import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import * as XLSX from 'xlsx';
import db from './src/db/database.js';

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // Employees
  app.get('/api/employees', (req, res) => {
    const employees = db.prepare('SELECT * FROM employees ORDER BY id DESC').all();
    res.json(employees);
  });

  app.post('/api/employees', (req, res) => {
    const { full_name, mobile, address, pan_id, aadhaar_id, photo_url, monthly_salary } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO employees (full_name, mobile, address, pan_id, aadhaar_id, photo_url, monthly_salary)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(full_name, mobile, address, pan_id, aadhaar_id, photo_url, monthly_salary);
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/employees/:id', (req, res) => {
    const { full_name, mobile, address, pan_id, aadhaar_id, photo_url, monthly_salary } = req.body;
    try {
      const stmt = db.prepare(`
        UPDATE employees 
        SET full_name = ?, mobile = ?, address = ?, pan_id = ?, aadhaar_id = ?, photo_url = ?, monthly_salary = ?
        WHERE id = ?
      `);
      stmt.run(full_name, mobile, address, pan_id, aadhaar_id, photo_url, monthly_salary, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/employees/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
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
    const { employee_id, date, status } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO attendance (employee_id, date, status)
        VALUES (?, ?, ?)
        ON CONFLICT(employee_id, date) DO UPDATE SET status = excluded.status
      `);
      stmt.run(employee_id, date, status);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Advances
  app.get('/api/advances', (req, res) => {
    const advances = db.prepare(`
      SELECT a.*, e.full_name 
      FROM advances a 
      JOIN employees e ON a.employee_id = e.id 
      ORDER BY a.date DESC
    `).all();
    res.json(advances);
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
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year required' });
    }
    
    const m = parseInt(month as string, 10);
    const y = parseInt(year as string, 10);
    const daysInMonth = new Date(y, m, 0).getDate();
    const datePrefix = `${y}-${m.toString().padStart(2, '0')}`;

    try {
      const employees = db.prepare('SELECT * FROM employees').all() as any[];
      
      const results = employees.map(emp => {
        // Attendance
        const attendance = db.prepare('SELECT status FROM attendance WHERE employee_id = ? AND date LIKE ?').all(emp.id, `${datePrefix}-%`) as any[];
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
        const advances = db.prepare('SELECT SUM(amount) as total FROM advances WHERE employee_id = ? AND date LIKE ?').get(emp.id, `${datePrefix}-%`) as any;
        const totalAdvances = advances.total || 0;
        
        // Overtime
        const overtime = db.prepare('SELECT SUM(hours * rate) as total FROM overtime WHERE employee_id = ? AND date LIKE ?').get(emp.id, `${datePrefix}-%`) as any;
        const totalOvertime = overtime.total || 0;

        const perDaySalary = emp.monthly_salary / daysInMonth;
        const baseSalary = totalPaidDays * perDaySalary;
        const finalSalary = baseSalary - totalAdvances + totalOvertime;

        return {
          employee_id: emp.id,
          full_name: emp.full_name,
          monthly_salary: emp.monthly_salary,
          perDaySalary: Math.round(perDaySalary),
          totalPaidDays,
          baseSalary: Math.round(baseSalary),
          totalAdvances: Math.round(totalAdvances),
          totalOvertime: Math.round(totalOvertime),
          finalSalary: Math.round(finalSalary)
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
            INSERT INTO employees (id, full_name, mobile, address, pan_id, aadhaar_id, photo_url, monthly_salary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              full_name=excluded.full_name, mobile=excluded.mobile, address=excluded.address,
              pan_id=excluded.pan_id, aadhaar_id=excluded.aadhaar_id, photo_url=excluded.photo_url,
              monthly_salary=excluded.monthly_salary
          `);
          for (const emp of employees) {
            stmt.run(emp.id, emp.full_name, emp.mobile, emp.address, emp.pan_id, emp.aadhaar_id, emp.photo_url, emp.monthly_salary);
          }
        }

        // Attendance
        if (wb.SheetNames.includes('Attendance')) {
          const attendance = XLSX.utils.sheet_to_json(wb.Sheets['Attendance']) as any[];
          const stmt = db.prepare(`
            INSERT INTO attendance (id, employee_id, date, status)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employee_id=excluded.employee_id, date=excluded.date, status=excluded.status
          `);
          for (const att of attendance) {
            stmt.run(att.id, att.employee_id, att.date, att.status);
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
