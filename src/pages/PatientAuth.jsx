import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';

const PatientAuth = () => {
  const navigate = useNavigate();
  // 처음부터 '882'를 넣어두고 시작합니다.
  const [code, setCode] = useState(""); 
  const MAX_LENGTH = 6; 

  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState('');
  
  const handlePress = (val) => {
    if (code.length < MAX_LENGTH) setCode(prev => prev + val);
  };

  const handleBackspace = () => {
    setCode(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (code.length !== 6) {
      alert('환자 코드 6자리를 모두 입력해주세요!');
      return;
    }

    setLoading(true); // 로딩 상태 시작
    setError('');     // 기존 에러 초기화

    try {
      // 성빈님이 만든 login 함수 호출!
      // 환자 코드를 아이디와 비밀번호로 사용합니다.
      await login(code, code); 
      
      // 성공하면 대시보드로 이동!
      navigate('/dashboard');
    } catch (err) {
      // 실패하면 에러 메시지 띄우기
      setError('코드가 올바르지 않습니다. 다시 확인해주세요.');
    } finally {
      setLoading(false); // 로딩 끝
    }
  };

  return (
    <main className="relative flex items-center justify-center min-h-screen w-full bg-[#f8f9fa] p-10 font-sans overflow-hidden">
      <div className="absolute inset-0 bg-[#e2e8f0]/40 blur-[100px] -z-10" />
      <div className="w-full max-w-6xl flex items-center justify-between gap-16">
        
        {/* 왼쪽 섹션 */}
        <div className="flex-1 max-w-[450px]">
          <div className="mb-10">
            <span className="text-[#00478d] font-black text-2xl tracking-tighter uppercase">ANON-CARE</span>
            <div className="h-1.5 w-14 bg-[#00478d] mt-2" />
          </div>
          <h1 className="text-7xl font-black text-[#191c1d] mb-6 tracking-tight">환자 확인</h1>
          <p className="text-xl text-[#424752] font-medium leading-relaxed mb-20">의료 기록에 접근하기 위해 환자 고유 코드를 입력해 주세요.</p>
          <button className="flex items-center gap-4 bg-[#ffdad6]/70 border border-[#ffdad6] p-4 px-7 rounded-2xl group shadow-sm">
            <div className="bg-[#ffdad6] p-2.5 rounded-xl"><span className="material-symbols-outlined text-[#940010] font-bold">warning</span></div>
            <span className="text-[#940010] text-2xl font-black">긴급 접근</span>
          </button>
        </div>

        {/* 오른쪽 카드 */}
        <div className="w-[520px] bg-white rounded-[3.5rem] p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]">
          <div className="flex justify-center items-center gap-4 mb-14">
            {/* 6칸을 돌면서 입력된 값을 보여줌 */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <React.Fragment key={i}>
                <div className={`w-12 h-16 border-b-4 ${code[i] ? 'border-[#00478d]' : 'border-gray-200'} flex items-center justify-center text-5xl font-bold text-[#1a1c1e]`}>
                  {code[i] || ""}
                </div>
                {i === 2 && <div className="text-4xl font-bold text-gray-300 mx-1">-</div>}
              </React.Fragment>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button 
                key={n} 
                onClick={() => handlePress(n.toString())} 
                className="h-20 rounded-2xl bg-[#f1f3f6] hover:bg-[#e4e7eb] text-3xl font-bold text-[#1a1c1e] transition-all active:scale-95"
              >
                {n}
              </button>
            ))}
            
            <button onClick={handleBackspace} className="h-20 rounded-2xl flex items-center justify-center hover:bg-gray-50">
              <span className="material-symbols-outlined text-3xl text-gray-500 font-bold">backspace</span>
            </button>
            
            <button onClick={() => handlePress("0")} className="h-20 rounded-2xl bg-[#f1f3f6] hover:bg-[#e4e7eb] text-3xl font-bold text-[#1a1c1e]">
              0
            </button>
            
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className={`h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all ${code.length === 6 ? 'bg-[#3b5998] text-white active:scale-95' : 'bg-gray-200 text-gray-400'}`}
            >
              <span className="material-symbols-outlined text-3xl font-bold">arrow_forward</span>
            </button>
          </div> 
          {/* 숫자 버튼 상자 끝 */}

          {/* 에러 메시지 (버튼들 아래에 나타남) */}
          {error && (
            <p className="text-red-500 text-center mt-6 font-bold animate-bounce">
              {error}
            </p>
          )}

          {/* 로딩 메시지 */}
          {loading && (
            <p className="text-blue-500 text-center mt-2 font-medium">확인 중입니다...</p>
          )}

          <div className="mt-10 pt-8 border-t border-gray-50 flex justify-center">
            <button className="flex items-center gap-3 text-[#00478d] font-bold text-sm tracking-widest uppercase">
              <span className="material-symbols-outlined text-xl">barcode_scanner</span>
              환자 ID 팔찌 스캔
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PatientAuth;