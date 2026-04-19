-- Phase 37 — Viva System Reboot Script
-- This script cleans all transactional data and inserts minimal, predictable records for Viva.

-- 1. Clean all existing data (Transaction and Master)
TRUNCATE TABLE cancellation RESTART IDENTITY CASCADE;
TRUNCATE TABLE seat_allocation RESTART IDENTITY CASCADE;
TRUNCATE TABLE ticket_passenger RESTART IDENTITY CASCADE;
TRUNCATE TABLE ticket RESTART IDENTITY CASCADE;
TRUNCATE TABLE waitlist_queue RESTART IDENTITY CASCADE;
TRUNCATE TABLE carbon_log RESTART IDENTITY CASCADE;
TRUNCATE TABLE seat RESTART IDENTITY CASCADE;
TRUNCATE TABLE schedule RESTART IDENTITY CASCADE;
TRUNCATE TABLE route_station RESTART IDENTITY CASCADE;
TRUNCATE TABLE route RESTART IDENTITY CASCADE;
TRUNCATE TABLE train RESTART IDENTITY CASCADE;
TRUNCATE TABLE passenger RESTART IDENTITY CASCADE;
TRUNCATE TABLE app_user RESTART IDENTITY CASCADE;
TRUNCATE TABLE station RESTART IDENTITY CASCADE;

-- 2. (Users and Passengers will be seeded programmatically in TriggerInitializer to ensure BCrypt compatibility)

-- 3. Insert Stations
INSERT INTO station (station_code, station_name, city, state) VALUES 
('NDLS', 'New Delhi Railway Station', 'Delhi', 'Delhi'),
('BCT', 'Mumbai Central', 'Mumbai', 'Maharashtra'),
('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu'),
('SBC', 'KSR Bengaluru City Junction', 'Bangalore', 'Karnataka'),
('ADI', 'Ahmedabad Junction', 'Ahmedabad', 'Gujarat'),
('JP', 'Jaipur Junction', 'Jaipur', 'Rajasthan');

-- 4. Insert Minimal Trains (Small Coaches for Viva)
INSERT INTO train (train_number, train_name, train_type, total_coaches, status) VALUES 
('12431', 'Rajdhani Express', 'Rajdhani', 3, 'ACTIVE'),
('12002', 'Shatabdi Express', 'Shatabdi', 3, 'ACTIVE'),
('20607', 'Mysuru Vande Bharat', 'Vande_Bharat', 3, 'ACTIVE'),
('12007', 'Mysuru Shatabdi', 'Shatabdi', 3, 'ACTIVE'),
('12957', 'Swarna Jayanti Rajdhani', 'Rajdhani', 3, 'ACTIVE');

-- 5. Insert Route
INSERT INTO route (route_name, total_distance) VALUES 
('Delhi - Mumbai Corridor', 1400.0),
('Chennai - Bangalore ExpressWay', 350.0),
('Ahmedabad - Jaipur Link', 600.0);

-- 6. Link Route to Stations
INSERT INTO route_station (route_id, station_id, stop_number, arrival_time, departure_time) VALUES 
-- Delhi - Mumbai
(1, 1, 1, '00:00:00', '16:30:00'),
(1, 2, 2, '08:15:00', '00:00:00'),
-- Chennai - Bangalore
(2, 3, 1, '00:00:00', '06:00:00'),
(2, 4, 2, '10:30:00', '00:00:00'),
-- Ahmedabad - Jaipur
(3, 5, 1, '00:00:00', '17:45:00'),
(3, 6, 2, '06:20:00', '00:00:00');

-- 7. Insert Schedules for Today and Tomorrow
INSERT INTO schedule (train_id, route_id, journey_date, departure_datetime, arrival_datetime, delay_minutes) VALUES 
-- Delhi - Mumbai (Rajdhani)
(1, 1, CURRENT_DATE, CURRENT_DATE + TIME '16:30:00', CURRENT_DATE + INTERVAL '1 day' + TIME '08:15:00', 0),
(1, 1, CURRENT_DATE + 1, CURRENT_DATE + 1 + TIME '16:30:00', CURRENT_DATE + 2 + TIME '08:15:00', 0),
-- Delhi - Mumbai (Shatabdi)
(2, 1, CURRENT_DATE, CURRENT_DATE + TIME '06:00:00', CURRENT_DATE + TIME '14:00:00', 0),

-- Chennai - Bangalore (Vande Bharat)
(3, 2, CURRENT_DATE, CURRENT_DATE + TIME '06:00:00', CURRENT_DATE + TIME '10:30:00', 0),
(3, 2, CURRENT_DATE + 1, CURRENT_DATE + 1 + TIME '06:00:00', CURRENT_DATE + 1 + TIME '10:30:00', 0),

-- Chennai - Bangalore (Shatabdi)
(4, 2, CURRENT_DATE, CURRENT_DATE + TIME '15:15:00', CURRENT_DATE + TIME '20:00:00', 0),

-- Ahmedabad - Jaipur (Swarna Jayanti Rajdhani)
(5, 3, CURRENT_DATE, CURRENT_DATE + TIME '17:45:00', CURRENT_DATE + INTERVAL '1 day' + TIME '06:20:00', 0),
(5, 3, CURRENT_DATE + 1, CURRENT_DATE + 1 + TIME '17:45:00', CURRENT_DATE + 2 + TIME '06:20:00', 0);

-- 8. Auto-generate Seats for these schedules will be handled by AdminService or we can insert them here
-- For reliability in SQL Reboot, we insert them here too (3 coaches, 5 seats each = 15 total)
DO $$
DECLARE
    sch_id INT;
    c INT;
    s INT;
    cls VARCHAR;
BEGIN
    FOR sch_id IN (SELECT schedule_id FROM schedule) LOOP
        FOR c IN 1..3 LOOP
            cls := CASE WHEN c = 1 THEN '1AC' WHEN c = 2 THEN '2AC' ELSE '3AC' END;
            FOR s IN 1..5 LOOP
                INSERT INTO seat (schedule_id, coach_number, seat_number, class, status)
                VALUES (sch_id, c, s, cls, 'AVAILABLE');
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
