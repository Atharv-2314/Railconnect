package com.railconnect.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "Ticket")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "pnr_number", unique = true, nullable = false)
    private String pnrNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(name = "booking_time",
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            insertable = false, updatable = false)
    private LocalDateTime bookingTime;

    @Column(columnDefinition = "VARCHAR(20) DEFAULT 'BOOKED'")
    private String status;

    @Column(name = "total_fare")
    private Double totalFare;

    @Column(name = "is_notified", columnDefinition = "BOOLEAN DEFAULT TRUE")
    @Builder.Default
    private Boolean isNotified = true;  // FALSE for auto-promoted waitlist tickets until user sees them

    @OneToMany(mappedBy = "ticket", fetch = FetchType.LAZY)
    @ToString.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<SeatAllocation> seatAllocations;
}
