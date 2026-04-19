package com.railconnect.backend.repositories;

import com.railconnect.backend.entities.AppUser;
import com.railconnect.backend.entities.Passenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PassengerRepository extends JpaRepository<Passenger, Long> {
    List<Passenger> findByUser(AppUser user);
}
