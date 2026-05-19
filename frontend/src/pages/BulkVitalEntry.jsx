import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

/* ─────────────────────────────────────────────
   컬럼 정의
───────────────────────────────────────────── */
const COLS = [
  { key: 'sbp',  label: 'SBP',  unit: 'mmHg' },
  { key: 'dbp',  label: 'DBP',  unit: 'mmHg' },
  { key: 'hr',   label: 'PR',   unit: 'bpm'  },
  { key: 'bt',   label: 'BT',   unit: '°C',  step: '0.1' },
  { key: 'spo2', label: 'SpO2', unit: '%'    },
  { key: 'rr',   label: 'RR',   unit: '/min' },
];

const TAB_ORDER = [...COLS.map(c => c.key), 'memo'];

/* ─────────────────────────────────────────────
   이상 수치 판별
───────────────────────────────────────────── */
const isAbnormal = (key, val) => {
  const v = parseFloat(val);
  if (isNaN(v) || val === '') return false;
  if (key === 'sbp')  return v >= 160 || v <= 90;
  if (key === 'dbp')  return v >= 100 || v <= 60;
  if (key === 'hr')   return v >= 120 || v <= 50;
  if (key === 'bt')   return v >= 38.0 || v <= 35.5;
  if (key === 'spo2') return v <= 92;
  if (key === 'rr')   return v >= 25 || v <= 10;
  return false;
};

/* ─────────────────────────────────────────────
   저장 상태 뱃지
───────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (status === 'saving') return <span className="text-yellow-600 text-xs font-bold animate-pulse">저장 중…</span>;
  if (status === 'done')   return <span className="text-green-600 text-xs font-bold">✓ 완료</span>;
  if (status === 'error')  return <span className="text-red-500 text-xs font-bold">✗ 오류</span>;
  return null;
};

/* ─────────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────────── */
const BulkVitalEntry = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const inputRefs = useRef({});

  /* 환자 목록 로드 */
  useEffect(() => {
    const wardId = localStorage.getItem('wardId');
    if (!wardId) { navigate('/'); return; }

    api.get(`/api/wards/${wardId}/dashboard`)
      .then(res => {
        if (res.data.success) {
          const pts = res.data.data.patients;
          setRows(pts.map(p => ({
            patientId:  p.patientId,
            name:       p.name,
            bedNumber:  p.bedNumber,
            sbp: '', dbp: '', hr: '', bt: '', spo2: '', rr: '', memo: '',
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  /* Enter → 다음 칸으로 포커스 이동 */
  const handleKeyDown = (e, rowIdx, colKey) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const colIdx = TAB_ORDER.indexOf(colKey);
    let nextRow = rowIdx;
    let nextCol;
    if (colIdx < TAB_ORDER.length - 1) {
      nextCol = TAB_ORDER[colIdx + 1];
    } else {
      nextRow = rowIdx + 1;
      nextCol = TAB_ORDER[0];
    }
    const ref = inputRefs.current[`${nextRow}-${nextCol}`];
    if (ref) ref.focus();
  };

  const handleChange = (rowIdx, key, value) => {
    setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r));
  };

  /* 개별 환자 저장 */
  const saveRow = useCallback(async (row) => {
    const userId = Number(localStorage.getItem('userId'));
    const payload = { recordedBy: userId };
    if (row.sbp)  payload.bpSystolic       = parseInt(row.sbp);
    if (row.dbp)  payload.bpDiastolic      = parseInt(row.dbp);
    if (row.hr)   payload.heartRate        = parseInt(row.hr);
    if (row.bt)   payload.temperature      = parseFloat(row.bt);
    if (row.spo2) payload.oxygenSaturation = parseInt(row.spo2);
    if (row.rr)   payload.respiratoryRate  = parseInt(row.rr);
    if (row.memo) payload.note             = row.memo;

    /* 수치 미입력 시 스킵 */
    if (Object.keys(payload).length <= 1) return;

    setSaveStatus(prev => ({ ...prev, [row.patientId]: 'saving' }));
    try {
      await api.post(`/api/patients/${row.patientId}/vitals`, payload);
      setSaveStatus(prev => ({ ...prev, [row.patientId]: 'done' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [row.patientId]: null })), 3000);
    } catch {
      setSaveStatus(prev => ({ ...prev, [row.patientId]: 'error' }));
    }
  }, []);

  /* 전체 저장 */
  const saveAll = async () => {
    for (const row of rows) await saveRow(row);
  };

  /* ── 이상 수치가 있는 항목 수 계산 ── */
  const abnormalCount = rows.reduce((acc, row) =>
    acc + COLS.filter(c => isAbnormal(c.key, row[c.key])).length, 0);

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9fa] font-sans">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="bulk" />

      <main className="w-full flex flex-col pb-16">
        <Header title="바이탈 일괄 입력" onMenuClick={() => setIsMenuOpen(true)} />

        <div className="p-6 max-w-[1600px] mx-auto w-full">

          {/* ── 상단 안내 바 ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500 font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-gray-400">keyboard_return</span>
                Enter 키로 다음 칸 이동
              </p>
              {abnormalCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  이상 수치 {abnormalCount}건
                </span>
              )}
            </div>
            <button
              onClick={saveAll}
              className="flex items-center gap-2 bg-[#00478d] text-white font-black px-6 py-3 rounded-2xl hover:bg-[#003a73] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-base">save</span>
              전체 저장
            </button>
          </div>

          {/* ── 로딩 ── */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400 font-bold animate-pulse">환자 목록 불러오는 중...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-16 text-center shadow-sm">
              <span className="material-symbols-outlined text-6xl text-gray-200">person_off</span>
              <p className="text-gray-400 font-bold text-xl mt-4">현재 입원 환자가 없습니다</p>
            </div>
          ) : (
            <>
              {/* ═══ Desktop 테이블 ═══ */}
              <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9fa] border-b border-gray-100">
                      <th className="text-left px-5 py-4 font-black text-gray-400 text-xs uppercase tracking-wider">병상</th>
                      <th className="text-left px-5 py-4 font-black text-gray-400 text-xs uppercase tracking-wider">이름</th>
                      {COLS.map(c => (
                        <th key={c.key} className="text-center px-3 py-4 font-black text-gray-400 text-xs uppercase tracking-wider min-w-[80px]">
                          {c.label}
                          <div className="text-[10px] font-semibold text-gray-300 normal-case">{c.unit}</div>
                        </th>
                      ))}
                      <th className="text-left px-4 py-4 font-black text-gray-400 text-xs uppercase tracking-wider">메모</th>
                      <th className="text-center px-4 py-4 font-black text-gray-400 text-xs uppercase tracking-wider w-28">저장 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => (
                      <tr
                        key={row.patientId}
                        className={`border-b border-gray-50 transition-colors
                          ${saveStatus[row.patientId] === 'done' ? 'bg-green-50/60' : 'hover:bg-gray-50/50'}`}
                      >
                        <td className="px-5 py-3 font-bold text-gray-500 text-sm">{row.bedNumber}</td>
                        <td className="px-5 py-3 font-black text-[#191c1d]">{row.name}</td>

                        {COLS.map(col => {
                          const abn = isAbnormal(col.key, row[col.key]);
                          return (
                            <td key={col.key} className="px-2 py-2">
                              <input
                                ref={el => { inputRefs.current[`${rowIdx}-${col.key}`] = el; }}
                                type="number"
                                step={col.step || '1'}
                                min="0"
                                value={row[col.key]}
                                onChange={e => handleChange(rowIdx, col.key, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, rowIdx, col.key)}
                                placeholder="—"
                                className={`w-full text-center font-bold rounded-xl border px-2 py-2.5 focus:outline-none focus:ring-2 transition-all text-sm
                                  ${abn
                                    ? 'border-red-300 bg-red-50 text-red-600 focus:ring-red-300/40'
                                    : 'border-gray-200 bg-gray-50 text-gray-700 focus:ring-[#00478d]/20 focus:border-[#00478d]'
                                  }`}
                              />
                            </td>
                          );
                        })}

                        <td className="px-2 py-2">
                          <input
                            ref={el => { inputRefs.current[`${rowIdx}-memo`] = el; }}
                            type="text"
                            value={row.memo}
                            onChange={e => handleChange(rowIdx, 'memo', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, rowIdx, 'memo')}
                            placeholder="메모..."
                            className="w-full font-semibold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00478d]/20 focus:border-[#00478d] transition-all text-sm"
                          />
                        </td>

                        <td className="px-3 py-2 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <button
                              onClick={() => saveRow(row)}
                              disabled={saveStatus[row.patientId] === 'saving'}
                              className="bg-[#00478d] text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-[#003a73] disabled:opacity-50 transition-colors w-full"
                            >
                              저장
                            </button>
                            <StatusBadge status={saveStatus[row.patientId]} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ═══ Mobile 카드 ═══ */}
              <div className="md:hidden space-y-4">
                {rows.map((row, rowIdx) => (
                  <div
                    key={row.patientId}
                    className={`bg-white rounded-[2rem] p-6 shadow-sm border transition-colors
                      ${saveStatus[row.patientId] === 'done' ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="font-black text-[#191c1d] text-xl">{row.name}</p>
                        <p className="text-xs text-gray-400 font-bold mt-0.5">병상 {row.bedNumber}</p>
                      </div>
                      <StatusBadge status={saveStatus[row.patientId]} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {COLS.map(col => {
                        const abn = isAbnormal(col.key, row[col.key]);
                        return (
                          <div key={col.key}>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                              {col.label} <span className="text-gray-300 normal-case font-semibold">{col.unit}</span>
                            </label>
                            <input
                              type="number"
                              step={col.step || '1'}
                              value={row[col.key]}
                              onChange={e => handleChange(rowIdx, col.key, e.target.value)}
                              placeholder="—"
                              className={`w-full text-center font-bold rounded-xl border px-2 py-2.5 mt-1 focus:outline-none transition-all text-sm
                                ${abn ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={row.memo}
                      onChange={e => handleChange(rowIdx, 'memo', e.target.value)}
                      placeholder="메모..."
                      className="w-full font-semibold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2.5 focus:outline-none mb-4 text-sm"
                    />

                    <button
                      onClick={() => saveRow(row)}
                      disabled={saveStatus[row.patientId] === 'saving'}
                      className="w-full bg-[#00478d] text-white font-black py-3 rounded-2xl hover:bg-[#003a73] disabled:opacity-50 transition-colors"
                    >
                      저장
                    </button>
                  </div>
                ))}

                <button
                  onClick={saveAll}
                  className="w-full bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">save</span>
                  전체 저장
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default BulkVitalEntry;
