import React from 'react';

const Header = ({ title, onMenuClick, patientId }) => {
  return (
    <header className="flex justify-between items-center px-8 py-6 bg-white border-b">
      <div className="flex items-center gap-4">
        
        {/* 1. 온메뉴클릭(onMenuClick) 함수가 프로퍼티로 전달되었을 때만 햄버거 버튼을 렌더링합니다 */}
        {onMenuClick ? (
          <button 
            onClick={onMenuClick} 
            className="material-symbols-outlined text-3xl p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            menu
          </button>
        ) : (
          /* 버튼이 없을 때는 레이아웃 정렬을 위해 살짝 여백(패딩)을 채워줍니다 */
          <div className="w-3" />
        )}
        
        <div>
          <h2 className="text-xl font-black text-[#191c1d]">{title}</h2>
          
          {/* 2. 하드코딩을 제거하고, patientId가 명확히 주입되었을 때만 환자 ID 서브 배너를 노출합니다 */}
          {patientId && (
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mt-0.5">
              PATIENT ID: #{patientId}
            </span>
          )}
        </div>
      </div>
      
      {/* 우측 상단 의료진 아바타 프로필 영역 */}
      <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
        <span className="material-symbols-outlined text-gray-400 text-2xl font-light">account_circle</span>
      </div>
    </header>
  );
};

export default Header;