# 🚂 RailConnect: Ultra-Deep Viva Preparation Guide

This guide is designed to dissect every inch of the **RailConnect** project so you are completely prepared for your one-on-one Viva with the professor. 

Since this is a **DBMS Project**, your core focus should be on how the **Database does the heavy lifting**. The professor will test why you made certain architectural choices, particularly the "DBMS-Pivot" architecture, and how you ensured ACID properties. 

---

## 1. 🗄️ Database (The Core Engine)

This is the most critical section for your viva. The majority of your project’s intelligence lives in **PostgreSQL**. You must confidently defend the **Function-Pivot Architecture**, meaning you moved business logic out of Java and into PostgreSQL using PL/pgSQL.

### A. Schema Design & Normalization
*   **BCNF Compliance**: The schema is strictly designed up to Boyce-Codd Normal Form. Mention that there are no transitive dependencies.
    *   *Proof:* `Seat` is tied to `Schedule` instead of `Train`, because availability depends on the specific journey date (`Schedule_id`), not just the train itself.
    *   *Proof:* `Ticket_Passenger` acts as a junction table resolving the Many-to-Many relationship between Tickets and Passengers.
*   **Data Integrity & Constraints**:
    *   The `App_User` table enforces role boundaries using `CHECK (role IN ('ADMIN', 'PASSENGER'))`.
    *   The `Seat` table uses a composite `UNIQUE` constraint on `(schedule_id, coach_number, seat_number)` to mathematically prevent double-booking a specific seat on a specific date.
    *   Foreign keys extensively use `ON DELETE CASCADE` (e.g., deleting a User cascades to their Passengers, Tickets, Payments, etc.) to prevent orphaned records and maintain Referential Integrity.

### B. Concurrency Control (ACID Properties)
*Professor's trap question: "What happens if two people try to book the exact same seat at the exact same millisecond?"*
*   **The Answer**: **Pessimistic Locking using `SELECT FOR UPDATE NOWAIT` / `SKIP LOCKED`**.
*   **How it Works**: Inside the `fn_book_ticket` transaction block, the DB requests an exclusive row-level lock on the specific `Seat` row. 
    *   If you use `SKIP LOCKED` (during waitlist batching), the database just skips over seats currently being booked by others, ensuring the queue continues processing without failing.
    *   If you use `NOWAIT`, any concurrent transaction trying to book the exact same seat instantly gets an error rather than hanging/deadlocking.
*   **Atomicity**: Both `fn_book_ticket` and `fn_cancel_ticket` are wrapped in single atomic transaction blocks. If the payment logic fails, or if a trigger fails, the *entire* ticket insertion, seat allocation, and log generation rolls back automatically. Nothing is left half-completed.

### C. Advanced DBMS Constructs
Be prepared to explain all four of these:
1.  **Stored Functions (`fn_book_ticket`, `fn_cancel_ticket`)**: Execute multiple SQL statements atomically. We parse JSON payloads natively in Postgres to insert multiple passengers at once, calculating the fare based on seat class (`fn_calculate_fare`), and applying carbon rewards.
2.  **Cursors (`sp_promote_batch_waitlist`)**:
    *   *Why Cursors?* Standard SQL operates on sets, but waitlist promotion requires *row-by-row procedural logic*. 
    *   We use a dual-cursor loop: Cursor 1 iterates through the `Waitlist_Queue` (ordered by priority), and Cursor 2 iterates through available seats. It pairs them up procedurally.
3.  **Triggers (`trg_ticket_audit`, `trg_passenger_audit`)**:
    *   *Purpose:* Real-time, tamper-proof auditing.
    *   Whenever a ticket status changes (`AFTER UPDATE ON Ticket`), the trigger fires transparently and writes a full `JSONB` snapshot of the `old_data` and `new_data` into the `system_audit_log` table. 
4.  **Views (`v_live_occupancy`, `v_route_performance`)**:
    *   *Purpose:* Hiding complex join logic from the backend. The backend just queries `SELECT * FROM v_live_occupancy` without knowing it’s executing a massive aggregate join grouping by train schedules.

### D. Novel Project Features (Database Perspective)
*   **Anti-Scalper Logic** (`fn_is_eligible_for_booking`): A function that counts tickets booked by a `user_id` within the last 10 minutes. If > 6, it blocks the transaction.
*   **Carbon Footprint Tracker**: Calculated and inserted simultaneously with ticket generation, creating an incentivized loyalty loop entirely calculated on the DB level.

---

## 2. ⚙️ Backend (Spring Boot & Java 21)

While the DB does the heavy lifting, the backend is the **secure gateway**. Make sure to emphasize that the backend was kept intentionally "thin".

### A. The "Thin REST Adapter" Pattern
*   *Why?* Instead of pulling thousands of rows into Java memory, looping through them, and saving them back (which causes network I/O bottlenecks and race conditions), the Java backend simply receives the HTTP request and delegates it by calling `CALL fn_book_ticket(...)`. 
*   This makes the application hyper-scalable because the workload happens right inside the data itself. 

### B. Security (Spring Security & JWT)
*   **Role-Based Access Control (RBAC)**: We configured Spring Security filter chains. Endpoints like `/api/admin/**` are strictly locked behind the `ADMIN` role. 
*   **Stateless Authentication (JWT)**: We use JWT (JSON Web Tokens). When a user logs in, the backend issues an encrypted token. On subsequent requests, Spring intercepts the request, decodes the JWT using `jjwt-impl` via the `Authorization: Bearer <token>` header, and verifies the user without needing to query the database or maintain HTTP Sessions (making the backend stateless).

### C. Technology Stack Decisions
*   **Spring Boot 3.x + Java 21**: Leveraging the newest Java version for enhanced garbage collection and virtual thread support (even if not explicitly used, it's good to mention).
*   **JdbcTemplate / Data JPA**: Used for dependency injection and database connectivity. We rely heavily on Spring’s environment abstractions (`application.properties`) to connect to Postgres.
*   **Exception Translation**: When PostgreSQL throws an exception inside a function (e.g., custom error raised in PL/pgSQL), the Spring Boot backend catches this `SQLException`, unwraps the message, and translates it into a clean `400 Bad Request` or `409 Conflict` HTTP response for the frontend.

---

## 3. 💻 Frontend (React 18 & Vite)

The frontend is all about providing a modern, seamless, and highly responsive user experience. 

### A. Modern Tooling (Vite + React)
*   *Why Vite over Create React App (CRA)?* Vite uses native ES modules (`type: "module"`) so the dev server starts instantly, compared to CRA's heavy Webpack bundling.
*   **Component Architecture**: The UI is broken down into reusable React components. It uses contextual state management to track if the user is authenticated, passing the JWT token in `axios` request interceptors for every secure call.
*   **Routing**: Utilizes `react-router-dom` to implement a Singe Page Application (SPA) architecture. The page never refreshes; React just swaps out the DOM nodes.

### B. Styling & Interface (Tailwind CSS)
*   *Why Tailwind?* It's a utility-first CSS framework. Instead of maintaining massive `.css` files full of class names, styles are applied inline (e.g., `flex items-center justify-between text-white`). 
*   This leads to a perfectly highly-responsive grid layout, adapting to different screen sizes without writing custom media queries.
*   **Dashboard Experience**: We utilized `lucide-react` for beautiful iconography and created a split-screen dashboard layout for passengers, making ticket browsing and administration feel like a native desktop app.

---

## 🎯 Viva Q&A "Cheat Sheet"

If the Professor asks:
1.  **"Why didn't you just use Java (Spring Data JPA) to handle the booking logic?"**
    *   *Answer:* "If we pull data to Java, check if a seat is free, and then write back to the DB, a concurrent transaction might steal the seat in those milliseconds. By moving logic to a Postgres Stored Function with pessimistic locking (`FOR UPDATE`), the lock and the write happen in the exact same database transaction, giving us 100% data integrity without network latency."
2.  **"How does your waitlist work?"**
    *   *Answer:* "It uses Database Cursors inside a stored procedure. When someone cancels a ticket, the procedure iterates through the `Waitlist_Queue` row-by-row based on their queue position, assigning freed seats to the highest-priority patient automatically."
3.  **"How do you prevent malicious data modification or track admin abuse?"**
    *   *Answer:* "We implemented trigger-based auditing. An `AFTER UPDATE` trigger intercepts the action at the database level—so even if someone bypasses the Java API and logs directly into Postgres with pgAdmin, their changes are caught and a unified JSONB snapshot of the old vs. new row is logged in `system_audit_log`."
4.  **"What is the time complexity of searching for a PNR?"**
    *   *Answer:* "O(1) or O(log N). We created a B-Tree `UNIQUE` index on `Ticket(pnr_number)`. This bypasses sequential table scans, instantly locating the ticket row."
