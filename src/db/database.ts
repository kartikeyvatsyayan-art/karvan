import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'veewell.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    address TEXT,
    pan_id TEXT,
    aadhaar_id TEXT,
    photo_url TEXT,
    monthly_salary REAL NOT NULL,
    date_of_joining TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    login_time TEXT,
    logout_time TEXT,
    comment TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE(employee_id, date)
  );

  CREATE TABLE IF NOT EXISTS advances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS overtime (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    hours REAL NOT NULL,
    rate REAL NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    mode TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );
`);

// Migration for existing tables
try {
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  db.exec(`ALTER TABLE employees ADD COLUMN date_of_joining TEXT DEFAULT '${currentYearStart}'`);
} catch (error) {
  // Column already exists, ignore
}

export default db;
