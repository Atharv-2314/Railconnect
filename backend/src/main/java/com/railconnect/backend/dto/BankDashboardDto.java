package com.railconnect.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankDashboardDto {
    private BigDecimal currentBalance;
    private Double totalEarnings;
    private Double totalRefunds;
    private Long pendingRefundsCount;
}
