import Client from '../models/Client.js';
import License from '../models/License.js';
import crypto from 'crypto';

// Get all clients (For Super Admin dashboard)
export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

// Create a new client and generate a license
export const createClient = async (req, res) => {
  try {
    const { restaurantName, ownerName, email, password, plan } = req.body;

    // Check if email exists
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate unique license key (e.g. MSBILL-ABCD-1234-WXYZ)
    const generateKeySegment = () => crypto.randomBytes(2).toString('hex').toUpperCase();
    const licenseKey = `MSBILL-${generateKeySegment()}-${generateKeySegment()}-${generateKeySegment()}`;

    // Create client (storing plainTextPassword as requested by Super Admin)
    const newClient = new Client({
      restaurantName,
      ownerName,
      email,
      plainTextPassword: password, // For admin visibility/support
      licenseKey
    });

    const savedClient = await newClient.save();

    // Determine validity based on plan
    const validUntil = new Date();
    if (plan === 'Monthly') validUntil.setMonth(validUntil.getMonth() + 1);
    else if (plan === 'Yearly') validUntil.setFullYear(validUntil.getFullYear() + 1);
    else if (plan === 'Lifetime') validUntil.setFullYear(validUntil.getFullYear() + 100);

    // Save license to DB
    const newLicense = new License({
      key: licenseKey,
      client: savedClient._id,
      plan: plan || 'Yearly',
      validUntil
    });

    await newLicense.save();

    res.status(201).json({
      message: 'Client and License generated successfully',
      client: savedClient
    });

  } catch (error) {
    res.status(500).json({ message: 'Error creating client', error: error.message });
  }
};

// Update client password directly (Super Admin override)
export const updateClientPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const client = await Client.findById(id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    client.plainTextPassword = newPassword;
    await client.save();

    res.status(200).json({ message: 'Password updated successfully', client });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
};

// Validate License Key (Called by Desktop App on startup)
export const validateLicense = async (req, res) => {
  try {
    const { licenseKey, hardwareId } = req.body;

    if (!licenseKey || !hardwareId) {
      return res.status(400).json({ valid: false, message: 'License key and Hardware ID are required' });
    }

    const license = await License.findOne({ key: licenseKey });
    if (!license) {
      return res.status(404).json({ valid: false, message: 'Invalid License Key' });
    }

    const client = await Client.findById(license.client);
    if (!client) {
      return res.status(404).json({ valid: false, message: 'Client account not found' });
    }

    if (client.status !== 'Active') {
      return res.status(403).json({ valid: false, message: `Account is ${client.status}` });
    }

    if (new Date() > license.validUntil) {
      return res.status(403).json({ valid: false, message: 'License has expired' });
    }

    // Hardware ID Binding
    if (!client.hardwareId) {
      // First time activation! Bind to this computer.
      client.hardwareId = hardwareId;
      await client.save();
    } else if (client.hardwareId !== hardwareId) {
      // Trying to use on a different computer! Block it.
      return res.status(403).json({ valid: false, message: 'License is already bound to another computer. Contact support.' });
    }

    res.status(200).json({
      valid: true,
      message: 'License Verified',
      restaurantName: client.restaurantName,
      validUntil: license.validUntil
    });

  } catch (error) {
    res.status(500).json({ valid: false, message: 'Error validating license', error: error.message });
  }
};
