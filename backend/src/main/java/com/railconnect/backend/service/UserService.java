package com.railconnect.backend.service;

import com.railconnect.backend.dto.UserProfileDto;
import com.railconnect.backend.entities.AppUser;
import com.railconnect.backend.entities.Passenger;
import com.railconnect.backend.repositories.AppUserRepository;
import com.railconnect.backend.repositories.PassengerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository appUserRepository;
    private final PassengerRepository passengerRepository;
    private final JdbcTemplate jdbcTemplate;

    @SuppressWarnings("null")
    public UserProfileDto getProfile(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Pull analytics from the v_user_booking_summary view
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT total_bookings, confirmed, cancelled, total_spent, total_carbon_points " +
                "FROM v_user_booking_summary WHERE user_id = ?",
                userId
        );

        long totalBookings = 0, confirmed = 0, cancelled = 0, carbonPoints = 0;
        double totalSpent = 0.0;

        if (!rows.isEmpty()) {
            Map<String, Object> row = rows.get(0);
            totalBookings = row.get("total_bookings") != null ? ((Number) row.get("total_bookings")).longValue() : 0;
            confirmed     = row.get("confirmed")     != null ? ((Number) row.get("confirmed")).longValue()     : 0;
            cancelled     = row.get("cancelled")     != null ? ((Number) row.get("cancelled")).longValue()     : 0;
            totalSpent    = row.get("total_spent")   != null ? ((Number) row.get("total_spent")).doubleValue() : 0.0;
            carbonPoints  = row.get("total_carbon_points") != null ? ((Number) row.get("total_carbon_points")).longValue() : 0;
        }

        // Pull passenger profile for name/age/gender/phone
        String fullName = user.getUsername();
        Integer age = null;
        String gender = null;
        String phone = null;

        List<Passenger> passengers = passengerRepository.findByUser(user);
        if (!passengers.isEmpty()) {
            Passenger p = passengers.get(0);
            fullName = p.getName();
            age      = p.getAge();
            gender   = p.getGender();
            phone    = p.getPhone();
        }

        String memberSince = user.getCreatedAt() != null
                ? user.getCreatedAt().format(DateTimeFormatter.ofPattern("MMMM yyyy"))
                : "—";

        return UserProfileDto.builder()
                .userId(userId)
                .username(user.getUsername())
                .memberSince(memberSince)
                .totalBookings(totalBookings)
                .confirmedBookings(confirmed)
                .cancelledBookings(cancelled)
                .totalSpent(totalSpent)
                .totalCarbonPoints(carbonPoints)
                .fullName(fullName)
                .age(age)
                .gender(gender)
                .phone(phone)
                .build();
    }
}
