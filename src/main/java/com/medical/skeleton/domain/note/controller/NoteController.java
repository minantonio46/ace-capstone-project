package com.medical.skeleton.domain.note.controller;

import com.medical.skeleton.domain.note.dto.NoteRequest;
import com.medical.skeleton.domain.note.entity.Note;
import com.medical.skeleton.domain.note.service.NoteService;
import com.medical.skeleton.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "메모 관리")
@RestController
@RequestMapping("/api/patients/{patientId}/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @Operation(summary = "메모 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<Note>>> getNotes(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.ok(noteService.getNotes(patientId)));
    }

    @Operation(summary = "메모 작성")
    @PostMapping
    public ResponseEntity<ApiResponse<Note>> create(
            @PathVariable Long patientId,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(noteService.create(patientId, request)));
    }

    @Operation(summary = "메모 수정")
    @PutMapping("/{noteId}")
    public ResponseEntity<ApiResponse<Note>> update(
            @PathVariable Long patientId,
            @PathVariable Long noteId,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(noteService.update(patientId, noteId, request)));
    }

    @Operation(summary = "메모 삭제")
    @DeleteMapping("/{noteId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long patientId,
            @PathVariable Long noteId) {
        noteService.delete(patientId, noteId);
        return ResponseEntity.ok(ApiResponse.ok("삭제되었습니다.", null));
    }
}
