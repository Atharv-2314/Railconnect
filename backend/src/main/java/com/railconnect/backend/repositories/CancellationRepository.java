package com.railconnect.backend.repositories;

import com.railconnect.backend.entities.Cancellation;
import com.railconnect.backend.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CancellationRepository extends JpaRepository<Cancellation, Long> {
    Optional<Cancellation> findByTicket(Ticket ticket);
    java.util.List<Cancellation> findByRefundStatusOrderByCancellationDateAsc(String refundStatus);
}
