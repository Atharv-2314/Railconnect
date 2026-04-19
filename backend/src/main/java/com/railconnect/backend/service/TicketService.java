package com.railconnect.backend.service;

import com.railconnect.backend.dto.TicketDetailDto;
import com.railconnect.backend.entities.*;
import com.railconnect.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final AppUserRepository appUserRepository;
    private final TicketRepository ticketRepository;
    private final SeatAllocationRepository seatAllocationRepository;
    private final TicketPassengerRepository ticketPassengerRepository;
    private final CarbonLogRepository carbonLogRepository;
    private final CancellationRepository cancellationRepository;
    private final JdbcTemplate jdbcTemplate;

    @SuppressWarnings("null")
    public List<TicketDetailDto> getTicketsForUser(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Ticket> tickets = ticketRepository.findByUser(user);
        return tickets.stream()
                .map(t -> buildDetail(t, user))
                .collect(Collectors.toList());
    }

    @SuppressWarnings("null")
    public TicketDetailDto getTicketById(Long ticketId, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        // Verify ownership (admins bypass this check via role, but service-layer ensures passenger sees only their ticket)
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!ticket.getUser().getUserId().equals(userId) && !"ADMIN".equals(user.getRole())) {
            throw new RuntimeException("Access denied");
        }
        return buildDetail(ticket, ticket.getUser());
    }

    @Transactional
    @SuppressWarnings("null")
    public TicketDetailDto cancelTicket(Long ticketId, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if ("CANCELLED".equals(ticket.getStatus())) {
            throw new RuntimeException("Ticket is already cancelled.");
        }

        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!ticket.getUser().getUserId().equals(userId) && !"ADMIN".equals(user.getRole())) {
            throw new RuntimeException("Access denied: You can only cancel your own tickets");
        }

        // Delegate entire Cancellation, Refund, Waitlist Cursor Loop to Stored Function
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT * FROM fn_cancel_ticket(?, ?)",
            ticketId,
            user.getUserId()
        );

        String errorMsg = (rows != null && !rows.isEmpty()) ? (String) rows.get(0).get("p_err_msg") : null;

        if (errorMsg != null) {
            throw new RuntimeException("Cancellation Failed by DBMS: " + errorMsg);
        }

        // Reload fresh state from DB (since function updated it)
        Ticket updatedTicket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket missing after cancellation"));

        TicketDetailDto result = buildDetail(updatedTicket, updatedTicket.getUser());
        double refund = result.getRefundAmount() != null ? result.getRefundAmount() : (ticket.getTotalFare() != null ? ticket.getTotalFare() * 0.8 : 0);
        result.setMessage(String.format("Ticket cancelled successfully! Refund of ₹%.2f has been initiated.", refund));
        return result;
    }

    /** Returns auto-promoted waitlist tickets the user hasn't seen yet. */
    @SuppressWarnings("null")
    public List<TicketDetailDto> getUnnotifiedTickets(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Ticket> unnotified = ticketRepository.findByUserAndIsNotifiedFalse(user);
        return unnotified.stream()
                .map(t -> buildDetail(t, user))
                .collect(Collectors.toList());
    }

    /** Marks a promoted ticket as acknowledged so it doesn't show in the notification again. */
    @Transactional
    @SuppressWarnings("null")
    public void acknowledgeTicket(Long ticketId, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        if (!ticket.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        ticket.setIsNotified(true);
        ticketRepository.save(ticket);
    }

    private TicketDetailDto buildDetail(Ticket ticket, AppUser user) {
        Schedule schedule = ticket.getSchedule();
        Route route = schedule.getRoute();
        Train train = schedule.getTrain();

        // Resolved Station names from route stations list
        List<RouteStation> stations = route.getRouteStations();
        String source = "NDLS"; // Fallback
        String dest = "MUMBAI"; // Fallback

        if (stations != null && !stations.isEmpty()) {
            // Sort by stop number
            List<RouteStation> sorted = stations.stream()
                .sorted((a, b) -> a.getStopNumber().compareTo(b.getStopNumber()))
                .collect(java.util.stream.Collectors.toList());
            
            source = sorted.get(0).getStation().getStationName();
            dest = sorted.get(sorted.size() - 1).getStation().getStationName();
        }
        String routeName = route.getRouteName() != null ? route.getRouteName() : "—";

        // Carbon points sum for this ticket
        int carbonPoints = carbonLogRepository.findByUser(user).stream()
                .filter(cl -> cl.getTicket().getTicketId().equals(ticket.getTicketId()))
                .mapToInt(cl -> cl.getPointsEarned() != null ? cl.getPointsEarned() : 0)
                .sum();

        // Seat allocations → build SeatInfo with passenger data
        List<SeatAllocation> allocations = seatAllocationRepository.findByTicket(ticket);
        List<TicketPassenger> tps = ticketPassengerRepository.findByTicket(ticket);

        List<TicketDetailDto.SeatInfo> seatInfos = new ArrayList<>();
        for (int i = 0; i < allocations.size(); i++) {
            SeatAllocation alloc = allocations.get(i);
            Seat seat = alloc.getSeat();
            String label = "C" + seat.getCoachNumber() + "-S" + seat.getSeatNumber();

            // Match passenger positionally (they were inserted in same order)
            String pName = "—";
            Integer pAge = null;
            String pGender = "—";
            if (i < tps.size()) {
                Passenger p = tps.get(i).getPassenger();
                pName = p.getName();
                pAge = p.getAge();
                pGender = p.getGender();
            }

            seatInfos.add(TicketDetailDto.SeatInfo.builder()
                    .seatLabel(label)
                    .seatClass(seat.getSeatClass())
                    .passengerName(pName)
                    .passengerAge(pAge)
                    .passengerGender(pGender)
                    .build());
        }

        // Refund info (if cancelled)
        Double refundAmount = null;
        String cancellationDate = null;
        String refundStatus = null;
        if ("CANCELLED".equals(ticket.getStatus())) {
            var cancOpt = cancellationRepository.findByTicket(ticket);
            if (cancOpt.isPresent()) {
                Cancellation c = cancOpt.get();
                refundAmount = c.getRefundAmount();
                refundStatus = c.getRefundStatus();
                if (c.getCancellationDate() != null) {
                    cancellationDate = c.getCancellationDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"));
                }
            }
        }

        return TicketDetailDto.builder()
                .ticketId(ticket.getTicketId())
                .pnrNumber(ticket.getPnrNumber())
                .status(ticket.getStatus())
                .totalFare(ticket.getTotalFare())
                .bookingTime(ticket.getBookingTime() != null
                    ? ticket.getBookingTime().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")) : "—")
                .trainName(train.getTrainName())
                .trainNumber(train.getTrainNumber())
                .routeName(routeName)
                .journeyDate(schedule.getJourneyDate())
                .departureTime(schedule.getDepartureDatetime() != null
                    ? schedule.getDepartureDatetime().format(DateTimeFormatter.ofPattern("HH:mm")) : "—")
                .arrivalTime(schedule.getArrivalDatetime() != null
                    ? schedule.getArrivalDatetime().format(DateTimeFormatter.ofPattern("HH:mm")) : "—")
                .sourceStation(source)
                .destinationStation(dest)
                .carbonPointsEarned(carbonPoints)
                .seats(seatInfos)
                .refundAmount(refundAmount)
                .refundStatus(refundStatus)
                .cancellationDate(cancellationDate)
                .build();
    }
}
