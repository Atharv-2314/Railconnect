-- =========================================================================
-- MASTER SCRIPT: RAILCONNECT ADVANCED DBMS CONSTRUCTS
-- Includes: Procedures, Functions, Cursors, Triggers, Views, Indexes,
--           Transactions, Locking, Exception Handling & Audit Logs.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 0. EXTENSIONS & AUDIT TABLE
-- -------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS system_audit_log (
    audit_id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(50) DEFAULT 'SYSTEM'
);

-- -------------------------------------------------------------------------
-- 1. INDEXES (Rule of 3)
-- -------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_pnr_unique ON Ticket(pnr_number);
CREATE INDEX IF NOT EXISTS idx_seat_schedule_status ON Seat(schedule_id, status);
CREATE INDEX IF NOT EXISTS idx_passenger_gov_mapping ON Passenger(gov_id) WHERE gov_id IS NOT NULL;

-- -------------------------------------------------------------------------
-- 2. VIEWS (Rule of 3)
-- -------------------------------------------------------------------------
-- View 1: Live Occupancy
CREATE OR REPLACE VIEW v_live_occupancy AS
SELECT sc.schedule_id, t.train_name, r.route_name, sc.journey_date,
       COUNT(s.seat_id) AS total_seats,
       COUNT(s.seat_id) FILTER (WHERE s.status = 'AVAILABLE') AS available_seats,
       ROUND(COUNT(s.seat_id) FILTER (WHERE s.status = 'BOOKED')::NUMERIC / NULLIF(COUNT(s.seat_id),0)*100, 2) as occupancy_pct
FROM Schedule sc
JOIN Train t ON t.train_id = sc.train_id 
JOIN Route r ON r.route_id = sc.route_id
LEFT JOIN Seat s ON s.schedule_id = sc.schedule_id
GROUP BY sc.schedule_id, t.train_name, r.route_name, sc.journey_date;

-- View 2: User Loyalty Summary
CREATE OR REPLACE VIEW v_user_loyalty_summary AS
SELECT u.user_id, u.username, 
       COUNT(DISTINCT t.ticket_id) as trips_taken, 
       COALESCE(SUM(cl.points_earned), 0) as lifetime_points
FROM App_User u
LEFT JOIN Ticket t ON t.user_id = u.user_id AND t.status IN ('BOOKED', 'CONFIRMED')
LEFT JOIN Carbon_Log cl ON cl.user_id = u.user_id
GROUP BY u.user_id, u.username;

-- View 3: Route Performance
CREATE OR REPLACE VIEW v_route_performance AS
SELECT r.route_name, 
       COALESCE(SUM(t.total_fare), 0) as total_revenue, 
       COUNT(t.ticket_id) as tickets_sold
FROM Route r
JOIN Schedule sc ON sc.route_id = r.route_id
LEFT JOIN Ticket t ON t.schedule_id = sc.schedule_id AND t.status != 'CANCELLED'
GROUP BY r.route_name;

-- -------------------------------------------------------------------------
-- 3. STORED FUNCTIONS (Rule of 3)
-- -------------------------------------------------------------------------
-- Function 1: Check booking eligibility (Anti-Scalper Velocity Check)
DROP FUNCTION IF EXISTS fn_is_eligible_for_booking(INT, INT);
CREATE OR REPLACE FUNCTION fn_is_eligible_for_booking(p_user_id BIGINT, p_seat_count INT) 
RETURNS BOOLEAN AS $$
DECLARE
    v_recent_seats INT;
BEGIN
    SELECT COALESCE(SUM(1), 0) INTO v_recent_seats
    FROM Ticket t 
    JOIN Seat_Allocation sa ON sa.ticket_id = t.ticket_id
    WHERE t.user_id = p_user_id 
      AND t.status != 'CANCELLED'
      AND t.booking_time >= NOW() - INTERVAL '10 minutes';
      
    IF (v_recent_seats + p_seat_count) > 6 THEN
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Calculate specific seat fare
CREATE OR REPLACE FUNCTION fn_calculate_fare(p_route_distance NUMERIC, p_class VARCHAR) 
RETURNS NUMERIC AS $$
DECLARE
    v_multiplier NUMERIC;
BEGIN
    CASE p_class
        WHEN '1AC' THEN v_multiplier := 3.5;
        WHEN '2AC' THEN v_multiplier := 2.0;
        WHEN '3AC' THEN v_multiplier := 1.5;
        WHEN 'EC'  THEN v_multiplier := 3.0;
        WHEN 'CC'  THEN v_multiplier := 1.2;
        WHEN 'SL'  THEN v_multiplier := 0.8;
        ELSE v_multiplier := 0.5;
    END CASE;
    RETURN p_route_distance * v_multiplier;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Calculate carbon discount
CREATE OR REPLACE FUNCTION fn_calculate_carbon_discount(p_points INT, p_total_fare NUMERIC) 
RETURNS NUMERIC AS $$
DECLARE
    v_discount NUMERIC;
    v_max_discount NUMERIC;
BEGIN
    v_discount := (p_points / 1000.0) * 0.05 * p_total_fare;
    v_max_discount := 0.20 * p_total_fare;
    IF v_discount > v_max_discount THEN
        RETURN v_max_discount;
    ELSE
        RETURN v_discount;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 4. TRIGGERS (Rule of 3)
-- -------------------------------------------------------------------------
-- Trigger 1: Ticket Audit
CREATE OR REPLACE FUNCTION fn_trg_ticket_audit() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_audit_log (table_name, operation, old_data, new_data)
    VALUES ('Ticket', TG_OP, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ticket_audit ON Ticket;
CREATE TRIGGER trg_ticket_audit AFTER UPDATE ON Ticket
FOR EACH ROW EXECUTE FUNCTION fn_trg_ticket_audit();

-- Trigger 2: Passenger Audit
CREATE OR REPLACE FUNCTION fn_trg_passenger_audit() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_audit_log (table_name, operation, old_data, new_data)
    VALUES ('Passenger', TG_OP, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_passenger_audit ON Passenger;
CREATE TRIGGER trg_passenger_audit AFTER INSERT OR UPDATE ON Passenger
FOR EACH ROW EXECUTE FUNCTION fn_trg_passenger_audit();

-- Trigger 3: Waitlist Notify
CREATE OR REPLACE FUNCTION fn_trg_waitlist_notify() RETURNS TRIGGER AS $$
BEGIN
    NEW.is_notified := FALSE; 
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Since we use procedures, creating a BEFORE INSERT trigger for auto-promoted tickets
-- Waitlist promotes with 'CONFIRMED' directly in procedure now, vs standard bookings which use 'BOOKED'
DROP TRIGGER IF EXISTS trg_waitlist_is_notified ON Ticket;
CREATE TRIGGER trg_waitlist_is_notified BEFORE INSERT ON Ticket
FOR EACH ROW WHEN (NEW.status = 'CONFIRMED')
EXECUTE FUNCTION fn_trg_waitlist_notify();


-- -------------------------------------------------------------------------
-- 5. CURSORS (Rule of 3)
-- -------------------------------------------------------------------------

-- Cursor 1: Waitlist Promotion (Iterates over queue for a schedule to assign freed seats)
DROP PROCEDURE IF EXISTS sp_promote_batch_waitlist(BIGINT);
DROP PROCEDURE IF EXISTS sp_promote_batch_waitlist(INT);

CREATE OR REPLACE PROCEDURE sp_promote_batch_waitlist(p_schedule_id BIGINT) AS $$
DECLARE
    v_freed_seat RECORD;
    v_waitlist_cursor CURSOR FOR 
        SELECT wq.waitlist_id, wq.passenger_id, p.user_id 
        FROM Waitlist_Queue wq JOIN Passenger p ON p.passenger_id = wq.passenger_id
        WHERE wq.schedule_id = p_schedule_id ORDER BY wq.position ASC;
    v_waitlist_rec RECORD;
    v_seat_cursor CURSOR FOR
        SELECT seat_id, class FROM Seat WHERE schedule_id = p_schedule_id AND status = 'AVAILABLE' ORDER BY coach_number, seat_number FOR UPDATE SKIP LOCKED;
    v_route_dist NUMERIC;
    v_pnr TEXT;
    v_fare NUMERIC;
    v_tid INT;
BEGIN
    SELECT total_distance INTO v_route_dist FROM Route r JOIN Schedule sc ON sc.route_id = r.route_id WHERE sc.schedule_id = p_schedule_id;
    
    OPEN v_waitlist_cursor;
    OPEN v_seat_cursor;
    
    LOOP
        FETCH v_waitlist_cursor INTO v_waitlist_rec;
        EXIT WHEN NOT FOUND;
        
        FETCH v_seat_cursor INTO v_freed_seat;
        EXIT WHEN NOT FOUND; -- No more free seats
        
        -- Promote matching pair (with double-check guard to prevent race conditions)
        PERFORM seat_id FROM Seat WHERE seat_id = v_freed_seat.seat_id AND status = 'AVAILABLE';
        IF NOT FOUND THEN
            CONTINUE; -- Seat was already grabbed by a concurrent transaction, skip it
        END IF;

        v_pnr := 'WPNR' || UPPER(SUBSTRING(REPLACE(md5(random()::TEXT || clock_timestamp()::TEXT), '-', ''), 1, 8));
        v_fare := fn_calculate_fare(v_route_dist, v_freed_seat.class);
        
        INSERT INTO Ticket (pnr_number, user_id, schedule_id, status, total_fare)
        VALUES (v_pnr, v_waitlist_rec.user_id, p_schedule_id, 'CONFIRMED', v_fare)
        RETURNING ticket_id INTO v_tid;
        
        INSERT INTO Ticket_Passenger(ticket_id, passenger_id) VALUES (v_tid, v_waitlist_rec.passenger_id);
        UPDATE Seat SET status = 'BOOKED' WHERE seat_id = v_freed_seat.seat_id;
        INSERT INTO Seat_Allocation(ticket_id, seat_id, status) VALUES (v_tid, v_freed_seat.seat_id, 'BOOKED');
        INSERT INTO Payment(ticket_id, amount, payment_mode, status) VALUES (v_tid, v_fare, 'WAITLIST_AUTO', 'SUCCESS');
        
        DELETE FROM Waitlist_Queue WHERE waitlist_id = v_waitlist_rec.waitlist_id;
    END LOOP;
    
    CLOSE v_seat_cursor;
    CLOSE v_waitlist_cursor;
    
    -- Reorder remaining
    UPDATE Waitlist_Queue wq1
    SET position = (
        SELECT COUNT(*) 
        FROM Waitlist_Queue wq2 
        WHERE wq2.schedule_id = p_schedule_id AND wq2.created_at <= wq1.created_at
    )
    WHERE schedule_id = p_schedule_id;
END;
$$ LANGUAGE plpgsql;

-- Cursor 2: Reconcile Wallets (Check carbon points anomalies)
CREATE OR REPLACE PROCEDURE sp_reconcile_wallets() AS $$
DECLARE
    v_sum INT;
    v_user_rec RECORD;
    v_user_cursor CURSOR FOR SELECT user_id, username FROM App_User;
BEGIN
    OPEN v_user_cursor;
    LOOP
        FETCH v_user_cursor INTO v_user_rec;
        EXIT WHEN NOT FOUND;
        
        SELECT COALESCE(SUM(points_earned),0) INTO v_sum FROM Carbon_Log WHERE user_id = v_user_rec.user_id;
        -- Example operation: insert an audit anomaly if huge mismatch
        IF v_sum > 10000 THEN
           INSERT INTO system_audit_log(table_name, operation, old_data) VALUES ('App_User', 'RECONCILE', jsonb_build_object('user_id', v_user_rec.user_id, 'anomaly', 'High Carbon Points'));
        END IF;
    END LOOP;
    CLOSE v_user_cursor;
END;
$$ LANGUAGE plpgsql;

-- Cursor 3: Process Refund Batch
CREATE OR REPLACE PROCEDURE sp_process_refund_batch() AS $$
DECLARE
    rec RECORD;
    c_refund CURSOR FOR SELECT cancellation_id, refund_amount FROM Cancellation WHERE refund_status = 'PENDING';
BEGIN
    OPEN c_refund;
    LOOP
        FETCH c_refund INTO rec;
        EXIT WHEN NOT FOUND;
        -- Move funds
        UPDATE bank_account SET balance = balance - rec.refund_amount WHERE account_id = 1;
        UPDATE Cancellation SET refund_status = 'COMPLETED' WHERE cancellation_id = rec.cancellation_id;
    END LOOP;
    CLOSE c_refund;
END;
$$ LANGUAGE plpgsql;


-- -------------------------------------------------------------------------
-- 6. TRANSACTIONS, LOCKING, PROCEDURES (Rule of 3 Main SPs)
-- -------------------------------------------------------------------------

-- Function 1: Book Ticket (With Explicit Locking & Exception Handling block)
-- CLEAN SLATE: Dropping all possible overloaded signatures
DROP PROCEDURE IF EXISTS sp_book_ticket(BIGINT, BIGINT, TEXT, TEXT, TEXT, TEXT);
DROP PROCEDURE IF EXISTS sp_book_ticket(INT, INT, TEXT, JSONB, TEXT, TEXT);
DROP PROCEDURE IF EXISTS sp_book_ticket(INT, INT, TEXT, JSONB);
DROP PROCEDURE IF EXISTS sp_book_ticket(BIGINT, BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS fn_book_ticket(BIGINT, BIGINT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION fn_book_ticket(
    IN p_user_id BIGINT,
    IN p_schedule_id BIGINT,
    IN p_seat_ids TEXT, 
    IN p_passengers_txt TEXT,
    OUT p_pnr TEXT,
    OUT p_err_msg TEXT,
    OUT p_total_fare NUMERIC,
    OUT p_carbon_points INT
) RETURNS RECORD AS $$
DECLARE
    p_passengers JSONB := p_passengers_txt::JSONB;
    v_seat_arr INT[];
    v_seat_id INT;
    v_seat_stat VARCHAR;
    v_journey_date DATE;
    v_route_dist NUMERIC;
    v_total_fare NUMERIC := 0;
    v_fare NUMERIC;
    v_class VARCHAR;
    v_idx INT := 0;
    v_pass_rec JSONB;
    v_pass_id INT;
    v_ticket_id INT;
    v_seat_count INT;
    old_state TEXT;
BEGIN
    p_pnr := NULL; p_err_msg := NULL;
    v_seat_arr := string_to_array(p_seat_ids, ',')::INT[];
    v_seat_count := array_length(v_seat_arr, 1);
    
    -- Anti-Scalper: Velocity check via function execution
    IF fn_is_eligible_for_booking(p_user_id, v_seat_count) = FALSE THEN
        p_err_msg := 'Booking limit exceeded. Rule of 6 per 10 mins enforced.';
        RETURN;
    END IF;

    SELECT journey_date, r.total_distance INTO v_journey_date, v_route_dist
    FROM Schedule sc JOIN Route r ON r.route_id = sc.route_id WHERE sc.schedule_id = p_schedule_id;

    -- Iterating input passengers for Identity check
    FOR v_pass_rec IN SELECT * FROM jsonb_array_elements(p_passengers)
    LOOP
        IF (v_pass_rec->>'govId') IS NOT NULL AND (v_pass_rec->>'govId') <> '' THEN
            IF EXISTS (
                SELECT 1 FROM Ticket t JOIN Ticket_Passenger tp ON t.ticket_id = tp.ticket_id JOIN Passenger p ON p.passenger_id = tp.passenger_id
                WHERE p.gov_id = (v_pass_rec->>'govId') AND t.schedule_id IN (SELECT schedule_id FROM Schedule WHERE journey_date = v_journey_date) AND t.status != 'CANCELLED'
            ) THEN
                p_err_msg := 'Identity conflict: Gov ID ' || (v_pass_rec->>'govId') || ' already has an active booking on this date.';
                RETURN;
            END IF;
        END IF;
    END LOOP;

    -- Pessimistic Lock on all seats safely (Ordered to prevent deadlocks)
    FOREACH v_seat_id IN ARRAY v_seat_arr
    LOOP
        SELECT status, class INTO v_seat_stat, v_class FROM Seat WHERE seat_id = v_seat_id FOR UPDATE NOWAIT;
        IF v_seat_stat <> 'AVAILABLE' THEN
            p_err_msg := 'Seat ' || v_seat_id || ' taken due to high concurrency.';
            RETURN;
        END IF;
        v_fare := fn_calculate_fare(v_route_dist, v_class);
        v_total_fare := v_total_fare + v_fare;
    END LOOP;

    -- Insert Ticket
    p_pnr := 'PNR' || UPPER(SUBSTRING(REPLACE(md5(random()::TEXT || clock_timestamp()::TEXT), '-', ''), 1, 8));
    INSERT INTO Ticket (pnr_number, user_id, schedule_id, status, total_fare) 
    VALUES (p_pnr, p_user_id, p_schedule_id, 'BOOKED', v_total_fare) RETURNING ticket_id INTO v_ticket_id;

    -- Loop to insert Allocations and Passengers
    FOREACH v_seat_id IN ARRAY v_seat_arr
    LOOP
        v_pass_rec := p_passengers->v_idx;
        v_idx := v_idx + 1;
        
        UPDATE Seat SET status = 'BOOKED' WHERE seat_id = v_seat_id;
        INSERT INTO Seat_Allocation(ticket_id, seat_id, status) VALUES(v_ticket_id, v_seat_id, 'BOOKED');
        
        INSERT INTO Passenger (user_id, name, age, gender, gov_id)
        VALUES (p_user_id, v_pass_rec->>'name', (v_pass_rec->>'age')::INT, v_pass_rec->>'gender', NULLIF(v_pass_rec->>'govId', ''))
        RETURNING passenger_id INTO v_pass_id;
        
        INSERT INTO Ticket_Passenger(ticket_id, passenger_id) VALUES(v_ticket_id, v_pass_id);
    END LOOP;
    
    INSERT INTO Payment(ticket_id, amount, payment_mode, status) VALUES (v_ticket_id, v_total_fare, 'UPI', 'SUCCESS');
    UPDATE bank_account SET balance = balance + v_total_fare WHERE account_id = 1;
    p_carbon_points := CAST(v_total_fare * 0.02 AS INT);
    INSERT INTO Carbon_Log(user_id, ticket_id, points_earned) VALUES (p_user_id, v_ticket_id, p_carbon_points);
    p_total_fare := v_total_fare;

EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS old_state = MESSAGE_TEXT;
    p_err_msg := 'Transaction Failed: ' || old_state;
    -- Note: Functions automatically rollback the block upon exception catch!
END;
$$ LANGUAGE plpgsql;

-- Function 2: Cancel Ticket
DROP PROCEDURE IF EXISTS sp_cancel_ticket(BIGINT, BIGINT, TEXT);
DROP PROCEDURE IF EXISTS sp_cancel_ticket(INT, INT, TEXT);
DROP PROCEDURE IF EXISTS sp_cancel_ticket(INT, INT);
DROP PROCEDURE IF EXISTS sp_cancel_ticket(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS fn_cancel_ticket(BIGINT, BIGINT);

CREATE OR REPLACE FUNCTION fn_cancel_ticket(
    p_ticket_id BIGINT,
    p_user_id BIGINT
) RETURNS TABLE(p_err_msg TEXT) AS $$
DECLARE
    v_err TEXT := NULL;
    v_stat VARCHAR;
    v_uid INT;
    v_sched INT;
    v_fare NUMERIC;
    v_seat_id INT;
BEGIN
    SELECT status, user_id, schedule_id, total_fare INTO v_stat, v_uid, v_sched, v_fare FROM Ticket WHERE ticket_id = p_ticket_id FOR UPDATE;
    IF v_stat IS NULL THEN v_err := 'Ticket not found'; p_err_msg := v_err; RETURN NEXT; RETURN; END IF;
    IF v_uid != p_user_id THEN v_err := 'Access Denied'; p_err_msg := v_err; RETURN NEXT; RETURN; END IF;
    IF v_stat = 'CANCELLED' THEN v_err := 'Already cancelled'; p_err_msg := v_err; RETURN NEXT; RETURN; END IF;
    
    UPDATE Ticket SET status = 'CANCELLED' WHERE ticket_id = p_ticket_id;
    UPDATE Payment SET status = 'REFUNDED' WHERE ticket_id = p_ticket_id;
    
    INSERT INTO Cancellation (ticket_id, refund_amount, refund_status) VALUES (p_ticket_id, v_fare * 0.8, 'PENDING');
    
    FOR v_seat_id IN SELECT seat_id FROM Seat_Allocation WHERE ticket_id = p_ticket_id
    LOOP
        UPDATE Seat SET status = 'AVAILABLE' WHERE seat_id = v_seat_id;
        UPDATE Seat_Allocation SET status = 'CANCELLED' WHERE seat_id = v_seat_id AND ticket_id = p_ticket_id;
    END LOOP;
    
    -- Call the Cursor waitlist promotion proc safely
    CALL sp_promote_batch_waitlist(v_sched);

    p_err_msg := NULL;
    RETURN NEXT;

EXCEPTION WHEN OTHERS THEN
    p_err_msg := 'Cancellation Failed: ' || SQLERRM;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

