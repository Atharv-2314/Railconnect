package com.railconnect.backend.controller;

import com.railconnect.backend.dto.WaitlistRequest;
import com.railconnect.backend.service.WaitlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/waitlist")
@RequiredArgsConstructor
public class WaitlistController {

    private final WaitlistService waitlistService;

    /**
     * POST /api/waitlist/join
     * Authenticated passenger calls this when a train is sold out.
     */
    @PostMapping("/join")
    public ResponseEntity<Map<String, String>> joinWaitlist(
            @RequestBody WaitlistRequest request,
            Principal principal) {
        String username = principal != null ? principal.getName() : "user";
        String message = waitlistService.joinWaitlist(request, username);
        return ResponseEntity.ok(Map.of("message", message));
    }
}
