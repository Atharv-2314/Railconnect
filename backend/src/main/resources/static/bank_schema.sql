-- =============================================================
-- PHASES 18–24: RAILCONNECT BANK SYSTEM SCHEMA
-- Idempotent — safe to re-run on every application restart.
-- =============================================================

-- Phase 18: Central bank account table
CREATE TABLE IF NOT EXISTS bank_account (
    account_id BIGINT PRIMARY KEY,
    balance    NUMERIC(15,2) NOT NULL DEFAULT 0
);

-- Seed with 1 lakh initial operational float (skip if already seeded)
INSERT INTO bank_account (account_id, balance)
VALUES (1, 100000.00)
ON CONFLICT (account_id) DO NOTHING;

-- Phase 18: Add refund_status to Cancellation (idempotent)
ALTER TABLE Cancellation
    ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED';

-- Phase 23: Pending refunds monitoring view
CREATE OR REPLACE VIEW pending_refunds_view AS
SELECT
    c.cancellation_id,
    t.pnr_number,
    u.username,
    c.refund_amount,
    c.refund_status,
    c.cancellation_date
FROM Cancellation c
JOIN Ticket   t ON t.ticket_id = c.ticket_id
JOIN App_User u ON u.user_id   = t.user_id
WHERE c.refund_status = 'PENDING'
ORDER BY c.cancellation_date ASC;

-- Phase 24: Bank balance convenience view
CREATE OR REPLACE VIEW bank_balance_view AS
SELECT
    account_id,
    balance
FROM bank_account;
