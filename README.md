# RailConnect - Advanced Railway Reservation System

RailConnect is a modern, full-stack railway reservation platform built with Spring Boot and React. It features a robust transactional engine, automatic waitlist management via database triggers, a carbon-conscious rewards system, and a central bank-integrated financial module.

## 🚀 Quick Start

### Prerequisites
- **Java**: 17+
- **Node.js**: 18+
- **PostgreSQL**: 14+

### 1. Database Setup
1. Create a database named `railconnect` in PostgreSQL.
2. The schemas, triggers, and views are automatically installed on the first backend run.

### 2. Backend Execution
```bash
cd backend
./gradlew bootRun
```
*The server will start at `http://localhost:8080`.*

### 3. Frontend Execution
```bash
cd frontend
npm install
npm run dev
```
*Access the UI at `http://localhost:5173`.*

---

## 🛠 Tech Stack

- **Backend**: Java 17, Spring Boot 3.x, Spring Security (JWT), Hibernate/JPA.
- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Context API for state.
- **Database**: PostgreSQL with PL/pgSQL Triggers and materialized views.
- **Financials**: Internal Bank System with Pessimistic Locking for atomic refunds.

---

## ✨ Core Features

### 📅 Smart Scheduling & Search
- Multi-route train discovery.
- Real-time seat availability across classes (1AC, 2AC, CC, etc.).
- Admin panel to deploy new rolling stock and generate schedules instantly.

### 🎟 Transactional Booking
- **Atomic Allocation**: Uses SQL `SELECT FOR UPDATE` to prevent double-booking.
- **Carbon Rewards**: Earn points for every trip; use points for discounts on future bookings.
- **PNR Generation**: Automatic 10-character unique PNR generation.

### ⏳ Waitlist Automation
- PostgreSQL triggers (`trg_waitlist_promotion`) automatically promote passengers from the waitlist whenever a confirmed ticket is cancelled.
- Real-time seat reallocation without manual intervention.

### 💰 Central Bank & Refunds
- Integrated payment simulation.
- **80% Refund Policy**: Automatic refund calculation on cancellation.
- **Retry Engine**: Failed refunds (e.g., due to low bank float) are automatically queued and retried when the bank is credited.

### 📊 Admin Command Center
- **Analytics Dashboard**: View platform-wide revenue, occupancy percentages, and user analytics.
- **Passenger Discovery**: Deep-dive into user booking patterns and carbon savings.

---

## 🛡 Security
- Secured using **JWT (JSON Web Tokens)**.
- Role-Based Access Control (RBAC) separating `ADMIN` and `PASSENGER` capabilities.
- BCrypt password hashing for data protection.

---

## 🧑‍💻 Development / Viva Mode
To reset the system for a fresh demonstration, use the **Viva Reboot** function or run the `reboot_viva_data.sql` script located in `backend/src/main/resources/static/`.

---
*Developed for the Database Management Systems Laboratory Project.*
