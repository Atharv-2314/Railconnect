package com.railconnect.backend.repositories;

import com.railconnect.backend.entities.RouteStation;
import com.railconnect.backend.entities.RouteStation.RouteStationId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RouteStationRepository extends JpaRepository<RouteStation, RouteStationId> {
}
