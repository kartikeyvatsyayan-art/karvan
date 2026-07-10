import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Calendar, UserCheck, UserX, UserMinus, Info, Clock, AlertCircle, Search, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface EmployeeSummary {
  id: number;
  fullName: string;
  mobile: string;
  monthlySalary: number;
  present: number;
  absent: number;
  leave: number;
  halfDay: number;
  sunday: number;
  unmarked: number;
  attendanceRate: number;
}

interface MonthlySummaryData {
  month: string;
  present: number;
  absent: number;
  leave: number;
  halfDay: number;
  sunday: number;
  unmarked: number;
  totalEmployees: number;
  daysInMonth: number;
  totalPotentialRecords: number;
  employeeSummary?: EmployeeSummary[];
}

export default function AttendanceSummaryCard() {
  const [data, setData] = useState<MonthlySummaryData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMonthlySummary = async (monthStr?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = monthStr ? `/api/attendance-monthly-summary?month=${monthStr}` : '/api/attendance-monthly-summary';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch monthly attendance summary');
      }
      const json: MonthlySummaryData = await res.json();
      setData(json);
      if (json.month) {
        setSelectedMonth(json.month);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlySummary();
  }, []);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    fetchMonthlySummary(month);
  };

  // Prepare chart data based on loaded data
  const chartData = data
    ? [
        { name: 'Present', value: data.present, color: '#10b981', hoverColor: '#059669', icon: UserCheck },
        { name: 'Absent', value: data.absent, color: '#f43f5e', hoverColor: '#e11d48', icon: UserX },
        { name: 'On Leave', value: data.leave, color: '#3b82f6', hoverColor: '#2563eb', icon: UserMinus },
        { name: 'Half Day', value: data.halfDay, color: '#f59e0b', hoverColor: '#d97706', icon: Clock },
        { name: 'Sunday', value: data.sunday, color: '#8b5cf6', hoverColor: '#7c3aed', icon: Calendar },
        { name: 'Unmarked', value: data.unmarked, color: '#64748b', hoverColor: '#475569', icon: AlertCircle },
      ].filter(item => item.value > 0)
    : [];

  // Monthly Attendance Rate: percentage of Present (plus 0.5 for Half-Days) out of actual non-unmarked working records
  const totalRelevantMarked = data ? (data.present + data.absent + data.leave + data.halfDay) : 0;
  const attendanceRate = data && totalRelevantMarked > 0
    ? Math.round(((data.present + data.halfDay * 0.5) / totalRelevantMarked) * 100)
    : 0;

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs">
          <p className="font-bold">{item.name}</p>
          <p className="mt-1 text-slate-300">
            Total Shifts/Days: <span className="font-semibold text-white">{item.value}</span>
          </p>
          {data && data.totalPotentialRecords > 0 && (
            <p className="text-slate-400">
              Share: {Math.round((item.value / data.totalPotentialRecords) * 100)}% of month
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render formatted month for title
  const formattedMonth = data?.month
    ? format(parseISO(`${data.month}-01`), 'MMMM yyyy')
    : 'Selected Month';

  // Filter employees for report list
  const filteredEmployees = data?.employeeSummary
    ? data.employeeSummary.filter(emp =>
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 mt-8 relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calendar size={20} />
            </span>
            Monthly Attendance Visualizer
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Visual status breakdown for <span className="font-semibold text-slate-700">{formattedMonth}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 self-stretch md:self-auto justify-between sm:justify-start">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Select Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg text-sm font-semibold text-slate-700 px-3 py-1"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-xs text-slate-400 mt-3 font-medium">Crunching monthly attendance data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-red-500">
          <div className="p-3 bg-red-50 rounded-full text-red-600 mb-2">
            <AlertCircle size={24} />
          </div>
          <p className="font-bold">Could not load chart</p>
          <p className="text-xs text-red-400 mt-1 max-w-sm">{error}</p>
          <button
            onClick={() => fetchMonthlySummary(selectedMonth)}
            className="mt-4 px-4 py-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition-colors"
          >
            Retry Fetching
          </button>
        </div>
      ) : !data || data.totalEmployees === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Info size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No Employee Database Records</p>
          <p className="text-xs text-slate-400">Add employees first to enable attendance tracking.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Pie Chart display column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
              {chartData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-semibold text-slate-500">Zero attendance marked this month</p>
                  <p className="text-xs text-slate-400 mt-1">All employee days are currently Unmarked.</p>
                </div>
              ) : (
                <div className="w-full h-64 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={800}
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            cursor="pointer"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Embedded Center Stat ring */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Attendance</span>
                    <span className="text-3.5xl font-black text-slate-800 leading-none mt-1">
                      {attendanceRate}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1">
                      for marked active days
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-3 text-xs">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Row Information column */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                    <UserCheck size={18} /> Present Days
                  </div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{data.present}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Total shifts marked Present</div>
                </div>

                <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl">
                  <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                    <UserX size={18} /> Absent Days
                  </div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{data.absent}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Total shifts marked Absent</div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                    <UserMinus size={18} /> On Leave Days
                  </div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{data.leave}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Total shifts marked Leave</div>
                </div>
              </div>

              {/* Supplementary Breakdowns */}
              <div className="bg-slate-50/70 border border-slate-150 p-4 rounded-xl text-xs space-y-3.5">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Monthly Category Breakdowns & Potential Shares</h4>
                
                {/* Half Day progress */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1.5"><Clock size={13} className="text-amber-500" /> Half Day (H)</span>
                    <span>{data.halfDay} Shifts ({Math.round(data.halfDay / data.totalPotentialRecords * 100)}% of month)</span>
                  </div>
                  <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(data.halfDay / data.totalPotentialRecords) * 100}%` }} />
                  </div>
                </div>

                {/* Sunday progress */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1.5"><Calendar size={13} className="text-purple-500" /> Sunday (S)</span>
                    <span>{data.sunday} Days ({Math.round(data.sunday / data.totalPotentialRecords * 100)}% of month)</span>
                  </div>
                  <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${(data.sunday / data.totalPotentialRecords) * 100}%` }} />
                  </div>
                </div>

                {/* Unmarked progress */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1.5"><AlertCircle size={13} className="text-slate-400" /> Unmarked / Pending</span>
                    <span>{data.unmarked} Record slots ({Math.round(data.unmarked / data.totalPotentialRecords * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-full rounded-full transition-all duration-500" style={{ width: `${(data.unmarked / data.totalPotentialRecords) * 100}%` }} />
                  </div>
                </div>
              </div>
              
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 bg-sky-50/40 p-2.5 rounded-lg border border-sky-100/50">
                <Info size={14} className="text-sky-500 shrink-0" />
                <span>
                  <strong>Average Monthly Attendance Rate</strong> is calculated as: <code>(Present + 0.5 * Half Day) / (Present + Absent + Leave + Half Day)</code>. This reflects real attendance during active days.
                </span>
              </div>
            </div>
          </div>

          {/* Employee Wise Monthly Summary Section */}
          {data.employeeSummary && data.employeeSummary.length > 0 && (
            <div className="mt-10 pt-8 border-t border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Users size={18} />
                    </span>
                    Employee-wise Monthly Report
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detailed attendance stats for each individual employee
                  </p>
                </div>

                {/* Search input bar */}
                <div className="relative w-full md:w-72">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employee name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-sm font-medium text-slate-700 pl-9 pr-4 py-2 transition-all"
                  />
                </div>
              </div>

              {/* List/Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-3 text-center">Attendance %</th>
                      <th className="py-3 px-3 text-center text-emerald-600">P</th>
                      <th className="py-3 px-3 text-center text-amber-600">H</th>
                      <th className="py-3 px-3 text-center text-rose-600">A</th>
                      <th className="py-3 px-3 text-center text-blue-600">L</th>
                      <th className="py-3 px-3 text-center text-purple-600">S</th>
                      <th className="py-3 px-3 text-center text-slate-400">Unmarked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                          No employees found matching "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const initials = emp.fullName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                  {initials}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">{emp.fullName}</div>
                                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                                    <span>{emp.mobile || 'No contact'}</span>
                                    {emp.monthlySalary > 0 && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span>Rs. {emp.monthlySalary.toLocaleString()} / mo</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex flex-col items-center">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  emp.attendanceRate >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  emp.attendanceRate >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {emp.attendanceRate}%
                                </span>
                                <div className="w-16 bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      emp.attendanceRate >= 85 ? 'bg-emerald-500' :
                                      emp.attendanceRate >= 60 ? 'bg-amber-500' :
                                      'bg-rose-500'
                                    }`}
                                    style={{ width: `${emp.attendanceRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-xs">
                                {emp.present}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg text-xs">
                                {emp.halfDay}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-xs">
                                {emp.absent}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg text-xs">
                                {emp.leave}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center font-semibold text-purple-600">
                              {emp.sunday}
                            </td>
                            <td className="py-3.5 px-3 text-center font-semibold text-slate-400">
                              {emp.unmarked}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
