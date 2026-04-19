package com.railconnect.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ScheduleCreationRequest {
    private Long trainId;
    private Long routeId;
    private LocalDate journeyDate;
    private String departureTime;
    private String arrivalTime;
}
