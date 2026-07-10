import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, Search, IndianRupee, Upload, X, Eye, FileImage, Camera, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Employee } from '../types';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Lightbox viewer for full-size documents and photos
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Track upload status of each field to display loading states
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    address: '',
    pan_id: '',
    aadhaar_id: '',
    photo_url: '',
    pan_photo_url: '',
    aadhaar_photo_url: '',
    monthly_salary: 0,
    date_of_joining: new Date().toISOString().split('T')[0],
  });

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'photo_url' | 'pan_photo_url' | 'aadhaar_photo_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      const data = await res.json();
      setFormData((prev) => ({ ...prev, [field]: data.url }));
    } catch (err: any) {
      alert(err.message || 'Error uploading file. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveFile = (field: 'photo_url' | 'pan_photo_url' | 'aadhaar_photo_url') => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
    const method = editingEmployee ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    setIsModalOpen(false);
    setEditingEmployee(null);
    fetchEmployees();
  };

  const confirmDelete = async () => {
    if (employeeToDelete !== null) {
      await fetch(`/api/employees/${employeeToDelete}`, { method: 'DELETE' });
      setEmployeeToDelete(null);
      fetchEmployees();
    }
  };

  const handleDelete = (id: number) => {
    setEmployeeToDelete(id);
  };

  const openModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmployee(emp);
      setFormData({
        full_name: emp.full_name || '',
        mobile: emp.mobile || '',
        address: emp.address || '',
        pan_id: emp.pan_id || '',
        aadhaar_id: emp.aadhaar_id || '',
        photo_url: emp.photo_url || '',
        pan_photo_url: emp.pan_photo_url || '',
        aadhaar_photo_url: emp.aadhaar_photo_url || '',
        monthly_salary: emp.monthly_salary || 0,
        date_of_joining: emp.date_of_joining || new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        full_name: '',
        mobile: '',
        address: '',
        pan_id: '',
        aadhaar_id: '',
        photo_url: '',
        pan_photo_url: '',
        aadhaar_photo_url: '',
        monthly_salary: 0,
        date_of_joining: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const filteredEmployees = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.mobile.includes(search)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employees</h1>
          <p className="text-slate-500 mt-2">Manage your workforce details, identity documents, and salaries.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 premium-glossy cursor-pointer"
        >
          <Plus size={20} /> Add Employee
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Identity Documents</th>
                <th className="px-6 py-4 font-semibold">Salary Details</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {emp.photo_url ? (
                          <div className="relative group/avatar cursor-pointer" onClick={() => setPreviewImage({ url: emp.photo_url, title: `${emp.full_name}'s Photo` })}>
                            <img
                              src={emp.photo_url}
                              alt={emp.full_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-50 shadow-sm hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                              <Eye size={12} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg border-2 border-blue-100 shadow-sm">
                            {emp.full_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-base">{emp.full_name}</div>
                          <div className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">
                            ID: #{emp.id.toString().padStart(4, '0')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{emp.mobile}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{emp.address || 'No Address Listed'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            PAN: <span className="font-bold">{emp.pan_id || 'N/A'}</span>
                          </span>
                          {emp.pan_photo_url ? (
                            <button
                              onClick={() => setPreviewImage({ url: emp.pan_photo_url!, title: `PAN Card - ${emp.full_name}` })}
                              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100/75 px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              <Eye size={11} /> View
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">No Image</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            AAD: <span className="font-bold">{emp.aadhaar_id || 'N/A'}</span>
                          </span>
                          {emp.aadhaar_photo_url ? (
                            <button
                              onClick={() => setPreviewImage({ url: emp.aadhaar_photo_url!, title: `Aadhaar Card - ${emp.full_name}` })}
                              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100/75 px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              <Eye size={11} /> View
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">No Image</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-emerald-600 flex items-center gap-0.5 text-base">
                        <IndianRupee size={15} /> {emp.monthly_salary.toLocaleString()}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">/ month</div>
                      {emp.date_of_joining && (
                        <div className="text-[11px] text-slate-400 font-medium mt-1">
                          Joined: <span className="text-slate-600 font-semibold">{format(new Date(emp.date_of_joining), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(emp)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Employee"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Employee"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingEmployee ? 'Edit Employee details' : 'Add New Employee'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 font-medium"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number *</label>
                  <input
                    required
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 font-medium"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 font-medium"
                    placeholder="Address, City, State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">PAN ID (Permanent Account Number)</label>
                  <input
                    type="text"
                    value={formData.pan_id}
                    onChange={(e) => setFormData({ ...formData, pan_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 font-medium uppercase"
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Aadhaar ID (12-Digit Number)</label>
                  <input
                    type="text"
                    value={formData.aadhaar_id}
                    onChange={(e) => setFormData({ ...formData, aadhaar_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 font-medium"
                    placeholder="1234 5678 9012"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Monthly Salary (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.monthly_salary}
                    onChange={(e) => setFormData({ ...formData, monthly_salary: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Joining *</label>
                  <input
                    required
                    type="date"
                    value={formData.date_of_joining}
                    onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 font-medium"
                  />
                </div>
              </div>

              {/* Document & Photo Uploaders Section */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-md font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">
                  Document and Image Uploads
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* 1. Employee Photo Upload */}
                  <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center relative group">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Profile Photo</span>
                    {formData.photo_url ? (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md">
                        <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('photo_url')}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs cursor-pointer"
                        >
                          <X size={16} /> Remove
                        </button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200 flex flex-col items-center justify-center cursor-pointer transition-all gap-1">
                        {uploadingField === 'photo_url' ? (
                          <Loader2 className="animate-spin text-blue-600" size={24} />
                        ) : (
                          <>
                            <Camera size={24} className="text-slate-400" />
                            <span className="text-[10px] font-bold">Select File</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'photo_url')}
                          className="hidden"
                          disabled={!!uploadingField}
                        />
                      </label>
                    )}
                  </div>

                  {/* 2. PAN Card Upload */}
                  <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center relative group">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">PAN ID Image</span>
                    {formData.pan_photo_url ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                        <img src={formData.pan_photo_url} alt="PAN card" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('pan_photo_url')}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs cursor-pointer"
                        >
                          <X size={16} /> Remove
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-24 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 px-2">
                        {uploadingField === 'pan_photo_url' ? (
                          <Loader2 className="animate-spin text-blue-600" size={24} />
                        ) : (
                          <>
                            <FileImage size={24} className="text-slate-400" />
                            <span className="text-[10px] font-bold">Upload PAN card</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'pan_photo_url')}
                          className="hidden"
                          disabled={!!uploadingField}
                        />
                      </label>
                    )}
                  </div>

                  {/* 3. Aadhaar Card Upload */}
                  <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center relative group">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Aadhaar Card Image</span>
                    {formData.aadhaar_photo_url ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                        <img src={formData.aadhaar_photo_url} alt="Aadhaar card" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('aadhaar_photo_url')}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs cursor-pointer"
                        >
                          <X size={16} /> Remove
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-24 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 px-2">
                        {uploadingField === 'aadhaar_photo_url' ? (
                          <Loader2 className="animate-spin text-blue-600" size={24} />
                        ) : (
                          <>
                            <FileImage size={24} className="text-slate-400" />
                            <span className="text-[10px] font-bold">Upload Aadhaar card</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'aadhaar_photo_url')}
                          className="hidden"
                          disabled={!!uploadingField}
                        />
                      </label>
                    )}
                  </div>

                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!uploadingField}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all cursor-pointer ${
                    uploadingField ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {editingEmployee ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {employeeToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Employee</h3>
              <p className="text-slate-500 text-sm">
                Are you sure you want to delete this employee? This action cannot be undone.
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 transition-all duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center">
            {/* Top Toolbar */}
            <div className="w-full flex justify-between items-center text-white mb-3 bg-slate-900/40 px-4 py-2 rounded-xl backdrop-blur-sm">
              <span className="font-bold text-sm tracking-wide uppercase">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Full Size Image */}
            <img 
              src={previewImage.url} 
              alt={previewImage.title}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
              className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800 bg-slate-900/50" 
            />
            
            <p className="text-xs text-slate-400 mt-3 text-center">Click anywhere outside the card to close viewer.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
