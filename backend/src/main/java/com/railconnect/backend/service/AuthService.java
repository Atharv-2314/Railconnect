package com.railconnect.backend.service;

import com.railconnect.backend.dto.AuthResponse;
import com.railconnect.backend.dto.LoginRequest;
import com.railconnect.backend.dto.RegisterRequest;
import com.railconnect.backend.entities.AppUser;
import com.railconnect.backend.entities.Passenger;
import com.railconnect.backend.repositories.AppUserRepository;
import com.railconnect.backend.repositories.PassengerRepository;
import com.railconnect.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PassengerRepository passengerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    @SuppressWarnings("null")
    public AuthResponse registerPassenger(RegisterRequest request) {
        if (appUserRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username is already taken.");
        }

        AppUser user = AppUser.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("PASSENGER")
                .build();

        appUserRepository.save(user);

        Passenger passenger = Passenger.builder()
                .user(user)
                .name(request.getName())
                .age(request.getAge())
                .gender(request.getGender())
                .phone(request.getPhone())
                .build();
        passengerRepository.save(passenger);

        String jwtToken = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getRole());
        return AuthResponse.builder()
                .token(jwtToken)
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    @Transactional
    @SuppressWarnings("null")
    public AuthResponse createAdmin(RegisterRequest request) {
        if (appUserRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username is already taken.");
        }

        AppUser user = AppUser.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("ADMIN")
                .build();

        appUserRepository.save(user);

        String jwtToken = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getRole());
        return AuthResponse.builder()
                .token(jwtToken)
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        AppUser user = appUserRepository.findByUsername(request.getUsername())
                .orElseThrow();

        String jwtToken = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getRole());
        return AuthResponse.builder()
                .token(jwtToken)
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }
}
