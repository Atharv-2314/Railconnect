package com.railconnect.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingPassengerDto {
    private String name;
    private Integer age;
    private String gender;
    private String seatClassPreference; // E.g., '1AC', '2AC', 'SL'
    private String govId;               // Aadhaar/PAN — required for Anti-Scalper identity check
}
