import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Advances from './pages/Advances';
import Overtime from './pages/Overtime';
import Payments from './pages/Payments';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="advances" element={<Advances />} />
        <Route path="overtime" element={<Overtime />} />
        <Route path="payments" element={<Payments />} />
      </Route>
    </Routes>
  );
}
