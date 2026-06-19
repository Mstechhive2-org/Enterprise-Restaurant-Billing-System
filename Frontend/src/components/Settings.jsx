import React, { useState, useEffect } from 'react';
import { Save, Building, Phone, MapPin, Mail, FileText, Settings as SettingsIcon, User } from 'lucide-react';
import Toast from './Toast';
import { apiUpdateProfile } from '../api/auth';

const Settings = ({ user, setUser }) => {
  const [settings, setSettings] = useState({
    restaurantName: 'ABC RESTAURANT',
    restaurantType: 'South Indian & Chinese',
    address: 'Main Road, Hyderabad - 500001',
    phone: '9876543210',
    email: 'support@abcrestaurant.com',
    gstin: '36ABCDE1234F1Z5',
    footerMessage: '*** THANK YOU! VISIT AGAIN ***'
  });

  const [username, setUsername] = useState(user ? user.username : '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('restaurantSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save restaurant settings to localStorage
      localStorage.setItem('restaurantSettings', JSON.stringify(settings));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));

      // Save profile name
      if (username !== user?.username) {
        const response = await apiUpdateProfile(username);
        // Update global user state
        setUser(response.user);
        // Update localStorage user
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      setToast({ message: 'Settings saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'phone') {
      // Allow only digits and limit to 10 characters
      if (/^\d*$/.test(value) && value.length <= 10) {
        setSettings(prev => ({
          ...prev,
          [field]: value
        }));
      }
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <SettingsIcon className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-main">Restaurant Settings</h1>
              <p className="text-sm text-text-muted">Configure your restaurant information and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <div className="flex flex-col gap-4">
            {/* Profile Information */}
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <User className="text-primary" size={20} />
                </div>
                <h2 className="text-xl font-bold text-text-main">Profile Information</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <User size={14} />
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-text-main"
                  placeholder="Enter username"
                />
              </div>
            </div>

            {/* Restaurant Information */}
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building className="text-primary" size={20} />
                </div>
                <h2 className="text-xl font-bold text-text-main">Restaurant Information</h2>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Restaurant Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <Building size={14} />
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={settings.restaurantName}
                  onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                  onKeyPress={(e) => {
                    if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-text-main"
                  placeholder="Enter restaurant name"
                />
              </div>

              {/* Restaurant Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <FileText size={14} />
                  Restaurant Type
                </label>
                <input
                  type="text"
                  value={settings.restaurantType}
                  onChange={(e) => handleInputChange('restaurantType', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-text-main"
                  placeholder="e.g., South Indian & Chinese"
                />
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <MapPin size={14} />
                  Address
                </label>
                <textarea
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-text-main resize-none"
                  placeholder="Enter full address"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <Phone size={14} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-text-main"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <Mail size={14} />
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onKeyPress={(e) => {
                    if (!/[a-zA-Z0-9@._-]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-text-main"
                  placeholder="Enter email address"
                />
              </div>

              {/* GSTIN */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <FileText size={14} />
                  GSTIN
                </label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-text-main"
                  placeholder="Enter GSTIN"
                />
              </div>

              {/* Footer Message */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <FileText size={14} />
                  Footer Message
                </label>
                <input
                  type="text"
                  value={settings.footerMessage}
                  onChange={(e) => handleInputChange('footerMessage', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-text-main"
                  placeholder="Enter footer message for receipts"
                />
              </div>
            </div>
          </div>
          </div>

          {/* Preview Section */}
          <div className="bg-surface rounded-2xl p-4 border border-border shadow-lg">
            <h2 className="text-xl font-bold text-text-main mb-4">Receipt Preview</h2>
            <div className="bg-white border border-border rounded-xl p-4 max-w-xs mx-auto">
              <div className="text-center font-bold text-lg mb-2">{settings.restaurantName}</div>
              <div className="text-center text-sm text-gray-600 mb-4">
                {settings.restaurantType}<br/>
                {settings.address.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                Ph: {settings.phone}<br/>
                GSTIN: {settings.gstin}
              </div>
              <div className="border-t border-b border-dashed py-2 my-4 text-center font-bold">
                RECEIPT
              </div>
              <div className="text-center text-sm mb-4">
                {settings.footerMessage}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/40 hover:shadow-xl hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save size={20} />
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Settings;