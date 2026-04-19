package com.railconnect.backend.service;

import com.railconnect.backend.dto.BookingRequest;
import com.railconnect.backend.dto.BookingResponse;
import com.railconnect.backend.entities.*;
import com.railconnect.backend.exception.CustomConcurrencyException;
import com.railconnect.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final AppUserRepository appUserRepository;
    private final ScheduleRepository scheduleRepository;
    private final RefundRetryService refundRetryService;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Transactional // High-level isolation boundary (READ_COMMITTED) wrapper for SP
    @SuppressWarnings("null")
    public BookingResponse bookTicket(BookingRequest request) {
        
        AppUser user = appUserRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (request.getSeatIds() == null || request.getSeatIds().isEmpty() || request.getSeatIds().size() != request.getPassengers().size()) {
            throw new RuntimeException("Mismatch between selected seats and passenger count.");
        }

        // 1. Serialize Passengers to JSONB
        String tempPassengersJson;
        try {
            tempPassengersJson = objectMapper.writeValueAsString(request.getPassengers());
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize passengers payload", e);
        }
        final String passengersJson = tempPassengersJson;

        // 2. Comma-separated Seat IDs
        final String seatIdsCSV = request.getSeatIds().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        // 3. Delegate ALL complex logic into Stored Function (Locks, Limit, Fares)
        String sql = "SELECT * FROM fn_book_ticket(?, ?, ?, ?)";
        
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            sql,
            user.getUserId(),
            schedule.getScheduleId(),
            seatIdsCSV,
            passengersJson
        );

        if (rows == null || rows.isEmpty()) {
            throw new RuntimeException("Function execution failed: No result");
        }

        Map<String, Object> resultRow = rows.get(0);
        String pnr = (String) resultRow.get("p_pnr");
        String errorMsg = (String) resultRow.get("p_err_msg");

        if (errorMsg != null) {
            // SP enforces Rules: Scale-limit, Identify check, locks
            if (errorMsg.contains("concurrency")) {
                throw new CustomConcurrencyException(errorMsg);
            }
            throw new RuntimeException(errorMsg);
        }

        // Extract fare and carbon points directly from DB Function result
        double totalFare = 0.0;
        int carbonPoints = 0;
        if (resultRow.get("p_total_fare") != null) {
            totalFare = ((Number) resultRow.get("p_total_fare")).doubleValue();
        }
        if (resultRow.get("p_carbon_points") != null) {
            carbonPoints = ((Number) resultRow.get("p_carbon_points")).intValue();
        }

        // 4. Fallback execution for unrelated services
        try {
            refundRetryService.retryPendingRefunds();
        } catch (Exception e) {
            // Ignored
        }

        return BookingResponse.builder()
                .pnrNumber(pnr)
                .status("CONFIRMED")
                .totalFare(totalFare)
                .allocatedSeats(List.of("Details stored securely in DBMS"))
                .carbonPointsEarned(carbonPoints)
                .message("Booking completed successfully via DBMS engine!")
                .build();
    }
}
