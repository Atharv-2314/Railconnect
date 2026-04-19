-- =============================================================
-- PHASE 16: RAILCONNECT — WAITLIST PROMOTION TRIGGER
-- =============================================================
-- Fires AFTER INSERT on Cancellation.
-- Finds the freed seat(s) from the cancelled ticket, then
-- promotes the top-ranked Waitlist_Queue entry for that schedule
-- by converting it into a fully booked ticket automatically.
-- =============================================================

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Expand the ticket status check constraint to include CONFIRMED (used by waitlist promotion)
ALTER TABLE ticket DROP CONSTRAINT IF EXISTS ticket_status_check;
ALTER TABLE ticket ADD CONSTRAINT ticket_status_check
    CHECK (status IN ('BOOKED', 'CONFIRMED', 'CANCELLED'));

-- Step 1: Trigger FUNCTION
CREATE OR REPLACE FUNCTION promote_waitlist_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
    v_cancelled_ticket_id  BIGINT;
    v_schedule_id          BIGINT;
    v_freed_seat           RECORD;
    v_next_waitlist        RECORD;
    v_new_ticket_id        BIGINT;
    v_new_pnr              TEXT;
BEGIN
    v_cancelled_ticket_id := NEW.ticket_id;

    -- Get the schedule of the just-cancelled ticket
    SELECT schedule_id INTO v_schedule_id
    FROM Ticket
    WHERE ticket_id = v_cancelled_ticket_id;

    -- Mark ticket as CANCELLED
    UPDATE Ticket
    SET status = 'CANCELLED'
    WHERE ticket_id = v_cancelled_ticket_id;

    -- Collect each seat from the cancelled allocation and try to assign to waitlist
    FOR v_freed_seat IN
        SELECT sa.seat_id
        FROM Seat_Allocation sa
        WHERE sa.ticket_id = v_cancelled_ticket_id
          AND sa.status = 'BOOKED'
    LOOP
        -- Free the seat
        UPDATE Seat SET status = 'AVAILABLE' WHERE seat_id = v_freed_seat.seat_id;
        UPDATE Seat_Allocation SET status = 'CANCELLED'
        WHERE seat_id = v_freed_seat.seat_id AND ticket_id = v_cancelled_ticket_id;

        -- Get the next pending waitlist entry for this schedule (lowest position number)
        SELECT wq.waitlist_id, wq.passenger_id, p.user_id
        INTO v_next_waitlist
        FROM Waitlist_Queue wq
        JOIN Passenger p ON p.passenger_id = wq.passenger_id
        WHERE wq.schedule_id = v_schedule_id
        ORDER BY wq.position ASC
        LIMIT 1;

        -- If a waitlisted passenger exists, promote them
        IF FOUND THEN
            -- Book the seat for them
            UPDATE Seat SET status = 'BOOKED' WHERE seat_id = v_freed_seat.seat_id;

            -- Generate a unique PNR
            -- Use md5+clock_timestamp as a safe fallback if pgcrypto is unavailable
            v_new_pnr := 'WPNR' || UPPER(SUBSTRING(REPLACE(md5(random()::TEXT || clock_timestamp()::TEXT), '-', ''), 1, 8));

            -- Calculate fare (reuse same fare logic as original: distance * class multiplier)
            INSERT INTO Ticket (pnr_number, user_id, schedule_id, status, is_notified, total_fare)
            SELECT
                v_new_pnr,
                v_next_waitlist.user_id,
                v_schedule_id,
                'BOOKED',
                FALSE,
                r.total_distance * CASE s.class
                    WHEN '1AC' THEN 3.5
                    WHEN '2AC' THEN 2.0
                    WHEN '3AC' THEN 1.5
                    WHEN 'EC'  THEN 3.0
                    WHEN 'CC'  THEN 1.2
                    WHEN 'SL'  THEN 0.8
                    ELSE 0.5
                END
            FROM Schedule sc
            JOIN Route r ON r.route_id = sc.route_id
            JOIN Seat s ON s.seat_id = v_freed_seat.seat_id
            WHERE sc.schedule_id = v_schedule_id
            RETURNING ticket_id INTO v_new_ticket_id;

            -- Allocate the seat
            INSERT INTO Seat_Allocation (ticket_id, seat_id, status)
            VALUES (v_new_ticket_id, v_freed_seat.seat_id, 'BOOKED');

            -- Map passenger to new ticket
            INSERT INTO Ticket_Passenger (ticket_id, passenger_id)
            VALUES (v_new_ticket_id, v_next_waitlist.passenger_id);

            -- Create a SUCCESS payment record (auto-pay on promotion)
            -- Must use VALUES with v_new_ticket_id directly; subquery SELECT caused type mismatch
            INSERT INTO Payment (ticket_id, amount, payment_mode, status)
            SELECT v_new_ticket_id, t.total_fare, 'WAITLIST_AUTO', 'SUCCESS'
            FROM Ticket t WHERE t.ticket_id = v_new_ticket_id;

            -- Remove from waitlist
            DELETE FROM Waitlist_Queue WHERE waitlist_id = v_next_waitlist.waitlist_id;

            -- Reorder remaining positions for same schedule
            UPDATE Waitlist_Queue
            SET position = position - 1
            WHERE schedule_id = v_schedule_id AND position > 1;

            RAISE NOTICE 'Waitlist promoted: passenger % → ticket % (PNR: %)',
                v_next_waitlist.passenger_id, v_new_ticket_id, v_new_pnr;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Attach trigger to Cancellation table
--   DROP first so this file is idempotent (safe to re-run)
DROP TRIGGER IF EXISTS trg_waitlist_promotion ON Cancellation;

CREATE TRIGGER trg_waitlist_promotion
    AFTER INSERT ON Cancellation
    FOR EACH ROW
    EXECUTE FUNCTION promote_waitlist_on_cancel();

-- =============================================================
-- Reporting / Admin VIEW: Booking Summary per user
-- =============================================================
CREATE OR REPLACE VIEW v_user_booking_summary AS
SELECT
    u.user_id,
    u.username,
    COUNT(t.ticket_id)                                                          AS total_bookings,
    COUNT(t.ticket_id) FILTER (WHERE t.status = 'CONFIRMED')                    AS confirmed,
    COUNT(t.ticket_id) FILTER (WHERE t.status = 'CANCELLED')                    AS cancelled,
    COALESCE(SUM(t.total_fare) FILTER (WHERE t.status IN ('CONFIRMED','BOOKED')), 0) AS total_spent,
    -- Subquery aggregation prevents the Join Explosion when joining both Ticket and Carbon_Log
    COALESCE((
        SELECT SUM(cl.points_earned)
        FROM Carbon_Log cl
        WHERE cl.user_id = u.user_id
    ), 0)                                                                        AS total_carbon_points
FROM App_User u
LEFT JOIN Ticket t ON t.user_id = u.user_id
GROUP BY u.user_id, u.username;

-- =============================================================
-- Admin VIEW: Schedule occupancy overview
-- =============================================================
CREATE OR REPLACE VIEW v_schedule_occupancy AS
SELECT
    sc.schedule_id,
    t.train_name,
    t.train_number,
    r.route_name,
    sc.journey_date,
    COUNT(s.seat_id)                                          AS total_seats,
    COUNT(s.seat_id) FILTER (WHERE s.status = 'AVAILABLE')   AS available_seats,
    COUNT(s.seat_id) FILTER (WHERE s.status = 'BOOKED')      AS booked_seats,
    ROUND(
        COUNT(s.seat_id) FILTER (WHERE s.status = 'BOOKED')::NUMERIC
        / NULLIF(COUNT(s.seat_id), 0) * 100, 1
    )                                                         AS occupancy_pct,
    (SELECT COUNT(*) FROM Waitlist_Queue wq WHERE wq.schedule_id = sc.schedule_id) AS waitlisted
FROM Schedule sc
JOIN Train t ON t.train_id = sc.train_id
JOIN Route r ON r.route_id = sc.route_id
LEFT JOIN Seat s ON s.schedule_id = sc.schedule_id
GROUP BY sc.schedule_id, t.train_name, t.train_number, r.route_name, sc.journey_date;
