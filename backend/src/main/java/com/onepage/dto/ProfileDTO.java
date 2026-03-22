package com.onepage.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProfileDTO {
    private String username;
    private String avatar;
    private String bio;
    private String twitter;
    private String github;
    private String linkedin;
    private String website;
    private Boolean vipStatus;
    private LocalDateTime vipExpireTime;
    private List<BlogSummary> blogs;

    @Data
    public static class BlogSummary {
        private Long id;
        private String title;
        private String coverImage;
        private String shareCode;
        private LocalDateTime publishTime;
    }
}