package com.railconnect.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TrainSearchResponse {
    private Long scheduleId;
    private String trainNumber;
    private String trainName;
    private String trainType;
    private LocalDateTime departure;
    private LocalDateTime arrival;
    private String sourceStation;
    private String destStation;
    private Map<String, Integer> availableSeatsByClass;
    private Integer delayMinutes;
}
