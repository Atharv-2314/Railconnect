package com.railconnect.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;
import java.io.Serializable;

@Entity
@Table(name = "Route_Station")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStation {

    @EmbeddedId
    private RouteStationId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("routeId")
    @JoinColumn(name = "route_id")
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("stationId")
    @JoinColumn(name = "station_id")
    private Station station;

    @Column(name = "stop_number", nullable = false)
    private Integer stopNumber;

    @Column(name = "arrival_time")
    private LocalTime arrivalTime;

    @Column(name = "departure_time")
    private LocalTime departureTime;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class RouteStationId implements Serializable {
        @Column(name = "route_id")
        private Long routeId;

        @Column(name = "station_id")
        private Long stationId;
    }
}
