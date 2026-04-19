package com.railconnect.backend.repositories;

import com.railconnect.backend.entities.WaitlistQueue;
import com.railconnect.backend.entities.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WaitlistQueueRepository extends JpaRepository<WaitlistQueue, Long> {
    List<WaitlistQueue> findByScheduleOrderByPositionAsc(Schedule schedule);
}
