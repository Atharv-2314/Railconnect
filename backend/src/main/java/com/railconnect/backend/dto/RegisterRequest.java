package com.railconnect.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String username;
    private String password;
    private String role; // Optional: usually defaulted to PASSENGER in service if not sent

    // Passenger details needed for registration
    private String name;
    private Integer age;
    private String gender;
    private String phone;
}
