package com.railconnect.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatDto {
    private Long seatId;
    private Integer coachNumber;
    private Integer seatNumber;
    private String seatClass;
    private String status;
}
