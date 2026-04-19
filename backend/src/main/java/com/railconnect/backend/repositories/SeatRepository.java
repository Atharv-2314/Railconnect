package com.railconnect.backend.repositories;

import com.railconnect.backend.entities.Seat;
import com.railconnect.backend.entities.Schedule;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findBySchedule(Schedule schedule);
    List<Seat> findBySchedule_ScheduleId(Long scheduleId);
    
    List<Seat> findByScheduleAndStatus(Schedule schedule, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Seat s WHERE s.schedule = :schedule AND s.status = :status AND s.seatClass = :seatClass")
    List<Seat> findLockedAvailableSeats(
            @Param("schedule") Schedule schedule,
            @Param("status") String status,
            @Param("seatClass") String seatClass
    );
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Seat s WHERE s.seatId = :seatId")
    Optional<Seat> findByIdForUpdate(@Param("seatId") Long seatId);
}
