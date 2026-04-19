package com.railconnect.backend.repositories;

import com.railconnect.backend.entities.SeatAllocation;
import com.railconnect.backend.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SeatAllocationRepository extends JpaRepository<SeatAllocation, Long> {
    List<SeatAllocation> findByTicket(Ticket ticket);
}
