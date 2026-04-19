package com.railconnect.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "bank_account")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount {

    @Id
    @Column(name = "account_id")
    private Long accountId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance;
}
