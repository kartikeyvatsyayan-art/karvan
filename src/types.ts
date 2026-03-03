export interface Employee {
  id: number;
  full_name: string;
  mobile: string;
  address: string;
  pan_id: string;
  aadhaar_id: string;
  photo_url: string;
  monthly_salary: number;
  created_at: string;
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  status: 'P' | 'L' | 'H' | 'A' | 'S';
}

export interface Advance {
  id: number;
  employee_id: number;
  date: string;
  amount: number;
  full_name?: string;
}

export interface Overtime {
  id: number;
  employee_id: number;
  date: string;
  hours: number;
  rate: number;
  full_name?: string;
}

export interface Payment {
  id: number;
  employee_id: number;
  date: string;
  amount: number;
  mode: string;
  full_name?: string;
}
