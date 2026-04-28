import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DetailedData = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative w-full bg-[#f8f9fa]">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="detailed" />
      
      <main className="w-full flex flex-col overflow-y-visible">
        <Header title="상세 데이터 분석" onMenuClick={() => setIsMenuOpen(true)} />
        
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 pb-[300px]">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white">
            <h3 className="text-2xl font-black text-[#00478d] mb-8">심박수 및 체온 추이</h3>
            <div className="h-80 bg-[#f8f9fa] rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-center">
              <span className="text-gray-400 font-bold text-xl italic">[그래프 영역]</span>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-white overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-2xl font-black text-[#191c1d]">간호 기록 내역</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {/* 기록이 많아지면 화면 밖으로 넘어가며 스크롤 생겨남 */}
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="p-8 hover:bg-gray-50 transition-colors">
                  <p className="text-[#00478d] font-black text-sm mb-2">10:00 | 25 OCT 2023</p>
                  <p className="text-xl text-gray-700 font-medium">환자 상태 체크 완료. 모든 바이탈 사인 정상 수치 유지 중입니다. (기록 {item})</p>
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