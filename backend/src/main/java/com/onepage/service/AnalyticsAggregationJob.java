package com.onepage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.onepage.mapper.BlogDailySourceStatsMapper;
import com.onepage.mapper.PageViewMapper;
import com.onepage.model.BlogDailySourceStats;
import com.onepage.model.PageView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsAggregationJob {

    private final PageViewMapper pageViewMapper;
    private final BlogDailySourceStatsMapper sourceStatsMapper;

    /**
     * Aggregate page views by source for previous day.
     * Runs daily at 00:05 to ensure all page views for previous day are recorded.
     * CRON: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 5 0 * * ?")
    public void aggregateDailySourceStats() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("Starting daily source aggregation for date: {}", yesterday);

        try {
            // Query all page views for yesterday grouped by blog_id and source
            LocalDateTime startOfDay = yesterday.atStartOfDay();
            LocalDateTime endOfDay = yesterday.plusDays(1).atStartOfDay();

            List<PageView> pageViews = pageViewMapper.selectList(
                new LambdaQueryWrapper<PageView>()
                    .ge(PageView::getVisitedAt, startOfDay)
                    .lt(PageView::getVisitedAt, endOfDay)
            );

            // Group by blogId and source
            Map<String, Long> sourceCounts = pageViews.stream()
                .collect(Collectors.groupingBy(
                    pv -> pv.getBlogId() + "_" + (pv.getRefererSource() != null ? pv.getRefererSource() : "DIRECT"),
                    Collectors.counting()
                ));

            // Upsert each source stat
            for (Map.Entry<String, Long> entry : sourceCounts.entrySet()) {
                String[] parts = entry.getKey().split("_", 2);
                Long blogId = Long.parseLong(parts[0]);
                String source = parts.length > 1 ? parts[1] : "DIRECT";
                int count = entry.getValue().intValue();

                BlogDailySourceStats stat = new BlogDailySourceStats();
                stat.setBlogId(blogId);
                stat.setStatDate(yesterday);
                stat.setSource(source);
                stat.setPageViews(count);
                stat.setUniqueVisitors(count); // Simplified - unique visitor logic deferred
                stat.setCreatedAt(LocalDateTime.now());

                // Upsert logic using MyBatis-Plus
                BlogDailySourceStats existing = sourceStatsMapper.selectOne(
                    new LambdaQueryWrapper<BlogDailySourceStats>()
                        .eq(BlogDailySourceStats::getBlogId, blogId)
                        .eq(BlogDailySourceStats::getStatDate, yesterday)
                        .eq(BlogDailySourceStats::getSource, source)
                );

                if (existing != null) {
                    stat.setId(existing.getId());
                    sourceStatsMapper.updateById(stat);
                } else {
                    sourceStatsMapper.insert(stat);
                }
            }

            log.info("Daily source aggregation completed. Processed {} source combinations", sourceCounts.size());
        } catch (Exception e) {
            log.error("Daily source aggregation failed", e);
        }
    }
}