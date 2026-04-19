package com.railconnect.backend.repositories;

import com.railconnect.backend.entities.Ticket;
import com.railconnect.backend.entities.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Optional<Ticket> findByPnrNumber(String pnrNumber);
    List<Ticket> findByUser(AppUser user);

    // --- Anti-Scalper: tickets not yet shown as notification to the user ---
    List<Ticket> findByUserAndIsNotifiedFalse(AppUser user);

    // --- Velocity Limit: count seats booked by this user in the last N minutes ---
    @Query("""
        SELECT COALESCE(SUM(SIZE(sa)), 0)
        FROM Ticket t JOIN t.seatAllocations sa
        WHERE t.user = :user
          AND t.status != 'CANCELLED'
          AND t.bookingTime >= :since
    """)
    Long countRecentSeatsByUser(@Param("user") AppUser user, @Param("since") LocalDateTime since);

    // --- Identity Lock: check if a gov_id already has an ACTIVE booking on the same journey date ---
    @Query("""
        SELECT COUNT(t) > 0
        FROM Ticket t
        JOIN t.seatAllocations sa
        JOIN TicketPassenger tp ON tp.ticket = t
        JOIN tp.passenger p
        WHERE p.govId = :govId
          AND t.schedule.journeyDate = :journeyDate
          AND t.status != 'CANCELLED'
    """)
    boolean existsActiveBookingForGovIdOnDate(@Param("govId") String govId,
                                               @Param("journeyDate") LocalDate journeyDate);
}
