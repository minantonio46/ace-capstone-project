import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import api from '../api/axiosInstance';

const DetailedData = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePatientId, setActivePatientId] = useState('1');

  useEffect(() => {
    // 현재 사이드바에서 관제 중인 환자의 고유 ID 추출
    const currentId = localStorage.getItem('activePatientId') || '1';
    setActivePatientId(currentId);

    // 추후 백엔드가 열리면 이 위치에서 해당 환자의 24시간 바이탈 배열 및 간호 기록을 fetch
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9fa] overflow-y-auto font-sans">
      {/* 환자가 선택된 상태이므로 전용 사이드바 배치 */}
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="detailed" />

      <main className="w-full flex flex-col pb-16">
        <Header
          title="상세 데이터 분석"
          onMenuClick={() => setIsMenuOpen(true)}
          patientId={activePatientId}
        />

        <div className="p-10 max-w-[1600px] mx-auto w-full space-y-10">

          {/* 상단 안내 정보 뱃지 */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white flex justify-between items-center">
            <span className="text-sm font-bold text-gray-400">
              현재 조회 중인 환자 고유 식별 번호: <strong className="text-[#00478d]">#{activePatientId}</strong>
            </span>
          </div>

          {/* 1. 시각화 그래프 영역 */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white">
            <h3 className="text-2xl font-black text-[#00478d] mb-8">심박수 및 체온 추이</h3>
            <div className="h-80 bg-[#f8f9fa] rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-center">
              <span className="text-gray-400 font-bold text-xl italic">[24시간 데이터 시각화 그래프 영역]</span>
            </div>
          </div>

          {/* 2. 간호 기록 내역 리스트 레코드 영역 */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-[#191c1d]">간호 기록 내역</h3>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">환자별 정렬 완료</span>
            </div>

            <div className="divide-y divide-gray-50">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="p-8 hover:bg-gray-50 transition-colors">
                  <p className="text-[#00478d] font-black text-sm mb-2">10:00 | 25 OCT 2023</p>
                  <p className="text-xl text-gray-700 font-medium">
                    환자 상태 체크 완료. 모든 바이탈 사인 정상 수치 유지 중입니다. (환자 #{activePatientId} - 기록 {item})
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default DetailedData;