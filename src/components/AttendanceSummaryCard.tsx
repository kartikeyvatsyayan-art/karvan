import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Calendar, UserCheck, UserX, UserMinus, Info, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SummaryData {
  date: string;
  present: number;
  absent: number;
  leave: number;
  halfDay: number;
  sunday: number;
  unmarked: number;
  totalEmployees: number;
}

export default function AttendanceSummaryCard() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async (dateStr?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = dateStr ? `/api/attendance-summary?date=${dateStr}` : '/api/attendance-summary';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch attendance summary');
      }
      const json: SummaryData = await res.json();
      setData(json);
      // Auto-populate the input date with whatever the server used 
      if (json.date) {
        setSelectedDate(json.date);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchSummary(date);
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
      ].filter(item => item.value > 0) // Only show categories with count > 0 in the chart
    : [];

  const totalMarked = data ? (data.present + data.absent + data.leave + data.halfDay + data.sunday) : 0;
  const attendanceRate = data && data.totalEmployees > 0 
    ? Math.round(((data.present + data.halfDay * 0.5) / data.totalEmployees) * 100) 
    : 0;

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs">
          <p className="font-bold">{item.name}</p>
          <p className="mt-1 text-slate-300">
            Count: <span className="font-semibold text-white">{item.value}</span>
          </p>
          {data && data.totalEmployees > 0 && (
            <p className="text-slate-400">
              Share: {Math.round((item.value / data.totalEmployees) * 100)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render formatted date for title
  const formattedDate = data?.date
    ? format(parseISO(data.date), 'PPPP')
    : 'Selected Day';

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
            Daily Attendance Visualizer
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Visual status breakdown for <span className="font-semibold text-slate-700">{formattedDate}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 self-stretch md:self-auto justify-between sm:justify-start">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Select Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg text-sm font-semibold text-slate-700 px-3 py-1"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-xs text-slate-400 mt-3 font-medium">Crunching daily attendance data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-red-500">
          <div className="p-3 bg-red-50 rounded-full text-red-600 mb-2">
            <AlertCircle size={24} />
          </div>
          <p className="font-bold">Could not load chart</p>
          <p className="text-xs text-red-400 mt-1 max-w-sm">{error}</p>
          <button
            onClick={() => fetchSummary(selectedDate)}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Pie Chart display column */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
            {chartData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm font-semibold text-slate-500">Zero attendance marked</p>
                <p className="text-xs text-slate-400 mt-1">All employees are currently Unmarked.</p>
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
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance</span>
                  <span className="text-3.5xl font-black text-slate-800 leading-none mt-1">
                    {attendanceRate}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold mt-1">
                    {data.present} of {data.totalEmployees} present
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
                  <UserCheck size={18} /> Present
                </div>
                <div className="text-2xl font-black text-slate-800 mt-1">{data.present}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Status Code: P</div>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl">
                <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                  <UserX size={18} /> Absent
                </div>
                <div className="text-2xl font-black text-slate-800 mt-1">{data.absent}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Status Code: A</div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                  <UserMinus size={18} /> On Leave
                </div>
                <div className="text-2xl font-black text-slate-800 mt-1">{data.leave}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Status Code: L</div>
              </div>
            </div>

            {/* Supplementary Breakdowns */}
            <div className="bg-slate-50/70 border border-slate-150 p-4 rounded-xl text-xs space-y-3.5">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Other Categories and Fill Ratio</h4>
              
              {/* Half Day progress */}
              <div>
                <div className="flex justify-between font-semibold text-slate-600 mb-1">
                  <span className="flex items-center gap-1.5"><Clock size={13} className="text-amber-500" /> Half Day (H)</span>
                  <span>{data.halfDay} Employees ({Math.round(data.halfDay / data.totalEmployees * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(data.halfDay / data.totalEmployees) * 100}%` }} />
                </div>
              </div>

              {/* Sunday progress */}
              <div>
                <div className="flex justify-between font-semibold text-slate-600 mb-1">
                  <span className="flex items-center gap-1.5"><Calendar size={13} className="text-purple-500" /> Sunday (S)</span>
                  <span>{data.sunday} Employees ({Math.round(data.sunday / data.totalEmployees * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${(data.sunday / data.totalEmployees) * 100}%` }} />
                </div>
              </div>

              {/* Unmarked progress */}
              <div>
                <div className="flex justify-between font-semibold text-slate-600 mb-1">
                  <span className="flex items-center gap-1.5"><AlertCircle size={13} className="text-slate-400" /> Unmarked</span>
                  <span>{data.unmarked} Employees ({Math.round(data.unmarked / data.totalEmployees * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full transition-all duration-500" style={{ width: `${(data.unmarked / data.totalEmployees) * 100}%` }} />
                </div>
              </div>
            </div>
            
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 bg-sky-50/40 p-2.5 rounded-lg border border-sky-100/50">
              <Info size={14} className="text-sky-500 shrink-0" />
              <span>
                <strong>Attendance Rate</strong> is calculated as: <code>(Present + 0.5 * Half Day) / Total Employees</code>. Non-marked employees are treated as pending records for the select day.
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
