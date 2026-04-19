package com.railconnect.backend.controller;

import com.railconnect.backend.dto.TrainSearchResponse;
import com.railconnect.backend.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/trains")
@RequiredArgsConstructor
public class TrainController {

    private final SearchService searchService;

    @GetMapping("/search")
    public ResponseEntity<List<TrainSearchResponse>> searchTrains(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        return ResponseEntity.ok(searchService.searchTrains(source, destination, date));
    }
}
