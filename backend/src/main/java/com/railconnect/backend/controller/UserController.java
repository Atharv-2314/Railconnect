package com.railconnect.backend.controller;

import com.railconnect.backend.dto.UserProfileDto;
import com.railconnect.backend.security.JwtUtil;
import com.railconnect.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getProfile(
            @RequestHeader("Authorization") String token) {
        Long userId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(userService.getProfile(userId));
    }
}
