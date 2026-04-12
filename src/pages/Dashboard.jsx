import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';


const Dashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [patientData, setPatientData] = useState(null); // 처음엔 비어있음
    const [loading, setLoading] = useState(true); // 로딩 상태 확인용

const [medications, setMedications] = useState([]);

useEffect(() => {
  const token = "temp-token";

  // 1. 환자 상세 정보 가져오기
  axios.get('http://localhost:8080/api/patients/1', {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then((res) => {
    if (res.data.success) {
      setPatientData(res.data.data); // 환자 데이터 상자 열기
    }
  })
  .catch((err) => console.error("환자 정보 에러:", err));

  // 2. 처방 약물 목록 가져오기 (따로 실행해야 해요!)
  axios.get('http://localhost:8080/api/patients/1/medications', {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then((res) => {
    if (res.data.success) {
      setMedications(res.data.data); // 약물 데이터 상자 열기
    }
    setLoading(false); // 데이터 로딩 완료!
  })
  .catch((err) => {
    console.error("약물 정보 에러:", err);
    setLoading(false);
  });
}, []);

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
                {/* 사진 대신 임시 심볼*/}
               <span className="material-symbols-outlined text-7xl text-gray-300 font-light">person</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h3 className="text-5xl font-black text-[#191c1d]">{patientData?.name || '이름 없음'}</h3>
                <span className="text-2xl font-bold text-gray-300">#{patientData?.bedNumber || '000'}</span>
                <span className="bg-[#e8f5e9] text-[#2e7d32] px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider ml-auto">● 안정</span>
              </div>
             <p className="text-2xl text-[#5e6672] font-semibold tracking-tight">
            {patientData?.birthDate} | {patientData?.gender === 'M' ? '남성' : '여성'}
            </p>
            </div>
          </section>

          {/* 2. 중간 그리드: 바이탈 사인 & 처방 약물 */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-10">
            
            {/* 왼쪽: 최근 바이탈 사인 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white flex flex-col">
                <div className="flex justify-between items-center mb-10">
                    <h4 className="text-2xl font-black text-[#191c1d]">최근 바이탈 사인</h4>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">업데이트: 방금 전</span>
                </div>
                
                {/* 바이탈 카드 3개 */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                    {/* 심박수 */}
                    <div className="bg-[#fff5f5] p-8 rounded-3xl border border-[#fee2e2]">
                        <div className="flex justify-between items-start mb-5">
                            <span className="material-symbols-outlined text-[#ef4444] text-3xl font-light">favorite</span>
                            <p className="text-[#ef4444] font-black text-xs uppercase tracking-widest">심박수</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <p className="text-6xl font-black text-[#ef4444]">78</p>
                            <p className="text-lg font-bold text-[#ef4444]/60 uppercase">BPM</p>
                        </div>
                    </div>
                    {/* 혈압 */}
                    <div className="bg-[#f0f9ff] p-8 rounded-3xl border border-[#e0f2fe]">
                        <div className="flex justify-between items-start mb-5">
                            <span className="material-symbols-outlined text-[#0ea5e9] text-3xl font-light">blood_pressure</span>
                            <p className="text-[#0ea5e9] font-black text-xs uppercase tracking-widest">혈압</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <p className="text-6xl font-black text-[#0ea5e9]">120/80</p>
                            <p className="text-lg font-bold text-[#0ea5e9]/60 uppercase">mmHg</p>
                        </div>
                    </div>
                    {/* 산소포화도 */}
                    <div className="bg-[#eff6ff] p-8 rounded-3xl border border-[#dbeafe]">
                        <div className="flex justify-between items-start mb-5">
                            <span className="material-symbols-outlined text-[#3b82f6] text-3xl font-light">air</span>
                            <p className="text-[#3b82f6] font-black text-xs uppercase tracking-widest">산소포화도</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <p className="text-6xl font-black text-[#3b82f6]">98</p>
                            <p className="text-lg font-bold text-[#3b82f6]/60 uppercase">%</p>
                        </div>
                    </div>
                </div>

                {/* 그래프 예시(추가 예정) */}
                <div className="flex-1 min-h-[150px] bg-[#f8f9fa] rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 font-bold italic">[24시간 심박수 추이 그래프 영역]</span>
                </div>
            </div>

            {/* 오른쪽: 처방 약물 섹션 안쪽ㄱ */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white flex flex-col">
                <div className="flex justify-between items-center mb-10">
                    <h4 className="text-2xl font-black text-[#191c1d]">처방 약물</h4>
                    <span className="material-symbols-outlined text-gray-300 hover:text-gray-600 transition-colors">history</span>
                </div>
                
                {/* 약물 리스트 */}
<div className="space-y-4 flex-1">
  {/* 1. medications 배열에 데이터가 있을 때만 map을 돌립니다 */}
  {medications && medications.length > 0 ? (
    medications.map((drug, i) => (
      <div key={i} className="flex items-center gap-5 p-5 bg-[#f8f9fa] rounded-2xl border border-gray-100">
        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-center">
          <span className="material-symbols-outlined text-[#00478d] text-lg">pill</span>
        </div>
        <div>
          {/* 2. 명세서 5.1 규격: drugName, dosage, unit 사용 */}
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
    /* 3. 데이터가 없을 때 보여줄 화면 */
    <div className="py-10 text-center text-gray-400 font-medium">
      처방된 약물이 없습니다.
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
                {/* 소견 예시 */}
                <div className="p-8 bg-[#f8f9fa] rounded-3xl border border-gray-100">
                    <div className="flex justify-between items-center mb-5">
                        <p className="font-bold text-[#00478d]">심장내과</p>
                        <p className="text-xs font-medium text-gray-400">Oct 24, 10:15 AM</p>
                    </div>
                    <p className="text-lg text-[#191c1d] font-medium leading-relaxed">
                        환자가 오전 활동 후 가벼운 가슴 답답함을 호소함. ECG 결과 정상 리듬이며 ST 분절 변화 없음. 현재 혈압 관리 유지 중.
                    </p>
                </div>
                {/* 빠른 노트 추가 예시 */}
                <div className="p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <p className="text-lg text-gray-400 font-bold italic">빠른 노트 추가 - 임상 관찰 내용을 입력하세요...</p>
                </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;