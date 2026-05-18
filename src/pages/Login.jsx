import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // 페이지 이동을 위한 라우터 훅

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 백엔드 AuthController의 POST /api/auth/login 호출
      // 실제 서버로 보내는 코드 테스트를 위해 임시 주석처리
      // const res = await api.post('/api/auth/login', { username, password });
      //!!!!!!!! 가짜데이터 삽입!!!!!!!!!
      const res = {
      data: {
        success: true,
        message: "성공",
        data: {
          accessToken: "mock_jwt_access_token_string_12345",
          refreshToken: "mock_jwt_refresh_token_string_67890",
          username: username,
          name: "테스트간호사",
          role: "NURSE"
        }
      }
    };
      //!!!!!!!! 가짜데이터 삽입!!!!!!!!!


      // 백엔드 공통 ApiResponse 규격(success: true) 검증
      if (res.data && res.data.success) {
        const { accessToken, refreshToken, role, name } = res.data.data;
        
        // 브라우저 로컬 스토리지에 인증 정보 격리 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userName', name);
        localStorage.setItem('userRole', role);
        
        // 대시보드 조회를 위한 기본 wardId 세팅 (기본 1번 병동 할당)
        localStorage.setItem('wardId', '1'); 

        // 인증 성공 후 병동 실시간 종합 현황 페이지로 라우팅 이동
        navigate('/ward');
      } else {
        setError(res.data?.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      // 백엔드 내부 예외 메시지(BadCredentialsException 등)가 존재하면 해당 메시지 출력
      setError(err.response?.data?.message || '아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] flex items-center justify-center font-sans">
      <div className="bg-white rounded-[2.5rem] p-12 w-full max-w-[480px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white text-center">
        
        {/* 상단 메디컬 시스템 로고 엠블럼 */}
        <div className="w-20 h-20 bg-[#f0f7ff] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#e0f0ff]">
          <span className="material-symbols-outlined text-4xl text-[#00478d] font-light">local_hospital</span>
        </div>
        
        {/* 타이틀 영역 */}
        <h2 className="text-3xl font-black text-[#191c1d] mb-2 tracking-tight">환자 모니터링 시스템</h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-12">Medical Staff Authentication</p>

        {/* 로그인 입력 폼 */}
        <form onSubmit={handleLogin} className="text-left space-y-6">
          
          {/* 아이디 입력란 */}
          <div>
            <label className="block text-xs font-black text-[#5e6672] uppercase tracking-widest mb-2.5 ml-1">
              사번 / 아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 bg-[#f8f9fa] rounded-2xl border border-gray-100 text-lg font-bold text-[#191c1d] focus:outline-none focus:border-gray-300 focus:bg-white transition-all duration-200"
              placeholder="username을 입력하세요"
              required
            />
          </div>

          {/* 비밀번호 입력란 */}
          <div>
            <label className="block text-xs font-black text-[#5e6672] uppercase tracking-widest mb-2.5 ml-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-[#f8f9fa] rounded-2xl border border-gray-100 text-lg font-bold text-[#191c1d] focus:outline-none focus:border-gray-300 focus:bg-white transition-all duration-200"
              placeholder="••••••••"
              required
            />
          </div>

          {/* 에러 피드백 메시지 영역 */}
          {error && (
            <div className="bg-red-50 text-red-500 rounded-xl p-4 text-sm font-bold tracking-tight border border-red-100 flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {/* 로그인 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 bg-[#00478d] text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(0,71,141,0.2)] hover:bg-[#003d7a] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                인증을 확인하는 중...
              </>
            ) : (
              <>
                <span>시스템 안전 접속</span>
                <span className="material-symbols-outlined text-lg">login</span>
              </>
            )}
          </button>
          
        </form>

        {/* 푸터 안내 문구 */}
        <p className="text-xs text-gray-300 font-medium mt-12">
          본 시스템은 인가된 의료진만 접근할 수 있으며, 모든 접속 이력은 안전하게 기록됩니다.
        </p>

      </div>
    </div>
  );
};

export default Login;