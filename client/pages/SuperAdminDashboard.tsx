import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Settings, LogOut, Database, UserPlus } from 'lucide-react';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">SA</div>
          <div>
            <h1 className="font-bold text-lg">Super Admin</h1>
            <p className="text-xs text-slate-400">System Control Center</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm hover:text-red-400 transition bg-slate-700 px-4 py-2 rounded-lg">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <Shield className="text-indigo-400" /> System Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-indigo-500 transition cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-300 group-hover:text-white">Manage Admins</h3>
              <UserPlus className="text-indigo-500" />
            </div>
            <p className="text-sm text-slate-400">Create, edit, or remove barangay administrator accounts.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-indigo-500 transition cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-300 group-hover:text-white">System Logs</h3>
              <Database className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-400">View database activity, user logins, and system errors.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-indigo-500 transition cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-300 group-hover:text-white">Global Settings</h3>
              <Settings className="text-blue-500" />
            </div>
            <p className="text-sm text-slate-400">Configure system-wide parameters and maintenance mode.</p>
          </div>
        </div>
      </div>
    </div>
  );
}