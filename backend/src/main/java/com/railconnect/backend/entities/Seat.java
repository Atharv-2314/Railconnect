package com.railconnect.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Seat", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"schedule_id", "coach_number", "seat_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seat_id")
    private Long seatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(name = "coach_number", nullable = false)
    private Integer coachNumber;

    @Column(name = "seat_number", nullable = false)
    private Integer seatNumber;

    @Column(name = "class")
    private String seatClass; // 'class' is a reserved Java keyword; mapped to DB column 'class'

    @Column(columnDefinition = "VARCHAR(20) DEFAULT 'AVAILABLE'")
    private String status;
}
