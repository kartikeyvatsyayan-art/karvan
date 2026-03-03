import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, Search, User, IndianRupee } from 'lucide-react';
import type { Employee } from '../types';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    address: '',
    pan_id: '',
    aadhaar_id: '',
    photo_url: '',
    monthly_salary: 0,
  });

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    const data = await res.json();
    setEmployees(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      fetchEmployees();
    }
  };

  const openModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmployee(emp);
      setFormData({
        full_name: emp.full_name,
        mobile: emp.mobile,
        address: emp.address,
        pan_id: emp.pan_id,
        aadhaar_id: emp.aadhaar_id,
        photo_url: emp.photo_url,
        monthly_salary: emp.monthly_salary,
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
        monthly_salary: 0,
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
          <p className="text-slate-500 mt-2">Manage your workforce details and salaries.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
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
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">IDs</th>
                <th className="px-6 py-4 font-medium">Salary</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
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
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {emp.photo_url ? (
                          <img src={emp.photo_url} alt={emp.full_name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {emp.full_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{emp.full_name}</div>
                          <div className="text-xs text-slate-500">ID: #{emp.id.toString().padStart(4, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{emp.mobile}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{emp.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block mb-1">PAN: {emp.pan_id || 'N/A'}</div>
                      <div className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">AAD: {emp.aadhaar_id || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-emerald-600 flex items-center gap-1">
                        <IndianRupee size={14} /> {emp.monthly_salary.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">/ month</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(emp)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    required
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">PAN ID</label>
                  <input
                    type="text"
                    value={formData.pan_id}
                    onChange={(e) => setFormData({ ...formData, pan_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aadhaar ID</label>
                  <input
                    type="text"
                    value={formData.aadhaar_id}
                    onChange={(e) => setFormData({ ...formData, aadhaar_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Salary (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.monthly_salary}
                    onChange={(e) => setFormData({ ...formData, monthly_salary: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Photo URL</label>
                  <input
                    type="url"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all"
                >
                  {editingEmployee ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
