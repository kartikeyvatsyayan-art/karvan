import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import db from './src/db/database.js';

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ensure uploads directory exists and is served statically
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // File Upload API
  app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = req.file.originalname ? path.extname(req.file.originalname) : '.png';
      const filename = uniqueSuffix + ext;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      res.json({ url: `/uploads/${filename}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Routes
  
  // Dashboard
  app.get('/api/dashboard', (req, res) => {
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
    
    // For simplicity, total payouts = sum of all payments
    const totalPayouts = db.prepare('SELECT SUM(amount) as total FROM payments').get() as { total: number };
    
    const totalAdvances = db.prepare('SELECT SUM(amount) as total FROM advances').get() as { total: number };
    
    // Overtime total = sum(hours * rate)
    const totalOvertime = db.prepare('SELECT SUM(hours * rate) as total FROM overtime').get() as { total: number };

    res.json({
      totalEmployees: totalEmployees.count,
      totalPayouts: totalPayouts.total || 0,
      totalAdvances: totalAdvances.total || 0,
      totalOvertime: totalOvertime.total || 0,
    });
  });

  // Attendance Summary for specific date
  app.get('/api/attendance-summary', (req, res) => {
    let { date } = req.query; // Expecting YYYY-MM-DD
    
    if (!date) {
      // Find the latest date recorded in attendance table
      const latestRecord = db.prepare('SELECT date FROM attendance ORDER BY date DESC LIMIT 1').get() as { date: string } | undefined;
      if (latestRecord) {
        date = latestRecord.date;
      } else {
        // Fallback to current date in YYYY-MM-DD
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        date = `${year}-${month}-${day}`;
      }
    }

    const totalEmployeesResult = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
    const totalEmployees = totalEmployeesResult.count;

    const records = db.prepare('SELECT status, COUNT(*) as count FROM attendance WHERE date = ? GROUP BY status').all(date) as { status: string; count: number }[];

    const summary = {
      date,
      present: 0,
      absent: 0,
      leave: 0,
      halfDay: 0,
      sunday: 0,
      unmarked: totalEmployees,
      totalEmployees
    };

    let totalMarked = 0;
    records.forEach(row => {
      const count = row.count;
      if (row.status === 'P') {
        summary.present = count;
      } else if (row.status === 'A') {
        summary.absent = count;
      } else if (row.status === 'L') {
        summary.leave = count;
      } else if (row.status === 'H') {
        summary.halfDay = count;
      } else if (row.status === 'S') {
        summary.sunday = count;
      }
      totalMarked += count;
    });

    summary.unmarked = Math.max(0, totalEmployees - totalMarked);

    res.json(summary);
  });

  // Monthly Attendance Summary
  app.get('/api/attendance-monthly-summary', (req, res) => {
    let { month } = req.query; // Expecting YYYY-MM
    
    if (!month) {
      // Find the latest month recorded in attendance table
      const latestRecord = db.prepare('SELECT date FROM attendance ORDER BY date DESC LIMIT 1').get() as { date: string } | undefined;
      if (latestRecord) {
        month = latestRecord.date.substring(0, 7);
      } else {
        // Fallback to current month in YYYY-MM
        const d = new Date();
        const year = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        month = `${year}-${monthStr}`;
      }
    }

    const [yearStr, monthStr] = (month as string).split('-');
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    const totalEmployeesResult = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
    const totalEmployees = totalEmployeesResult.count;

    const records = db.prepare("SELECT status, COUNT(*) as count FROM attendance WHERE date LIKE ? GROUP BY status").all(`${month}-%`) as { status: string; count: number }[];

    const summary = {
      month,
      present: 0,
      absent: 0,
      leave: 0,
      halfDay: 0,
      sunday: 0,
      unmarked: totalEmployees * daysInMonth,
      totalEmployees,
      daysInMonth,
      totalPotentialRecords: totalEmployees * daysInMonth,
      employeeSummary: [] as any[]
    };

    let totalMarked = 0;
    records.forEach(row => {
      const count = row.count;
      if (row.status === 'P') {
        summary.present = count;
      } else if (row.status === 'A') {
        summary.absent = count;
      } else if (row.status === 'L') {
        summary.leave = count;
      } else if (row.status === 'H') {
        summary.halfDay = count;
      } else if (row.status === 'S') {
        summary.sunday = count;
      }
      totalMarked += count;
    });

    summary.unmarked = Math.max(0, (totalEmployees * daysInMonth) - totalMarked);

    // Get individual employee summaries for the month
    const employeesList = db.prepare('SELECT id, full_name, mobile, photo_url, monthly_salary FROM employees ORDER BY full_name ASC').all() as { id: number; full_name: string; mobile: string; photo_url: string; monthly_salary: number }[];
    
    const employeeRecords = db.prepare(`
      SELECT employee_id, status, COUNT(*) as count 
      FROM attendance 
      WHERE date LIKE ? 
      GROUP BY employee_id, status
    `).all(`${month}-%`) as { employee_id: number; status: string; count: number }[];

    const empRecordMap: Record<number, Record<string, number>> = {};
    employeeRecords.forEach(row => {
      if (!empRecordMap[row.employee_id]) {
        empRecordMap[row.employee_id] = { P: 0, A: 0, L: 0, H: 0, S: 0 };
      }
      empRecordMap[row.employee_id][row.status] = row.count;
    });

    summary.employeeSummary = employeesList.map(emp => {
      const stats = empRecordMap[emp.id] || { P: 0, A: 0, L: 0, H: 0, S: 0 };
      const present = stats.P || 0;
      const absent = stats.A || 0;
      const leave = stats.L || 0;
      const halfDay = stats.H || 0;
      const sunday = stats.S || 0;
      const totalMarkedForEmp = present + absent + leave + halfDay + sunday;
      const unmarked = Math.max(0, daysInMonth - totalMarkedForEmp);
      const totalRelevantMarked = present + absent + leave + halfDay;
      const attendanceRate = totalRelevantMarked > 0
        ? Math.round(((present + halfDay * 0.5) / totalRelevantMarked) * 100)
        : 0;

      return {
        id: emp.id,
        fullName: emp.full_name,
        mobile: emp.mobile,
        photoUrl: emp.photo_url,
        monthlySalary: emp.monthly_salary,
        present,
        absent,
        leave,
        halfDay,
        sunday,
        unmarked,
        attendanceRate
      };
    });

    res.json(summary);
  });

  // Employees
  app.get('/api/employees', (req, res) => {
    const employees = db.prepare('SELECT * FROM employees ORDER BY id DESC').all();
    res.json(employees);
  });

  app.post('/api/employees', (req, res) => {
    const { full_name, mobile, address, pan_id, aadhaar_id, photo_url, pan_photo_url, aadhaar_photo_url, monthly_salary, date_of_joining } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO employees (full_name, mobile, address, pan_id, aadhaar_id, photo_url, pan_photo_url, aadhaar_photo_url, monthly_salary, date_of_joining)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(full_name, mobile, address, pan_id, aadhaar_id, photo_url, pan_photo_url, aadhaar_photo_url, monthly_salary, date_of_joining);
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/employees/:id', (req, res) => {
    const { full_name, mobile, address, pan_id, aadhaar_id, photo_url, pan_photo_url, aadhaar_photo_url, monthly_salary, date_of_joining } = req.body;
    try {
      const stmt = db.prepare(`
        UPDATE employees 
        SET full_name = ?, mobile = ?, address = ?, pan_id = ?, aadhaar_id = ?, photo_url = ?, pan_photo_url = ?, aadhaar_photo_url = ?, monthly_salary = ?, date_of_joining = ?
        WHERE id = ?
      `);
      stmt.run(full_name, mobile, address, pan_id, aadhaar_id, photo_url, pan_photo_url, aadhaar_photo_url, monthly_salary, date_of_joining, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/employees/:id', (req, res) => {
    try {
      const id = req.params.id;
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM attendance WHERE employee_id = ?').run(id);
        db.prepare('DELETE FROM advances WHERE employee_id = ?').run(id);
        db.prepare('DELETE FROM overtime WHERE employee_id = ?').run(id);
        db.prepare('DELETE FROM payments WHERE employee_id = ?').run(id);
        db.prepare('DELETE FROM employees WHERE id = ?').run(id);
      });
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Attendance
  app.get('/api/attendance', (req, res) => {
    const { month, year } = req.query; // format: MM, YYYY
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year required' });
    }
    const datePrefix = `${year}-${month.toString().padStart(2, '0')}`;
    const attendance = db.prepare('SELECT * FROM attendance WHERE date LIKE ?').all(`${datePrefix}-%`);
    res.json(attendance);
  });

  app.post('/api/attendance', (req, res) => {
    const { employee_id, date, status, login_time, logout_time, comment } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO attendance (employee_id, date, status, login_time, logout_time, comment)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(employee_id, date) DO UPDATE SET 
          status = excluded.status,
          login_time = excluded.login_time,
          logout_time = excluded.logout_time,
          comment = excluded.comment
      `);
      stmt.run(employee_id, date, status, login_time, logout_time, comment);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Advances
  app.get('/api/advances', (req, res) => {
    const { month, year, startDate, endDate, employeeId } = req.query;
    let query = `
      SELECT a.*, e.full_name, e.photo_url 
      FROM advances a 
      JOIN employees e ON a.employee_id = e.id 
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (startDate && endDate) {
      conditions.push('a.date >= ? AND a.date <= ?');
      params.push(startDate, endDate);
    } else if (month && year) {
      const m = parseInt(month as string, 10);
      const y = parseInt(year as string, 10);
      const daysInMonth = new Date(y, m, 0).getDate();
      const startStr = `${y}-${m.toString().padStart(2, '0')}-01`;
      const endStr = `${y}-${m.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;
      conditions.push('a.date >= ? AND a.date <= ?');
      params.push(startStr, endStr);
    }

    if (employeeId && employeeId !== 'all') {
      conditions.push('a.employee_id = ?');
      params.push(employeeId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.date DESC';

    try {
      const advances = db.prepare(query).all(...params);
      res.json(advances);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/advances', (req, res) => {
    const { employee_id, date, amount } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO advances (employee_id, date, amount) VALUES (?, ?, ?)');
      const info = stmt.run(employee_id, date, amount);
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/advances/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM advances WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Overtime
  app.get('/api/overtime', (req, res) => {
    const overtime = db.prepare(`
      SELECT o.*, e.full_name 
      FROM overtime o 
      JOIN employees e ON o.employee_id = e.id 
      ORDER BY o.date DESC
    `).all();
    res.json(overtime);
  });

  app.post('/api/overtime', (req, res) => {
    const { employee_id, date, hours, rate } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO overtime (employee_id, date, hours, rate) VALUES (?, ?, ?, ?)');
      const info = stmt.run(employee_id, date, hours, rate);
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/overtime/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM overtime WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Payments
  app.get('/api/payments', (req, res) => {
    const payments = db.prepare(`
      SELECT p.*, e.full_name 
      FROM payments p 
      JOIN employees e ON p.employee_id = e.id 
      ORDER BY p.date DESC
    `).all();
    res.json(payments);
  });

  app.post('/api/payments', (req, res) => {
    const { employee_id, date, amount, mode } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO payments (employee_id, date, amount, mode) VALUES (?, ?, ?, ?)');
      const info = stmt.run(employee_id, date, amount, mode);
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/payments/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Salary Calculation
  app.get('/api/salary-calculation', (req, res) => {
    const { month, year, startDate, endDate } = req.query;
    
    let startStr = '';
    let endStr = '';
    let daysInMonth = 30;

    if (startDate && endDate) {
      startStr = startDate as string;
      endStr = endDate as string;
      const sDate = new Date(startStr);
      daysInMonth = new Date(sDate.getFullYear(), sDate.getMonth() + 1, 0).getDate();
    } else if (month && year) {
      const m = parseInt(month as string, 10);
      const y = parseInt(year as string, 10);
      daysInMonth = new Date(y, m, 0).getDate();
      startStr = `${y}-${m.toString().padStart(2, '0')}-01`;
      endStr = `${y}-${m.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;
    } else {
      return res.status(400).json({ error: 'Month/Year or Start/End dates required' });
    }

    try {
      const employees = db.prepare('SELECT * FROM employees').all() as any[];
      
      const results = employees.map(emp => {
        // Attendance
        const attendance = db.prepare('SELECT status FROM attendance WHERE employee_id = ? AND date >= ? AND date <= ?').all(emp.id, startStr, endStr) as any[];
        let p = 0, l = 0, h = 0, a = 0, s = 0;
        attendance.forEach(record => {
          if (record.status === 'P') p++;
          if (record.status === 'L') l++;
          if (record.status === 'H') h++;
          if (record.status === 'A') a++;
          if (record.status === 'S') s++;
        });
        const totalPaidDays = p + l + s + (h * 0.5);
        
        // Advances
        const advances = db.prepare('SELECT SUM(amount) as total FROM advances WHERE employee_id = ? AND date >= ? AND date <= ?').get(emp.id, startStr, endStr) as any;
        const totalAdvances = advances.total || 0;
        
        // Overtime
        const overtime = db.prepare('SELECT SUM(hours * rate) as total FROM overtime WHERE employee_id = ? AND date >= ? AND date <= ?').get(emp.id, startStr, endStr) as any;
        const totalOvertime = overtime.total || 0;

        // Payments
        const payments = db.prepare('SELECT SUM(amount) as total FROM payments WHERE employee_id = ? AND date >= ? AND date <= ?').get(emp.id, startStr, endStr) as any;
        const totalPaidAmount = payments.total || 0;

        const perDaySalary = emp.monthly_salary / daysInMonth;
        const baseSalary = totalPaidDays * perDaySalary;
        const finalSalary = baseSalary - totalAdvances + totalOvertime;

        return {
          employee_id: emp.id,
          full_name: emp.full_name,
          date_of_joining: emp.date_of_joining,
          monthly_salary: emp.monthly_salary,
          perDaySalary: Math.round(perDaySalary),
          totalPaidDays,
          baseSalary: Math.round(baseSalary),
          totalAdvances: Math.round(totalAdvances),
          totalOvertime: Math.round(totalOvertime),
          totalPaidAmount: Math.round(totalPaidAmount),
          finalSalary: Math.round(finalSalary),
          periodStr: `${startStr} to ${endStr}`
        };
      });

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync Data (Export to Excel for Google Sheets)
  app.get('/api/export-sheets', (req, res) => {
    try {
      const employees = db.prepare('SELECT * FROM employees').all();
      const attendance = db.prepare('SELECT * FROM attendance').all();
      const advances = db.prepare('SELECT * FROM advances').all();
      const overtime = db.prepare('SELECT * FROM overtime').all();
      const payments = db.prepare('SELECT * FROM payments').all();

      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(employees), 'Employees');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attendance), 'Attendance');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(advances), 'Advances');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overtime), 'Overtime');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payments), 'Payments');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="Veewell_Data.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync Data (Import from Excel from Google Sheets)
  app.post('/api/import-sheets', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    try {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      
      const transaction = db.transaction(() => {
        // Employees
        if (wb.SheetNames.includes('Employees')) {
          const employees = XLSX.utils.sheet_to_json(wb.Sheets['Employees']) as any[];
          const stmt = db.prepare(`
            INSERT INTO employees (id, full_name, mobile, address, pan_id, aadhaar_id, photo_url, monthly_salary, date_of_joining)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              full_name=excluded.full_name, mobile=excluded.mobile, address=excluded.address,
              pan_id=excluded.pan_id, aadhaar_id=excluded.aadhaar_id, photo_url=excluded.photo_url,
              monthly_salary=excluded.monthly_salary, date_of_joining=excluded.date_of_joining
          `);
          for (const emp of employees) {
            stmt.run(emp.id, emp.full_name, emp.mobile, emp.address, emp.pan_id, emp.aadhaar_id, emp.photo_url, emp.monthly_salary, emp.date_of_joining || '2024-01-01');
          }
        }

        // Attendance
        if (wb.SheetNames.includes('Attendance')) {
          const attendance = XLSX.utils.sheet_to_json(wb.Sheets['Attendance']) as any[];
          const stmt = db.prepare(`
            INSERT INTO attendance (id, employee_id, date, status, login_time, logout_time, comment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employee_id=excluded.employee_id, date=excluded.date, status=excluded.status,
              login_time=excluded.login_time, logout_time=excluded.logout_time, comment=excluded.comment
          `);
          for (const att of attendance) {
            stmt.run(att.id, att.employee_id, att.date, att.status, att.login_time, att.logout_time, att.comment);
          }
        }

        // Advances
        if (wb.SheetNames.includes('Advances')) {
          const advances = XLSX.utils.sheet_to_json(wb.Sheets['Advances']) as any[];
          const stmt = db.prepare(`
            INSERT INTO advances (id, employee_id, date, amount)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employee_id=excluded.employee_id, date=excluded.date, amount=excluded.amount
          `);
          for (const adv of advances) {
            stmt.run(adv.id, adv.employee_id, adv.date, adv.amount);
          }
        }

        // Overtime
        if (wb.SheetNames.includes('Overtime')) {
          const overtime = XLSX.utils.sheet_to_json(wb.Sheets['Overtime']) as any[];
          const stmt = db.prepare(`
            INSERT INTO overtime (id, employee_id, date, hours, rate)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employee_id=excluded.employee_id, date=excluded.date, hours=excluded.hours, rate=excluded.rate
          `);
          for (const ot of overtime) {
            stmt.run(ot.id, ot.employee_id, ot.date, ot.hours, ot.rate);
          }
        }

        // Payments
        if (wb.SheetNames.includes('Payments')) {
          const payments = XLSX.utils.sheet_to_json(wb.Sheets['Payments']) as any[];
          const stmt = db.prepare(`
            INSERT INTO payments (id, employee_id, date, amount, mode)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employee_id=excluded.employee_id, date=excluded.date, amount=excluded.amount, mode=excluded.mode
          `);
          for (const pay of payments) {
            stmt.run(pay.id, pay.employee_id, pay.date, pay.amount, pay.mode);
          }
        }
      });
      
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Backup
  app.get('/api/backup', (req, res) => {
    try {
      const employees = db.prepare('SELECT * FROM employees').all();
      const attendance = db.prepare('SELECT * FROM attendance').all();
      const advances = db.prepare('SELECT * FROM advances').all();
      const overtime = db.prepare('SELECT * FROM overtime').all();
      const payments = db.prepare('SELECT * FROM payments').all();

      const backupData = {
        timestamp: new Date().toISOString(),
        data: {
          employees,
          attendance,
          advances,
          overtime,
          payments
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=veewell_backup.json');
      res.send(JSON.stringify(backupData, null, 2));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Restore JSON
  app.post('/api/restore', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    try {
      const jsonStr = req.file.buffer.toString('utf-8');
      const parsed = JSON.parse(jsonStr);
      const data = parsed.data || parsed; // Handle both wrapped and unwrapped formats
      
      const transaction = db.transaction(() => {
        if (data.employees && Array.isArray(data.employees)) {
          const stmt = db.prepare(`
            INSERT INTO employees (id, full_name, mobile, address, pan_id, aadhaar_id, photo_url, monthly_salary, date_of_joining)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              full_name=excluded.full_name, mobile=excluded.mobile, address=excluded.address,
              pan_id=excluded.pan_id, aadhaar_id=excluded.aadhaar_id, photo_url=excluded.photo_url,
              monthly_salary=excluded.monthly_salary, date_of_joining=excluded.date_of_joining
          `);
          for (const emp of data.employees) {
            stmt.run(emp.id, emp.full_name, emp.mobile, emp.address, emp.pan_id, emp.aadhaar_id, emp.photo_url, emp.monthly_salary, emp.date_of_joining || '2024-01-01');
          }
        }

        if (data.attendance && Array.isArray(data.attendance)) {
          const stmt = db.prepare(`
            INSERT INTO attendance (id, employee_id, date, status, login_time, logout_time, comment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employee_id=excluded.employee_id, date=excluded.date, status=excluded.status,
              login_time=excluded.login_time, logout_time=excluded.logout_time, comment=excluded.comment
          `);
          for (const att of data.attendance) {
            stmt.run(att.id, att.employee_id, att.date, att.status, att.login_time, att.logout_time, att.comment);
          }
        }

        if (data.advances && Array.isArray(data.advances)) {
          const stmt = db.prepare(`
            INSERT INTO advances (id, employee_id, date, amount)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employee_id=excluded.employee_id, date=excluded.date, amount=excluded.amount
          `);
          for (const adv of data.advances) {
            stmt.run(adv.id, adv.employee_id, adv.date, adv.amount);
          }
        }

        if (data.overtime && Array.isArray(data.overtime)) {
          const stmt = db.prepare(`
            INSERT INTO overtime (id, employee_id, date, hours, rate)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employee_id=excluded.employee_id, date=excluded.date, hours=excluded.hours, rate=excluded.rate
          `);
          for (const ot of data.overtime) {
            stmt.run(ot.id, ot.employee_id, ot.date, ot.hours, ot.rate);
          }
        }

        if (data.payments && Array.isArray(data.payments)) {
          const stmt = db.prepare(`
            INSERT INTO payments (id, employee_id, date, amount, mode)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employee_id=excluded.employee_id, date=excluded.date, amount=excluded.amount, mode=excluded.mode
          `);
          for (const pay of data.payments) {
            stmt.run(pay.id, pay.employee_id, pay.date, pay.amount, pay.mode);
          }
        }
      });
      
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Full Database Backup (.db file)
  app.get('/api/db-backup', (req, res) => {
    const dbPath = path.resolve(process.cwd(), 'veewell.db');
    if (fs.existsSync(dbPath)) {
      res.download(dbPath, 'veewell_full_backup.db');
    } else {
      res.status(404).json({ error: 'Database file not found' });
    }
  });

  // Full Database Restore (.db file)
  app.post('/api/db-restore', upload.single('file'), (req, res) => {
    if (!req.file) {
      console.error('Restore failed: No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('Starting full database restore...');
    const dbPath = path.resolve(process.cwd(), 'veewell.db');
    const backupPath = path.resolve(process.cwd(), 'veewell.db.bak');
    
    try {
      // 1. Close the current connection to release the file lock
      console.log('Closing database connection...');
      db.close();
      
      // 2. Backup current DB just in case
      if (fs.existsSync(dbPath)) {
        fs.renameSync(dbPath, backupPath);
        console.log('Current database moved to backup');
      }
      
      // 3. Write the new database file
      fs.writeFileSync(dbPath, req.file.buffer);
      console.log('New database file written successfully');
      
      // 4. Delete the backup if everything went well
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
      
      res.json({ success: true, message: 'Database file replaced. The server will now restart.' });
      
      // 5. Force exit to let the platform restart the server with the new DB
      console.log('Exiting process for restart in 1 second...');
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } catch (error: any) {
      console.error('Database restore error:', error);
      
      // Try to restore the backup if it exists and we failed
      if (fs.existsSync(backupPath) && !fs.existsSync(dbPath)) {
        try {
          fs.renameSync(backupPath, dbPath);
          console.log('Restored original database from backup after failure');
        } catch (e) {
          console.error('Failed to restore backup after error:', e);
        }
      }
      
      res.status(500).json({ error: `Restore failed: ${error.message}` });
      
      // If we closed the DB but failed to restore, we might need to exit anyway to recover
      setTimeout(() => process.exit(1), 2000);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
