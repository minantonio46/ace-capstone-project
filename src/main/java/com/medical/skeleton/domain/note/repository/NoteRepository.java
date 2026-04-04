package com.medical.skeleton.domain.note.repository;

import com.medical.skeleton.domain.note.entity.Note;
import com.medical.skeleton.domain.note.entity.NoteType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Note> findByPatientIdAndNoteTypeOrderByCreatedAtDesc(Long patientId, NoteType noteType);
}
