package com.railconnect.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class CustomConcurrencyException extends RuntimeException {
    public CustomConcurrencyException(String message) {
        super(message);
    }
}
