package com.railconnect.backend.repositories;

import com.railconnect.backend.entities.CarbonLog;
import com.railconnect.backend.entities.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CarbonLogRepository extends JpaRepository<CarbonLog, Long> {
    List<CarbonLog> findByUser(AppUser user);
}
