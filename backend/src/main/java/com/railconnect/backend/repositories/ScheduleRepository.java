package com.railconnect.backend.repositories;

import com.railconnect.backend.entities.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByJourneyDate(LocalDate journeyDate);

    @Query(value = """
            SELECT DISTINCT s.* FROM Schedule s
            JOIN Route_Station rs1 ON s.route_id = rs1.route_id
            JOIN Station st1 ON rs1.station_id = st1.station_id
            JOIN Route_Station rs2 ON s.route_id = rs2.route_id
            JOIN Station st2 ON rs2.station_id = st2.station_id
            WHERE (st1.station_code = :sourceCode OR UPPER(st1.city) LIKE '%' || :sourceCode || '%')
              AND (st2.station_code = :destCode OR UPPER(st2.city) LIKE '%' || :destCode || '%')
              AND rs1.stop_number < rs2.stop_number
              AND s.journey_date = :date
            """, nativeQuery = true)
    List<Schedule> findSchedulesBySourceDestAndDate(
            @Param("sourceCode") String sourceCode,
            @Param("destCode") String destCode,
            @Param("date") LocalDate date);

    @Query(value = """
            SELECT DISTINCT s.* FROM Schedule s
            JOIN Route_Station rs1 ON s.route_id = rs1.route_id
            JOIN Station st1 ON rs1.station_id = st1.station_id
            JOIN Route_Station rs2 ON s.route_id = rs2.route_id
            JOIN Station st2 ON rs2.station_id = st2.station_id
            WHERE (st1.station_code = :sourceCode OR UPPER(st1.city) LIKE '%' || :sourceCode || '%')
              AND (st2.station_code = :destCode OR UPPER(st2.city) LIKE '%' || :destCode || '%')
              AND rs1.stop_number < rs2.stop_number
            """, nativeQuery = true)
    List<Schedule> findSchedulesBySourceDest(
            @Param("sourceCode") String sourceCode,
            @Param("destCode") String destCode);
}
