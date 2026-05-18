import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Dashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [patientData, setPatientData] = useState(null); // 환자 상태 데이터 상자
  const [loading, setLoading] = useState(true);        // 로딩 확인용
  const [medications, setMedications] = useState([]);  // 약물 정보 상자

  // 서버와 연결
  useEffect(() => {
    const fetchAllData = async () => {
      try { 
        // 1. 로그인할 때 저장된 wardId 꺼내오기
        let wardId = localStorage.getItem('wardId');
      
        // 121212 임시데이터
        if (!wardId || wardId === "121212") { 
          setPatientData({
            patientName: "테스트 환자",
            roomNumber: "101",
            status: "모니터링 중",
            birthDate: "1955-08-15",
            gender: "M",
            heartRate: "82",
            bloodPressure: "128/84",
            oxygenLevel: "98",
            notes: "현재 임시 데이터(121212) 모드로 실행 중입니다. 소희님의 스켈레톤 화면 및 CCTV 컴포넌트 검증이 가능합니다."
          });

          setMedications([
            { drugName: "아스피린", dosage: "100", unit: "mg", intervalHours: 8, instruction: "식후 30분 복용" },
            { drugName: "네오시럽", dosage: "5", unit: "ml", intervalHours: 12, instruction: "증상 발현 시 복용" }
          ]);

          setLoading(false);
          return; // 백엔드 API 요청 안 하고 여기서 중단!
        }
//----------------------------
        if (!wardId) { 
          console.error("병동 ID를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }

        // 2. 환자 실시간 상태 정보 가져오기
        const patientRes = await api.get(`/api/wards/${wardId}/status`);
        if (patientRes.data.success) {
          setPatientData(patientRes.data.data);
        }
      
        // 3. 약물 처방 정보 가져오기
        const mediRes = await api.get(`/api/patients/1/medications`);
        if (mediRes.data.success) {
          setMedications(mediRes.data.data);
        }

      } catch (err) {
        console.error("데이터를 가져오는 중 에러 발생:", err);
      } finally {
        setLoading(false);
      }
    };

    // 처음 켜질 때 한 번 실행
    fetchAllData(); 

    // 5초마다 자동으로 데이터를 새로고침함
    const timer = setInterval(fetchAllData, 5000);
    
    // 페이지를 떠날 때 타이머 종료
    return () => clearInterval(timer);
  }, []); // 👈 useEffect 괄호 짝 완벽하게 정리 완료!

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9fa] overflow-y-auto font-sans">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="dash" />
      
      <main className="w-full flex flex-col pb-16">
        <Header 
          title="환자 모니터링" 
          onMenuClick={() => setIsMenuOpen(true)} 
        />
        
        {/* 중앙 컨텐츠 영역*/}
        <div className="p-10 max-w-[1600px] mx-auto w-full space-y-10">
          
          {/* 1. 환자 프로필 섹션 */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] flex items-center gap-10 border border-white">
            <div className="w-36 h-36 bg-[#f1f5f9] rounded-[2rem] flex items-center justify-center shrink-0 overflow-hidden">
               <span className="material-symbols-outlined text-7xl text-gray-300 font-light">person</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h3 className="text-5xl font-black text-[#191c1d]">{patientData?.patientName || '이름 없음'}</h3>
                <span className="text-2xl font-bold text-gray-300">#{patientData?.roomNumber || '000'}</span>
                <span className="bg-[#e8f5e9] text-[#2e7d32] px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider ml-auto">
                  ● {patientData?.status || '안정'}
                </span>
              </div>
              <p className="text-2xl text-[#5e6672] font-semibold tracking-tight">
                {patientData?.birthDate || '1990-01-01'} | {patientData?.gender === 'M' ? '남성' : '여성'}
              </p>
            </div>
          </section>

          {/* 2. 중간 그리드: 바이탈 사인 & 처방 약물 */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-10">
            
            {/* 왼쪽: 최근 바이탈 사인 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white flex flex-col">
                <div className="flex justify-between items-center mb-10">
                    <h4 className="text-2xl font-black text-[#191c1d]">최근 바이탈 사인</h4>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      업데이트: {loading ? '갱신 중...' : '방금 전'}
                    </span>
                </div>
                
                {/* 바이탈 카드 3개 */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="bg-[#fff5f5] p-8 rounded-3xl border border-[#fee2e2]">
                        <div className="flex justify-between items-start mb-5">
                            <span className="material-symbols-outlined text-[#ef4444] text-3xl font-light">favorite</span>
                            <p className="text-[#ef4444] font-black text-xs uppercase tracking-widest">심박수</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <p className="text-6xl font-black text-[#ef4444]">{patientData?.heartRate || '--'}</p>
                            <p className="text-lg font-bold text-[#ef4444]/60 uppercase">BPM</p>
                        </div>
                    </div>
                    <div className="bg-[#f0f9ff] p-8 rounded-3xl border border-[#e0f2fe]">
                        <div className="flex justify-between items-start mb-5">
                            <span className="material-symbols-outlined text-[#0ea5e9] text-3xl font-light">blood_pressure</span>
                            <p className="text-[#0ea5e9] font-black text-xs uppercase tracking-widest">혈압</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <p className="text-6xl font-black text-[#0ea5e9]">{patientData?.bloodPressure || '120/80'}</p>
                            <p className="text-lg font-bold text-[#0ea5e9]/60 uppercase">mmHg</p>
                        </div>
                    </div>
                    <div className="bg-[#eff6ff] p-8 rounded-3xl border border-[#dbeafe]">
                        <div className="flex justify-between items-start mb-5">
                            <span className="material-symbols-outlined text-[#3b82f6] text-3xl font-light">air</span>
                            <p className="text-[#3b82f6] font-black text-xs uppercase tracking-widest">산소포화도</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <p className="text-6xl font-black text-[#3b82f6]">{patientData?.oxygenLevel || '98'}</p>
                            <p className="text-lg font-bold text-[#3b82f6]/60 uppercase">%</p>
                        </div>
                    </div>
                </div>

                {/* 그래프 영역 */}
                <div className="flex-1 min-h-[150px] bg-[#f8f9fa] rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 font-bold italic">[실시간 바이탈 그래프 활성화 중]</span>
                </div>
            </div>

            {/* 오른쪽: 처방 약물 섹션 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white flex flex-col">
                <div className="flex justify-between items-center mb-10">
                    <h4 className="text-2xl font-black text-[#191c1d]">처방 약물</h4>
                    <span className="material-symbols-outlined text-gray-300 hover:text-gray-600 transition-colors cursor-pointer">history</span>
                </div>
                
                <div className="space-y-4 flex-1 overflow-y-auto pr-2" style={{ maxHeight: '450px' }}>
                  {medications && medications.length > 0 ? (
                    medications.map((drug, i) => (
                      <div key={i} className="flex items-center gap-5 p-5 bg-[#f8f9fa] rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#00478d] text-lg">pill</span>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#191c1d]">
                            {drug.drugName} {drug.dosage}{drug.unit}
                          </p>
                          <p className="text-xs font-medium text-gray-400 tracking-wide">
                            {drug.intervalHours}시간마다 | {drug.instruction || '복용 안내 없음'}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 ml-auto">chevron_right</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-gray-400 font-medium italic">
                      처방된 약물 정보가 없습니다.
                    </div>
                  )}
                </div>
                
                <button className="mt-8 w-full py-4 text-sm font-bold text-[#00478d] bg-[#f0f7ff] rounded-xl hover:bg-[#e0f0ff] transition-colors">전체 이력 보기</button>
            </div>
          </div>

          {/* 3. 하단: 주요 소견 및 임상 노트 */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-[#00478d]">description</span>
                <h4 className="text-2xl font-black text-[#191c1d]">주요 소견 및 임상 노트</h4>
              </div>
              <button className="bg-[#00478d] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#003d7a]">노트 추가</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-[#f8f9fa] rounded-3xl border border-gray-100">
                    <div className="flex justify-between items-center mb-5">
                        <p className="font-bold text-[#00478d]">임상 모니터링</p>
                        <p className="text-xs font-medium text-gray-400">최근 업데이트: {new Date().toLocaleDateString()}</p>
                    </div>
                    <p className="text-lg text-[#191c1d] font-medium leading-relaxed">
                        {patientData?.notes || '현재 특이 소견 없음. 정기적인 바이탈 체크 및 실시간 모니터링 중입니다.'}
                    </p>
                </div>
                <div className="p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <p className="text-lg text-gray-400 font-bold italic">빠른 노트 추가 - 클릭하여 입력하세요...</p>
                </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;