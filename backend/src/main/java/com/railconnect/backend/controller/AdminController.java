package com.railconnect.backend.controller;

import com.railconnect.backend.dto.*;
import com.railconnect.backend.entities.Route;
import com.railconnect.backend.entities.Schedule;
import com.railconnect.backend.entities.Station;
import com.railconnect.backend.entities.Train;
import com.railconnect.backend.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AuthService authService;
    private final AdminService adminService;
    private final AnalyticsService analyticsService;
    private final BankService bankService;
    private final WaitlistService waitlistService;

    @PostMapping("/create-admin")
    public ResponseEntity<AuthResponse> createAdmin(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.createAdmin(request));
    }

    @PostMapping("/trains")
    public ResponseEntity<Train> createTrain(@RequestBody Train train) {
        return ResponseEntity.ok(adminService.saveTrain(train));
    }

    @PostMapping("/routes")
    public ResponseEntity<Route> createRoute(@RequestBody Route route) {
        return ResponseEntity.ok(adminService.saveRoute(route));
    }

    @PostMapping("/schedules")
    public ResponseEntity<Schedule> createSchedule(@RequestBody ScheduleCreationRequest request) {
        return ResponseEntity.ok(adminService.createSchedule(request));
    }

    // ── Station Management ────────────────────────────────────────────────────

    @GetMapping("/stations")
    public ResponseEntity<List<Station>> getAllStations() {
        return ResponseEntity.ok(adminService.getAllStations());
    }

    @PostMapping("/stations")
    public ResponseEntity<Station> createStation(@RequestBody Station station) {
        return ResponseEntity.ok(adminService.saveStation(station));
    }

    @PostMapping("/routes/map-stations")
    public ResponseEntity<Map<String, String>> mapRouteStations(@RequestBody RouteStationRequest request) {
        String msg = adminService.mapRouteStations(request);
        return ResponseEntity.ok(Map.of("message", msg));
    }

    // ── Analytics ────────────────────────────────────────────────────────────

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsDto> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }

    // ── Bank & Refunds ───────────────────────────────────────────────────────

    @GetMapping("/bank")
    public ResponseEntity<BankDashboardDto> getBankDashboard() {
        return ResponseEntity.ok(bankService.getBankDashboard());
    }

    @GetMapping("/refunds/pending")
    public ResponseEntity<List<PendingRefundDto>> getPendingRefunds() {
        return ResponseEntity.ok(bankService.getPendingRefunds());
    }

    @PostMapping("/refunds/retry/{id}")
    public ResponseEntity<?> retryRefund(@PathVariable Long id) {
        boolean success = bankService.triggerManualRefundRetry(id);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Refund processed successfully."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Insufficient bank funds to process refund right now."));
        }
    }

    @GetMapping("/bank/balance")
    public ResponseEntity<?> getBankBalance() {
        return ResponseEntity.ok(Map.of(
            "accountId", 1L,
            "balance", bankService.getBankDashboard().getCurrentBalance()
        ));
    }

    // ── Waitlist Management ──────────────────────────────────────────────────

    @GetMapping("/waitlist")
    public ResponseEntity<List<Map<String, Object>>> getSchedulesWithWaitlist() {
        return ResponseEntity.ok(waitlistService.getSchedulesWithWaitlist());
    }

    @GetMapping("/waitlist/{scheduleId}")
    public ResponseEntity<List<WaitlistEntryDto>> getWaitlistForSchedule(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(waitlistService.getWaitlistForSchedule(scheduleId));
    }
}

