import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Dashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [patientData, setPatientData] = useState(null); // 환자 상태 데이터 상자
  const [loading, setLoading] = useState(true);        // 로딩 확인용
  const [medications, setMedications] = useState([]);  // 약물 정보 상자

  // 라우터 주소창 구조(/dashboard/:patientId)에서 환자 고유 ID 추출
  const { patientId } = useParams();

  // 서버와 연결 및 멀티 스레드 형태 동기화 fetch
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. 로그인할 때 저장된 wardId 꺼내오기
        const wardId = localStorage.getItem('wardId');
        if (!wardId) {
          console.error("병동 ID를 찾을 수 없습니다.");
          return;
        }

        // 2. 현재 활성화된 환자 ID를 사이드바 공유용으로 로컬스토리지에 동기화 보관
        const currentPatientId = patientId || '1';
        localStorage.setItem('activePatientId', currentPatientId);

        // 3. 환자 실시간 상태 정보 가져오기
        const patientRes = await api.get(`/api/wards/${wardId}/status`);
        if (patientRes.data.success) {
          setPatientData(patientRes.data.data);
        }

        // 4. 약물 처방 정보 가져오기 (하드코딩된 1 대신 주소창의 실시간 ID 사용)
        const mediRes = await api.get(`/api/patients/${currentPatientId}/medications`);
        if (mediRes.data.success) {
          setMedications(mediRes.data.data);
        }

      } catch (err) {
        console.error("데이터를 가져오는 중 에러 발생:", err);
      } finally {
        setLoading(false);
      }
    };

    // 최초 1회 즉시 실행
    fetchAllData();

    // 5초마다 자동으로 데이터를 백엔드와 새로고침함
    const timer = setInterval(fetchAllData, 5000);

    // 컴포넌트가 언마운트(페이지 탈출)될 때 메모리 누수 방지를 위해 타이머 소멸
    return () => clearInterval(timer);
  }, [patientId]); // 환자 ID가 변경될 때마다 이펙트 재호출

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9fa] overflow-y-auto font-sans">
      {/* 컨텍스트 대응 완료된 사이드바 마운트 */}
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="dash" />

      <main className="w-full flex flex-col pb-16">
        <Header
          title="환자 모니터링"
          onMenuClick={() => setIsMenuOpen(true)}
          patientId={patientId}
        />

        {/* 중앙 컨텐츠 영역 */}
        <div className="p-10 max-w-[1600px] mx-auto w-full space-y-10">

          {/* 1. 환자 프로필 섹션 */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] flex items-center gap-10 border border-white">
            <div className="w-36 h-36 bg-[#f1f5f9] rounded-[2rem] flex items-center justify-center shrink-0 overflow-hidden">
              {/* 사진 대신 임시 심볼 */}
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

            {/* 왼쪽: 최근 바이탈 사인 카드 뷰 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <h4 className="text-2xl font-black text-[#191c1d]">최근 바이탈 사인</h4>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">업데이트: 방금 전</span>
              </div>

              {/* 바이탈 서브 세부 카드 3개 분할 그리드 */}
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

              {/* 차트 시각화 배치 영역 */}
              <div className="flex-1 min-h-[150px] bg-[#f8f9fa] rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                <span className="text-gray-400 font-bold italic">[24시간 심박수 추이 그래프 영역]</span>
              </div>
            </div>

            {/* 오른쪽: 처방 약물 현황 패널 목록 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <h4 className="text-2xl font-black text-[#191c1d]">처방 약물</h4>
                <span className="material-symbols-outlined text-gray-300 hover:text-gray-600 transition-colors">history</span>
              </div>

              {/* 약물 리스트 렌더링 루프 */}
              <div className="space-y-4 flex-1">
                {medications && medications.length > 0 ? (
                  medications.map((drug, i) => (
                    <div key={i} className="flex items-center gap-5 p-5 bg-[#f8f9fa] rounded-2xl border border-gray-100">
                      <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#00478d] text-lg">pill</span>
                      </div>
                      <div>
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
                  <div className="py-10 text-center text-gray-400 font-medium">
                    처방된 약물이 없습니다.
                  </div>
                )}
              </div>

              <button className="mt-8 w-full py-4 text-sm font-bold text-[#00478d] bg-[#f0f7ff] rounded-xl hover:bg-[#e0f0ff] transition-colors">
                전체 이력 보기
              </button>
            </div>
          </div>

          {/* 3. 하단 섹션: 소견 및 임상 노트 저장소 */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] border border-white">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-[#00478d]">description</span>
                <h4 className="text-2xl font-black text-[#191c1d]">주요 소견 및 임상 노트</h4>
              </div>
              <button className="bg-[#00478d] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#003d7a]">
                노트 추가
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 데이터 카드 샘플 */}
              <div className="p-8 bg-[#f8f9fa] rounded-3xl border border-gray-100">
                <div className="flex justify-between items-center mb-5">
                  <p className="font-bold text-[#00478d]">심장내과</p>
                  <p className="text-xs font-medium text-gray-400">Oct 24, 10:15 AM</p>
                </div>
                <p className="text-lg text-[#191c1d] font-medium leading-relaxed">
                  환자가 오전 활동 후 가벼운 가슴 답답함을 호소함. ECG 결과 정상 리듬이며 ST 분절 변화 없음. 현재 혈압 관리 유지 중.
                </p>
              </div>
              {/* 퀵 인풋 컴포넌트 더미 */}
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