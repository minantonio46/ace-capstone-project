package com.medical.skeleton.domain.patient.service;

import com.medical.skeleton.domain.patient.dto.PatientRequest;
import com.medical.skeleton.domain.patient.dto.PatientResponse;
import com.medical.skeleton.domain.patient.entity.Patient;
import com.medical.skeleton.domain.patient.entity.PatientStatus;
import com.medical.skeleton.domain.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    @Transactional(readOnly = true)
    public List<PatientResponse> getPatientsByWard(Long wardId) {
        return patientRepository.findByWardIdAndStatus(wardId, PatientStatus.ADMITTED)
                .stream().map(PatientResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatient(Long id) {
        return PatientResponse.from(findPatientById(id));
    }

    @Transactional
    public PatientResponse register(PatientRequest request) {
        Patient patient = Patient.builder()
                .name(request.getName())
                .birthDate(request.getBirthDate())
                .gender(request.getGender())
                .wardId(request.getWardId())
                .bedNumber(request.getBedNumber())
                .admissionDate(request.getAdmissionDate())
                .doctorId(request.getDoctorId())
                .status(PatientStatus.ADMITTED)
                .build();
        return PatientResponse.from(patientRepository.save(patient));
    }

    @Transactional
    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = findPatientById(id);
        patient.updateInfo(request.getName(), request.getBedNumber(), request.getDoctorId());
        return PatientResponse.from(patient);
    }

    @Transactional
    public void discharge(Long id) {
        Patient patient = findPatientById(id);
        patient.discharge();
    }

    private Patient findPatientById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("환자를 찾을 수 없습니다: " + id));
    }
}
