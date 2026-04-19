package com.railconnect.backend.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketDetailDto {
    private Long ticketId;
    private String pnrNumber;
    private String status;
    private Double totalFare;
    private String bookingTime;

    // Journey info
    private String trainName;
    private String trainNumber;
    private String routeName;
    private LocalDate journeyDate;
    private String departureTime;
    private String arrivalTime;
    private String sourceStation;
    private String destinationStation;

    // Carbon rewards
    private Integer carbonPointsEarned;

    // Seat allocations
    private List<SeatInfo> seats;

    // Refund (if cancelled)
    private Double refundAmount;
    private String refundStatus;
    private String cancellationDate;

    // Status message for UI display
    private String message;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatInfo {
        private String seatLabel;    // e.g. "C1-S12"
        private String seatClass;    // e.g. "2AC"
        private String passengerName;
        private Integer passengerAge;
        private String passengerGender;
    }
}
