package com.railconnect.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaitlistEntryDto {
    private Long waitlistId;
    private Integer position;
    private String passengerName;
    private Integer passengerAge;
    private String passengerGender;
    private String joinedAt;
}
