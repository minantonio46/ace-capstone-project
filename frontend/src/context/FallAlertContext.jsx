import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSkeletonFrames } from '../api/skeleton';

/**
 * 전역 낙상 감지 컨텍스트
 *
 * ■ 핵심 설계
 *   - setInterval 주기와 무관하게 performance.now() 기반 실제 경과 시간으로
 *     현재 프레임을 계산 → 백그라운드 탭에서도 타이밍 정확
 *   - 어느 페이지에 있든 항상 실행됨 (App 최상단에서 Provider로 감쌈)
 *
 * ■ 낙상 판정 기준
 *   직전 WINDOW 프레임 내 bounding box 비율 < 1.2 (서있었음)
 *   + 현재 비율 > 1.8 (누워있음)
 *   → 서있다가 누운 전환 = 낙상
 *
 * ■ 오탐 방지
 *   - 영상 루프 후 침대 구간(프레임 0~29): idx < WINDOW 조건으로 스킵 → 오탐 없음
 *   - room2(처음부터 누워있음): minPrev > 1.2 → 조건 미충족 → 오탐 없음
 */

const ROOMS = [
  { id: 1, name: '301호', patient: '환자 A', skeletonDataId: 'room1' },
  { id: 2, name: '302호', patient: '환자 B', skeletonDataId: 'room2' },
];

const FPS              = 24;
const WINDOW           = 30;    // 직전 30프레임 범위
const UPRIGHT_MAX      = 1.2;   // 서있을 때 최대 비율
const FALLEN_MIN       = 1.8;   // 넘어진 상태 최소 비율
const COOLDOWN_MS      = 7000; // 알림 지속 + 재감지 방지 시간
const CHECK_INTERVAL   = 300;   // 300ms마다 체크 (백그라운드 탭도 충분)

const FallAlertContext = createContext(null);

export function FallAlertProvider({ children }) {
  const [globalAlert, setGlobalAlert] = useState(null);
  /** 낙상 감지 시 Dashboard가 해당 환자 빠른기록 모달을 열 수 있도록 룸 이름 전달 */
  const [pendingFallRoom, setPendingFallRoom] = useState(null); // e.g. '301호'

  const framesData  = useRef({});  // roomId → skeleton frames []
  const cooldowns   = useRef({});  // roomId → 쿨다운 중 여부
  const startTime   = useRef(null); // 분석 시작 기준 시각 (ms)

  // ── JSON 로드 ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadAllRooms = () => {
      if (!localStorage.getItem('accessToken')) return;

      let loadedCount = 0;
      ROOMS.forEach(room => {
        getSkeletonFrames(room.skeletonDataId)
          .then(data => {
            if (cancelled) return;
            framesData.current[room.id] = data;
            cooldowns.current[room.id] = false;
            loadedCount++;
            if (loadedCount === 1) {
              startTime.current = performance.now();
            }
          })
          .catch(() => { /* Backend unavailable or authentication expired. */ });
      });
    };

    loadAllRooms();
    window.addEventListener('auth-changed', loadAllRooms);

    return () => {
      cancelled = true;
      window.removeEventListener('auth-changed', loadAllRooms);
    };
  }, []);

  // ── 300ms마다 현재 프레임 계산 후 낙상 감지 ─────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!startTime.current) return; // JSON 아직 로드 중

      // performance.now() 기반 경과 시간 → 프레임 인덱스 계산
      // setInterval이 백그라운드에서 1fps로 쓰로틀돼도 타이밍 정확
      const elapsedSec = (performance.now() - startTime.current) / 1000;

      ROOMS.forEach(room => {
        const frames = framesData.current[room.id];
        if (!frames || frames.length === 0) return;
        if (cooldowns.current[room.id]) return;

        const totalFrames = frames.length;
        const idx = Math.floor(elapsedSec * FPS) % totalFrames;

        // 루프 시작 직후 침대 구간: WINDOW 미확보 → 스킵 (오탐 방지)
        if (idx < WINDOW) return;

        // 현재 프레임 bounding box 비율
        const currBox = frames[idx]?.boxes?.[0];
        if (!currBox) return;
        const currRatio = (currBox[2] - currBox[0]) / (currBox[3] - currBox[1]);
        if (currRatio <= FALLEN_MIN) return; // 아직 서있음 → 스킵

        // 직전 WINDOW 프레임 중 최소 비율 계산
        let minPrev = Infinity;
        for (let i = idx - WINDOW; i < idx; i++) {
          const box = frames[i]?.boxes?.[0];
          if (!box) continue;
          const r = (box[2] - box[0]) / (box[3] - box[1]);
          if (r < minPrev) minPrev = r;
        }

        // 직전에 서있었고(minPrev < 1.2) + 지금 누워있으면(curr > 1.8) → 낙상
        if (minPrev < UPRIGHT_MAX) {
          cooldowns.current[room.id] = true;
          setGlobalAlert(`${room.name} ${room.patient} 낙상 감지!`);
          setPendingFallRoom(room.name); // Dashboard가 모달 자동 오픈에 사용
          // 알림 배너: 기록창 닫힘 또는 7초 후 자동 해제
          setTimeout(() => setGlobalAlert(null), COOLDOWN_MS);
          // 재감지 쿨다운: 7초 유지 (배너 해제와 독립)
          setTimeout(() => { cooldowns.current[room.id] = false; }, COOLDOWN_MS);
        }
      });
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <FallAlertContext.Provider value={{ globalAlert, setGlobalAlert, pendingFallRoom, setPendingFallRoom }}>
      {children}
    </FallAlertContext.Provider>
  );
}

export const useFallAlert = () => useContext(FallAlertContext);
