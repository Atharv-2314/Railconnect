package com.railconnect.backend.service;

import com.railconnect.backend.dto.BankDashboardDto;
import com.railconnect.backend.dto.PendingRefundDto;
import com.railconnect.backend.entities.BankAccount;
import com.railconnect.backend.entities.Cancellation;
import com.railconnect.backend.repositories.BankAccountRepository;
import com.railconnect.backend.repositories.CancellationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BankService {

    private final BankAccountRepository bankAccountRepository;
    private final CancellationRepository cancellationRepository;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Credit the bank on successful booking.
     */
    @Transactional
    public void creditBank(Double amount) {
        BankAccount bank = bankAccountRepository.findByIdForUpdate(1L)
                .orElseThrow(() -> new RuntimeException("Bank account not found. Is it initialized?"));
        
        bank.setBalance(bank.getBalance().add(BigDecimal.valueOf(amount)));
        bankAccountRepository.save(bank);
        log.info("Bank credited by {}. New balance: {}", amount, bank.getBalance());
    }

    /**
     * Determine refund status on cancellation.
     * Check if bank has enough balance; if so, deduct and RETURN 'COMPLETED'.
     * Otherwise, RETURN 'PENDING'.
     */
    @Transactional
    public String processRefund(Double refundAmount) {
        BankAccount bank = bankAccountRepository.findByIdForUpdate(1L)
                .orElseThrow(() -> new RuntimeException("Bank account not found"));

        BigDecimal amount = BigDecimal.valueOf(refundAmount);
        if (bank.getBalance().compareTo(amount) >= 0) {
            bank.setBalance(bank.getBalance().subtract(amount));
            bankAccountRepository.save(bank);
            log.info("Refund of {} processed. New balance: {}", amount, bank.getBalance());
            return "COMPLETED";
        } else {
            log.warn("Insufficient funds for refund. Amount: {}, Balance: {}. Marking as PENDING.", amount, bank.getBalance());
            return "PENDING";
        }
    }

    /**
     * Used by RefundRetryService to attempt processing a pending refund.
     * Returns true if successfully processed and deducted.
     */
    @Transactional
    public boolean attemptPendingRefund(Cancellation cancellation) {
        BankAccount bank = bankAccountRepository.findByIdForUpdate(1L)
                .orElseThrow(() -> new RuntimeException("Bank account not found"));

        BigDecimal amount = BigDecimal.valueOf(cancellation.getRefundAmount());
        if (bank.getBalance().compareTo(amount) >= 0) {
            bank.setBalance(bank.getBalance().subtract(amount));
            bankAccountRepository.save(bank);
            
            cancellation.setRefundStatus("COMPLETED");
            cancellationRepository.save(cancellation);
            
            log.info("Pending refund mapped to cancellation {} processed. New balance: {}", cancellation.getCancellationId(), bank.getBalance());
            return true;
        }
        return false;
    }

    /**
     * Phase 21 & 24 Analytics / Dashboard
     */
    public BankDashboardDto getBankDashboard() {
        // Query from DB views + simple queries
        BigDecimal balance = bankAccountRepository.findById(1L)
                .map(BankAccount::getBalance)
                .orElse(BigDecimal.ZERO);

        Double totalEarnings = jdbcTemplate.queryForObject("SELECT COALESCE(SUM(amount), 0) FROM payment WHERE status = 'SUCCESS'", Double.class);
        Double totalRefunds = jdbcTemplate.queryForObject("SELECT COALESCE(SUM(refund_amount), 0) FROM cancellation WHERE refund_status = 'COMPLETED'", Double.class);
        Long pendingRefundsCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM cancellation WHERE refund_status = 'PENDING'", Long.class);

        return BankDashboardDto.builder()
                .currentBalance(balance)
                .totalEarnings(totalEarnings != null ? totalEarnings : 0.0)
                .totalRefunds(totalRefunds != null ? totalRefunds : 0.0)
                .pendingRefundsCount(pendingRefundsCount != null ? pendingRefundsCount : 0L)
                .build();
    }

    /**
     * Phase 23 Pending Refunds Portal
     */
    public List<PendingRefundDto> getPendingRefunds() {
        return jdbcTemplate.query("""
            SELECT cancellation_id, pnr_number, username, refund_amount, refund_status, cancellation_date::TEXT
            FROM pending_refunds_view
            """,
            (rs, rowNum) -> PendingRefundDto.builder()
                    .cancellationId(rs.getLong("cancellation_id"))
                    .pnrNumber(rs.getString("pnr_number"))
                    .username(rs.getString("username"))
                    .refundAmount(rs.getDouble("refund_amount"))
                    .refundStatus(rs.getString("refund_status"))
                    .cancellationDate(rs.getString("cancellation_date"))
                    .build()
        );
    }

    /**
     * Phase 23 admin manual retry
     */
    @SuppressWarnings("null")
    public boolean triggerManualRefundRetry(Long cancellationId) {
        Cancellation cancellation = cancellationRepository.findById(cancellationId)
                .orElseThrow(() -> new RuntimeException("Cancellation not found"));
        if (!"PENDING".equals(cancellation.getRefundStatus())) {
            throw new RuntimeException("This refund is already COMPLETED.");
        }
        return attemptPendingRefund(cancellation);
    }
}
