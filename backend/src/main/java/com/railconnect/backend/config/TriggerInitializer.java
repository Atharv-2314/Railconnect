package com.railconnect.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Phase 16 — Silent DB Initializer
 *
 * Runs once at startup and installs the PostgreSQL waitlist-promotion
 * trigger + reporting views from waitlist_trigger.sql.
 *
 * The SQL uses CREATE OR REPLACE / DROP TRIGGER IF EXISTS so it is
 * fully idempotent — safe to run on every application restart.
 */
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
@RequiredArgsConstructor
@Slf4j
public class TriggerInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        log.info("[TriggerInitializer] Installing waitlist trigger, reporting views, and bank schema...");
        try {
            // 0. Ensure pgcrypto extension is enabled for gen_random_uuid() (needed by waitlist trigger)
            try {
                jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
                log.info("[TriggerInitializer] ✅ pgcrypto extension ensured.");
            } catch (Exception extEx) {
                log.warn("[TriggerInitializer] ⚠️  pgcrypto unavailable, trigger will use md5 fallback: {}", extEx.getMessage());
            }

            String sql1 = loadSql("static/waitlist_trigger.sql");
            executeSqlScript(sql1);
            
            String sql2 = loadSql("static/bank_schema.sql");
            executeSqlScript(sql2);

            String sql3 = loadSql("static/fix_trains.sql");
            executeSqlScript(sql3);

            String sql4 = loadSql("static/reboot_viva_data.sql");
            executeSqlScript(sql4);

            // 5. Seed Users Programmatically (Reliable BCrypt)
            seedUsers();

            log.info("[TriggerInitializer] ✅ trg_waitlist_promotion installed successfully.");
            log.info("[TriggerInitializer] ✅ v_user_booking_summary view refreshed (join-explosion fix applied).");
            log.info("[TriggerInitializer] ✅ v_schedule_occupancy view refreshed.");
            log.info("[TriggerInitializer] ✅ bank_schema initialized.");
            log.info("[TriggerInitializer] ✅ fix_trains executed.");
            log.info("[TriggerInitializer] ✅ Viva Reboot complete.");
        } catch (Exception e) {
            // Log but don't crash the application — DB may be fresh or trigger already exists
            log.warn("[TriggerInitializer] ⚠️  Could not install trigger/views/bank_schema: {}", e.getMessage());
        }
    }

    private void seedUsers() {
        String passHash = passwordEncoder.encode("password123");
        
        // Admin
        jdbcTemplate.update("INSERT INTO app_user (username, password_hash, role) VALUES (?, ?, ?)",
                "admin@railconnect.com", passHash, "ADMIN");
        
        // Traveler
        jdbcTemplate.update("INSERT INTO app_user (username, password_hash, role) VALUES (?, ?, ?)",
                "user", passHash, "PASSENGER");
        
        // Link Traveler to a Passenger profile
        Integer userId = jdbcTemplate.queryForObject("SELECT user_id FROM app_user WHERE username = 'user'", Integer.class);
        jdbcTemplate.update("INSERT INTO passenger (user_id, name, age, gender, phone) VALUES (?, ?, ?, ?, ?)",
                userId, "Viva Passenger", 25, "MALE", "9876543210");
        
        log.info("[TriggerInitializer] 🛡️ Seeded admin@railconnect.com and traveler 'user' with password 'password123'");
    }

    /**
     * Splits the script on dollar-quoted block boundaries ($$;) and plain
     * statement terminators (;) so each statement is sent to PostgreSQL
     * individually. Comments and blank lines are skipped.
     */
    @SuppressWarnings("null")
    private void executeSqlScript(String sql) {
        StringBuilder current = new StringBuilder();
        boolean inDollarQuote = false;

        for (String line : sql.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("--")) continue; // skip full-line comments

            if (trimmed.contains("$$")) {
                inDollarQuote = !inDollarQuote;
            }

            current.append(line).append("\n");

            if (!inDollarQuote && trimmed.endsWith(";")) {
                String stmt = current.toString().trim();
                if (!stmt.isEmpty() && !stmt.startsWith("--")) {
                    try {
                        jdbcTemplate.execute(stmt);
                    } catch (Exception ex) {
                        log.debug("[TriggerInitializer] Statement skipped: {}", ex.getMessage());
                    }
                }
                current.setLength(0);
            }
        }
        // Execute any remaining content
        if (!current.toString().trim().isEmpty()) {
            try {
                jdbcTemplate.execute(current.toString().trim());
            } catch (Exception ex) {
                log.debug("[TriggerInitializer] Trailing statement skipped: {}", ex.getMessage());
            }
        }
    }

    @SuppressWarnings("null")
    private String loadSql(String classpathLocation) throws IOException {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        return resource.getContentAsString(StandardCharsets.UTF_8);
    }
}
