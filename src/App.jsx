import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login'; // pages 폴더 경로로 수정
import WardOverview from './pages/WardOverview'; // pages 폴더 경로로 수정
import Dashboard from './pages/Dashboard';
import DetailedData from './pages/DetailedData';
import CCTV from './pages/CCTV';

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. 첫 화면: 의료인 로그인 */}
        <Route path="/" element={<Login />} />
        
        {/* 2. 로그인 후 이동할 병동 전체 현황 대시보드 */}
        <Route path="/ward" element={<WardOverview />} />
        
        {/* 3. 특정 환자 클릭 시 진입하는 기존 개별 환자 화면 */}
        <Route path="/dashboard/:patientId" element={<Dashboard />} />
        
        {/* 4. 기존 개별 페이지들 완벽 유지 */}
        <Route path="/details" element={<DetailedData />} />
        <Route path="/cctv" element={<CCTV />} />
        
        {/* 잘못된 주소 접근 시 로그인 화면으로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;