-- PHASE 0: RAILCONNECT DATABASE SCHEMA (PostgreSQL)
-- BCNF Compliant Railway Reservation System

-- 1. App_User Table
CREATE TABLE App_User (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'PASSENGER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Passenger Table
CREATE TABLE Passenger (
    passenger_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT,
    gender VARCHAR(10),
    phone VARCHAR(20),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES App_User(user_id) ON DELETE CASCADE
);

-- 3. Train Table
CREATE TABLE Train (
    train_id SERIAL PRIMARY KEY,
    train_number VARCHAR(20) UNIQUE NOT NULL,
    train_name VARCHAR(255) NOT NULL,
    train_type VARCHAR(50),
    status VARCHAR(50),
    total_coaches INT
);

-- 4. Station Table
CREATE TABLE Station (
    station_id SERIAL PRIMARY KEY,
    station_code VARCHAR(10) UNIQUE NOT NULL,
    station_name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100)
);

-- 5. Route Table
CREATE TABLE Route (
    route_id SERIAL PRIMARY KEY,
    route_name VARCHAR(255),
    total_distance DECIMAL(10, 2)
);

-- 6. Route_Station (Mapping Stations to Routes with Sequence)
CREATE TABLE Route_Station (
    route_id INT NOT NULL,
    station_id INT NOT NULL,
    stop_number INT NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    PRIMARY KEY (route_id, station_id),
    CONSTRAINT fk_route FOREIGN KEY (route_id) REFERENCES Route(route_id) ON DELETE CASCADE,
    CONSTRAINT fk_station FOREIGN KEY (station_id) REFERENCES Station(station_id)
);

-- 7. Schedule Table (Date-Specific instances of a Train on a Route)
CREATE TABLE Schedule (
    schedule_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL,
    route_id INT NOT NULL,
    journey_date DATE NOT NULL,
    departure_datetime TIMESTAMP,
    arrival_datetime TIMESTAMP,
    delay_minutes INT DEFAULT 0,
    CONSTRAINT fk_schedule_train FOREIGN KEY (train_id) REFERENCES Train(train_id),
    CONSTRAINT fk_schedule_route FOREIGN KEY (route_id) REFERENCES Route(route_id)
);

-- 8. Seat Table (Tied to Schedule - Date Specific)
CREATE TABLE Seat (
    seat_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL,
    coach_number INT NOT NULL,
    seat_number INT NOT NULL,
    class VARCHAR(50),
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED')),
    CONSTRAINT fk_seat_schedule FOREIGN KEY (schedule_id) REFERENCES Schedule(schedule_id) ON DELETE CASCADE,
    CONSTRAINT unique_seat_per_schedule UNIQUE (schedule_id, coach_number, seat_number)
);

-- 9. Ticket Table
CREATE TABLE Ticket (
    ticket_id SERIAL PRIMARY KEY,
    pnr_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    schedule_id INT NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CANCELLED')),
    total_fare DECIMAL(10, 2),
    CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES App_User(user_id),
    CONSTRAINT fk_ticket_schedule FOREIGN KEY (schedule_id) REFERENCES Schedule(schedule_id)
);

-- 10. Ticket_Passenger (Relation between Tickets and Passengers)
CREATE TABLE Ticket_Passenger (
    ticket_id INT NOT NULL,
    passenger_id INT NOT NULL,
    PRIMARY KEY (ticket_id, passenger_id),
    CONSTRAINT fk_tp_ticket FOREIGN KEY (ticket_id) REFERENCES Ticket(ticket_id) ON DELETE CASCADE,
    CONSTRAINT fk_tp_passenger FOREIGN KEY (passenger_id) REFERENCES Passenger(passenger_id)
);

-- 11. Seat_Allocation (Links allocated seats to tickets)
CREATE TABLE Seat_Allocation (
    allocation_id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL,
    seat_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CANCELLED')),
    CONSTRAINT fk_sa_ticket FOREIGN KEY (ticket_id) REFERENCES Ticket(ticket_id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_seat FOREIGN KEY (seat_id) REFERENCES Seat(seat_id)
);

-- 12. Waitlist_Queue Table
CREATE TABLE Waitlist_Queue (
    waitlist_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL,
    passenger_id INT NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_waitlist_schedule FOREIGN KEY (schedule_id) REFERENCES Schedule(schedule_id),
    CONSTRAINT fk_waitlist_passenger FOREIGN KEY (passenger_id) REFERENCES Passenger(passenger_id)
);

-- 13. Payment Table
CREATE TABLE Payment (
    payment_id SERIAL PRIMARY KEY,
    ticket_id INT UNIQUE NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10, 2) NOT NULL,
    payment_mode VARCHAR(50),
    status VARCHAR(50),
    CONSTRAINT fk_payment_ticket FOREIGN KEY (ticket_id) REFERENCES Ticket(ticket_id) ON DELETE CASCADE
);

-- 14. Cancellation Table
CREATE TABLE Cancellation (
    cancellation_id SERIAL PRIMARY KEY,
    ticket_id INT UNIQUE NOT NULL,
    cancellation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_amount DECIMAL(10, 2),
    CONSTRAINT fk_cancellation_ticket FOREIGN KEY (ticket_id) REFERENCES Ticket(ticket_id) ON DELETE CASCADE
);

-- 15. Carbon_Log Table
CREATE TABLE Carbon_Log (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    ticket_id INT NOT NULL,
    points_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carbon_user FOREIGN KEY (user_id) REFERENCES App_User(user_id),
    CONSTRAINT fk_carbon_ticket FOREIGN KEY (ticket_id) REFERENCES Ticket(ticket_id)
);

-- Indexes Required for Performance
CREATE INDEX idx_station_id ON Route_Station(station_id);
CREATE INDEX idx_schedule_train_date ON Schedule(train_id, journey_date);
