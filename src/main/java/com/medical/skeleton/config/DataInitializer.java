package com.medical.skeleton.config;

import com.medical.skeleton.domain.medication.entity.Medication;
import com.medical.skeleton.domain.medication.entity.MedicationRecord;
import com.medical.skeleton.domain.medication.entity.MedicationStatus;
import com.medical.skeleton.domain.medication.repository.MedicationRecordRepository;
import com.medical.skeleton.domain.medication.repository.MedicationRepository;
import com.medical.skeleton.domain.note.entity.Note;
import com.medical.skeleton.domain.note.entity.NoteType;
import com.medical.skeleton.domain.note.repository.NoteRepository;
import com.medical.skeleton.domain.patient.entity.Patient;
import com.medical.skeleton.domain.patient.entity.PatientStatus;
import com.medical.skeleton.domain.patient.repository.PatientRepository;
import com.medical.skeleton.domain.user.entity.Role;
import com.medical.skeleton.domain.user.entity.User;
import com.medical.skeleton.domain.user.repository.UserRepository;
import com.medical.skeleton.domain.vital.entity.VitalSign;
import com.medical.skeleton.domain.vital.repository.VitalSignRepository;
import com.medical.skeleton.domain.ward.entity.Ward;
import com.medical.skeleton.domain.ward.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 애플리케이션 시작 시 DB가 비어있으면 테스트 데이터를 자동으로 삽입합니다.
 *
 * ※ 데이터를 초기화하려면 MySQL에서 아래 실행 후 재시작:
 *    DROP DATABASE medical_db; CREATE DATABASE medical_db CHARACTER SET utf8mb4;
 *
 * 로그인 계정
 *   - 간호사: 123456 / 123456
 *   - 의사:   000000 / 000000
 *
 * 환자
 *   - 301호 : 이기동 (78세, 남) — 고혈압·심부전
 *   - 302호 : 최진수 (55세, 남) — 제2형 당뇨병·우측 대퇴부 골절
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository              userRepository;
    private final WardRepository              wardRepository;
    private final PatientRepository           patientRepository;
    private final VitalSignRepository         vitalSignRepository;
    private final MedicationRepository        medicationRepository;
    private final MedicationRecordRepository  medicationRecordRepository;
    private final NoteRepository              noteRepository;
    private final PasswordEncoder             passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("[DataInitializer] 데이터 이미 존재 → 초기화 건너뜀");
            return;
        }
        log.info("[DataInitializer] 테스트 데이터 삽입 시작");

        // ── 병동 ──────────────────────────────────────────────────────
        Ward ward = wardRepository.save(Ward.builder()
                .wardCode("W_3F").wardName("3층 일반병동").floor(3)
                .description("스켈레톤 기반 낙상 감지 모니터링 병동")
                .build());

        // ── 의료진 ────────────────────────────────────────────────────
        User doctor = userRepository.save(User.builder()
                .username("000000").password(passwordEncoder.encode("000000"))
                .name("김재원").role(Role.DOCTOR).wardId(ward.getId()).build());

        User nurse = userRepository.save(User.builder()
                .username("123456").password(passwordEncoder.encode("123456"))
                .name("박지수").role(Role.NURSE).wardId(ward.getId()).build());

        // ── 환자 A : 이기동 (78세, 고혈압·심부전) ─────────────────────
        Patient pA = patientRepository.save(Patient.builder()
                .name("이기동")
                .birthDate(LocalDate.of(1947, 5, 12))
                .gender("M")
                .wardId(ward.getId()).bedNumber("301-1")
                .admissionDate(LocalDate.now().minusDays(8))
                .status(PatientStatus.ADMITTED)
                .doctorId(doctor.getId())
                .build());

        // ── 환자 B : 최진수 (55세, 당뇨·우측 대퇴부 골절) ───────────
        Patient pB = patientRepository.save(Patient.builder()
                .name("최진수")
                .birthDate(LocalDate.of(1970, 11, 28))
                .gender("M")
                .wardId(ward.getId()).bedNumber("302-1")
                .admissionDate(LocalDate.now().minusDays(3))
                .status(PatientStatus.ADMITTED)
                .doctorId(doctor.getId())
                .build());

        LocalDateTime now = LocalDateTime.now();

        // ────────────────────────────────────────────────────────────
        // 바이탈 사인 — 이기동 (고혈압·심부전: BP↑, O2↓, HR약간↑)
        // ────────────────────────────────────────────────────────────
        saveVital(pA.getId(), nurse.getId(), now.minusHours(1),
                37.1, 155, 96, 91, 93, 20, "하지 부종 관찰, 상체 거상 유지 중");
        saveVital(pA.getId(), nurse.getId(), now.minusHours(7),
                37.0, 152, 94, 89, 94, 19, null);
        saveVital(pA.getId(), nurse.getId(), now.minusHours(13),
                36.9, 158, 98, 93, 92, 21, "야간 호흡곤란 호소 후 산소 투여");
        saveVital(pA.getId(), nurse.getId(), now.minusHours(19),
                36.8, 148, 90, 88, 95, 18, null);
        saveVital(pA.getId(), nurse.getId(), now.minusHours(25),
                36.7, 153, 93, 90, 93, 20, null);

        // ────────────────────────────────────────────────────────────
        // 바이탈 사인 — 최진수 (수술 후: BP약간↑, 정상 범위)
        // ────────────────────────────────────────────────────────────
        saveVital(pB.getId(), nurse.getId(), now.minusHours(2),
                36.8, 138, 86, 82, 97, 17, "우측 수술 부위 드레싱 교체 완료");
        saveVital(pB.getId(), nurse.getId(), now.minusHours(8),
                37.2, 141, 88, 84, 96, 18, "발열 경향, 냉찜질 적용");
        saveVital(pB.getId(), nurse.getId(), now.minusHours(14),
                36.7, 135, 84, 79, 97, 16, null);
        saveVital(pB.getId(), nurse.getId(), now.minusHours(20),
                36.6, 133, 82, 78, 98, 16, null);

        // ────────────────────────────────────────────────────────────
        // 처방 약물 — 이기동
        // ────────────────────────────────────────────────────────────
        Medication carvedilol = saveMed(pA.getId(), doctor.getId(), "카르베딜롤", 6.25, "mg", 12);
        Medication lisinopril = saveMed(pA.getId(), doctor.getId(), "리시노프릴", 10.0, "mg", 24);
        Medication furosemide = saveMed(pA.getId(), doctor.getId(), "푸로세미드", 40.0, "mg", 24);
        Medication spironolactone = saveMed(pA.getId(), doctor.getId(), "스피로놀락톤", 25.0, "mg", 24);
        Medication aspirinA = saveMed(pA.getId(), doctor.getId(), "아스피린", 100.0, "mg", 24);

        // 이기동 투여 기록 (nextDueAt이 미래 → 대시보드에 다음 투약 표시)
        saveMedRecord(carvedilol, pA.getId(), nurse.getId(), now.minusHours(6),  12);
        saveMedRecord(lisinopril, pA.getId(), nurse.getId(), now.minusHours(10), 24);
        saveMedRecord(furosemide, pA.getId(), nurse.getId(), now.minusHours(10), 24);
        saveMedRecord(spironolactone, pA.getId(), nurse.getId(), now.minusHours(10), 24);
        saveMedRecord(aspirinA, pA.getId(), nurse.getId(), now.minusHours(10), 24);

        // ────────────────────────────────────────────────────────────
        // 처방 약물 — 최진수
        // ────────────────────────────────────────────────────────────
        Medication metformin = saveMed(pB.getId(), doctor.getId(), "메트포르민", 1000.0, "mg", 12);
        Medication insulin    = saveMed(pB.getId(), doctor.getId(), "인슐린 글라진", 20.0, "unit", 24);
        Medication tramadol   = saveMed(pB.getId(), doctor.getId(), "트라마돌", 50.0, "mg", 8);
        Medication cefazolin  = saveMed(pB.getId(), doctor.getId(), "세파졸린", 1000.0, "mg", 8);
        Medication enoxaparin = saveMed(pB.getId(), doctor.getId(), "에녹사파린", 40.0, "mg", 24);

        // 최진수 투여 기록
        saveMedRecord(metformin,  pB.getId(), nurse.getId(), now.minusHours(5),  12);
        saveMedRecord(insulin,    pB.getId(), nurse.getId(), now.minusHours(14), 24);
        saveMedRecord(tramadol,   pB.getId(), nurse.getId(), now.minusHours(3),  8);
        saveMedRecord(cefazolin,  pB.getId(), nurse.getId(), now.minusHours(3),  8);
        saveMedRecord(enoxaparin, pB.getId(), nurse.getId(), now.minusHours(14), 24);

        // ────────────────────────────────────────────────────────────
        // 간호 기록 — 이기동
        // ────────────────────────────────────────────────────────────
        saveNote(pA.getId(), nurse.getId(), NoteType.PATIENT,
                "하지 부종 관찰. 양측 발목 부종 2+ 정도. 체중 측정 결과 어제보다 1.2kg 증가. 수분 제한 준수 여부 재교육 실시.");
        saveNote(pA.getId(), nurse.getId(), NoteType.PATIENT,
                "야간 수면 중 호흡곤란 호소하여 상체 거상(30°) 자세 적용. 이후 호흡 안정됨. 담당의(김재원) 보고 완료. 산소 2L/min 투여 중.");
        saveNote(pA.getId(), nurse.getId(), NoteType.PATIENT,
                "청진 시 양측 폐 하엽에서 수포음(crackle) 청진됨. 폐수종 악화 가능성으로 활력징후 1시간 간격 모니터링 시작.");
        saveNote(pA.getId(), nurse.getId(), NoteType.GUARDIAN,
                "보호자(아들 이준호) 방문. 환자 상태 및 치료 계획 설명. 퇴원 일정은 부종 호전 여부에 따라 결정될 예정임을 안내.");
        saveNote(pA.getId(), nurse.getId(), NoteType.CAUTION,
                "페니실린 계열 항생제 알레르기(두드러기). 처방 시 반드시 확인 요망. 낙상 고위험 환자 — 침대 낙상 방지대 항시 올릴 것.");

        // ────────────────────────────────────────────────────────────
        // 간호 기록 — 최진수
        // ────────────────────────────────────────────────────────────
        saveNote(pB.getId(), nurse.getId(), NoteType.PATIENT,
                "우측 대퇴부 골절 수술(ORIF) 후 3일차. 수술 부위 드레싱 교체 시 삼출액 소량 관찰, 감염 징후 없음. 항생제 투여 유지.");
        saveNote(pB.getId(), nurse.getId(), NoteType.PATIENT,
                "혈당 모니터링: 공복 혈당 118 mg/dL, 식후 2시간 혈당 172 mg/dL. 목표 혈당(공복 80~130, 식후 <180) 범위 내 유지 중. 인슐린 용량 조정 없음.");
        saveNote(pB.getId(), nurse.getId(), NoteType.PATIENT,
                "재활의학과 협진 완료. 오늘부터 침상 옆 기립 훈련 시작. 통증 VAS 6/10으로 트라마돌 투여 후 4/10으로 감소. 물리치료사 방문 예정(오후 2시).");
        saveNote(pB.getId(), nurse.getId(), NoteType.PATIENT,
                "조조 체온 37.2°C로 미열 있음. 수술 후 반응성 발열 가능성 높음. 냉찜질 적용 및 수분 섭취 권장. 38°C 이상 시 담당의 연락 예정.");
        saveNote(pB.getId(), nurse.getId(), NoteType.CAUTION,
                "당뇨 환자 — 저혈당 주의. 인슐린 투여 후 식사 여부 반드시 확인. 우측 하지 DVT 예방을 위해 에녹사파린 투여 및 탄력 스타킹 착용 유지.");

        log.info("[DataInitializer] 삽입 완료 — 병동: {}, 환자: {}명",
                ward.getWardName(), patientRepository.count());
    }

    // ── 헬퍼 메서드 ──────────────────────────────────────────────────

    private void saveVital(Long patientId, Long recordedBy, LocalDateTime at,
                           double temp, int bpS, int bpD, int hr, int o2, int rr, String note) {
        vitalSignRepository.save(VitalSign.builder()
                .patientId(patientId)
                .temperature(temp)
                .bpSystolic(bpS).bpDiastolic(bpD)
                .heartRate(hr).oxygenSaturation(o2).respiratoryRate(rr)
                .recordedBy(recordedBy)
                .recordedAt(at)
                .note(note)
                .build());
    }

    private Medication saveMed(Long patientId, Long doctorId,
                               String name, double dosage, String unit, int intervalHours) {
        return medicationRepository.save(Medication.builder()
                .patientId(patientId)
                .drugName(name).dosage(dosage).unit(unit)
                .intervalHours(intervalHours)
                .startAt(LocalDateTime.now().minusDays(3))
                .prescribedBy(doctorId)
                .status(MedicationStatus.ACTIVE)
                .build());
    }

    private void saveMedRecord(Medication med, Long patientId, Long nurseId,
                               LocalDateTime administeredAt, int intervalHours) {
        medicationRecordRepository.save(MedicationRecord.builder()
                .medicationId(med.getId())
                .patientId(patientId)
                .drugName(med.getDrugName())
                .dosage(med.getDosage())
                .administeredAt(administeredAt)
                .nextDueAt(administeredAt.plusHours(intervalHours))
                .administeredBy(nurseId)
                .build());
    }

    private void saveNote(Long patientId, Long nurseId, NoteType type, String content) {
        noteRepository.save(Note.builder()
                .patientId(patientId)
                .noteType(type)
                .content(content)
                .createdBy(nurseId)
                .build());
    }
}
