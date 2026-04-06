import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, LogOut, LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sidebar / Navigation */}
      <div className="bg-[#1e293b] text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
          <div>
            <h1 className="font-bold text-lg">Admin Dashboard</h1>
            <p className="text-xs text-slate-400">Barangay Mambog II</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm hover:text-red-400 transition">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700">Total Residents</h3>
              <Users className="text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">1,245</p>
            <p className="text-xs text-green-600 mt-2 font-medium">+12 this week</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700">Pending Reports</h3>
              <FileText className="text-orange-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">8</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Requires attention</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700">Announcements</h3>
              <LayoutDashboard className="text-purple-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">24</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Active posts</p>
          </div>
        </div>
      </div>
    </div>
  );
}