package com.onepage.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String avatar;
    private Integer status;
}
