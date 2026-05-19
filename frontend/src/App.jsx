import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import PatientAuth    from './pages/PatientAuth';
import Dashboard      from './pages/Dashboard';
import DetailedData   from './pages/DetailedData';
import CCTV           from './pages/CCTV';
import BulkVitalEntry from './pages/BulkVitalEntry';
import { FallAlertProvider, useFallAlert } from './context/FallAlertContext';

/**
 * 낙상 감지 전역 알림 배너
 *
 * - Router 내부에 위치시켜 useNavigate 사용 가능
 * - 클릭 시 /dashboard로 이동 (Dashboard가 pendingFallRoom을 감지해 모달 자동 오픈)
 */
function GlobalFallAlert() {
  const { globalAlert } = useFallAlert();
  const navigate = useNavigate();

  if (!globalAlert) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] cursor-pointer"
      onClick={() => navigate('/dashboard')}
    >
      <div className="bg-red-600 text-white px-10 py-5 rounded-2xl shadow-2xl
                      text-xl font-black flex items-center gap-3 animate-bounce">
        ⚠️ {globalAlert}
        <span className="text-sm font-semibold opacity-75 ml-1">→ 눌러서 기록</span>
      </div>
    </div>
  );
}

/** Router 내부에 두어 useNavigate를 쓸 수 있도록 분리 */
function AppContent() {
  return (
    <>
      <GlobalFallAlert />
      <Routes>
        <Route path="/"             element={<PatientAuth />}    />
        <Route path="/dashboard"    element={<Dashboard />}      />
        <Route path="/details"      element={<DetailedData />}   />
        <Route path="/cctv"         element={<CCTV />}           />
        <Route path="/bulk-vitals"  element={<BulkVitalEntry />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <FallAlertProvider>
      <Router>
        <AppContent />
      </Router>
    </FallAlertProvider>
  );
}

export default App;
