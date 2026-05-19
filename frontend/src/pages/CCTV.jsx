import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

// COCO 17관절 연결선 정의
const SKELETON_EDGES = [
  [0, 1], [0, 2],
  [1, 3], [2, 4],
  [5, 6],
  [5, 7], [7, 9],
  [6, 8], [8, 10],
  [5, 11], [6, 12],
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
];

const ROOMS = [
  {
    id: 1,
    name: '301호',
    patient: '환자 A',
    videoUrl: 'http://localhost:8080/videos/room1.mp4',
    skeletonUrl: 'http://localhost:8080/skeleton/room1.json',
  },
  {
    id: 2,
    name: '302호',
    patient: '환자 B',
    videoUrl: 'http://localhost:8080/videos/room2.mp4',
    skeletonUrl: 'http://localhost:8080/skeleton/room2.json',
  },
];


const CCTV = () => {
  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [selectedRoom,  setSelectedRoom]  = useState(ROOMS[0]);
  const [skeletonFrames,setSkeletonFrames]= useState([]);
  const [frameLoading,  setFrameLoading]  = useState(true);
  const [fps,           setFps]           = useState(30);
  const [isMasking,     setIsMasking]     = useState(false); // 프라이버시 마스킹 ON/OFF

  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const animFrameRef = useRef(null);
  const skeletonRef  = useRef([]);
  const isMaskingRef = useRef(false);   // rAF 클로저 안에서 최신값 읽기 위해 ref 동기화

  // isMasking state → ref 동기화
  useEffect(() => {
    isMaskingRef.current = isMasking;
  }, [isMasking]);

  // ─── 방이 바뀌면 스켈레톤 JSON 로드 ──────────────────────────
  useEffect(() => {
    setFrameLoading(true);
    setSkeletonFrames([]);
    skeletonRef.current = [];
    setFps(30);

    fetch(selectedRoom.skeletonUrl)
      .then(res => res.json())
      .then(data => {
        setSkeletonFrames(data);
        skeletonRef.current = data;
        const video = videoRef.current;
        if (video && video.duration) {
          setFps(data.length / video.duration);
        }
        setFrameLoading(false);
      })
      .catch(err => {
        console.error('스켈레톤 좌표 로드 실패:', err);
        setFrameLoading(false);
      });
  }, [selectedRoom]);

  const handleVideoMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    if (skeletonRef.current.length > 0) {
      setFps(skeletonRef.current.length / video.duration);
    }
  };

  // ─── 프라이버시 실루엣 그리기 ─────────────────────────────────
  /**
   * keypoints 기반으로 보라색 속채움 실루엣을 그린다.
   *
   * [레이어 순서]
   *   ① 몸통 폴리곤 (어깨 + 골반 사각형) — 꽉 찬 보라색
   *   ② 각 신체 부위를 굵기가 다른 캡슐 선으로 덮음
   *   ③ 관절 원으로 선 사이 빈틈 제거
   *   ④ 목 (어깨 중심 → 코) 연결
   *   ⑤ 머리 원 (코·눈·귀 중심에 큰 원)
   *   ⑥ 스켈레톤 선을 밝은 라벤더색으로 위에 올림 → 이미지와 동일한 느낌
   */
  const drawPrivacySilhouette = (ctx, keypoints) => {
    if (!keypoints || keypoints.length < 17) return;

    const valid = (kp) => kp && kp[0] > 0 && kp[1] > 0;

    // 어깨 너비(sw)로 모든 굵기를 비례 계산
    const ls = keypoints[5];   // 왼쪽 어깨
    const rs = keypoints[6];   // 오른쪽 어깨
    let sw = 100;
    if (valid(ls) && valid(rs)) {
      sw = Math.max(60, Math.hypot(ls[0] - rs[0], ls[1] - rs[1]));
    }

    const PURPLE = '#9B30D0';                         // 메인 보라색
    const LINE   = 'rgba(230, 180, 255, 0.85)';       // 위에 올릴 밝은 라벤더 선

    ctx.shadowColor = 'rgba(140, 40, 200, 0.45)';
    ctx.shadowBlur  = 22;

    // ── ① 몸통 폴리곤 (어깨 ↔ 골반 사각형) ──────────────────
    const lh = keypoints[11];
    const rh = keypoints[12];
    if (valid(ls) && valid(rs) && valid(lh) && valid(rh)) {
      ctx.fillStyle = PURPLE;
      ctx.beginPath();
      ctx.moveTo(ls[0], ls[1]);
      ctx.lineTo(rs[0], rs[1]);
      ctx.lineTo(rh[0], rh[1]);
      ctx.lineTo(lh[0], lh[1]);
      ctx.closePath();
      ctx.fill();
    }

    // ── ② 신체 부위별 캡슐 선 (굵기 차등) ───────────────────
    //  [관절i, 관절j, lineWidth (sw 비례)]
    const limbs = [
      [5,  6,  sw * 0.30],   // 어깨 연결
      [5,  7,  sw * 0.28],   // 왼쪽 상완
      [7,  9,  sw * 0.22],   // 왼쪽 전완
      [6,  8,  sw * 0.28],   // 오른쪽 상완
      [8,  10, sw * 0.22],   // 오른쪽 전완
      [5,  11, sw * 0.25],   // 왼쪽 옆구리
      [6,  12, sw * 0.25],   // 오른쪽 옆구리
      [11, 12, sw * 0.30],   // 골반 연결
      [11, 13, sw * 0.32],   // 왼쪽 허벅지
      [13, 15, sw * 0.25],   // 왼쪽 종아리
      [12, 14, sw * 0.32],   // 오른쪽 허벅지
      [14, 16, sw * 0.25],   // 오른쪽 종아리
    ];

    ctx.strokeStyle = PURPLE;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    limbs.forEach(([i, j, w]) => {
      if (!valid(keypoints[i]) || !valid(keypoints[j])) return;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(keypoints[i][0], keypoints[i][1]);
      ctx.lineTo(keypoints[j][0], keypoints[j][1]);
      ctx.stroke();
    });

    // ── ③ 관절 원 (선 사이 빈틈 제거) ───────────────────────
    ctx.fillStyle = PURPLE;
    [
      [5,  sw * 0.17], [6,  sw * 0.17],   // 어깨
      [7,  sw * 0.14], [8,  sw * 0.14],   // 팔꿈치
      [9,  sw * 0.12], [10, sw * 0.12],   // 손목
      [11, sw * 0.17], [12, sw * 0.17],   // 골반
      [13, sw * 0.16], [14, sw * 0.16],   // 무릎
      [15, sw * 0.12], [16, sw * 0.12],   // 발목
    ].forEach(([idx, r]) => {
      if (!valid(keypoints[idx])) return;
      ctx.beginPath();
      ctx.arc(keypoints[idx][0], keypoints[idx][1], r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── ④ 목 (어깨 중심 → 코) ───────────────────────────────
    if (valid(ls) && valid(rs) && valid(keypoints[0])) {
      const nx = (ls[0] + rs[0]) / 2;
      const ny = (ls[1] + rs[1]) / 2;
      ctx.strokeStyle = PURPLE;
      ctx.lineWidth   = sw * 0.20;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(keypoints[0][0], keypoints[0][1]);
      ctx.stroke();
    }

    // ── ⑤ 머리 (코·눈·귀 평균 위치에 원) ──────────────────
    const faceKps = [0, 1, 2, 3, 4].map(i => keypoints[i]).filter(valid);
    if (faceKps.length > 0) {
      const cx = faceKps.reduce((s, p) => s + p[0], 0) / faceKps.length;
      const cy = faceKps.reduce((s, p) => s + p[1], 0) / faceKps.length;
      ctx.fillStyle = PURPLE;
      ctx.beginPath();
      ctx.arc(cx, cy, sw * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // ── ⑥ 스켈레톤 선 — 밝은 라벤더색으로 실루엣 위에 올림 ─
    ctx.strokeStyle = LINE;
    ctx.lineWidth   = Math.max(1.5, sw * 0.015);
    ctx.lineCap     = 'round';

    SKELETON_EDGES.forEach(([i, j]) => {
      if (!valid(keypoints[i]) || !valid(keypoints[j])) return;
      ctx.beginPath();
      ctx.moveTo(keypoints[i][0], keypoints[i][1]);
      ctx.lineTo(keypoints[j][0], keypoints[j][1]);
      ctx.stroke();
    });
  };

  // ─── rAF 그리기 루프 ────────────────────────────────────────────
  useEffect(() => {
    if (frameLoading || skeletonFrames.length === 0) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');

    const draw = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (vw && vh) {
        canvas.width  = vw;
        canvas.height = vh;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const frames        = skeletonRef.current;
      const currentFps    = fps > 0 ? fps : 30;
      const currentFrameIdx = Math.min(
        Math.round(video.currentTime * currentFps),
        frames.length - 1
      );
      const frameData = frames[currentFrameIdx];

      if (frameData?.keypoints) {
        frameData.keypoints.forEach((personKeypoints, personIdx) => {
          if (isMaskingRef.current) {
            // ── 마스킹 ON: keypoints로 흰색 실루엣 그리기 ──
            drawPrivacySilhouette(ctx, personKeypoints);
          } else {
            // ── 마스킹 OFF: 스켈레톤 선+점 그리기 ──
            drawSkeleton(ctx, personKeypoints, personIdx);
          }
        });
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [skeletonFrames, fps, frameLoading]);

  // ─── 스켈레톤 그리기 ───────────────────────────────────────────
  const drawSkeleton = (ctx, keypoints, personIdx) => {
    if (!keypoints || keypoints.length < 17) return;

    const colors = ['#00ff88', '#ff6b6b', '#66b3ff'];
    const color  = colors[personIdx % colors.length];

    ctx.strokeStyle = color;
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 6;

    SKELETON_EDGES.forEach(([i, j]) => {
      const kpI = keypoints[i];
      const kpJ = keypoints[j];
      if (!kpI || !kpJ) return;
      const [x1, y1] = kpI;
      const [x2, y2] = kpJ;
      if (x1 > 0 && y1 > 0 && x2 > 0 && y2 > 0) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    ctx.fillStyle  = color;
    ctx.shadowBlur = 0;
    keypoints.forEach(kp => {
      if (!kp) return;
      const [x, y] = kp;
      if (x > 0 && y > 0) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#f8f9fa] overflow-x-hidden">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="cctv" />

      <main className="w-full h-screen flex flex-col">
        <Header title="실시간 모니터링" onMenuClick={() => setIsMenuOpen(true)} />

        {/* 방 선택 탭 + 마스킹 버튼 */}
        <div className="flex items-center gap-3 px-8 pt-4">
          {ROOMS.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                selectedRoom.id === room.id
                  ? 'bg-[#00478d] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {room.name} — {room.patient}
            </button>
          ))}

          {/* 프라이버시 마스킹 토글 버튼 */}
          <button
            onClick={() => setIsMasking(prev => !prev)}
            className={`ml-auto flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ${
              isMasking
                ? 'bg-[#00478d] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {isMasking ? 'visibility_off' : 'visibility'}
            </span>
            {isMasking ? '마스킹 ON' : '마스킹 OFF'}
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          <div className="relative w-full h-full bg-[#1e293b] rounded-[2.5rem] shadow-2xl overflow-hidden border-[10px] border-white">

            {/* LIVE 표시 */}
            <div className="absolute top-6 left-6 flex items-center gap-3 bg-red-600 px-4 py-2 rounded-full shadow-lg z-20 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="text-white font-black text-xs tracking-widest uppercase">Live</span>
            </div>

            {/* 방 이름 + 마스킹 상태 표시 */}
            <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
              {isMasking && (
                <div className="bg-[#00478d]/80 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-white text-sm">visibility_off</span>
                  <span className="text-white font-black text-xs tracking-widest">PRIVACY</span>
                </div>
              )}
              <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-full">
                <span className="text-white font-bold text-sm">
                  {selectedRoom.name} · {selectedRoom.patient}
                </span>
              </div>
            </div>

            {/* 로딩 표시 */}
            {frameLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <p className="text-white font-bold text-lg animate-pulse">
                  스켈레톤 데이터 로딩 중...
                </p>
              </div>
            )}

            {/* 영상 + 스켈레톤/마스킹 캔버스 */}
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                key={selectedRoom.videoUrl}
                src={selectedRoom.videoUrl}
                className="w-full h-full object-contain"
                autoPlay
                loop
                muted
                onLoadedMetadata={handleVideoMetadata}
              />
              {/*
                캔버스: 마스킹 OFF → 투명 배경 위에 스켈레톤 선+점
                        마스킹 ON  → keypoints 기반 흰색 실루엣 (누군지 식별 불가)
              */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'none' }}
              />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default CCTV;
