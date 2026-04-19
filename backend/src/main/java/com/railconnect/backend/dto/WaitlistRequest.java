package com.railconnect.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaitlistRequest {
    private Long scheduleId;
    private Long passengerId; // existing passenger, OR name/age/gender below
    private String passengerName;
    private Integer passengerAge;
    private String passengerGender;
}
