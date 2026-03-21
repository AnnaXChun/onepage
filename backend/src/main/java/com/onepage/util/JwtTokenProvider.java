package com.onepage.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Token Provider - handles token generation, validation, and refresh.
 * Secrets must be at least 256 bits (32+ characters) for HS256.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:604800000}")
    private Long expiration;

    @Value("${jwt.refresh-expiration:2592000000}")
    private Long refreshExpiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generate access token (default 7 days).
     */
    public String generateAccessToken(Long userId, String username) {
        return generateToken(userId, username, expiration);
    }

    /**
     * Generate refresh token (default 30 days).
     */
    public String generateRefreshToken(Long userId, String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("type", "refresh");

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generate a token with custom expiration.
     */
    public String generateToken(Long userId, String username, Long expMs) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Parse and validate token, returning claims.
     * Returns null if token is invalid/expired.
     */
    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            log.debug("JWT token expired: {}", e.getMessage());
            return null;
        } catch (JwtException e) {
            log.debug("JWT token invalid: {}", e.getMessage());
            return null;
        }
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        if (claims == null) return null;
        return claims.get("userId", Long.class);
    }

    public String getUsernameFromToken(String token) {
        Claims claims = parseToken(token);
        if (claims == null) return null;
        return claims.getSubject();
    }

    public boolean isRefreshToken(String token) {
        Claims claims = parseToken(token);
        if (claims == null) return false;
        return "refresh".equals(claims.get("type", String.class));
    }

    /**
     * Validate token - returns true if valid and not expired.
     */
    public boolean validateToken(String token) {
        return parseToken(token) != null;
    }

    /**
     * Check if token is expired.
     */
    public boolean isTokenExpired(String token) {
        Claims claims = parseToken(token);
        if (claims == null) return true;
        Date expiration = claims.getExpiration();
        return expiration != null && expiration.before(new Date());
    }

    /**
     * Generate both access and refresh tokens.
     */
    public Map<String, String> generateTokenPair(Long userId, String username) {
        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", generateAccessToken(userId, username));
        tokens.put("refreshToken", generateRefreshToken(userId, username));
        return tokens;
    }
}
