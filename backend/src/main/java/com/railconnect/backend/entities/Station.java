package com.railconnect.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Station")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Station {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "station_id")
    private Long stationId;

    @Column(name = "station_code", unique = true, nullable = false)
    private String stationCode;

    @Column(name = "station_name", nullable = false)
    private String stationName;

    private String city;
    private String state;
}
