package com.railconnect.backend.service;

import com.railconnect.backend.dto.BookingPassengerDto;
import com.railconnect.backend.dto.BookingRequest;
import com.railconnect.backend.dto.BookingResponse;
import com.railconnect.backend.entities.*;
import com.railconnect.backend.exception.CustomConcurrencyException;
import com.railconnect.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final AppUserRepository appUserRepository;
    private final ScheduleRepository scheduleRepository;
    private final SeatRepository seatRepository;
    private final TicketRepository ticketRepository;
    private final SeatAllocationRepository seatAllocationRepository;
    private final PassengerRepository passengerRepository;
    private final TicketPassengerRepository ticketPassengerRepository;
    private final PaymentRepository paymentRepository;
    private final RewardService rewardService;
    private final BankService bankService;
    private final RefundRetryService refundRetryService;

    @Transactional // Uses READ_COMMITTED default; row-level pessimistic locks (SELECT FOR UPDATE) handle concurrency
    @SuppressWarnings("null")
    public BookingResponse bookTicket(BookingRequest request) {
        
        AppUser user = appUserRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (request.getSeatIds() == null || request.getSeatIds().isEmpty() || request.getSeatIds().size() != request.getPassengers().size()) {
            throw new RuntimeException("Mismatch between selected seats and passenger count.");
        }

        // ─── ANTI-SCALPER: FAMILY VELOCITY LIMIT (Rule of 6) ───────────────────────
        // Count all seats this user has successfully booked in the last 10 minutes
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
        Long recentSeats = ticketRepository.countRecentSeatsByUser(user, tenMinutesAgo);
        if (recentSeats == null) recentSeats = 0L;
        if (recentSeats + request.getSeatIds().size() > 6) {
            throw new RuntimeException(
                "Booking limit exceeded. Standard limit is 6 seats per 10 minutes to ensure fair access. " +
                "You have already booked " + recentSeats + " seat(s) in the last 10 minutes."
            );
        }

        // ─── ANTI-SCALPER: IDENTITY LOCK (One Person, One Seat per Journey Date) ──
        for (BookingPassengerDto rp : request.getPassengers()) {
            if (rp.getGovId() != null && !rp.getGovId().isBlank()) {
                boolean duplicate = ticketRepository.existsActiveBookingForGovIdOnDate(
                    rp.getGovId().trim(), schedule.getJourneyDate()
                );
                if (duplicate) {
                    throw new RuntimeException(
                        "Identity conflict: Gov ID '" + rp.getGovId() +
                        "' already has an active booking on " + schedule.getJourneyDate() +
                        ". One seat per journey date per identity is enforced."
                    );
                }
            }
        }

        // Generate PNR
        String pnr = "PNR" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Prepare Ticket
        Ticket ticket = Ticket.builder()
                .pnrNumber(pnr)
                .user(user)
                .schedule(schedule)
                .status("BOOKED")
                .totalFare(0.0) // Will calculate below
                .build();
        
        ticket = ticketRepository.save(ticket);

        List<String> allocatedSeatNames = new ArrayList<>();
        double totalFare = 0.0;

        // Process strictly requested seats
        for (int i = 0; i < request.getSeatIds().size(); i++) {
            Long requestedSeatId = request.getSeatIds().get(i);
            BookingPassengerDto rp = request.getPassengers().get(i);

            // SELECT FOR UPDATE locking explicit seat row.
            Seat assignedSeat = seatRepository.findByIdForUpdate(requestedSeatId)
                    .orElseThrow(() -> new RuntimeException("Seat ID not found: " + requestedSeatId));

            if (!"AVAILABLE".equals(assignedSeat.getStatus())) {
                throw new CustomConcurrencyException("Seat " + assignedSeat.getSeatClass() + "-" + assignedSeat.getSeatNumber() + " is already BOOKED by another user. Transaction aborted.");
            }

            assignedSeat.setStatus("BOOKED");
            seatRepository.save(assignedSeat);

            // Ad-hoc insert passenger (with gov_id for Anti-Scalper)
            Passenger passenger = Passenger.builder()
                    .user(user)
                    .name(rp.getName())
                    .age(rp.getAge())
                    .gender(rp.getGender())
                    .govId(rp.getGovId() != null ? rp.getGovId().trim() : null)
                    .build();
            passenger = passengerRepository.save(passenger);

            // Create Ticket_Passenger mapping
            TicketPassenger.TicketPassengerId tpId = new TicketPassenger.TicketPassengerId(ticket.getTicketId(), passenger.getPassengerId());
            TicketPassenger tp = TicketPassenger.builder()
                    .id(tpId)
                    .ticket(ticket)
                    .passenger(passenger)
                    .build();
            ticketPassengerRepository.save(tp);

            // Create allocation
            SeatAllocation allocation = SeatAllocation.builder()
                    .ticket(ticket)
                    .seat(assignedSeat)
                    .status("BOOKED")
                    .build();
            seatAllocationRepository.save(allocation);

            allocatedSeatNames.add("C" + assignedSeat.getCoachNumber() + "-S" + assignedSeat.getSeatNumber());
            
            // Logically map fare based on the specific physical seat tier grabbed
            totalFare += calculateFare(assignedSeat.getSeatClass(), schedule.getRoute().getTotalDistance());
        }

        // Phase 34: Calculate Carbon Point Discount
        double discountPercent = 0.0;
        if (request.getPointsUsed() != null && request.getPointsUsed() > 0) {
            discountPercent = Math.min((request.getPointsUsed() / 1000.0) * 5.0, 20.0);
            rewardService.deductCarbonPoints(user, ticket, request.getPointsUsed());
        }

        double finalFare = totalFare - (totalFare * discountPercent / 100.0);
        ticket.setTotalFare(finalFare);
        ticketRepository.save(ticket);

        // Phase 20 Simplification: Immediate logically true payment mapping
        Payment payment = Payment.builder()
                .ticket(ticket)
                .amount(finalFare)
                .paymentMode("CREDIT_CARD")
                .status("SUCCESS")
                .build();
        paymentRepository.save(payment);

        // Phase 18: Credit the central bank
        bankService.creditBank(finalFare);

        // Phase 19: Attempt pending refund settlement processing safely after crediting the bank
        try {
            refundRetryService.retryPendingRefunds();
        } catch (Exception e) {
            // Failure here must not rollback booking
        }

        // Assign reward points
        int points = rewardService.calculateAndLogCarbonPoints(user, ticket, schedule.getRoute().getTotalDistance());

        return BookingResponse.builder()
                .pnrNumber(pnr)
                .status("CONFIRMED")
                .totalFare(finalFare)
                .allocatedSeats(allocatedSeatNames)
                .carbonPointsEarned(points)
                .message("Booking completed and payment successful!")
                .build();
    }

    private double calculateFare(String seatClass, Double distance) {
        double dist = (distance != null && distance > 0) ? distance : 500.0;
        double multiplier = switch (seatClass) {
            case "1AC" -> 3.5;
            case "2AC" -> 2.0;
            case "3AC" -> 1.5;
            case "SL" -> 0.8;
            default -> 0.5;
        };
        return dist * multiplier;
    }
}
