package com.onepage.dto;

import com.onepage.validation.ValidEmail;
import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String username;
    @ValidEmail
    private String email;
    private String avatar;
    private Integer status;
}
