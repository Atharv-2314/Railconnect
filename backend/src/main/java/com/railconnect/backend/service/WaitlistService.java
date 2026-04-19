package com.railconnect.backend.service;

import com.railconnect.backend.dto.*;
import com.railconnect.backend.entities.*;
import com.railconnect.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WaitlistService {

    private final WaitlistQueueRepository waitlistQueueRepository;
    private final ScheduleRepository scheduleRepository;
    private final PassengerRepository passengerRepository;
    private final AppUserRepository appUserRepository;

    /**
     * Join the waitlist for a schedule. Creates an ad-hoc passenger if needed.
     */
    @Transactional
    @SuppressWarnings("null")
    public String joinWaitlist(WaitlistRequest req, String username) {
        Schedule schedule = scheduleRepository.findById(req.getScheduleId())
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        // Find or create passenger
        Passenger passenger;
        if (req.getPassengerId() != null) {
            passenger = passengerRepository.findById(req.getPassengerId())
                    .orElseThrow(() -> new RuntimeException("Passenger not found"));
        } else {
            // Create ad-hoc passenger linked to the logged-in user
            AppUser user = appUserRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Try to find the user's existing primary passenger record first
            List<Passenger> existing = passengerRepository.findByUser(user);
            if (!existing.isEmpty()) {
                passenger = existing.get(0);
            } else {
                passenger = passengerRepository.save(Passenger.builder()
                        .user(user)
                        .name(req.getPassengerName() != null ? req.getPassengerName() : username)
                        .age(req.getPassengerAge())
                        .gender(req.getPassengerGender())
                        .build());
            }
        }

        // Determine next position
        int nextPosition = waitlistQueueRepository.findByScheduleOrderByPositionAsc(schedule).size() + 1;

        WaitlistQueue entry = WaitlistQueue.builder()
                .schedule(schedule)
                .passenger(passenger)
                .position(nextPosition)
                .build();

        waitlistQueueRepository.save(entry);

        return String.format("Added to waitlist at position #%d. You will be notified when a seat becomes available.", nextPosition);
    }

    /**
     * Get all waitlist entries for a schedule (admin view).
     */
    @SuppressWarnings("null")
    public List<WaitlistEntryDto> getWaitlistForSchedule(Long scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        return waitlistQueueRepository.findByScheduleOrderByPositionAsc(schedule).stream()
                .map(w -> WaitlistEntryDto.builder()
                        .waitlistId(w.getWaitlistId())
                        .position(w.getPosition())
                        .passengerName(w.getPassenger().getName())
                        .passengerAge(w.getPassenger().getAge())
                        .passengerGender(w.getPassenger().getGender())
                        .joinedAt(w.getCreatedAt() != null
                                ? w.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"))
                                : "—")
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get all schedules that have at least one waitlisted passenger (admin overview).
     */
    public List<java.util.Map<String, Object>> getSchedulesWithWaitlist() {
        return scheduleRepository.findAll().stream()
                .filter(s -> {
                    List<WaitlistQueue> wl = waitlistQueueRepository.findByScheduleOrderByPositionAsc(s);
                    return !wl.isEmpty();
                })
                .map(s -> {
                    List<WaitlistQueue> wl = waitlistQueueRepository.findByScheduleOrderByPositionAsc(s);
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("scheduleId", s.getScheduleId());
                    m.put("trainNumber", s.getTrain().getTrainNumber());
                    m.put("trainName", s.getTrain().getTrainName());
                    m.put("journeyDate", s.getJourneyDate());
                    m.put("routeName", s.getRoute().getRouteName());
                    m.put("waitlistCount", wl.size());
                    return m;
                })
                .collect(Collectors.toList());
    }
}
