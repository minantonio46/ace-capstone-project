const Header = ({ title, onMenuClick }) => (
  <header className="flex justify-between items-center px-8 py-6 bg-white border-b">
    <div className="flex items-center gap-4">
      {/* 햄버거 메뉴 버튼! */}
      <button onClick={onMenuClick} className="material-symbols-outlined text-3xl p-2 hover:bg-gray-100 rounded-full">menu</button>
      <div>
        <h2 className="text-xl font-black text-[#191c1d]">{title}</h2>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">PATIENT ID: 882-XJ</span>
      </div>
    </div>
    <div className="w-10 h-10 rounded-full bg-gray-200" />
  </header>
);
export default Header;