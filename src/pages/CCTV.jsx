import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import poseData from '../assets/data_2_pose_detection_3.json';

// COCO 포맷 관절 번호 구조 선 매핑 배열
const connections = [
  [5, 6],      // 어깨 - 어깨
  [5, 7], [7, 9],   // 왼팔 (어깨 - 팔꿈치 - 손목)
  [6, 8], [8, 10],  // 오른팔 (어깨 - 팔꿈치 - 손목)
  [5, 11], [6, 12], // 측면 상체 (어깨 - 골반)
  [11, 12],         // 골반 - 골반
  [11, 13], [13, 15], // 왼다리 (골반 - 무릎 - 발목)
  [12, 14], [14, 16]  // 오른다리 (골반 - 무릎 - 발목)
];

const CCTV = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePatientId, setActivePatientId] = useState('1');
  const canvasRef = useRef(null);

  // 현재 렌더링 중인 JSON 프레임의 인덱스 번호 상태 관리
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);

  useEffect(() => {
    // 세션 스토리지 기반 활성 환자 아이디 연동
    const currentId = localStorage.getItem('activePatientId') || '1';
    setActivePatientId(currentId);
  }, []);

  // 타이머 이펙트 - 40ms마다 1프레임씩 올려 실시간 비디오 효과 제공
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrameIdx((prevIdx) => {
        if (prevIdx >= poseData.length - 1) {
          return 0; // 무한 루프 재생 구조 바인딩
        }
        return prevIdx + 1;
      });
    }, 40); // 40ms = 초당 약 25프레임 타임라인 스케일

    return () => {
      clearInterval(interval);
    };
  }, []);

  // 프레임 인덱스 변경 시마다 HTML5 Canvas 그래픽 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 이전 프레임 잔상 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 프레임 데이터 안전성 검사
    const frameData = poseData[currentFrameIdx];
    if (!frameData || !frameData.keypoints || frameData.keypoints.length === 0) return;

    const keypoints = frameData.keypoints[0];

    // 뼈대 선(Bones) 그리기 디자인 세팅
    ctx.strokeStyle = "#4ade80"; // 형광 연두 초록
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    connections.forEach(([startIdx, endIdx]) => {
      const startPoint = keypoints[startIdx];
      const endPoint = keypoints[endIdx];

      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint[0], startPoint[1]);
        ctx.lineTo(endPoint[0], endPoint[1]);
        ctx.stroke();
      }
    });

    // 관절 점(Joints) 그리기 디자인 세팅
    ctx.fillStyle = "#f87171"; // 연한 주홍 레드
    keypoints.forEach((kp) => {
      if (kp) {
        const [x, y] = kp;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, [currentFrameIdx]);

  const displayFrameNumber = poseData[currentFrameIdx] ? poseData[currentFrameIdx].frame_number : 0;

  return (
    <div className="relative min-h-screen w-screen bg-[#f8f9fa] overflow-x-hidden flex flex-col">
      {/* 사이드바 정상 내장 */}
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="cctv" />

      <main className="w-full flex-1 flex flex-col">
        <Header
          title="실시간 모니터링"
          onMenuClick={() => setIsMenuOpen(true)}
          patientId={activePatientId}
        />
        <div className="flex-1 p-8 flex flex-col">
          <div className="relative flex-1 w-full bg-[#1e293b] rounded-[3rem] shadow-2xl overflow-hidden border-[12px] border-white min-h-[500px]">

            {/* 스켈레톤 캔버스 레이어 (데이터 원본 스케일에 대응하기 위해 1280x720 고정) */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
            />

            {/* LIVE 인터페이스 뱃지 */}
            <div className="absolute top-10 left-10 flex items-center gap-3 bg-red-600 px-5 py-2 rounded-full shadow-lg z-30 animate-pulse">
              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
              <span className="text-white font-black text-sm tracking-widest uppercase">Live Stream</span>
            </div>

            {/* 배경 관제구역 오버레이 텍스트 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none z-10">
              <h4 className="text-white text-5xl font-black tracking-[1rem] mb-4">PATIENT ID #{activePatientId}</h4>
              <p className="text-white text-xl font-bold">FRAME: {displayFrameNumber}</p>
            </div>

            {/* 우측 하단 바이탈 가상 위젯 패널 */}
            <div className="absolute bottom-10 right-10 w-80 bg-white/10 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/20 shadow-2xl z-30">
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

            {/* 좌측 하단 제어 컨트롤러 디자인 버튼 셋 */}
            <div className="absolute bottom-10 left-10 flex gap-4 z-30">
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