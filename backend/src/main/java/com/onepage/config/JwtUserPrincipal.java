package com.onepage.config;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * Principal object stored in SecurityContext for authenticated users.
 */
@Data
@AllArgsConstructor
public class JwtUserPrincipal implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    private Long userId;
    private String username;
}
