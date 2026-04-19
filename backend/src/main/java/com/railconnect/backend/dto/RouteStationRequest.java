package com.railconnect.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteStationRequest {
    private Long routeId;
    private Long station1Id;  // first stop
    private Long station2Id;  // last stop
}
