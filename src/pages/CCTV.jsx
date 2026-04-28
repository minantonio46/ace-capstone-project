import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const CCTV = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-screen bg-[#f8f9fa] overflow-x-hidden">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="cctv" />
      
      <main className="w-full h-screen flex flex-col">
        <Header title="실시간 모니터링" onMenuClick={() => setIsMenuOpen(true)} />
        
        <div className="flex-1 p-8 overflow-hidden">
          <div className="relative w-full h-full bg-[#1e293b] rounded-[3rem] shadow-2xl overflow-hidden border-[12px] border-white">
            {/* LIVE 표시 */}
            <div className="absolute top-10 left-10 flex items-center gap-3 bg-red-600 px-5 py-2 rounded-full shadow-lg z-10 animate-pulse">
              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
              <span className="text-white font-black text-sm tracking-widest uppercase">Live Stream</span>
            </div>

            {/* 화면 중앙 (이후 cctv 영상이 들어갈 자리)*/}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                <h4 className="text-white text-5xl font-black tracking-[1rem] mb-4">ICU ROOM 402</h4>
                <p className="text-white text-xl font-bold">2023-10-24 23:45:12</p>
            </div>

            {/* 오른쪽 하단 바이탈 위젯 */}
            <div className="absolute bottom-10 right-10 w-80 bg-white/10 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/20 shadow-2xl">
              <p className="text-white/60 font-black text-xs uppercase tracking-[0.2em] mb-6">Real-time Vitals</p>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-white font-bold text-lg text-opacity-80">심박수</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">78</span>
                    <span className="text-white/40 font-bold">bpm</span>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-white font-bold text-lg text-opacity-80">산소포화도</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-blue-400">98</span>
                    <span className="text-white/40 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 컨트롤 바 */}
            <div className="absolute bottom-10 left-10 flex gap-4">
                <button className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all">
                    <span className="material-symbols-outlined text-white">zoom_in</span>
                </button>
                <button className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all">
                    <span className="material-symbols-outlined text-white">videocam_off</span>
                </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CCTV;