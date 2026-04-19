package com.railconnect.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponse {
    private String pnrNumber;
    private String status;
    private Double totalFare;
    private List<String> allocatedSeats; // e.g., ["C1-45", "S2-12"]
    private Integer carbonPointsEarned;
    private String message;
}
