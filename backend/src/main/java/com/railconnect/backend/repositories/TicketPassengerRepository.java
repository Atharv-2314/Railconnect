package com.railconnect.backend.repositories;

import com.railconnect.backend.entities.Ticket;
import com.railconnect.backend.entities.TicketPassenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketPassengerRepository extends JpaRepository<TicketPassenger, TicketPassenger.TicketPassengerId> {
    List<TicketPassenger> findByTicket(Ticket ticket);
}
