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
public class BookingRequest {
    private Long scheduleId;
    private List<Long> seatIds;
    private Long userId; // Often derived from JWT in standard apps, but pass explicitly per basic REST or extract from context
    private List<BookingPassengerDto> passengers;
    private Integer pointsUsed;
}
