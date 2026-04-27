# RailConnect: A Next-Generation DBMS-Pivot Railway Reservation Engine

### Introduction
In the landscape of modern web applications, the database is often relegated to a passive storage layer. **RailConnect** challenges this paradigm by implementing a **"DBMS-Pivot" Architecture**, where the PostgreSQL engine acts as the primary orchestrator of business logic, transactional integrity, and high-concurrency control. Designed as a sophisticated enterprise-grade solution, RailConnect demonstrates how advanced relational database constructs can eliminate the overhead of application-layer processing while guaranteeing 100% data consistency.

### Architectural Philosophy
At its core, RailConnect utilizes a **Function-Pivot** model. While the Spring Boot backend provides a clean RESTful interface and the React frontend offers a premium user experience, the "brain" of the system resides within PL/pgSQL. This approach ensures that critical operations—such as atomic ticket booking, seat allocation, and waitlist promotion—are executed within the same memory space as the data itself, drastically reducing network latency and ensuring ACID compliance across complex multi-table transactions.

### Key Technical Innovations
1.  **Atomic Transaction Engine**: Stored functions (`fn_book_ticket`) handle passenger validation, Gov ID uniqueness, and financial processing in a single atomic unit.
2.  **Sophisticated Concurrency Control**: Leveraging `FOR UPDATE SKIP LOCKED`, RailConnect achieves non-blocking seat allocations, allowing multiple users to book simultaneously without race conditions.
3.  **Green Rewards**: The **Carbon Footprint Tracker** calculates environmental impact and rewards users with "Carbon Points," redeemable for dynamic discounts.
4.  **Waitlist Promotion**: Dual-cursor stored procedures automatically promote waitlisted passengers based on priority queueing theory.

### Educational Context & Extensibility
Developed as a capstone project for a Database Management Systems course, RailConnect adheres to strict architectural standards, including 3NF normalization and robust referential integrity. The project is designed with extensibility in mind; the modular nature of the PL/pgSQL scripts allows for the easy addition of new features—such as dynamic pricing based on demand or multi-modal transport integrations—without requiring significant changes to the frontend or backend application code.

### Conclusion
RailConnect is more than a booking platform; it is a showcase of advanced database engineering. By merging traditional RDBMS power with modern full-stack technologies, it provides a scalable, secure, and environmentally conscious solution for the future of railway management.
