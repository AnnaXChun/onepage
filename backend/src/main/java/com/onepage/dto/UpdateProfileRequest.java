package com.onepage.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(max = 500, message = "Bio must be at most 500 characters")
    private String bio;

    private String avatar;  // URL to avatar image

    @Size(max = 50, message = "Twitter username must be at most 50 characters")
    private String twitter;

    @Size(max = 50, message = "GitHub username must be at most 50 characters")
    private String github;

    @Size(max = 100, message = "LinkedIn username must be at most 100 characters")
    private String linkedin;

    @Size(max = 200, message = "Website URL must be at most 200 characters")
    private String website;
}
