package com.onepage.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.dto.AnalyticsDTO;
import com.onepage.mapper.BlogDailyStatsMapper;
import com.onepage.mapper.PageViewMapper;
import com.onepage.model.Blog;
import com.onepage.model.BlogDailyStats;
import com.onepage.model.PageView;
import com.onepage.util.RefererParser;
import com.onepage.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService extends ServiceImpl<PageViewMapper, PageView> {

    private final PageViewMapper pageViewMapper;
    private final BlogDailyStatsMapper blogDailyStatsMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final BlogService blogService;
    private final EmailService emailService;
    private final com.onepage.mapper.UserMapper userMapper;

    private static final String PAGEVIEW_REDIS_KEY = "analytics:pv:";
    private static final String VISITOR_REDIS_KEY = "analytics:uv:";
    private static final String FIRST_VISITOR_SENT_KEY = "notification:first_visitor_sent:";
    private static final int FIRST_VISITOR_KEY_TTL_DAYS = 7;

    /**
     * Record a page view - called from SiteController when serving published sites.
     * Non-blocking via @Async to avoid slowing down page serving.
     */
    @Async
    public void recordPageView(Long blogId, String clientIp, String userAgent, String referer) {
        try {
            String fingerprint = generateFingerprint(clientIp, userAgent);
            LocalDateTime now = LocalDateTime.now();

            // Parse referer to categorize source
            RefererParser.Source source = RefererParser.categorize(referer);

            // Save raw page view
            PageView pageView = new PageView();
            pageView.setBlogId(blogId);
            pageView.setVisitorFingerprint(fingerprint);
            pageView.setVisitedAt(now);
            pageView.setUserAgent(truncate(userAgent, 500));
            pageView.setReferer(truncate(referer, 500));
            pageView.setRefererSource(source.name());  // Store categorized source
            pageViewMapper.insert(pageView);

            // Increment Redis counters for real-time aggregation
            String dateKey = now.toLocalDate().toString();
            redisTemplate.opsForSet().add(PAGEVIEW_REDIS_KEY + blogId + ":" + dateKey + ":visitors", fingerprint);

            log.debug("Recorded page view for blogId={}, fingerprint={}", blogId, fingerprint);

            // Send first visitor email notification if this is the first visit
            sendFirstVisitorEmailIfNeeded(blogId);
        } catch (Exception e) {
            log.error("Failed to record page view for blogId={}", blogId, e);
        }
    }

    /**
     * Send first visitor notification email if this is the first visitor for the blog.
     * Uses Redis setIfAbsent for atomic check-and-set to prevent duplicate emails.
     */
    private void sendFirstVisitorEmailIfNeeded(Long blogId) {
        String notificationKey = FIRST_VISITOR_SENT_KEY + blogId;
        // Atomically check and set - only one thread will succeed
        Boolean wasSet = redisTemplate.opsForValue().setIfAbsent(
            notificationKey, true, FIRST_VISITOR_KEY_TTL_DAYS, TimeUnit.DAYS);

        if (wasSet == null || !wasSet) {
            return; // Already notified or race condition lost
        }

        // We won the race - send the email
        try {
            Blog blog = blogService.getById(blogId);
            if (blog == null) return;

            User user = userMapper.selectById(blog.getUserId());
            if (user == null || user.getEmail() == null || !user.getEmailVerified()) {
                log.info("Skipping first visitor email for blogId={}: no verified email", blogId);
                return;
            }

            emailService.sendFirstVisitorEmail(
                user.getEmail(),
                user.getUsername(),
                blog.getTitle(),
                blog.getShareCode()
            );
            log.info("First visitor email sent for blogId={}", blogId);
        } catch (Exception e) {
            log.error("Failed to send first visitor email for blogId={}: {}", blogId, e.getMessage());
        }
    }

    /**
     * Get analytics stats for a specific blog.
     * ANAL-01, ANAL-02
     */
    public AnalyticsDTO getBlogStats(Long blogId, String period) {
        Blog blog = blogService.getById(blogId);
        if (blog == null) {
            return new AnalyticsDTO(blogId, "Unknown", 0, 0, List.of());
        }

        int days = parsePeriod(period);
        LocalDate startDate = LocalDate.now().minusDays(days);

        List<BlogDailyStats> dailyStats = blogDailyStatsMapper
            .selectList(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<BlogDailyStats>()
                .eq(BlogDailyStats::getBlogId, blogId)
                .ge(BlogDailyStats::getStatDate, startDate)
                .orderByAsc(BlogDailyStats::getStatDate));

        int totalPageViews = dailyStats.stream().mapToInt(BlogDailyStats::getPageViews).sum();
        int totalUniqueVisitors = dailyStats.stream().mapToInt(BlogDailyStats::getUniqueVisitors).sum();

        // Add today's real-time data from Redis
        String todayKey = LocalDate.now().toString();
        Long todayVisitors = redisTemplate.opsForSet().size(PAGEVIEW_REDIS_KEY + blogId + ":" + todayKey + ":visitors");
        if (todayVisitors != null && todayVisitors > 0) {
            totalUniqueVisitors += todayVisitors.intValue();
            totalPageViews += todayVisitors.intValue(); // Approximate page views from today's visitors
        }

        List<AnalyticsDTO.DailyStat> dailyStatList = dailyStats.stream()
            .map(stat -> new AnalyticsDTO.DailyStat(
                stat.getStatDate().toString(),
                stat.getPageViews(),
                stat.getUniqueVisitors()))
            .collect(Collectors.toList());

        return new AnalyticsDTO(blogId, blog.getTitle(), totalPageViews, totalUniqueVisitors, dailyStatList);
    }

    /**
     * Get analytics stats for all blogs belonging to a user.
     * ANAL-03 - Used for dashboard display
     */
    public List<AnalyticsDTO> getUserBlogsStats(Long userId, String period) {
        List<Blog> userBlogs = blogService.lambdaQuery()
            .eq(Blog::getUserId, userId)
            .eq(Blog::getStatus, 1) // Only published blogs
            .list();

        return userBlogs.stream()
            .map(blog -> getBlogStats(blog.getId(), period))
            .collect(Collectors.toList());
    }

    /**
     * Generate a visitor fingerprint from IP and User-Agent.
     */
    private String generateFingerprint(String clientIp, String userAgent) {
        try {
            String input = (clientIp != null ? clientIp : "") + "|" + (userAgent != null ? userAgent : "");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 not available", e);
            return String.valueOf((clientIp + userAgent).hashCode());
        }
    }

    private String truncate(String str, int maxLength) {
        return str != null && str.length() > maxLength ? str.substring(0, maxLength) : str;
    }

    private int parsePeriod(String period) {
        if ("30d".equals(period)) return 30;
        if ("90d".equals(period)) return 90;
        return 7; // Default to 7 days
    }
}