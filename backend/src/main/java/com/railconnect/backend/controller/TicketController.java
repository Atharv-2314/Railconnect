package com.railconnect.backend.controller;

import com.railconnect.backend.dto.TicketDetailDto;
import com.railconnect.backend.security.JwtUtil;
import com.railconnect.backend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final JwtUtil jwtUtil;

    @GetMapping("/my")
    public ResponseEntity<List<TicketDetailDto>> getMyTickets(
            @RequestHeader("Authorization") String token) {
        Long userId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(ticketService.getTicketsForUser(userId));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<TicketDetailDto> getTicketById(
            @RequestHeader("Authorization") String token,
            @PathVariable Long ticketId) {
        Long userId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(ticketService.getTicketById(ticketId, userId));
    }

    @PostMapping("/cancel/{ticketId}")
    public ResponseEntity<TicketDetailDto> cancelTicket(
            @RequestHeader("Authorization") String token,
            @PathVariable Long ticketId) {
        Long userId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(ticketService.cancelTicket(ticketId, userId));
    }

    /** Returns tickets promoted from waitlist that the user hasn't yet been notified about. */
    @GetMapping("/notifications")
    public ResponseEntity<List<TicketDetailDto>> getUnnotifiedTickets(
            @RequestHeader("Authorization") String token) {
        Long userId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(ticketService.getUnnotifiedTickets(userId));
    }

    /** Called by the frontend after showing the notification banner — marks ticket as seen. */
    @PostMapping("/acknowledge/{ticketId}")
    public ResponseEntity<Void> acknowledgeTicket(
            @RequestHeader("Authorization") String token,
            @PathVariable Long ticketId) {
        Long userId = jwtUtil.extractUserId(token.substring(7));
        ticketService.acknowledgeTicket(ticketId, userId);
        return ResponseEntity.ok().build();
    }
}
