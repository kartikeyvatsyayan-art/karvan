import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, IndianRupee, Calendar, Search, Users, Wallet, X, Clock, Layers } from 'lucide-react';
import type { Employee, Advance } from '../types';
import { format } from 'date-fns';

export default function Advances() {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Period / Month selection (same as Dashboard)
  const [calculationMode, setCalculationMode] = useState<'month' | 'period'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'));
  
  // Optional filters
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    employee_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
  });

  // Fetch employees list
  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Fetch advances based on selected period
  const fetchAdvances = async () => {
    setLoading(true);
    let url = `/api/advances?`;
    if (calculationMode === 'month') {
      url += `month=${selectedMonth}&year=${selectedYear}`;
    } else {
      url += `startDate=${startDate}&endDate=${endDate}`;
    }

    if (selectedEmployeeFilter && selectedEmployeeFilter !== 'all') {
      url += `&employeeId=${selectedEmployeeFilter}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      setAdvances(data);
    } catch (err) {
      console.error('Error fetching advances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAdvances();
  }, [calculationMode, selectedMonth, selectedYear, startDate, endDate, selectedEmployeeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter valid employee and amount');
      return;
    }

    await fetch('/api/advances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: Number(formData.employee_id),
        date: formData.date,
        amount: Number(formData.amount),
      }),
    });

    setIsModalOpen(false);
    setFormData({
      employee_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
    });
    fetchAdvances();
  };

  const confirmDelete = async () => {
    if (deleteConfirmId !== null) {
      await fetch(`/api/advances/${deleteConfirmId}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      fetchAdvances();
    }
  };

  // Filtered advances by search query
  const filteredAdvances = advances.filter((adv) => {
    if (!searchQuery.trim()) return true;
    const nameMatch = adv.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const idMatch = adv.employee_id.toString().includes(searchQuery);
    return nameMatch || idMatch;
  });

  // Calculate summary metrics for the chosen period
  const totalAmount = filteredAdvances.reduce((sum, item) => sum + item.amount, 0);
  const uniqueEmployeesCount = new Set(filteredAdvances.map((a) => a.employee_id)).size;

  const currentPeriodLabel = calculationMode === 'month'
    ? `${format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}`
    : `${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Advances</h1>
          <p className="text-slate-500 mt-2">Manage and track employee salary advances by Month or custom Period.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2 premium-glossy cursor-pointer"
        >
          <Plus size={20} /> Issue Advance
        </button>
      </header>

      {/* Period Selector Card (Matching Dashboard By Month / By Period function) */}
      <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Advance Period Filter</h3>
              <p className="text-xs text-slate-500">Showing records for: <span className="font-semibold text-amber-700">{currentPeriodLabel}</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Mode Switch: By Month vs By Period */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setCalculationMode('month')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  calculationMode === 'month'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                By Month
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('period')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  calculationMode === 'period'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                By Period
              </button>
            </div>

            {/* Inputs based on Mode */}
            {calculationMode === 'month' ? (
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-700 py-1 cursor-pointer"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {format(new Date(2000, i), 'MMMM')}
                    </option>
                  ))}
                </select>
                <span className="text-slate-300">|</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-700 py-1 cursor-pointer"
                >
                  {Array.from({ length: 5 }).map((_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 py-1 cursor-pointer"
                />
                <span className="text-slate-400 text-xs font-semibold uppercase">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 py-1 cursor-pointer"
                />
              </div>
            )}

            {/* Employee Filter */}
            <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Users size={16} className="text-slate-400 mr-2" />
              <select
                value={selectedEmployeeFilter}
                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 py-1 cursor-pointer max-w-[160px]"
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Period Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Total Advance Disbursed</p>
              <p className="text-2xl font-bold text-amber-900 mt-1 flex items-center">
                <IndianRupee size={20} className="mr-0.5" />
                {totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Wallet size={20} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Transactions</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{filteredAdvances.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800 text-white shadow-md">
              <Layers size={20} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employees Count</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{uniqueEmployeesCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Users size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Advances Table Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        {/* Table Search Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by employee name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm font-medium text-slate-700 transition-all"
            />
          </div>
          <div className="text-xs text-slate-500 font-semibold self-center">
            Showing <span className="text-slate-900 font-bold">{filteredAdvances.length}</span> records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Advance Amount</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl mb-3">
                        <Wallet size={28} />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">No advances in this period</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        There are no advance payments logged for {currentPeriodLabel}.
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        + Issue an Advance
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => {
                  const initial = adv.full_name ? adv.full_name.charAt(0).toUpperCase() : 'E';
                  return (
                    <tr key={adv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Calendar size={15} className="text-slate-400" />
                          {format(new Date(adv.date), 'dd MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {adv.photo_url ? (
                            <img
                              src={adv.photo_url}
                              alt={adv.full_name || 'Employee'}
                              className="w-9 h-9 rounded-full object-cover border border-amber-100 shadow-sm"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-200">
                              {initial}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{adv.full_name}</div>
                            <div className="text-xs text-slate-400 font-medium">ID: #{adv.employee_id.toString().padStart(4, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-lg text-sm">
                          <IndianRupee size={15} /> {adv.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteConfirmId(adv.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                          title="Delete Advance"
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Advance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Wallet size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Issue Advance</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Employee *</label>
                <select
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm font-medium text-slate-700 cursor-pointer"
                >
                  <option value="" disabled>Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} (ID: #{emp.id.toString().padStart(4, '0')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Advance Date *</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm font-medium text-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-amber-500/30 transition-all cursor-pointer text-sm"
                >
                  Save Advance
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Advance Entry</h3>
              <p className="text-slate-500 text-sm">
                Are you sure you want to delete this advance record? This deduction will be removed from salary calculations.
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 cursor-pointer text-sm"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
