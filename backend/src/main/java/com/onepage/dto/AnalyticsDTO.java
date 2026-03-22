package com.onepage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDTO {

    private Long blogId;

    private String blogTitle;

    private Integer totalPageViews;

    private Integer totalUniqueVisitors;

    private List<DailyStat> dailyStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyStat {
        private String date;
        private Integer pageViews;
        private Integer uniqueVisitors;
    }
}
