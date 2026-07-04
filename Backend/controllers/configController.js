import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Setting from '../models/Setting.js';

export const setupDatabase = async (req, res) => {
  try {
    const { databaseName, username, password } = req.body;
    
    if (!databaseName || !username || !password) {
      return res.status(400).json({ message: 'Missing required configuration fields.' });
    }

    // 1. Write config
    const configDir = process.env.APP_USER_DATA_PATH || process.cwd();
    const configPath = path.join(configDir, 'client-config.json');
    fs.writeFileSync(configPath, JSON.stringify({ databaseName }), 'utf8');

    // 2. Disconnect existing mongoose
    await mongoose.disconnect();

    // 3. Generate new URI
    const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurantbilling';
    const parts = baseUri.split('?');
    const connectionPart = parts[0];
    const queryPart = parts.length > 1 ? `?${parts[1]}` : '';
    
    const lastSlashIndex = connectionPart.lastIndexOf('/');
    const newConnectionPart = connectionPart.substring(0, lastSlashIndex) + '/' + databaseName;
    const newUri = newConnectionPart + queryPart;
    
    // 4. Reconnect
    await mongoose.connect(newUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    console.log(`Switched to new client database: ${databaseName}`);

    // 5. Seed initial admin user if the database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // We pass plain password; the Mongoose pre-save hook automatically hashes it!
      const newUser = new User({
        username: username,
        password: password,
        role: 'Admin',
        activeSessions: []
      });
      await newUser.save();
      console.log(`Created initial admin user: ${username}`);
    }

    res.status(200).json({ message: 'Database configured successfully' });
  } catch (error) {
    console.error('Error in setupDatabase:', error);
    res.status(500).json({ message: 'Failed to configure database', error: error.message });
  }
};

export const resetLicense = async (req, res) => {
  try {
    const configDir = process.env.APP_USER_DATA_PATH || process.cwd();
    const configPath = path.join(configDir, 'client-config.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    // Also clear hardware ID from local storage in frontend, but here we just clear backend config
    res.status(200).json({ message: 'License reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset license', error: error.message });
  }
};

export const getRestaurantInfo = async (req, res) => {
  try {
    const expiryDoc = await Setting.findOne({ key: 'licenseExpiry' });
    const settingsDoc = await Setting.findOne({ key: 'restaurantSettings' });
    
    // Default to July 12, 2026 (Demo Expiry) if not set in DB
    const licenseExpiry = expiryDoc?.value || '2026-07-12T23:59:59.000Z';
    
    const restaurantSettings = settingsDoc?.value || {
      restaurantName: 'ABC RESTAURANT',
      restaurantType: 'South Indian & Chinese',
      address: 'Main Road, Hyderabad - 500001',
      phone: '9876543210',
      email: 'support@abcrestaurant.com',
      gstin: '36ABCDE1234F1Z5'
    };

    res.status(200).json({ licenseExpiry, restaurantSettings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching config', error: error.message });
  }
};

export const updateRestaurantInfo = async (req, res) => {
  try {
    const { licenseExpiry, restaurantSettings } = req.body;
    if (licenseExpiry) {
      await Setting.findOneAndUpdate({ key: 'licenseExpiry' }, { value: licenseExpiry }, { upsert: true });
    }
    if (restaurantSettings) {
      await Setting.findOneAndUpdate({ key: 'restaurantSettings' }, { value: restaurantSettings }, { upsert: true });
    }
    res.status(200).json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating config', error: error.message });
  }
};

