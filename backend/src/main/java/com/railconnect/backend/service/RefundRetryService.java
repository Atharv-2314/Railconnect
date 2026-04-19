package com.railconnect.backend.service;

import com.railconnect.backend.entities.Cancellation;
import com.railconnect.backend.repositories.CancellationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefundRetryService {

    private final BankService bankService;
    private final CancellationRepository cancellationRepository;

    /**
     * Retry processing pending refunds every 5 minutes (or manual trigger).
     * Processes in FIFO order based on cancellationDate.
     */
    @Scheduled(fixedDelayString = "300000") // 5 mins
    public void retryPendingRefunds() {
        List<Cancellation> pendingRefunds = cancellationRepository.findByRefundStatusOrderByCancellationDateAsc("PENDING");
        if (pendingRefunds.isEmpty()) {
            return;
        }

        log.info("Starting auto-settlement engine for {} PENDING refunds.", pendingRefunds.size());

        for (Cancellation refund : pendingRefunds) {
            boolean success = false;
            try {
                success = bankService.attemptPendingRefund(refund);
            } catch (Exception e) {
                log.error("Failed to process refund for cancellation ID {}: {}", refund.getCancellationId(), e.getMessage());
            }

            if (!success) {
                // If it fails (due to insufficient balance), break the loop to maintain FIFO
                // and wait for the balance to grow in future bookings.
                log.info("Refund ID {} cannot be processed yet (insufficient funds). Halting auto-settlement queue.", refund.getCancellationId());
                break;
            }
        }
    }
}
