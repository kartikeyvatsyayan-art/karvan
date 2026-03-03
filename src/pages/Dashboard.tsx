import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, IndianRupee, Wallet, Clock, CreditCard, Calculator } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  totalEmployees: number;
  totalPayouts: number;
  totalAdvances: number;
  totalOvertime: number;
}

interface SalaryCalculation {
  employee_id: number;
  full_name: string;
  monthly_salary: number;
  perDaySalary: number;
  totalPaidDays: number;
  baseSalary: number;
  totalAdvances: number;
  totalOvertime: number;
  finalSalary: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaryData, setSalaryData] = useState<SalaryCalculation[]>([]);
  const [loadingSalary, setLoadingSalary] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setLoadingSalary(true);
    fetch(`/api/salary-calculation?month=${selectedMonth}&year=${selectedYear}`)
      .then((res) => res.json())
      .then((data) => {
        setSalaryData(data);
        setLoadingSalary(false);
      });
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      title: 'Total Salary Payout',
      value: `₹${stats?.totalPayouts?.toLocaleString() || 0}`,
      icon: IndianRupee,
      color: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      title: 'Total Advances',
      value: `₹${stats?.totalAdvances?.toLocaleString() || 0}`,
      icon: Wallet,
      color: 'from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/20',
    },
    {
      title: 'Total Overtime',
      value: `₹${stats?.totalOvertime?.toLocaleString() || 0}`,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/20',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 mt-2">Welcome back to Veewell Admin Portal.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-2xl p-6 shadow-xl ${card.shadow} border border-slate-100 relative overflow-hidden group`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                  <Icon size={24} />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{card.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Placeholder for charts or recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calculator size={20} className="text-blue-500" /> Monthly Salary Calculation
            </h3>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 py-1"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {format(new Date(2000, i), 'MMM')}
                  </option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 py-1"
              >
                {Array.from({ length: 5 }).map((_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Employee</th>
                  <th className="px-4 py-3 font-medium text-center">Paid Days</th>
                  <th className="px-4 py-3 font-medium text-right">Base</th>
                  <th className="px-4 py-3 font-medium text-right text-amber-600">Advances</th>
                  <th className="px-4 py-3 font-medium text-right text-purple-600">Overtime</th>
                  <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Final Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingSalary ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : salaryData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                      No data available for this month.
                    </td>
                  </tr>
                ) : (
                  salaryData.map((row) => (
                    <tr key={row.employee_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{row.full_name}</div>
                        <div className="text-xs text-slate-500">₹{row.monthly_salary.toLocaleString()} / mo</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded text-sm">
                          {row.totalPaidDays}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        ₹{row.baseSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-amber-600">
                        -₹{row.totalAdvances.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-purple-600">
                        +₹{row.totalOvertime.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-emerald-600">
                          ₹{row.finalSalary.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors flex items-center gap-3">
              <Users size={18} className="text-blue-500" /> Add New Employee
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors flex items-center gap-3">
              <CreditCard size={18} className="text-emerald-500" /> Record Payment
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors flex items-center gap-3">
              <Wallet size={18} className="text-amber-500" /> Issue Advance
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
