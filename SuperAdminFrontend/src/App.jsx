import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Key, Users, RefreshCw, AlertTriangle, Search, Activity, Power } from 'lucide-react';

function App() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:4000/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOverridePassword = async (id, name) => {
    const newPassword = prompt(`Enter new password for ${name}:`);
    if (!newPassword) return;

    try {
      await axios.put(`http://localhost:4000/api/clients/${id}/password`, { newPassword });
      fetchClients();
      alert('Password overridden successfully!');
    } catch (error) {
      alert('Failed to override password.');
    }
  };

  const filteredClients = clients.filter(c => 
    c.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
      
      {/* Top Navbar */}
      <nav className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(255,92,53,0.3)]">
                <Shield className="text-primary w-5 h-5" />
              </div>
              <span className="font-black text-xl tracking-tight">MS<span className="text-primary">BILLING</span> <span className="font-medium text-gray-400">SUPER ADMIN</span></span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-300">System Online</span>
              </div>
              <button onClick={fetchClients} className="p-2 bg-surface hover:bg-gray-700 rounded-lg border border-border transition-colors">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-primary' : 'text-gray-300'}`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-24 h-24 text-white" />
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Clients</p>
            <h3 className="text-4xl font-black">{clients.length}</h3>
          </div>
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Key className="w-24 h-24 text-white" />
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Active Licenses</p>
            <h3 className="text-4xl font-black text-primary">{clients.filter(c => c.status === 'Active').length}</h3>
          </div>
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-lg relative overflow-hidden group flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Generate New Key</p>
              <button onClick={() => alert('WIP: Manual generation modal')} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg shadow-primary/20">
                + New Client
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-surface p-4 rounded-t-2xl border border-border border-b-0 flex justify-between items-center">
          <h2 className="text-lg font-bold">Client Management Database</h2>
          <div className="relative w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search restaurant or email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-surface border border-border rounded-b-2xl shadow-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 text-gray-400 text-xs uppercase tracking-wider font-bold">
                <th className="p-4 border-b border-border">Restaurant</th>
                <th className="p-4 border-b border-border">Email</th>
                <th className="p-4 border-b border-border">License Key</th>
                <th className="p-4 border-b border-border bg-red-900/10 text-red-400">Plain Password (Secret)</th>
                <th className="p-4 border-b border-border">HWID Binding</th>
                <th className="p-4 border-b border-border text-center">Status</th>
                <th className="p-4 border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading database...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">No clients found matching your search.</td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client._id} className="hover:bg-background/30 transition-colors">
                    <td className="p-4 font-bold">{client.restaurantName}</td>
                    <td className="p-4 text-gray-300">{client.email}</td>
                    <td className="p-4">
                      <span className="font-mono bg-background px-2 py-1 rounded text-primary text-xs font-bold border border-primary/20">
                        {client.licenseKey}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span className="font-mono text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded border border-red-400/20">
                          {client.plainTextPassword}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {client.hardwareId ? (
                        <span className="text-green-400 text-xs font-mono bg-green-400/10 px-2 py-1 rounded border border-green-400/20" title={client.hardwareId}>
                          {client.hardwareId.substring(0, 10)}...
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs italic">Not Activated Yet</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        client.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                        client.status === 'Suspended' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleOverridePassword(client._id, client.restaurantName)}
                        className="text-xs font-bold bg-surface border border-border hover:bg-gray-700 hover:text-white px-3 py-1.5 rounded transition-colors"
                      >
                        Force Reset Pwd
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;
