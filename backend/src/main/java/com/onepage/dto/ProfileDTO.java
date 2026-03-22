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
    /**
     * Total visitor count across all user's published sites.
     * PROF-11
     */
    private Long totalVisitors;

    @Data
    public static class BlogSummary {
        private Long id;
        private String title;
        private String coverImage;
        private String shareCode;
        private LocalDateTime publishTime;
        /**
         * Whether this blog is the user's featured/pinned site.
         * PROF-12
         */
        private Boolean featured = false;
    }
}