import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Header from '../components/Header';

const WardOverview = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // 라우터 이동용 훅

  // 시스템 종료 (로그아웃) 처리 함수
  const handleLogout = () => {
    localStorage.clear(); // 인증 토큰 및 유저 세션 정보 삭제
    navigate('/');        // 로그인 첫 화면으로 이동
  };

  // 백엔드 WardController: GET /api/wards/{wardId}/dashboard 데이터 호출 함수
  const fetchDashboard = async () => {
    try {
      const wardId = localStorage.getItem('wardId') || '1';
      // 실제 서버에 요청하는 부분 테스트를 위해 임시 주석처리
      // const res = await api.get(`/api/wards/${wardId}/dashboard`);
      
      const res = {
        data: {
          success: true,
          data: {
            wardId: 1,
            wardName: "3층 일반 관제병동",
            totalPatients: 2,
            patients: [
              {
                patientId: 101,
                name: "김순길",
                bedNumber: "301-A",
                latestVitals: { bp: "120/80", temperature: 36.5, heartRate: 72, oxygenSaturation: 99 },
                skeletonStatus: "NORMAL",
                unresolvedAlerts: 0
              },
              {
                patientId: 102,
                name: "홍길동",
                bedNumber: "301-B",
                latestVitals: { bp: "135/90", temperature: 37.2, heartRate: 88, oxygenSaturation: 95 },
                skeletonStatus: "FALL_DETECTED", // 낙상 발생 테스트용
                unresolvedAlerts: 2
              }
            ]
          }
        }
      };

      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error("대시보드 로딩 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // 5초마다 실시간으로 데이터를 새로고침하는 타이머 설정
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  // 스켈레톤 상태에 따른 실시간 분석 태그 및 배지 스타일 결정 함수
  const getSkeletonBadge = (status) => {
    switch (status) {
      case 'FALL_DETECTED':
        return <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full font-black text-xs">🚨 낙상 발생</span>;
      case 'ABNORMAL':
        return <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full font-black text-xs">⚠️ 이상 행동</span>;
      default:
        return <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full font-black text-xs">● 정상</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 font-bold bg-[#f8f9fa]">
        병동 현황 통합 데이터 분석 중...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9fa] overflow-y-auto font-sans">
      
      <main className="w-full flex flex-col pb-16">
        {/* 헤더 바 연동 (햄버거와 환자 ID 레이어가 나오지 않도록 타이틀만 주입) */}
        <Header 
          title={`${dashboardData?.wardName || '일반병동'} 실시간 종합 현황`} 
        />
        
        {/* 중앙 메인 콘텐츠 영역 */}
        <div className="p-10 max-w-[1600px] mx-auto w-full space-y-8">
          
          {/* 상단 의료진 및 모니터링 요약 바 + 로그아웃 버튼 통합 레이아웃 */}
          <div className="flex justify-between items-center bg-white rounded-3xl p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white">
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold text-gray-500">
                담당 의료진: <strong className="text-[#191c1d]">{localStorage.getItem('userName')} ({localStorage.getItem('userRole')})</strong>
              </span>
              <span className="bg-[#f0f7ff] text-[#00478d] px-6 py-2 rounded-2xl font-black text-sm">
                관제 대상 환자: {dashboardData?.totalPatients || 0}명
              </span>
            </div>

            {/* 신규 우측 배치 로그아웃 버튼 */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-400 font-bold text-sm hover:text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-2xl transition-all duration-200"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              시스템 로그아웃
            </button>
          </div>

          {/* 환자별 실시간 현황 카드 그리드 매핑 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dashboardData?.patients?.map((patient) => {
              // 낙상이 감지되었거나 미해결 알림이 있을 경우 카드 경고 상태 활성화
              const isCritical = patient.skeletonStatus === 'FALL_DETECTED' || patient.unresolvedAlerts > 0;
              
              return (
                <div 
                  key={patient.patientId}
                  // 카드 클릭 시 해당 환자의 고유 ID를 주소 파라미터에 담아 기존 Dashboard 상세화면으로 이동
                  onClick={() => navigate(`/dashboard/${patient.patientId}`)}
                  className={`bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border-2 transition-all transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
                    isCritical ? 'border-red-400 bg-red-50/10' : 'border-white hover:border-gray-200'
                  }`}
                >
                  {/* 카드 내부 상단: 침상 정보 및 이름, 스켈레톤 상태 배지 */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-sm font-bold text-gray-400"># {patient.bedNumber} 침상</span>
                      <h4 className="text-3xl font-black text-[#191c1d] mt-1">{patient.name}</h4>
                    </div>
                    {getSkeletonBadge(patient.skeletonStatus)}
                  </div>

                  {/* 카드 내부 중간: 최신 바이탈 사인 서머리 정보 */}
                  <div className="bg-[#f8f9fa] rounded-2xl p-4 space-y-2 mb-6 text-sm font-semibold text-[#5e6672]">
                    <div className="flex justify-between">
                      <span>혈압 (BP)</span>
                      <span className="text-[#191c1d] font-bold">
                        {patient.latestVitals?.bp || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>심박수 (HR)</span>
                      <span className="text-red-500 font-bold">
                        {patient.latestVitals?.heartRate ? `${patient.latestVitals.heartRate} BPM` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>산소포화도</span>
                      <span className="text-blue-500 font-bold">
                        {patient.latestVitals?.oxygenSaturation ? `${patient.latestVitals.oxygenSaturation} %` : '-'}
                      </span>
                    </div>
                  </div>

                  {/* 미해결 알림이 존재할 경우 긴급 점멸 알림 메시지 뱃지 노출 */}
                  {patient.unresolvedAlerts > 0 && (
                    <div className="bg-red-100 text-red-600 rounded-xl p-3 text-xs font-black flex items-center gap-2 mb-4 animate-pulse">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      확인 필요한 미해결 이벤트 {patient.unresolvedAlerts}건 존재
                    </div>
                  )}

                  {/* 카드 내부 하단: 내비게이션 진입 안내 */}
                  <div className="pt-4 border-t border-gray-100 flex items-center text-xs font-bold text-[#00478d] justify-end gap-1">
                    분석 화면 진입
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
};

export default WardOverview;