package com.medical.skeleton.domain.note.dto;

import com.medical.skeleton.domain.note.entity.NoteType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class NoteRequest {
    @NotNull
    private NoteType noteType;

    @NotBlank
    private String content;

    @NotNull
    private Long createdBy;
}
