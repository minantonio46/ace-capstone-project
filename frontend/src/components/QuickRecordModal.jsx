import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';

/* ─────────────────────────────────────────────────────────────
   상수
───────────────────────────────────────────────────────────── */
export const RECORD_TYPES = [
  { id: 'VITAL',         label: '바이탈',        icon: 'monitor_heart',   noteType: null       },
  { id: 'GENERAL',       label: '일반 기록',      icon: 'edit_note',       noteType: 'PATIENT'  },
  { id: 'NO_ISSUE',      label: '특이사항 없음',   icon: 'check_circle',    noteType: 'PATIENT'  },
  { id: 'PAIN',          label: '통증',           icon: 'mood_bad',        noteType: 'PATIENT'  },
  { id: 'DRESSING',      label: '드레싱',         icon: 'medical_services', noteType: 'PATIENT' },
  { id: 'MED_REACTION',  label: '투약 반응',      icon: 'medication',      noteType: 'PATIENT'  },
  { id: 'FALL',          label: '낙상 관련',       icon: 'emergency',       noteType: 'CAUTION'  },
  { id: 'DOCTOR_REPORT', label: '담당의 보고',     icon: 'local_hospital',  noteType: 'PATIENT'  },
];

const VITAL_THRESHOLDS = {
  bt:   { warn: v => v >= 38,                  msg: v => `체온 ${v}°C — 발열` },
  spo2: { warn: v => v <= 92,                  msg: v => `SpO2 ${v}% — 산소포화도 낮음` },
  sbp:  { warn: v => v >= 160 || v <= 90,      msg: v => v >= 160 ? `수축기혈압 ${v}mmHg — 고혈압` : `수축기혈압 ${v}mmHg — 저혈압` },
  hr:   { warn: v => v >= 120 || v <= 50,      msg: v => v >= 120 ? `맥박 ${v}bpm — 빈맥` : `맥박 ${v}bpm — 서맥` },
};

/* ─────────────────────────────────────────────────────────────
   텍스트 자동 생성
───────────────────────────────────────────────────────────── */
const buildDraft = (type, pain, dressing, medReact, fall, docReport) => {
  switch (type) {
    case 'NO_ISSUE':
      return '환자 상태 관찰함. 의식 명료하며 호흡곤란, 흉통, 어지러움 등 특이 호소 없음. 현재 상태 안정적으로 유지 중.';

    case 'PAIN': {
      const { vas, site, character, duration } = pain;
      let t = `통증 사정 시행함. 통증 부위: ${site || '[부위]'}. 양상: ${character}. 강도: VAS ${vas}/10. 지속 시간: ${duration || '[시간]'}.`;
      if (vas >= 7)      t += ' 통증 심함, 담당의 보고 및 처치 시행.';
      else if (vas >= 4) t += ' 진통제 투여 검토 예정.';
      else               t += ' 경미한 통증, 안정 도모 및 재평가 예정.';
      return t;
    }

    case 'DRESSING': {
      const { site, exAmount, exType, condition } = dressing;
      const ex = exAmount === '없음' ? '삼출물 없음' : `삼출물 ${exAmount} ${exType}`;
      return `드레싱 교체 시행함. 부위: ${site || '[부위]'}. ${ex}. 창상 상태: ${condition}. 무균 드레싱 적용 완료.`;
    }

    case 'MED_REACTION': {
      const { drug, route, reaction, detail } = medReact;
      return `${drug || '[약물명]'} ${route} 투여 후 반응 관찰함. ${reaction}. ${detail ? detail + '.' : '특이 반응 없음.'}`;
    }

    case 'FALL': {
      const { situation, location, injury, action, riskLevel, education } = fall;
      if (situation === '낙상 발생')
        return `낙상 발생함. 발생 장소: ${location || '[장소]'}. 손상 여부: ${injury}. 즉각 조치: ${action || '[조치]'}. 담당의 보고 완료. 활력 징후 모니터링 강화.`;
      if (situation === '위험도 평가')
        return `낙상 위험도 평가 시행함. 결과: ${riskLevel}. 낙상 예방 중재 지속 시행. 침대 낙상 방지대 적용 확인.`;
      if (situation === '낙상 예방 교육') {
        const edu = education.length ? education.join(', ') : '침대 낙상방지대, 야간 조명, 호출 벨 위치, 급격한 자세 변경 금지';
        return `낙상 예방 교육 시행함. 교육 내용: ${edu}. 환자 및 보호자 교육 완료. 이해 확인함.`;
      }
      if (situation === '낙상 후 재평가')
        return `낙상 후 재평가 시행함. 환자 활력 징후 안정적. 추가 손상 없음 확인. 지속 모니터링 중.`;
      return '낙상 관련 기록.';
    }

    case 'DOCTOR_REPORT':
      return `담당의 보고 시행함. 보고 내용: ${docReport.reason || '[내용]'}. 지시사항: ${docReport.instruction || '[지시사항]'}.`;

    default:
      return '';
  }
};

/* ─────────────────────────────────────────────────────────────
   메인 모달
───────────────────────────────────────────────────────────── */
const QuickRecordModal = ({ isOpen, onClose, patient, initialType = 'GENERAL', onSaved }) => {
  const [activeType, setActiveType] = useState(initialType);

  /* ── 바이탈 폼 ── */
  const [vForm, setVForm] = useState({ sbp: '', dbp: '', hr: '', bt: '', spo2: '', rr: '', memo: '' });

  /* ── 템플릿 폼 ── */
  const [pain,      setPain]      = useState({ vas: 5, site: '', character: '쑤시는', duration: '' });
  const [dressing,  setDressing]  = useState({ site: '', exAmount: '소량', exType: '장액성', condition: '깨끗함' });
  const [medReact,  setMedReact]  = useState({ drug: '', route: '경구', reaction: '효과 있음', detail: '' });
  const [fall,      setFall]      = useState({ situation: '낙상 예방 교육', location: '', injury: '없음', action: '', riskLevel: '중위험', education: [] });
  const [docReport, setDocReport] = useState({ reason: '', instruction: '' });

  /* ── 초안 ── */
  const [draft,   setDraft]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  /* 타입 또는 폼 변경 시 초안 재생성 */
  useEffect(() => {
    if (activeType === 'VITAL' || activeType === 'GENERAL') return;
    setDraft(buildDraft(activeType, pain, dressing, medReact, fall, docReport));
  }, [activeType, pain, dressing, medReact, fall, docReport]);

  /* 모달 열릴 때 / 환자 변경 시 초기화 */
  useEffect(() => {
    if (!isOpen) return;
    setActiveType(initialType || 'GENERAL');
    setVForm({ sbp: '', dbp: '', hr: '', bt: '', spo2: '', rr: '', memo: '' });
    setPain({ vas: 5, site: '', character: '쑤시는', duration: '' });
    setDressing({ site: '', exAmount: '소량', exType: '장액성', condition: '깨끗함' });
    setMedReact({ drug: '', route: '경구', reaction: '효과 있음', detail: '' });
    setFall({ situation: '낙상 예방 교육', location: '', injury: '없음', action: '', riskLevel: '중위험', education: [] });
    setDocReport({ reason: '', instruction: '' });
    setDraft(initialType === 'NO_ISSUE'
      ? '환자 상태 관찰함. 의식 명료하며 호흡곤란, 흉통, 어지러움 등 특이 호소 없음. 현재 상태 안정적으로 유지 중.'
      : '');
    setError('');
  }, [isOpen, patient?.patientId, initialType]);

  /* 비정상 수치 경고 */
  const warnings = Object.entries(VITAL_THRESHOLDS)
    .filter(([k, t]) => vForm[k] && t.warn(Number(vForm[k])))
    .map(([k, t]) => t.msg(Number(vForm[k])));

  /* ── 저장 ── */
  const handleSave = async () => {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) { setError('로그인 정보가 없습니다.'); return; }
    if (!patient?.patientId) return;

    setSaving(true);
    setError('');
    try {
      if (activeType === 'VITAL') {
        const payload = { recordedBy: userId };
        if (vForm.sbp)  payload.bpSystolic       = Number(vForm.sbp);
        if (vForm.dbp)  payload.bpDiastolic      = Number(vForm.dbp);
        if (vForm.hr)   payload.heartRate        = Number(vForm.hr);
        if (vForm.bt)   payload.temperature      = Number(vForm.bt);
        if (vForm.spo2) payload.oxygenSaturation = Number(vForm.spo2);
        if (vForm.rr)   payload.respiratoryRate  = Number(vForm.rr);
        if (vForm.memo) payload.note             = vForm.memo;
        if (Object.keys(payload).length === 1) { setError('최소 한 가지 수치를 입력해주세요.'); setSaving(false); return; }
        await api.post(`/api/patients/${patient.patientId}/vitals`, payload);
      } else {
        const content = draft.trim();
        if (!content) { setError('내용을 입력해주세요.'); setSaving(false); return; }
        const typeInfo = RECORD_TYPES.find(t => t.id === activeType);
        await api.post(`/api/patients/${patient.patientId}/notes`, {
          noteType:  typeInfo?.noteType || 'PATIENT',
          content,
          createdBy: userId,
        });
      }
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !patient) return null;

  const v = patient.latestVitals;
  const inp = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-[#00478d] focus:ring-2 focus:ring-[#00478d]/20 transition-all bg-white';
  const sel = inp;

  /* ── 공통 라벨 ── */
  const Lbl = ({ children }) => (
    <label className="block text-xs font-bold text-gray-500 mb-1">{children}</label>
  );

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ─── 헤더 ─── */}
        <div className="sticky top-0 bg-white z-10 px-7 pt-7 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-black text-[#00478d] uppercase tracking-widest mb-1">빠른 기록</p>
              <h2 className="text-2xl font-black text-[#191c1d]">
                {patient.name}
                <span className="text-base font-semibold text-gray-400 ml-2">병상 {patient.bedNumber}</span>
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-700">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* 현재 바이탈 미니 표시 */}
          {v && (
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { label: 'BP', value: v.bp ?? (v.bpSystolic && v.bpDiastolic ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'), color: 'text-[#0ea5e9]' },
                { label: 'HR', value: v.heartRate ? `${v.heartRate}bpm` : '—', color: 'text-[#ef4444]' },
                { label: 'SpO2', value: v.oxygenSaturation ? `${v.oxygenSaturation}%` : '—', color: 'text-[#3b82f6]' },
                { label: 'BT', value: v.temperature ? `${v.temperature}°C` : '—', color: 'text-[#f97316]' },
              ].map(({ label, value, color }) => (
                <span key={label} className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                  {label}: <span className={`${color} font-black`}>{value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ─── 유형 선택 ─── */}
        <div className="px-7 py-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {RECORD_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveType(t.id);
                  if (t.id === 'NO_ISSUE')
                    setDraft('환자 상태 관찰함. 의식 명료하며 호흡곤란, 흉통, 어지러움 등 특이 호소 없음. 현재 상태 안정적으로 유지 중.');
                  else if (t.id !== 'VITAL' && t.id !== 'GENERAL')
                    setDraft(''); // 재생성은 useEffect가 담당
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  activeType === t.id
                    ? 'bg-[#00478d] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── 폼 영역 ─── */}
        <div className="flex-1 px-7 py-5 space-y-5">

          {/* ━━ 바이탈 기록 ━━ */}
          {activeType === 'VITAL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'sbp', label: '수축기 혈압', placeholder: 'mmHg' },
                  { key: 'dbp', label: '이완기 혈압', placeholder: 'mmHg' },
                  { key: 'hr',  label: '맥박',        placeholder: 'bpm' },
                  { key: 'bt',  label: '체온',         placeholder: '°C', step: '0.1' },
                  { key: 'spo2',label: 'SpO2',        placeholder: '%' },
                  { key: 'rr',  label: '호흡수',       placeholder: '회/분' },
                ].map(({ key, label, placeholder, step }) => (
                  <div key={key}>
                    <Lbl>{label}</Lbl>
                    <input type="number" step={step} placeholder={placeholder}
                      value={vForm[key]}
                      onChange={e => setVForm(f => ({ ...f, [key]: e.target.value }))}
                      className={`${inp} ${warnings.some(w => w.includes(label.split(' ')[0])) ? 'border-red-300 bg-red-50' : ''}`} />
                  </div>
                ))}
              </div>
              <div>
                <Lbl>메모 (선택)</Lbl>
                <input type="text" placeholder="특이사항" value={vForm.memo}
                  onChange={e => setVForm(f => ({ ...f, memo: e.target.value }))} className={inp} />
              </div>
              {warnings.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                  {warnings.map((w, i) => (
                    <p key={i} className="text-xs font-black text-red-600 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">warning</span>{w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ━━ 통증 ━━ */}
          {activeType === 'PAIN' && (
            <div className="space-y-4">
              <div>
                <Lbl>VAS 통증 점수 ({pain.vas}/10)</Lbl>
                <div className="flex gap-1.5 flex-wrap">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setPain(f => ({ ...f, vas: n }))}
                      className={`w-9 h-9 rounded-lg text-sm font-black transition-all ${
                        pain.vas === n
                          ? n >= 7 ? 'bg-red-500 text-white' : n >= 4 ? 'bg-orange-400 text-white' : 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Lbl>통증 부위</Lbl>
                  <input type="text" placeholder="예) 우측 복부" value={pain.site}
                    onChange={e => setPain(f => ({ ...f, site: e.target.value }))} className={inp} />
                </div>
                <div>
                  <Lbl>통증 양상</Lbl>
                  <select value={pain.character} onChange={e => setPain(f => ({ ...f, character: e.target.value }))} className={sel}>
                    {['찌르는', '쑤시는', '뻐근한', '화끈거리는', '압박감', '욱신거리는'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <Lbl>지속 시간</Lbl>
                  <input type="text" placeholder="예) 30분, 지속적" value={pain.duration}
                    onChange={e => setPain(f => ({ ...f, duration: e.target.value }))} className={inp} />
                </div>
              </div>
            </div>
          )}

          {/* ━━ 드레싱 ━━ */}
          {activeType === 'DRESSING' && (
            <div className="space-y-4">
              <div>
                <Lbl>드레싱 부위</Lbl>
                <input type="text" placeholder="예) 우측 대퇴부 수술 부위" value={dressing.site}
                  onChange={e => setDressing(f => ({ ...f, site: e.target.value }))} className={inp} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Lbl>삼출물 양</Lbl>
                  <select value={dressing.exAmount} onChange={e => setDressing(f => ({ ...f, exAmount: e.target.value }))} className={sel}>
                    {['없음', '소량', '중등량', '다량'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <Lbl>삼출물 성상</Lbl>
                  <select value={dressing.exType} onChange={e => setDressing(f => ({ ...f, exType: e.target.value }))} className={sel}
                    disabled={dressing.exAmount === '없음'}>
                    {['장액성', '혈성', '화농성', '장액혈성'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <Lbl>창상 상태</Lbl>
                  <select value={dressing.condition} onChange={e => setDressing(f => ({ ...f, condition: e.target.value }))} className={sel}>
                    {['깨끗함', '발적', '부종', '괴사 조직 관찰'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ━━ 투약 반응 ━━ */}
          {activeType === 'MED_REACTION' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Lbl>약물명</Lbl>
                  <input type="text" placeholder="예) 트라마돌" value={medReact.drug}
                    onChange={e => setMedReact(f => ({ ...f, drug: e.target.value }))} className={inp} />
                </div>
                <div>
                  <Lbl>투여 경로</Lbl>
                  <select value={medReact.route} onChange={e => setMedReact(f => ({ ...f, route: e.target.value }))} className={sel}>
                    {['경구', 'IV', 'SC', 'IM', '외용'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Lbl>투여 반응</Lbl>
                <div className="flex gap-2">
                  {['효과 있음', '변화 없음', '부작용 발생'].map(r => (
                    <button key={r} onClick={() => setMedReact(f => ({ ...f, reaction: r }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                        medReact.reaction === r ? 'bg-[#00478d] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Lbl>세부 내용 (선택)</Lbl>
                <input type="text" placeholder="예) 오심 호소, VAS 통증 4→2 감소" value={medReact.detail}
                  onChange={e => setMedReact(f => ({ ...f, detail: e.target.value }))} className={inp} />
              </div>
            </div>
          )}

          {/* ━━ 낙상 관련 ━━ */}
          {activeType === 'FALL' && (
            <div className="space-y-4">
              <div>
                <Lbl>기록 유형</Lbl>
                <div className="grid grid-cols-2 gap-2">
                  {['낙상 발생', '위험도 평가', '낙상 예방 교육', '낙상 후 재평가'].map(s => (
                    <button key={s} onClick={() => setFall(f => ({ ...f, situation: s }))}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                        fall.situation === s
                          ? s === '낙상 발생' ? 'bg-red-500 text-white' : 'bg-[#00478d] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {fall.situation === '낙상 발생' && (
                <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Lbl>발생 장소</Lbl>
                      <input type="text" placeholder="예) 화장실" value={fall.location}
                        onChange={e => setFall(f => ({ ...f, location: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <Lbl>손상 여부</Lbl>
                      <select value={fall.injury} onChange={e => setFall(f => ({ ...f, injury: e.target.value }))} className={sel}>
                        {['없음', '찰과상', '타박상', '열상', '골절 의심'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Lbl>즉각 조치</Lbl>
                    <input type="text" placeholder="예) 담당의 보고, 신체 사정 시행" value={fall.action}
                      onChange={e => setFall(f => ({ ...f, action: e.target.value }))} className={inp} />
                  </div>
                </div>
              )}

              {fall.situation === '위험도 평가' && (
                <div>
                  <Lbl>낙상 위험도</Lbl>
                  <div className="flex gap-2">
                    {['저위험', '중위험', '고위험'].map(r => (
                      <button key={r} onClick={() => setFall(f => ({ ...f, riskLevel: r }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                          fall.riskLevel === r
                            ? r === '고위험' ? 'bg-red-500 text-white' : r === '중위험' ? 'bg-orange-400 text-white' : 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {fall.situation === '낙상 예방 교육' && (
                <div>
                  <Lbl>교육 항목 (복수 선택)</Lbl>
                  <div className="grid grid-cols-2 gap-2">
                    {['침대 낙상방지대', '야간 조명', '호출 벨 위치', '급격한 자세 변경 금지', '미끄럼 방지 양말', '보행 보조기 사용'].map(item => (
                      <label key={item} className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer">
                        <input type="checkbox"
                          checked={fall.education.includes(item)}
                          onChange={e => setFall(f => ({
                            ...f,
                            education: e.target.checked ? [...f.education, item] : f.education.filter(i => i !== item)
                          }))}
                          className="w-4 h-4 accent-[#00478d]" />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ━━ 담당의 보고 ━━ */}
          {activeType === 'DOCTOR_REPORT' && (
            <div className="space-y-3">
              <div>
                <Lbl>보고 내용</Lbl>
                <textarea rows={2} placeholder="예) 수축기 혈압 165mmHg로 상승"
                  value={docReport.reason}
                  onChange={e => setDocReport(f => ({ ...f, reason: e.target.value }))}
                  className={`${inp} resize-none`} />
              </div>
              <div>
                <Lbl>담당의 지시사항</Lbl>
                <textarea rows={2} placeholder="예) 항고혈압제 추가 투여 지시"
                  value={docReport.instruction}
                  onChange={e => setDocReport(f => ({ ...f, instruction: e.target.value }))}
                  className={`${inp} resize-none`} />
              </div>
            </div>
          )}

          {/* ━━ 작성 내용 초안 (바이탈 제외) ━━ */}
          {activeType !== 'VITAL' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-[#00478d]">
                  {activeType === 'GENERAL' ? '기록 내용' : '작성 내용 (수정 가능)'}
                </span>
                {activeType !== 'GENERAL' && activeType !== 'NO_ISSUE' && (
                  <button onClick={() => setDraft(buildDraft(activeType, pain, dressing, medReact, fall, docReport))}
                    className="text-xs text-gray-400 hover:text-[#00478d] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">refresh</span>초안 재생성
                  </button>
                )}
              </div>
              <textarea
                rows={5}
                placeholder={activeType === 'GENERAL' ? '간호 기록 내용을 입력하세요...' : '자동 생성된 초안을 수정하세요.'}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className={`${inp} resize-none`}
              />
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">error</span>{error}
            </p>
          )}
        </div>

        {/* ─── 푸터 ─── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-7 py-5 flex justify-between items-center gap-3">
          <p className="text-xs text-gray-400 font-semibold">
            {activeType === 'VITAL' ? '바이탈 이력 + 최신 바이탈에 반영됩니다' : '간호 기록에 추가됩니다'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
              취소
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 bg-[#00478d] text-white rounded-xl font-bold text-sm hover:bg-[#003d7a] disabled:opacity-50 transition-all flex items-center gap-2">
              {saving ? (
                <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>저장 중...</>
              ) : (
                <><span className="material-symbols-outlined text-base">save</span>저장</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickRecordModal;
