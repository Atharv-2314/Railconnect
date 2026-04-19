package com.railconnect.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Passenger")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Passenger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "passenger_id")
    private Long passengerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false)
    private String name;

    private Integer age;
    private String gender;
    private String phone;

    @Column(name = "gov_id", length = 20)
    private String govId;  // Aadhaar or PAN — used for Anti-Scalper identity check
}
