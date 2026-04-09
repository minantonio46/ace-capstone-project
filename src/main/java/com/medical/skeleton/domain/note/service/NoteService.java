package com.medical.skeleton.domain.note.service;

import com.medical.skeleton.domain.note.dto.NoteRequest;
import com.medical.skeleton.domain.note.entity.Note;
import com.medical.skeleton.domain.note.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;

    @Transactional(readOnly = true)
    public List<Note> getNotes(Long patientId) {
        return noteRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @Transactional
    public Note create(Long patientId, NoteRequest request) {
        Note note = Note.builder()
                .patientId(patientId)
                .noteType(request.getNoteType())
                .content(request.getContent())
                .createdBy(request.getCreatedBy())
                .build();
        return noteRepository.save(note);
    }

    @Transactional
    public Note update(Long patientId, Long noteId, NoteRequest request) {
        Note note = findNote(noteId, patientId);
        note.updateContent(request.getContent());
        return note;
    }

    @Transactional
    public void delete(Long patientId, Long noteId) {
        Note note = findNote(noteId, patientId);
        noteRepository.delete(note);
    }

    private Note findNote(Long noteId, Long patientId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new IllegalArgumentException("메모를 찾을 수 없습니다: " + noteId));
        if (!note.getPatientId().equals(patientId)) {
            throw new IllegalArgumentException("해당 환자의 메모가 아닙니다.");
        }
        return note;
    }
}
