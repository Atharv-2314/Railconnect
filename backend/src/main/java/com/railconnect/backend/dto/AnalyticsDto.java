package com.railconnect.backend.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDto {

    // Platform-wide KPIs
    private long totalUsers;
    private long totalBookings;
    private long confirmedBookings;
    private long cancelledBookings;
    private double totalRevenue;
    private long totalCarbonPoints;

    // Per-user breakdown (from v_user_booking_summary view)
    private List<UserSummary> userSummaries;

    // Per-schedule occupancy (from v_schedule_occupancy view)
    private List<ScheduleOccupancy> scheduleOccupancies;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long userId;
        private String username;
        private long totalBookings;
        private long confirmed;
        private long cancelled;
        private double totalSpent;
        private long carbonPoints;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleOccupancy {
        private Long scheduleId;
        private String trainName;
        private String trainNumber;
        private String routeName;
        private String journeyDate;
        private long totalSeats;
        private long availableSeats;
        private long bookedSeats;
        private double occupancyPct;
        private long waitlisted;
    }
}
