# PROJECT REPORT: RAILCONNECT RESERVATION SYSTEM

**Subject:** Database Management Systems Project  
**Author:** Atharv Kumar & Team  
**Date:** April 18, 2026

---

## 1. ABSTRACT
RailConnect is an advanced Railway Reservation System designed to handle high-concurrency booking requests while maintaining strict data integrity. The system leverages state-of-the-art backend technologies and relational database automation to solve common pain points such as race conditions during seat selection, manual waitlist processing, and inconsistent refund management.

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Backend Layer (Spring Boot 3.4)
The backend is built using the **Spring Boot** framework, focused on a modular service-oriented architecture.
- **Spring Data JPA**: Used for persistence, leveraging entity relationships to map the complex railway schema.
- **Spring Security & JWT**: Implements stateless authentication. Every request is validated via a JSON Web Token signed with a HS512 secret, ensuring that passenger data is isolated and protected.
- **Transaction Management**: Uses `@Transactional` with `Isolation.SERIALIZABLE` and `Pessimistic Locking` for critical booking paths.

### 2.2 Frontend Layer (React 18)
A modern, responsive dashboard built with **React** and **Tailwind CSS**.
- **Context API**: Manages global authentication and user states.
- **Glassmorphism UI**: Uses premium design principles with vibrant gradients and micro-animations (Lucide Icons) to provide a "WOW" user experience.

---

## 3. DATABASE DESIGN & AUTOMATION

### 3.1 Schema Overview
The relational schema comprises the following primary entities:
- **App_User / Passenger**: Separation of login credentials and physical passenger records.
- **Train / Schedule / Seat**: A hierarchical mapping of trains to specific journey dates and physical inventories.
- **Ticket / Seat_Allocation**: Transactional records linking users to specific seats on a schedule.
- **Waitlist_Queue**: Tracks users waiting for availability for a specific schedule.
- **Bank_Account / Payment / Cancellation**: A financial subsystem for managing funds and refunds.

### 3.2 PL/pgSQL Triggers
The core "intelligence" of the system resides in the database:
- **`trg_waitlist_promotion`**: An `AFTER INSERT` trigger on the `Cancellation` table. 
    - **Logic**: When a cancellation occurs, the trigger identifies the freed seat, checks the `Waitlist_Queue` for the same schedule, automatically generates a new PNR, creates a new `Ticket`, and relocates the passenger—all within a single atomic database operation.

### 3.3 Materialized Analytics Views
- **`v_schedule_occupancy`**: Aggregates real-time seat inventory, calculating occupancy percentages and waitlist counts for administrative oversight.
- **`v_user_booking_summary`**: Provides a consolidated view of user activity, including confirmed/cancelled counts and total revenue generated.

---

## 4. KEY IMPLEMENTATIONS

### 4.1 Atomic Concurrency Control
To prevent "Double Booking", the `BookingService` utilizes a `SELECT ... FOR UPDATE` query on the `Seat` table. This ensures that even if two users attempt to book the exact same seat simultaneously, the database locks the row for the first user, and the second user receives an immediate `CustomConcurrencyException`.

### 4.2 Integrated Bank & Refund Engine
RailConnect includes a simulated Central Bank (`BankService`).
- **Pessimistic Locking**: The bank balance is locked during transaction updates to prevent race conditions.
- **Retry Mechanism**: If a cancellation is processed but the bank has insufficient float for a refund (common in demo scenarios), the refund is marked as `PENDING`, and a `RefundRetryService` automatically settles it once the bank is credited by new bookings.

### 4.3 Carbon Points (Sustainability Logic)
A "Green Travel" reward system credits users with **Carbon Points** based on journey distance (1 point per 10km). 
- **Validation**: Modified logic ensures user balances never drop below zero during redemption.
- **UI Integration**: Users see their cumulative carbon savings on their dashboard.

---

## 5. EXECUTION GUIDE

### 5.1 Prerequisites
- PostgreSQL service running on port 5432.
- JDK 17 installed and set as `JAVA_HOME`.

### 5.2 Initialization
The system uses a `TriggerInitializer` component that natively executes SQL scripts on startup:
1. `waitlist_trigger.sql`: Installs automation logic.
2. `bank_schema.sql`: Initializes the financial state.
3. `reboot_viva_data.sql`: Seeds the initial trains (Rajdhani, Vande Bharat, etc.) and stations.

---

## 6. CONCLUSION
The RailConnect system successfully demonstrates the integration of complex business rules within a relational database environment. Through the use of advanced SQL triggers, serializable transactions, and modern security practices, the platform provides a production-ready template for a robust reservation engine.

---
*End of Report*
