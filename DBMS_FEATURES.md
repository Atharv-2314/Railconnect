# RailConnect — Advanced DBMS Feature Catalog

This document is the official technical record of all advanced PostgreSQL constructs implemented in the RailConnect railway reservation system. These features demonstrate enterprise-grade database design patterns for academic evaluation.

> **Architecture Note**: All core business logic has been migrated from the Java service layer into the PostgreSQL database engine. The Spring Boot backend acts as a thin REST adapter, while the database enforces all business rules, constraints, and data integrity.

---

## 1. Stored Functions

### `fn_book_ticket(p_user_id, p_schedule_id, p_seat_ids, p_passengers_txt)`
**Purpose**: The core booking transaction engine.
- Parses passenger JSON payload natively in the DB.
- Calls `fn_is_eligible_for_booking` to enforce the anti-scalper rule.
- Loops over passenger records to verify Gov ID uniqueness on the journey date.
- Acquires pessimistic row-level locks using `SELECT FOR UPDATE NOWAIT`.
- Calls `fn_calculate_fare` to compute each seat's fare dynamically by class.
- Inserts into `Ticket`, `Passenger`, `Ticket_Passenger`, `Seat_Allocation`, `Payment`, and `Carbon_Log` atomically.
- Returns: `p_pnr`, `p_err_msg`, `p_total_fare`, `p_carbon_points`.

---

### `fn_cancel_ticket(p_ticket_id, p_user_id)`
**Purpose**: The cancellation, refund, and waitlist promotion engine.
- Acquires a lock on the ticket row using `SELECT FOR UPDATE`.
- Validates ownership and current status before allowing cancellation.
- Updates `Ticket`, `Payment`, `Seat_Allocation` status in a single transaction.
- Inserts a `Cancellation` record with 80% refund amount.
- Releases all seats back to `AVAILABLE`.
- Calls `sp_promote_batch_waitlist` to assign freed seats to waiting passengers.
- Returns: `p_err_msg` (NULL on success).

---

### `fn_is_eligible_for_booking(p_user_id, p_seat_count)`
**Purpose**: Anti-scalper velocity check (Business Rule Enforcement).
- Counts seats booked by the user in the past 10 minutes.
- Rejects bookings if total would exceed 6 seats per window.
- Returns: `BOOLEAN`.

---

### `fn_calculate_fare(p_route_distance, p_class)`
**Purpose**: Dynamic seat fare pricing engine.
- Applies class-specific multipliers (1AC=3.5x, 2AC=2.0x, 3AC=1.5x, SL=0.8x, etc.).
- Multiplies by route distance for a distance-based fare model.
- Returns: `NUMERIC` (fare amount in INR).

---

### `fn_calculate_carbon_discount(p_points, p_total_fare)`
**Purpose**: Green rewards discount calculation.
- Calculates a 5% discount per 1000 carbon points spent.
- Enforces a maximum 20% discount cap.
- Returns: `NUMERIC` (discount amount).

---

## 2. Stored Procedures (with Cursors)

### `sp_promote_batch_waitlist(p_schedule_id)`
**Purpose**: Automated waitlist management using dual CURSOR loops.
- **Cursor 1 (`v_waitlist_cursor`)**: Iterates through the `Waitlist_Queue` ordered by priority position.
- **Cursor 2 (`v_seat_cursor`)**: Iterates through available seats ordered by coach and seat number.
- Pairs each queued passenger with a freed seat and creates a full booking (Ticket, Allocation, Payment).
- Renumbers remaining waitlist queue after promotion.

---

### `sp_reconcile_wallets()`
**Purpose**: Batch audit of user carbon point balances using a CURSOR.
- **Cursor (`v_user_cursor`)**: Iterates over all `App_User` records.
- Checks each user's cumulative carbon points total.
- Logs anomalies (points > 10,000) into `system_audit_log` as JSONB records.

---

### `sp_process_refund_batch()`
**Purpose**: Batch refund processing using a CURSOR.
- **Cursor (`c_refund`)**: Iterates over all pending cancellations.
- Deducts refund amounts from the central `bank_account`.
- Updates each cancellation to `COMPLETED` status.

---

## 3. Triggers

### `trg_ticket_audit` → Function: `fn_trg_ticket_audit()`
- **Event**: `AFTER UPDATE ON Ticket`
- **Purpose**: Captures a full history snapshot of every ticket status change.
- Records `old_data` and `new_data` as `JSONB` into `system_audit_log`.

---

### `trg_passenger_audit` → Function: `fn_trg_passenger_audit()`
- **Event**: `AFTER INSERT OR UPDATE ON Passenger`
- **Purpose**: Security audit trail for all passenger record changes.
- Records `old_data` and `new_data` as `JSONB` into `system_audit_log`.

---

### `trg_waitlist_is_notified` → Function: `fn_trg_waitlist_notify()`
- **Event**: `BEFORE INSERT ON Ticket` (when `status = 'CONFIRMED'`)
- **Purpose**: Automatically sets `is_notified = FALSE` for waitlist-promoted tickets.
- Ensures the system can track which users have been notified of their promotion.

---

## 4. Views

### `v_live_occupancy`
- **Type**: Aggregation View
- **Columns**: `schedule_id`, `train_name`, `route_name`, `journey_date`, `total_seats`, `available_seats`, `occupancy_pct`
- **Purpose**: Real-time percentage-based occupancy tracking for every train schedule.

---

### `v_user_loyalty_summary`
- **Type**: Multi-table Join & Coalescing View
- **Columns**: `user_id`, `username`, `trips_taken`, `lifetime_points`
- **Purpose**: Consolidated view of each user's booking history and total carbon loyalty points.

---

### `v_route_performance`
- **Type**: Financial Analytics View
- **Columns**: `route_name`, `total_revenue`, `tickets_sold`
- **Purpose**: Revenue and sales performance reporting per train route.

---

## 5. Indexes

| Index Name | Column(s) | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `idx_ticket_pnr_unique` | `Ticket(pnr_number)` | **Unique** | Guarantees PNR uniqueness at the database level; enables O(1) PNR lookups. |
| `idx_seat_schedule_status` | `Seat(schedule_id, status)` | Composite | Accelerates seat availability searches during booking and concurrency checks. |
| `idx_passenger_gov_mapping` | `Passenger(gov_id)` | Partial | Filtered index (only where `gov_id IS NOT NULL`) for fast Gov ID uniqueness validation. |

---

## 6. Transactions & Concurrency Control

All core functions utilize **explicit transaction control** and **pessimistic locking**:

- **`SELECT FOR UPDATE NOWAIT`**: Acquires row-level locks on seats during booking to prevent race conditions. `NOWAIT` immediately returns an error instead of waiting, which allows fast failure and retry.
- **Atomic Blocks**: All `fn_book_ticket` database writes (7 table operations) occur inside a single implicit transaction block. An exception in any step rolls back all changes automatically.
- **Deadlock Prevention**: Seat locks are acquired in a deterministic order (by array index) to prevent circular wait conditions between concurrent transactions.

---

## 7. Exception Handling

Both core functions implement `EXCEPTION WHEN OTHERS THEN` blocks:
- Capture the PostgreSQL error message using `GET STACKED DIAGNOSTICS`.
- Return a structured error via `OUT` parameters instead of crashing.
- Allow the Java layer to present meaningful user-facing error messages.
- Guarantee implicit rollback of all changes within the failed transaction block.

---

## 8. Audit Infrastructure

### `system_audit_log` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `audit_id` | `SERIAL PK` | Auto-incrementing log ID |
| `table_name` | `VARCHAR(50)` | Name of the audited table |
| `operation` | `VARCHAR(10)` | `INSERT`, `UPDATE`, `RECONCILE` |
| `old_data` | `JSONB` | Full row snapshot before change |
| `new_data` | `JSONB` | Full row snapshot after change |
| `changed_at` | `TIMESTAMP` | When the change occurred |
| `changed_by` | `VARCHAR(50)` | Actor (defaults to 'SYSTEM') |

---

*All constructs above are defined in `backend/src/main/resources/static/advanced_dbms_constructs.sql` and are deployed automatically on application startup via `TriggerInitializer.java`.*
