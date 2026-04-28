import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose, active }) => {
  const navigate = useNavigate();

  // 페이지 이동 함수
  const goTo = (path) => {
    navigate(path);
    onClose(); // 이동하면서 사이드바 닫기
  };

  return (
    <>
      {/* 배경 어둡게 (딤처리) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 transition-opacity" 
          onClick={onClose} 
        />
      )}
      
      {/* 사이드바 본체 */}
      <aside className={`fixed left-0 top-0 h-full w-80 bg-white z-50 shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* 상단 로고 및 닫기 버튼 */}
        <div className="p-8 border-b flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-[#00478d]">ANON-CARE</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Medical System</p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-gray-400 hover:text-black transition-colors p-2">
            close
          </button>
        </div>

        {/* 메뉴 리스트 */}
        <nav className="p-4 mt-4 space-y-2">
          <button 
            onClick={() => goTo('/dashboard')} 
            className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-left transition-all ${active === 'dash' ? 'bg-[#f1f5f9] text-[#00478d]' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            대시보드
          </button>

          <button 
            onClick={() => goTo('/details')} 
            className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-left transition-all ${active === 'detailed' ? 'bg-[#f1f5f9] text-[#00478d]' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <span className="material-symbols-outlined">analytics</span>
            상세 데이터
          </button>

          <button 
            onClick={() => goTo('/cctv')} 
            className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-left transition-all ${active === 'cctv' ? 'bg-[#f1f5f9] text-[#00478d]' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <span className="material-symbols-outlined">videocam</span>
            CCTV 모니터링
          </button>
        </nav>

        {/* 하단 로그아웃/설정 등 (선택사항) */}
        <div className="absolute bottom-8 left-0 w-full px-8">
          <button 
            onClick={() => goTo('/')}
            className="flex items-center gap-3 text-gray-400 font-bold text-sm hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            시스템 종료 (로그아웃)
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;