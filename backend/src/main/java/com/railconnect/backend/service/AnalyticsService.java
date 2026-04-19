package com.railconnect.backend.service;

import com.railconnect.backend.dto.AnalyticsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    public AnalyticsDto getAnalytics() {

        // --------------- User summaries from DB view ----------------
        List<AnalyticsDto.UserSummary> userSummaries = jdbcTemplate.query(
            """
            SELECT user_id, username, total_bookings, confirmed, cancelled,
                   total_spent, total_carbon_points
            FROM v_user_booking_summary
            ORDER BY total_bookings DESC
            """,
            (rs, rowNum) -> AnalyticsDto.UserSummary.builder()
                .userId(rs.getLong("user_id"))
                .username(rs.getString("username"))
                .totalBookings(rs.getLong("total_bookings"))
                .confirmed(rs.getLong("confirmed"))
                .cancelled(rs.getLong("cancelled"))
                .totalSpent(rs.getDouble("total_spent"))
                .carbonPoints(rs.getLong("total_carbon_points"))
                .build()
        );

        // --------------- Schedule occupancy from DB view ------------
        List<AnalyticsDto.ScheduleOccupancy> scheduleOccupancies = jdbcTemplate.query(
            """
            SELECT schedule_id, train_name, train_number, route_name,
                   journey_date::TEXT, total_seats, available_seats, booked_seats,
                   COALESCE(occupancy_pct, 0) AS occupancy_pct, waitlisted
            FROM v_schedule_occupancy
            ORDER BY journey_date ASC
            """,
            (rs, rowNum) -> AnalyticsDto.ScheduleOccupancy.builder()
                .scheduleId(rs.getLong("schedule_id"))
                .trainName(rs.getString("train_name"))
                .trainNumber(rs.getString("train_number"))
                .routeName(rs.getString("route_name"))
                .journeyDate(rs.getString("journey_date"))
                .totalSeats(rs.getLong("total_seats"))
                .availableSeats(rs.getLong("available_seats"))
                .bookedSeats(rs.getLong("booked_seats"))
                .occupancyPct(rs.getDouble("occupancy_pct"))
                .waitlisted(rs.getLong("waitlisted"))
                .build()
        );

        // --------------- Platform-wide KPI aggregates ---------------
        long totalBookings = userSummaries.stream().mapToLong(AnalyticsDto.UserSummary::getTotalBookings).sum();
        long confirmed = userSummaries.stream().mapToLong(AnalyticsDto.UserSummary::getConfirmed).sum();
        long cancelled = userSummaries.stream().mapToLong(AnalyticsDto.UserSummary::getCancelled).sum();
        double totalRevenue = userSummaries.stream().mapToDouble(AnalyticsDto.UserSummary::getTotalSpent).sum();
        long totalCarbon = userSummaries.stream().mapToLong(AnalyticsDto.UserSummary::getCarbonPoints).sum();
        long totalUsers = userSummaries.stream().filter(u -> u.getTotalBookings() > 0).count();

        return AnalyticsDto.builder()
            .totalUsers(totalUsers)
            .totalBookings(totalBookings)
            .confirmedBookings(confirmed)
            .cancelledBookings(cancelled)
            .totalRevenue(totalRevenue)
            .totalCarbonPoints(totalCarbon)
            .userSummaries(userSummaries)
            .scheduleOccupancies(scheduleOccupancies)
            .build();
    }
}
