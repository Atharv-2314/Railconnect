package com.railconnect.backend.service;

import com.railconnect.backend.entities.AppUser;
import com.railconnect.backend.entities.CarbonLog;
import com.railconnect.backend.entities.Ticket;
import com.railconnect.backend.repositories.CarbonLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RewardService {

    private final CarbonLogRepository carbonLogRepository;

    @Transactional
    @SuppressWarnings("null")
    public Integer calculateAndLogCarbonPoints(AppUser user, Ticket ticket, Double distance) {
        // Simple logic: 1 point per 10km travelled per ticket
        int points = 0;
        if (distance != null && distance > 0) {
            points = (int) (distance / 10.0);
        }

        CarbonLog log = CarbonLog.builder()
                .user(user)
                .ticket(ticket)
                .pointsEarned(points)
                .build();

        carbonLogRepository.save(log);
        return points;
    }

    @Transactional
    @SuppressWarnings("null")
    public void deductCarbonPoints(AppUser user, Ticket ticket, int pointsToDeduct) {
        if (pointsToDeduct <= 0) return;

        // Ensure user has enough points (sum of all pointsEarned for this user)
        Integer currentBalance = carbonLogRepository.findByUser(user).stream()
                .mapToInt(cl -> cl.getPointsEarned() != null ? cl.getPointsEarned() : 0)
                .sum();

        if (currentBalance < pointsToDeduct) {
            // Throw exception or cap at currentBalance? 
            // Better to cap at currentBalance to avoid 500 in booking if UI allows mismatch
            pointsToDeduct = Math.max(0, currentBalance);
        }
        
        if (pointsToDeduct == 0) return;

        CarbonLog log = CarbonLog.builder()
                .user(user)
                .ticket(ticket)
                .pointsEarned(-pointsToDeduct) // Negative points to deduct
                .build();
        
        carbonLogRepository.save(log);
    }
}
