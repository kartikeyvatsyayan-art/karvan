import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, getDaysInMonth, startOfMonth, addDays } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Calendar, AlertCircle, Edit3, X, Save } from 'lucide-react';
import type { Employee, Attendance as AttendanceType } from '../types';

const STATUS_COLORS = {
  P: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  L: 'bg-blue-100 text-blue-700 border-blue-200',
  H: 'bg-amber-100 text-amber-700 border-amber-200',
  A: 'bg-red-100 text-red-700 border-red-200',
  S: 'bg-purple-100 text-purple-700 border-purple-200',
};

const STATUS_LABELS = {
  P: 'Present',
  L: 'Leave',
  H: 'Half Day',
  A: 'Absent',
  S: 'Sunday',
};

export default function Attendance() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [editingRecord, setEditingRecord] = useState<{
    employeeId: number;
    employeeName: string;
    date: string;
    status: string;
    loginTime: string;
    logoutTime: string;
    comment: string;
  } | null>(null);

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    const data = await res.json();
    setEmployees(data);
  };

  const fetchAttendance = async () => {
    const res = await fetch(`/api/attendance?month=${selectedMonth}&year=${selectedYear}`);
    const data = await res.json();
    setAttendance(data);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEmployees(), fetchAttendance()]).then(() => setLoading(false));
  }, [selectedMonth, selectedYear]);

  const handleStatusChange = async (employeeId: number, date: string, status: string) => {
    // Optimistic update
    const newAttendance = [...attendance];
    const existingIndex = newAttendance.findIndex(a => a.employee_id === employeeId && a.date === date);
    
    if (existingIndex >= 0) {
      newAttendance[existingIndex].status = status as any;
    } else {
      newAttendance.push({ id: Date.now(), employee_id: employeeId, date, status: status as any });
    }
    setAttendance(newAttendance);

    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: employeeId, date, status }),
    });
  };

  const handleUpdateDetails = async () => {
    if (!editingRecord) return;

    const { employeeId, date, status, loginTime, logoutTime, comment } = editingRecord;

    // Optimistic update
    const newAttendance = [...attendance];
    const existingIndex = newAttendance.findIndex(a => a.employee_id === employeeId && a.date === date);
    
    if (existingIndex >= 0) {
      newAttendance[existingIndex] = { 
        ...newAttendance[existingIndex], 
        status: status as any,
        login_time: loginTime,
        logout_time: logoutTime,
        comment: comment
      };
    } else {
      newAttendance.push({ 
        id: Date.now(), 
        employee_id: employeeId, 
        date, 
        status: status as any,
        login_time: loginTime,
        logout_time: logoutTime,
        comment: comment
      });
    }
    setAttendance(newAttendance);

    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        employee_id: employeeId, 
        date, 
        status,
        login_time: loginTime,
        logout_time: logoutTime,
        comment: comment
      }),
    });

    setEditingRecord(null);
  };

  const daysInMonth = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1);
    const days = getDaysInMonth(date);
    const start = startOfMonth(date);
    
    return Array.from({ length: days }).map((_, i) => {
      const d = addDays(start, i);
      return {
        date: format(d, 'yyyy-MM-dd'),
        dayNum: format(d, 'd'),
        dayName: format(d, 'EEE'),
        isSunday: d.getDay() === 0,
      };
    });
  }, [selectedMonth, selectedYear]);

  const calculateStats = (employeeId: number) => {
    const empAttendance = attendance.filter(a => a.employee_id === employeeId);
    let p = 0, l = 0, h = 0, a = 0, s = 0;
    
    empAttendance.forEach(record => {
      if (record.status === 'P') p++;
      if (record.status === 'L') l++;
      if (record.status === 'H') h++;
      if (record.status === 'A') a++;
      if (record.status === 'S') s++;
    });

    const totalPaidDays = p + l + s + (h * 0.5);
    return { p, l, h, a, s, totalPaidDays };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Attendance Tracking</h1>
          <p className="text-slate-500 mt-2">Mark daily attendance and calculate paid days.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent border-none focus:ring-0 text-slate-700 font-medium cursor-pointer pl-2 pr-8 py-2"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {format(new Date(2000, i), 'MMMM')}
              </option>
            ))}
          </select>
          <div className="w-px h-6 bg-slate-200"></div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent border-none focus:ring-0 text-slate-700 font-medium cursor-pointer pl-2 pr-8 py-2"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-medium sticky left-0 bg-slate-50/95 backdrop-blur-sm z-20 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  Employee
                </th>
                {daysInMonth.map((day) => (
                  <th key={day.date} className={`px-2 py-4 text-center font-medium min-w-[48px] ${day.isSunday ? 'bg-red-50/50 text-red-600' : ''}`}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] opacity-70">{day.dayName}</span>
                      <span className="text-sm font-bold">{day.dayNum}</span>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 font-medium sticky right-0 bg-slate-50/95 backdrop-blur-sm z-20 border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.02)] text-center">
                  Paid Days
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={daysInMonth.length + 2} className="px-6 py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth.length + 2} className="px-6 py-12 text-center text-slate-400">
                    No employees found. Please add employees first.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const stats = calculateStats(emp.id);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3 sticky left-0 bg-white group-hover:bg-slate-50/95 backdrop-blur-sm z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="font-semibold text-slate-900 whitespace-nowrap">{emp.full_name}</div>
                        <div className="text-xs text-slate-500">ID: #{emp.id}</div>
                      </td>
                      
                      {daysInMonth.map((day) => {
                        const record = attendance.find(a => a.employee_id === emp.id && a.date === day.date);
                        const status = record?.status;
                        
                        return (
                          <td key={day.date} className={`p-1 text-center relative group/cell ${day.isSunday ? 'bg-red-50/30' : ''}`}>
                            <div className="flex flex-col gap-1 items-center">
                              <select
                                value={status || ''}
                                onChange={(e) => handleStatusChange(emp.id, day.date, e.target.value)}
                                className={`w-full h-10 rounded-lg text-center font-bold text-sm cursor-pointer appearance-none transition-all border ${
                                  status ? STATUS_COLORS[status] : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                <option value="" disabled>-</option>
                                <option value="P">P</option>
                                <option value="L">L</option>
                                <option value="H">H</option>
                                <option value="A">A</option>
                                <option value="S">S</option>
                              </select>
                              
                              <button
                                onClick={() => setEditingRecord({
                                  employeeId: emp.id,
                                  employeeName: emp.full_name,
                                  date: day.date,
                                  status: status || 'P',
                                  loginTime: record?.login_time || '',
                                  logoutTime: record?.logout_time || '',
                                  comment: record?.comment || '',
                                })}
                                className={`p-1 rounded-md transition-all opacity-0 group-hover/cell:opacity-100 hover:bg-slate-200 text-slate-500 premium-glossy ${
                                  (record?.login_time || record?.logout_time || record?.comment) ? 'opacity-100 text-blue-600' : ''
                                }`}
                                title="Edit Details"
                              >
                                <Edit3 size={12} />
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      <td className="px-6 py-3 sticky right-0 bg-white group-hover:bg-slate-50/95 backdrop-blur-sm z-10 border-l border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.02)] text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-700 font-bold text-lg border border-blue-100">
                          {stats.totalPaidDays}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${STATUS_COLORS[key as keyof typeof STATUS_COLORS]}`}>
              {key}
            </div>
            <span className="text-sm font-medium text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Attendance Details</h2>
                  <p className="text-sm text-slate-500">{editingRecord.employeeName} • {format(new Date(editingRecord.date), 'dd MMM yyyy')}</p>
                </div>
                <button 
                  onClick={() => setEditingRecord(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600 premium-glossy"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                    <select
                      value={editingRecord.status}
                      onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    >
                      <option value="P">Present</option>
                      <option value="L">Leave</option>
                      <option value="H">Half Day</option>
                      <option value="A">Absent</option>
                      <option value="S">Sunday</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Login Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="time"
                        value={editingRecord.loginTime}
                        onChange={(e) => setEditingRecord({ ...editingRecord, loginTime: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logout Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="time"
                        value={editingRecord.logoutTime}
                        onChange={(e) => setEditingRecord({ ...editingRecord, logoutTime: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comment</label>
                  <textarea
                    value={editingRecord.comment}
                    onChange={(e) => setEditingRecord({ ...editingRecord, comment: e.target.value })}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-all premium-glossy"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDetails}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 premium-glossy"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
