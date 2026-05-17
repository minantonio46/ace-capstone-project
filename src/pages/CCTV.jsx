import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

// 1. src/assets 폴더에 저장된 JSON 데이터를 올바른 상대 경로로 가져옵니다.
import poseData from '../assets/data_2_pose_detection_3.json'; 

// 2. COCO 포맷 관절 번호 매핑 (0: 코, 5~6: 어깨, 7~8: 팔꿈치, 9~10: 손목, 11~12: 골반, 13~14: 무릎, 15~16: 발목)
const connections = [
  [5, 6],   // 어깨 - 어깨
  [5, 7], [7, 9],   // 왼팔 (어깨 - 팔꿈치 - 손목)
  [6, 8], [8, 10],  // 오른팔 (어깨 - 팔꿈치 - 손목)
  [5, 11], [6, 12], // 측면 상체 (어깨 - 골반)
  [11, 12],         // 골반 - 골반
  [11, 13], [13, 15], // 왼다리 (골반 - 무릎 - 발목)
  [12, 14], [14, 16]  // 오른다리 (골반 - 무릎 - 발목)
];

const CCTV = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canvasRef = useRef(null);

  // 3. 현재 렌더링 중인 JSON 프레임의 인덱스 번호 상태 관리
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);

  // 4. 타이머 이펙트 - 40ms마다 1프레임씩 올려 실시간 비디오 효과 제공
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrameIdx((prevIdx) => {
        // 데이터 배열의 범위를 벗어나면 다시 처음(0)으로 되돌아가 무한 루프 재생
        if (prevIdx >= poseData.length - 1) {
          return 0;
        }
        return prevIdx + 1;
      });
    }, 40); // 40ms = 초당 약 25프레임 재생 속도

    return () => {
      clearInterval(interval);
    };
  }, []);

  // 5. 프레임 인덱스 변경 시마다 캔버스에 새로 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 이전 프레임 잔상 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 현재 인덱스의 프레임 데이터 안전 검사
    const frameData = poseData[currentFrameIdx];
    if (!frameData || !frameData.keypoints || frameData.keypoints.length === 0) return;

    // 첫 번째 유저의 관절 좌표 쌍 배열 추출 [[x, y], [x, y], ...]
    const keypoints = frameData.keypoints[0];

    // 뼈대 선(Bones) 스타일 정의 및 그리기
    ctx.strokeStyle = "#4ade80"; // 형광 초록
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    connections.forEach(([startIdx, endIdx]) => {
      const startPoint = keypoints[startIdx];
      const endPoint = keypoints[endIdx];

      // 누락된 관절 데이터 유효성 예외 처리
      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint[0], startPoint[1]);
        ctx.lineTo(endPoint[0], endPoint[1]);
        ctx.stroke();
      }
    });

    // 관절 점(Joints) 스타일 정의 및 그리기
    ctx.fillStyle = "#f87171"; // 연한 빨간색
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

  // 6. Vite 컴파일러 빌드 안정성을 위해 렌더링 영역 상단에서 미리 텍스트 변수 추출
  const displayFrameNumber = poseData[currentFrameIdx] ? poseData[currentFrameIdx].frame_number : 0;

  return (
    <div className="relative min-h-screen w-screen bg-[#f8f9fa] overflow-x-hidden">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="cctv" />
      
      <main className="w-full h-screen flex flex-col">
        <Header title="실시간 모니터링" onMenuClick={() => setIsMenuOpen(true)} />
        
        <div className="flex-1 p-8 overflow-hidden">
          <div className="relative w-full h-full bg-[#1e293b] rounded-[3rem] shadow-2xl overflow-hidden border-[12px] border-white">
            
            {/* 스켈레톤 캔버스 레이어 (데이터 원본 스케일에 대응하기 위해 1280x720 고정) */}
            <canvas 
              ref={canvasRef}
              width={1280}
              height={720}
              className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
            />

            {/* LIVE 표시 */}
            <div className="absolute top-10 left-10 flex items-center gap-3 bg-red-600 px-5 py-2 rounded-full shadow-lg z-30 animate-pulse">
              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
              <span className="text-white font-black text-sm tracking-widest uppercase">Live Stream</span>
            </div>

            {/* 배경 텍스트 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none z-10">
                <h4 className="text-white text-5xl font-black tracking-[1rem] mb-4">ICU ROOM 402</h4>
                <p className="text-white text-xl font-bold">FRAME: {displayFrameNumber}</p>
            </div>

            {/* 바이탈 위젯 */}
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

            {/* 컨트롤 바 */}
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