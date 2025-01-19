package com.site.drishyam.config;

import com.site.drishyam.util.JWTUtil;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilterConfig extends OncePerRequestFilter {

    private final JWTUtil jwtUtils;

    public JwtAuthFilterConfig(JWTUtil jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String username = jwtUtils.validateToken(token);

            if (username != null) {
                // Authenticate the user
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(username, null, null)
                );
            }
        }

        // Continue the filter chain
        try {
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            throw new RuntimeException("Filter chain interrupted", e);
        }
    }
}
