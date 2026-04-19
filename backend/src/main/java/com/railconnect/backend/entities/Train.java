package com.railconnect.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Train")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Train {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "train_id")
    private Long trainId;

    @Column(name = "train_number", unique = true, nullable = false)
    private String trainNumber;

    @Column(name = "train_name", nullable = false)
    private String trainName;

    @Column(name = "train_type")
    private String trainType;

    private String status;

    @Column(name = "total_coaches")
    private Integer totalCoaches;
}
