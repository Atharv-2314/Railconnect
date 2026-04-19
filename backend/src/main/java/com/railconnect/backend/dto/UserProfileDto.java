package com.railconnect.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long userId;
    private String username;
    private String memberSince; // formatted created_at

    // Booking analytics (from v_user_booking_summary)
    private long totalBookings;
    private long confirmedBookings;
    private long cancelledBookings;
    private double totalSpent;
    private long totalCarbonPoints;

    // Passenger profile (from Passenger table)
    private String fullName;
    private Integer age;
    private String gender;
    private String phone;
}
