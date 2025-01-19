package com.site.drishyam.controller;

import com.site.drishyam.util.JWTUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class LoginController {

    private final JWTUtil jwtUtils;

    @Value("${app.security.username}")
    private String USERNAME;

    @Value("${app.security.password}")
    private String PASSWORD;

    public LoginController(JWTUtil jwtUtils) {
        this.jwtUtils = jwtUtils;
    }


    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        if (username.equals(USERNAME) && password.equals(PASSWORD)) {
            String token = jwtUtils.generateToken(username);

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).build();
        }
    }
}
