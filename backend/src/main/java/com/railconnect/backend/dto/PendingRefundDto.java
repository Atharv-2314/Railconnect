package com.railconnect.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingRefundDto {
    private Long cancellationId;
    private String pnrNumber;
    private String username;
    private Double refundAmount;
    private String refundStatus;
    private String cancellationDate;
}
