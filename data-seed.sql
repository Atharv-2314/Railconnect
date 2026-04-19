-- =============================================================
-- PHASE 11: RAILCONNECT — INDIAN LOCALE DATA SEED
-- =============================================================
-- Password for ALL users: password123
-- BCrypt hash (strength 10): $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh8v
-- Run this AFTER schema.sql and triggers/views SQL have been applied.
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING where possible.
-- =============================================================

BEGIN;

-- =============================================================
-- SECTION 1: USERS
-- 1 Admin + 5 Passengers (all login with: password123)
-- =============================================================

INSERT INTO App_User (username, password_hash, role) VALUES
  ('admin@railconnect.com',  '$2a$10$MAZrA3sDR8HOflCT//S/7eOVX/tsIY7yFtUiGbwxFXVMlhG/lwt5O', 'ADMIN'),
  ('priya.sharma@gmail.com', '$2a$10$MAZrA3sDR8HOflCT//S/7eOVX/tsIY7yFtUiGbwxFXVMlhG/lwt5O', 'PASSENGER'),
  ('arjun.mehta@gmail.com',  '$2a$10$MAZrA3sDR8HOflCT//S/7eOVX/tsIY7yFtUiGbwxFXVMlhG/lwt5O', 'PASSENGER'),
  ('neha.kapoor@gmail.com',  '$2a$10$MAZrA3sDR8HOflCT//S/7eOVX/tsIY7yFtUiGbwxFXVMlhG/lwt5O', 'PASSENGER'),
  ('rohit.verma@gmail.com',  '$2a$10$MAZrA3sDR8HOflCT//S/7eOVX/tsIY7yFtUiGbwxFXVMlhG/lwt5O', 'PASSENGER'),
  ('sunita.rao@gmail.com',   '$2a$10$MAZrA3sDR8HOflCT//S/7eOVX/tsIY7yFtUiGbwxFXVMlhG/lwt5O', 'PASSENGER')
ON CONFLICT (username) DO NOTHING;

-- =============================================================
-- SECTION 2: PASSENGER PROFILES
-- Linked to user_id 2–6 (passengers above)
-- =============================================================

INSERT INTO Passenger (user_id, name, age, gender, phone)
SELECT u.user_id, p.name, p.age, p.gender, p.phone
FROM (VALUES
  ('priya.sharma@gmail.com', 'Priya Sharma',  28, 'Female', '9876543210'),
  ('arjun.mehta@gmail.com',  'Arjun Mehta',   34, 'Male',   '9988776655'),
  ('neha.kapoor@gmail.com',  'Neha Kapoor',   22, 'Female', '9871234567'),
  ('rohit.verma@gmail.com',  'Rohit Verma',   45, 'Male',   '9765432109'),
  ('sunita.rao@gmail.com',   'Sunita Rao',    31, 'Female', '9654321098')
) AS p(uname, name, age, gender, phone)
JOIN App_User u ON u.username = p.uname
WHERE NOT EXISTS (
    SELECT 1 FROM Passenger pa WHERE pa.user_id = u.user_id
);

-- =============================================================
-- SECTION 3: STATIONS (12 major Indian railway stations)
-- =============================================================

INSERT INTO Station (station_code, station_name, city, state) VALUES
  ('NDLS', 'New Delhi Railway Station',      'New Delhi',  'Delhi'),
  ('MMCT', 'Mumbai Central',                 'Mumbai',     'Maharashtra'),
  ('MAS',  'Chennai Central',                'Chennai',    'Tamil Nadu'),
  ('HWH',  'Howrah Junction',               'Kolkata',    'West Bengal'),
  ('BCT',  'Bandra Terminus',               'Mumbai',     'Maharashtra'),
  ('SBC',  'KSR Bengaluru City Junction',   'Bengaluru',  'Karnataka'),
  ('JP',   'Jaipur Junction',               'Jaipur',     'Rajasthan'),
  ('ADI',  'Ahmedabad Junction',            'Ahmedabad',  'Gujarat'),
  ('PUNE', 'Pune Junction',                 'Pune',       'Maharashtra'),
  ('LKO',  'Lucknow Charbagh',             'Lucknow',    'Uttar Pradesh'),
  ('HYB',  'Hyderabad Deccan',             'Hyderabad',  'Telangana'),
  ('AGC',  'Agra Cantt',                   'Agra',       'Uttar Pradesh')
ON CONFLICT (station_code) DO NOTHING;

-- =============================================================
-- SECTION 4: ROUTES (5 iconic Indian rail corridors)
-- =============================================================

INSERT INTO Route (route_name, total_distance) VALUES
  ('Delhi - Mumbai Rajdhani Corridor',     1384.00),
  ('Delhi - Kolkata Grand Trunk Route',    1441.00),
  ('Delhi - Chennai Express Corridor',     2175.00),
  ('Bengaluru - Hyderabad Express Route',   573.00),
  ('Delhi - Jaipur Shatabdi Corridor',      303.00)
ON CONFLICT DO NOTHING;

-- =============================================================
-- SECTION 5: ROUTE–STATION MAPPINGS (stop sequences + times)
-- =============================================================

-- Route 1: Delhi → Agra → Vadodara → Mumbai (Rajdhani)
INSERT INTO Route_Station (route_id, station_id, stop_number, arrival_time, departure_time)
SELECT r.route_id, s.station_id, m.stop_num, m.arr::TIME, m.dep::TIME
FROM (VALUES
  ('NDLS', 1, NULL,    '16:25'),
  ('AGC',  2, '18:55', '19:00'),
  ('ADI',  3, '02:30', '02:40'),
  ('MMCT', 4, '08:15', NULL   )
) AS m(code, stop_num, arr, dep)
JOIN Station s ON s.station_code = m.code
JOIN Route r ON r.route_name = 'Delhi - Mumbai Rajdhani Corridor'
ON CONFLICT DO NOTHING;

-- Route 2: Delhi → Lucknow → Kanpur → Kolkata (Grand Trunk)
INSERT INTO Route_Station (route_id, station_id, stop_number, arrival_time, departure_time)
SELECT r.route_id, s.station_id, m.stop_num, m.arr::TIME, m.dep::TIME
FROM (VALUES
  ('NDLS', 1, NULL,    '17:30'),
  ('LKO',  2, '21:50', '22:00'),
  ('AGC',  3, '19:15', '19:20'),
  ('HWH',  4, '10:05', NULL   )
) AS m(code, stop_num, arr, dep)
JOIN Station s ON s.station_code = m.code
JOIN Route r ON r.route_name = 'Delhi - Kolkata Grand Trunk Route'
ON CONFLICT DO NOTHING;

-- Route 3: Delhi → Hyderabad → Chennai (Express)
INSERT INTO Route_Station (route_id, station_id, stop_number, arrival_time, departure_time)
SELECT r.route_id, s.station_id, m.stop_num, m.arr::TIME, m.dep::TIME
FROM (VALUES
  ('NDLS', 1, NULL,    '06:00'),
  ('HYB',  2, '20:30', '20:45'),
  ('MAS',  3, '06:30', NULL   )
) AS m(code, stop_num, arr, dep)
JOIN Station s ON s.station_code = m.code
JOIN Route r ON r.route_name = 'Delhi - Chennai Express Corridor'
ON CONFLICT DO NOTHING;

-- Route 4: Bengaluru → Pune → Hyderabad
INSERT INTO Route_Station (route_id, station_id, stop_number, arrival_time, departure_time)
SELECT r.route_id, s.station_id, m.stop_num, m.arr::TIME, m.dep::TIME
FROM (VALUES
  ('SBC',  1, NULL,    '07:00'),
  ('PUNE', 2, '13:30', '13:45'),
  ('HYB',  3, '19:00', NULL   )
) AS m(code, stop_num, arr, dep)
JOIN Station s ON s.station_code = m.code
JOIN Route r ON r.route_name = 'Bengaluru - Hyderabad Express Route'
ON CONFLICT DO NOTHING;

-- Route 5: Delhi → Jaipur (Shatabdi)
INSERT INTO Route_Station (route_id, station_id, stop_number, arrival_time, departure_time)
SELECT r.route_id, s.station_id, m.stop_num, m.arr::TIME, m.dep::TIME
FROM (VALUES
  ('NDLS', 1, NULL,    '06:05'),
  ('AGC',  2, '08:00', '08:05'),
  ('JP',   3, '10:30', NULL   )
) AS m(code, stop_num, arr, dep)
JOIN Station s ON s.station_code = m.code
JOIN Route r ON r.route_name = 'Delhi - Jaipur Shatabdi Corridor'
ON CONFLICT DO NOTHING;

-- =============================================================
-- SECTION 6: TRAINS (8 iconic Indian trains)
-- =============================================================

INSERT INTO Train (train_number, train_name, train_type, status, total_coaches) VALUES
  ('12951', 'Mumbai Rajdhani Express',        'Rajdhani',  'ACTIVE', 16),
  ('12301', 'Howrah Rajdhani Express',        'Rajdhani',  'ACTIVE', 18),
  ('12621', 'Tamil Nadu Express',             'Superfast', 'ACTIVE', 20),
  ('22691', 'Rajdhani Express (KSR Bengaluru)','Rajdhani', 'ACTIVE', 16),
  ('12015', 'Ajmer Shatabdi Express',         'Shatabdi',  'ACTIVE', 10),
  ('12009', 'Mumbai Shatabdi Express',        'Shatabdi',  'ACTIVE', 10),
  ('12431', 'Hazrat Nizamuddin Rajdhani',     'Rajdhani',  'ACTIVE', 18),
  ('16591', 'Hampi Express',                  'Express',   'ACTIVE', 14)
ON CONFLICT (train_number) DO NOTHING;

-- =============================================================
-- SECTION 7: SCHEDULES (10 date-specific trips across future dates)
-- =============================================================

INSERT INTO Schedule (train_id, route_id, journey_date, departure_datetime, arrival_datetime, delay_minutes)
SELECT t.train_id, r.route_id, s.jdate::DATE, s.dep::TIMESTAMP, s.arr::TIMESTAMP, 0
FROM (VALUES
  -- (train_number, route_name, journey_date, departure_datetime, arrival_datetime)
  ('12951', 'Delhi - Mumbai Rajdhani Corridor',  '2026-04-15', '2026-04-15 16:25:00', '2026-04-16 08:15:00'),
  ('12951', 'Delhi - Mumbai Rajdhani Corridor',  '2026-04-20', '2026-04-20 16:25:00', '2026-04-21 08:15:00'),
  ('12301', 'Delhi - Kolkata Grand Trunk Route', '2026-04-16', '2026-04-16 17:30:00', '2026-04-17 10:05:00'),
  ('12301', 'Delhi - Kolkata Grand Trunk Route', '2026-04-22', '2026-04-22 17:30:00', '2026-04-23 10:05:00'),
  ('12621', 'Delhi - Chennai Express Corridor',  '2026-04-17', '2026-04-17 06:00:00', '2026-04-18 06:30:00'),
  ('22691', 'Bengaluru - Hyderabad Express Route','2026-04-18', '2026-04-18 07:00:00', '2026-04-18 19:00:00'),
  ('12015', 'Delhi - Jaipur Shatabdi Corridor',  '2026-04-15', '2026-04-15 06:05:00', '2026-04-15 10:30:00'),
  ('12015', 'Delhi - Jaipur Shatabdi Corridor',  '2026-04-16', '2026-04-16 06:05:00', '2026-04-16 10:30:00'),
  ('12431', 'Delhi - Mumbai Rajdhani Corridor',  '2026-04-19', '2026-04-19 16:25:00', '2026-04-20 08:15:00'),
  ('16591', 'Bengaluru - Hyderabad Express Route','2026-04-21', '2026-04-21 07:00:00', '2026-04-21 19:00:00')
) AS s(tnum, rname, jdate, dep, arr)
JOIN Train t ON t.train_number = s.tnum
JOIN Route r ON r.route_name = s.rname
WHERE NOT EXISTS (
    SELECT 1 FROM Schedule sc 
    WHERE sc.train_id = t.train_id 
      AND sc.route_id = r.route_id 
      AND sc.journey_date = s.jdate::DATE
);

-- =============================================================
-- SECTION 8: SEATS (auto-generate for all 10 schedules)
-- Coach 1-2: 1AC (36 seats), Coach 3-6: 2AC (46 seats each),
-- Coach 7+: 3AC (64 seats each) — mirrors real Indian Railways
-- =============================================================

INSERT INTO Seat (schedule_id, coach_number, seat_number, class, status)
SELECT
    sc.schedule_id,
    gs.coach_number,
    gs.seat_number,
    CASE
        WHEN gs.coach_number <= 2                             THEN '1AC'
        WHEN gs.coach_number <= 6                             THEN '2AC'
        WHEN gs.coach_number <= (t.total_coaches - 2)        THEN '3AC'
        ELSE 'SL'
    END AS class,
    'AVAILABLE' AS status
FROM Schedule sc
JOIN Train t ON t.train_id = sc.train_id
CROSS JOIN LATERAL (
    SELECT c.coach_number, s.seat_number
    FROM generate_series(1, t.total_coaches) AS c(coach_number)
    CROSS JOIN generate_series(1,
        CASE
            WHEN c.coach_number <= 2                          THEN 36
            WHEN c.coach_number <= 6                          THEN 46
            WHEN c.coach_number <= (t.total_coaches - 2)     THEN 64
            ELSE 72
        END
    ) AS s(seat_number)
) AS gs
WHERE NOT EXISTS (
    SELECT 1 FROM Seat se
    WHERE se.schedule_id   = sc.schedule_id
      AND se.coach_number  = gs.coach_number
      AND se.seat_number   = gs.seat_number
);

-- =============================================================
-- SECTION 9: SAMPLE BOOKINGS (using PL/pgSQL for atomicity)
-- 3 sample tickets so the app has visible booking history
-- =============================================================

-- Ticket 1: Priya Sharma books Delhi → Mumbai Rajdhani (Apr 15)
DO $$
DECLARE
    v_schedule_id  INT;
    v_user_id      INT;
    v_passenger_id INT;
    v_seat_id      INT;
    v_ticket_id    INT;
BEGIN
    -- Skip if already seeded
    IF EXISTS (SELECT 1 FROM Ticket WHERE pnr_number = 'PNR20260001') THEN RETURN; END IF;

    SELECT sc.schedule_id INTO v_schedule_id
    FROM Schedule sc JOIN Train t ON t.train_id = sc.train_id
    WHERE t.train_number = '12951' AND sc.journey_date = '2026-04-15' LIMIT 1;

    SELECT user_id    INTO v_user_id      FROM App_User  WHERE username     = 'priya.sharma@gmail.com';
    SELECT passenger_id INTO v_passenger_id FROM Passenger WHERE user_id    = v_user_id LIMIT 1;
    SELECT seat_id    INTO v_seat_id      FROM Seat
    WHERE schedule_id = v_schedule_id AND status = 'AVAILABLE' AND class = '2AC'
    ORDER BY seat_id LIMIT 1;

    INSERT INTO Ticket (pnr_number, user_id, schedule_id, status, total_fare)
    VALUES ('PNR20260001', v_user_id, v_schedule_id, 'BOOKED', 3245.00)
    RETURNING ticket_id INTO v_ticket_id;

    INSERT INTO Ticket_Passenger (ticket_id, passenger_id) VALUES (v_ticket_id, v_passenger_id);

    UPDATE Seat SET status = 'BOOKED' WHERE seat_id = v_seat_id;

    INSERT INTO Seat_Allocation (ticket_id, seat_id, status) VALUES (v_ticket_id, v_seat_id, 'BOOKED');
    INSERT INTO Payment (ticket_id, amount, payment_mode, status)
    VALUES (v_ticket_id, 3245.00, 'UPI', 'SUCCESS');
    INSERT INTO Carbon_Log (user_id, ticket_id, points_earned) VALUES (v_user_id, v_ticket_id, 65);
END $$;

-- Ticket 2: Arjun Mehta books Delhi → Jaipur Shatabdi (Apr 16)
DO $$
DECLARE
    v_schedule_id  INT;
    v_user_id      INT;
    v_passenger_id INT;
    v_seat_id      INT;
    v_ticket_id    INT;
BEGIN
    IF EXISTS (SELECT 1 FROM Ticket WHERE pnr_number = 'PNR20260002') THEN RETURN; END IF;

    SELECT sc.schedule_id INTO v_schedule_id
    FROM Schedule sc JOIN Train t ON t.train_id = sc.train_id
    WHERE t.train_number = '12015' AND sc.journey_date = '2026-04-16' LIMIT 1;

    SELECT user_id      INTO v_user_id      FROM App_User  WHERE username = 'arjun.mehta@gmail.com';
    SELECT passenger_id INTO v_passenger_id FROM Passenger WHERE user_id  = v_user_id LIMIT 1;
    SELECT seat_id      INTO v_seat_id      FROM Seat
    WHERE schedule_id = v_schedule_id AND status = 'AVAILABLE' AND class = '2AC'
    ORDER BY seat_id LIMIT 1;

    INSERT INTO Ticket (pnr_number, user_id, schedule_id, status, total_fare)
    VALUES ('PNR20260002', v_user_id, v_schedule_id, 'BOOKED', 855.00)
    RETURNING ticket_id INTO v_ticket_id;

    INSERT INTO Ticket_Passenger (ticket_id, passenger_id) VALUES (v_ticket_id, v_passenger_id);
    UPDATE Seat SET status = 'BOOKED' WHERE seat_id = v_seat_id;
    INSERT INTO Seat_Allocation (ticket_id, seat_id, status) VALUES (v_ticket_id, v_seat_id, 'BOOKED');
    INSERT INTO Payment (ticket_id, amount, payment_mode, status)
    VALUES (v_ticket_id, 855.00, 'NET_BANKING', 'SUCCESS');
    INSERT INTO Carbon_Log (user_id, ticket_id, points_earned) VALUES (v_user_id, v_ticket_id, 17);
END $$;

-- Ticket 3: Rohit Verma books Bengaluru → Hyderabad (Apr 18) — cancel to test trigger
DO $$
DECLARE
    v_schedule_id  INT;
    v_user_id      INT;
    v_passenger_id INT;
    v_seat_id      INT;
    v_ticket_id    INT;
BEGIN
    IF EXISTS (SELECT 1 FROM Ticket WHERE pnr_number = 'PNR20260003') THEN RETURN; END IF;

    SELECT sc.schedule_id INTO v_schedule_id
    FROM Schedule sc JOIN Train t ON t.train_id = sc.train_id
    WHERE t.train_number = '22691' AND sc.journey_date = '2026-04-18' LIMIT 1;

    SELECT user_id      INTO v_user_id      FROM App_User  WHERE username = 'rohit.verma@gmail.com';
    SELECT passenger_id INTO v_passenger_id FROM Passenger WHERE user_id  = v_user_id LIMIT 1;
    SELECT seat_id      INTO v_seat_id      FROM Seat
    WHERE schedule_id = v_schedule_id AND status = 'AVAILABLE' AND class = '3AC'
    ORDER BY seat_id LIMIT 1;

    INSERT INTO Ticket (pnr_number, user_id, schedule_id, status, total_fare)
    VALUES ('PNR20260003', v_user_id, v_schedule_id, 'BOOKED', 1120.00)
    RETURNING ticket_id INTO v_ticket_id;

    INSERT INTO Ticket_Passenger (ticket_id, passenger_id) VALUES (v_ticket_id, v_passenger_id);
    UPDATE Seat SET status = 'BOOKED' WHERE seat_id = v_seat_id;
    INSERT INTO Seat_Allocation (ticket_id, seat_id, status) VALUES (v_ticket_id, v_seat_id, 'BOOKED');
    INSERT INTO Payment (ticket_id, amount, payment_mode, status)
    VALUES (v_ticket_id, 1120.00, 'DEBIT_CARD', 'SUCCESS');
    INSERT INTO Carbon_Log (user_id, ticket_id, points_earned) VALUES (v_user_id, v_ticket_id, 22);
END $$;

-- =============================================================
-- SECTION 10: VERIFICATION QUERIES
-- Run these after seeding to confirm everything looks good.
-- =============================================================

-- SELECT 'Users'   AS entity, COUNT(*) FROM App_User;
-- SELECT 'Passengers' AS entity, COUNT(*) FROM Passenger;
-- SELECT 'Stations'  AS entity, COUNT(*) FROM Station;
-- SELECT 'Routes'    AS entity, COUNT(*) FROM Route;
-- SELECT 'Route_Stations' AS entity, COUNT(*) FROM Route_Station;
-- SELECT 'Trains'    AS entity, COUNT(*) FROM Train;
-- SELECT 'Schedules' AS entity, COUNT(*) FROM Schedule;
-- SELECT 'Seats'     AS entity, COUNT(*) FROM Seat;
-- SELECT 'Tickets'   AS entity, COUNT(*) FROM Ticket;
-- SELECT 'Payments'  AS entity, COUNT(*) FROM Payment;
-- SELECT 'CarbonLog' AS entity, COUNT(*) FROM Carbon_Log;

COMMIT;

-- =============================================================
-- END OF PHASE 11 SEED
-- =============================================================
