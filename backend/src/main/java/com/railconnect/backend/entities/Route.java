package com.railconnect.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "Route")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "route_id")
    private Long routeId;

    @Column(name = "route_name")
    private String routeName;

    @Column(name = "total_distance")
    private Double totalDistance;

    @OneToMany(mappedBy = "route", fetch = FetchType.LAZY)
    @ToString.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<RouteStation> routeStations;
}
