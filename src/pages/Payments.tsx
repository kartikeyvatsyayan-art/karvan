import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, IndianRupee, Calendar, CreditCard, Printer, Download, ArrowUpDown, Search } from 'lucide-react';
import type { Employee, Payment } from '../types';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'amount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    employee_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    mode: 'Bank Transfer',
  });

  const fetchData = async () => {
    const [payRes, empRes] = await Promise.all([
      fetch('/api/payments'),
      fetch('/api/employees'),
    ]);
    const payData = await payRes.json();
    const empData = await empRes.json();
    setPayments(payData);
    setEmployees(empData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    setIsModalOpen(false);
    setFormData({ ...formData, amount: 0 });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this payment record?')) {
      await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // Filter & Sort Payments
  const getSortedPayments = () => {
    const filtered = payments.filter((pay) => {
      const term = searchQuery.toLowerCase();
      const empName = (pay.full_name || '').toLowerCase();
      const empId = pay.employee_id.toString();
      const mode = pay.mode.toLowerCase();
      const amount = pay.amount.toString();
      return empName.includes(term) || empId.includes(term) || mode.includes(term) || amount.includes(term);
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.full_name || '';
        const nameB = b.full_name || '';
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      } else if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      return 0;
    });
  };

  // Generate Receipt PDF
  const generateReceiptPDF = (pay: Payment) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150]
    });

    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 100, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('PAYMENT RECEIPT', 50, 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Veewell Admin Enterprise Portal', 50, 18, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.line(10, 28, 90, 28);

    let y = 38;
    const drawRow = (label: string, val: string, isBold: boolean = false) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(label, 12, y);

      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(val, 88, y, { align: 'right' });
      y += 8;
    };

    drawRow('Receipt ID:', `#PAY-${pay.id.toString().padStart(6, '0')}`);
    drawRow('Payment Date:', format(new Date(pay.date), 'dd MMM yyyy'));
    drawRow('Employee Name:', pay.full_name || 'N/A', true);
    drawRow('Employee ID:', `#EMP-${pay.employee_id.toString().padStart(4, '0')}`);
    drawRow('Payment Mode:', pay.mode);

    doc.setFillColor(240, 253, 250);
    doc.rect(10, y + 2, 80, 14, 'F');
    doc.setDrawColor(204, 251, 241);
    doc.rect(10, y + 2, 80, 14, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(13, 148, 136);
    doc.text('AMOUNT PAID', 15, y + 10.5);

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${pay.amount.toLocaleString()}`, 85, y + 10.5, { align: 'right' });

    y += 28;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for your dedicated service.', 50, y, { align: 'center' });
    doc.text('This is an official computer-generated receipt.', 50, y + 4, { align: 'center' });

    doc.save(`Receipt_PAY-${pay.id}_${(pay.full_name || 'employee').replace(/\s+/g, '_')}.pdf`);
  };

  // Generate Report of All CURRENTLY MATCHED/FILTERED Payments
  const generatePaymentsReportPDF = () => {
    const doc = new jsPDF();
    const sorted = getSortedPayments();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text('PAYMENTS REPORT', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 27);
    doc.text(`Sort Order: ${sortBy === 'name' ? 'Employee Name' : sortBy === 'date' ? 'Payment Date' : 'Amount'} (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`, 14, 32);

    const totalAmount = sorted.reduce((sum, p) => sum + p.amount, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.text(`Total Payout Value: Rs. ${totalAmount.toLocaleString()}`, 14, 38);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 43, 196, 43);

    let y = 50;
    const drawHeaders = (currentY: number) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Date', 18, currentY + 5.5);
      doc.text('Employee', 45, currentY + 5.5);
      doc.text('Payment Mode', 125, currentY + 5.5);
      doc.text('Amount (Rs)', 170, currentY + 5.5, { align: 'right' });
      doc.line(14, currentY + 8, 196, currentY + 8);
    };

    drawHeaders(y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    sorted.forEach((pay) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        drawHeaders(y);
        y += 8;
        doc.setFont('helvetica', 'normal');
      }

      const formattedDate = format(new Date(pay.date), 'dd MMM yyyy');
      const empName = `${pay.full_name || 'N/A'} (ID: #${pay.employee_id})`;
      const mode = pay.mode;
      const amountStr = `Rs. ${pay.amount.toLocaleString()}`;

      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(formattedDate, 18, y + 5);
      doc.text(empName, 45, y + 5);
      doc.text(mode, 125, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(amountStr, 170, y + 5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 8, 196, y + 8);
      y += 8;
    });

    doc.save(`Payments_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
  };

  const sortedPaymentsList = getSortedPayments();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payments</h1>
          <p className="text-slate-500 mt-2">Record and track salary payouts.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 premium-glossy cursor-pointer"
        >
          <Plus size={20} /> Record Payment
        </button>
      </header>

      {/* Print only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payments Ledger</h1>
        <p className="text-slate-500 text-sm mt-1">Generated dynamically on {format(new Date(), 'dd MMMM yyyy')}</p>
        <div className="mt-4 text-sm font-semibold text-emerald-700">
          Total payments: {sortedPaymentsList.length} records listed
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20 print:hidden">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Sort Column Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm">
            <span className="text-slate-400 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-slate-800 cursor-pointer pr-6"
            >
              <option value="name">Employee Name</option>
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
            
            {/* Toggle order direction */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-slate-200 text-slate-500 ml-1 flex items-center justify-center cursor-pointer hover:text-slate-800"
              title={sortOrder === 'asc' ? 'Ascending Order' : 'Descending Order'}
            >
              <ArrowUpDown size={14} className={sortOrder === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Action Buttons: Print / PDF */}
          <button
            onClick={generatePaymentsReportPDF}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium border border-emerald-100 transition-all shadow-sm shadow-emerald-500/5 premium-glossy cursor-pointer"
            title="Download full ledger PDF report"
          >
            <Download size={16} />
            <span>PDF Report</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 transition-all shadow-sm premium-glossy cursor-pointer"
            title="Print directly from browser"
          >
            <Printer size={16} />
            <span>Print List</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden print:border-none print:shadow-none print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm uppercase tracking-wider print:bg-slate-100">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Mode</th>
                <th className="px-6 py-4 font-medium text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
              {loading ? (
                <tr className="print:hidden">
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 overflow-hidden">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  </td>
                </tr>
              ) : sortedPaymentsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                sortedPaymentsList.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors group print:hover:bg-transparent">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 print:text-slate-900">
                        <Calendar size={16} className="text-slate-400 print:hidden" />
                        {format(new Date(pay.date), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{pay.full_name}</div>
                      <div className="text-xs text-slate-500 print:text-slate-700">ID: #{pay.employee_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-emerald-600 flex items-center gap-1 print:text-slate-900">
                        <IndianRupee size={16} className="print:hidden" /> ₹{pay.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium border border-slate-200 print:bg-transparent print:border-none print:p-0">
                        <CreditCard size={14} className="text-slate-500 print:hidden" /> {pay.mode}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => generateReceiptPDF(pay)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors premium-glossy cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(pay.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors premium-glossy cursor-pointer"
                          title="Delete Payment Record"
                        >
                          <Trash2 size={16} />
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 premium-glossy p-1 rounded-full text-2xl font-bold line-none leading-none">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                <select
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                >
                  <option value="" disabled>Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} (ID: {emp.id})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode *</label>
                <select
                  required
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              
              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors premium-glossy cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-500/30 transition-all premium-glossy cursor-pointer"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
