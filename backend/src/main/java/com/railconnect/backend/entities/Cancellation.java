package com.railconnect.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Cancellation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cancellation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cancellation_id")
    private Long cancellationId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", unique = true, nullable = false)
    private Ticket ticket;

    @Column(name = "cancellation_date",
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            insertable = false, updatable = false)
    private LocalDateTime cancellationDate;

    @Column(name = "refund_amount")
    private Double refundAmount;

    @Column(name = "refund_status", length = 20)
    private String refundStatus;
}
