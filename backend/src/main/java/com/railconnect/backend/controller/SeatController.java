package com.railconnect.backend.controller;

import com.railconnect.backend.repositories.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.railconnect.backend.dto.SeatDto;

@RestController
@RequestMapping("/api/seats")
@RequiredArgsConstructor
public class SeatController {

    private final SeatRepository seatRepository;

    @GetMapping("/{scheduleId}")
    public ResponseEntity<List<SeatDto>> getSeatsBySchedule(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(seatRepository.findBySchedule_ScheduleId(scheduleId).stream()
                .map(s -> SeatDto.builder()
                        .seatId(s.getSeatId())
                        .coachNumber(s.getCoachNumber())
                        .seatNumber(s.getSeatNumber())
                        .seatClass(s.getSeatClass())
                        .status(s.getStatus())
                        .build())
                .toList());
    }
}
