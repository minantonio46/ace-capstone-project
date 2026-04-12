import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientAuth from './pages/PatientAuth';
import Dashboard from './pages/Dashboard';
import DetailedData from './pages/DetailedData';
import CCTV from './pages/CCTV';

function App() {
  return (
    <Router>
      <Routes>
        {/* 주소창 끝이 / 일 때 (첫 화면) */}
        <Route path="/" element={<PatientAuth />} />
        
        {/* 주소창 끝이 /dashboard 일 때 */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 주소창 끝이 /details 일 때 */}
        <Route path="/details" element={<DetailedData />} />
        
        {/* 주소창 끝이 /cctv 일 때 */}
        <Route path="/cctv" element={<CCTV />} />
      </Routes>
    </Router>
  );
}

export default App;