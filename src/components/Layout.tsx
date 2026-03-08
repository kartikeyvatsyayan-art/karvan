import React, { useState, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Wallet, 
  Clock, 
  CreditCard,
  Download,
  Upload,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Employees', path: '/employees', icon: Users },
  { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { name: 'Advances', path: '/advances', icon: Wallet },
  { name: 'Overtime', path: '/overtime', icon: Clock },
  { name: 'Payments', path: '/payments', icon: CreditCard },
];

export default function Layout() {
  const location = useLocation();
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    window.location.href = '/api/backup';
  };

  const handleJsonRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/restore', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('JSON Data restored successfully!');
        window.location.reload(); // Reload to reflect new data
      } else {
        const data = await res.json();
        alert(`Error restoring data: ${data.error}`);
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('Failed to restore data. Please check the file format.');
    } finally {
      setIsRestoring(false);
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  const handleExportSheets = () => {
    window.location.href = '/api/export-sheets';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import-sheets', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('Data imported successfully!');
        window.location.reload(); // Reload to reflect new data
      } else {
        const data = await res.json();
        alert(`Error importing data: ${data.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import data. Please check the file format.');
    } finally {
      setIsUploading(false);
      setIsSyncModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Veewell Admin
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Enterprise Portal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={twMerge(
                  clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )
                )}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-2">
          <button 
            onClick={() => setIsSyncModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl transition-colors text-sm font-medium shadow-lg shadow-emerald-900/20"
          >
            <FileSpreadsheet size={16} />
            Google Sheets Sync
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleBackup}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition-colors text-sm font-medium"
            >
              <Download size={16} />
              Backup
            </button>
            <button 
              onClick={() => jsonInputRef.current?.click()}
              disabled={isRestoring}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isRestoring ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-300"></div>
              ) : (
                <>
                  <Upload size={16} />
                  Restore
                </>
              )}
            </button>
          </div>
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={jsonInputRef}
            onChange={handleJsonRestore}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-slate-50/50 pointer-events-none" />
        <div className="relative p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Sync Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-600" /> Google Sheets Sync
                </h2>
                <button onClick={() => setIsSyncModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">Export Data</h3>
                  <p className="text-sm text-slate-500">Download all your records as an Excel file (.xlsx) that can be directly opened in Google Sheets.</p>
                  <button
                    onClick={handleExportSheets}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl transition-colors font-medium border border-slate-200"
                  >
                    <Download size={18} /> Download for Google Sheets
                  </button>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-400">OR</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">Import Data</h3>
                  <p className="text-sm text-slate-500">Upload an Excel file (.xlsx) downloaded from Google Sheets to update your records.</p>
                  
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-3 rounded-xl transition-colors font-medium border border-emerald-200 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-700"></div>
                    ) : (
                      <>
                        <Upload size={18} /> Upload from Google Sheets
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
