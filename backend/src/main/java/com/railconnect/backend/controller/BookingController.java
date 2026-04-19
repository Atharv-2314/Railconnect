package com.railconnect.backend.controller;

import com.railconnect.backend.dto.BookingRequest;
import com.railconnect.backend.dto.BookingResponse;
import com.railconnect.backend.security.JwtUtil;
import com.railconnect.backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @RequestHeader("Authorization") String token,
            @RequestBody BookingRequest request) {
        
        // Extract userId securely from token
        String jwt = token.substring(7);
        Long userId = jwtUtil.extractUserId(jwt);
        request.setUserId(userId);
        
        return ResponseEntity.ok(bookingService.bookTicket(request));
    }
}
