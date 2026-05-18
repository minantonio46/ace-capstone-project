import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080', // 백엔드 서버 주소
  headers: {
    'Content-Type': 'application/json',
  },
});

// [요청 인터셉터] 모든 API 요청 전 Access Token 자동 삽입
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// [응답 인터셉터] 백엔드 ApiResponse 규격에 맞춰 data 내부 추출 및 401 예외 처리
api.interceptors.response.use(
  (response) => {
    // 백엔드의 ApiResponse<T> 구조 { success, message, data } 에서 data만 반환
    return response; 
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized 에러 발생 시 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('리프레시 토큰이 없습니다.');

        // 백엔드 명세 규격인 @RequestHeader("Refresh-Token") 적용
        const res = await axios.post(
          'http://localhost:8080/api/auth/refresh',
          {},
          { headers: { 'Refresh-Token': refreshToken } }
        );

        const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
        localStorage.setItem('accessToken', newAccess);
        localStorage.setItem('refreshToken', newRefresh);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest); // 기존 요청 재실행
      } catch (refreshError) {
        console.error('세션 만료. 다시 로그인하십시오.');
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;