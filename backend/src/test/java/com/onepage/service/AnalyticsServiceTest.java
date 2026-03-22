package com.onepage.service;

import com.onepage.dto.AnalyticsDTO;
import com.onepage.mapper.BlogDailySourceStatsMapper;
import com.onepage.mapper.BlogDailyStatsMapper;
import com.onepage.mapper.PageViewMapper;
import com.onepage.model.Blog;
import com.onepage.model.BlogDailySourceStats;
import com.onepage.model.BlogDailyStats;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private PageViewMapper pageViewMapper;

    @Mock
    private BlogDailyStatsMapper blogDailyStatsMapper;

    @Mock
    private BlogDailySourceStatsMapper sourceStatsMapper;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private BlogService blogService;

    @Mock
    private EmailService emailService;

    @Mock
    private com.onepage.mapper.UserMapper userMapper;

    @Mock
    private SetOperations<String, Object> setOperations;

    @InjectMocks
    private AnalyticsService analyticsService;

    private Blog testBlog;

    @BeforeEach
    void setUp() {
        testBlog = new Blog();
        testBlog.setId(1L);
        testBlog.setUserId(100L);
        testBlog.setTitle("Test Blog");
        testBlog.setShareCode("abc123");
        testBlog.setStatus(1);
    }

    @Test
    void testGetBlogStats_returnsDailyStatsWith7DayPeriod() {
        // Given
        when(blogService.getById(1L)).thenReturn(testBlog);
        when(blogDailyStatsMapper.selectList(any())).thenReturn(List.of(
            createDailyStat(1L, LocalDate.now().minusDays(1), 10, 5),
            createDailyStat(1L, LocalDate.now().minusDays(2), 15, 8)
        ));
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(setOperations.size(anyString())).thenReturn(0L);

        // When
        AnalyticsDTO result = analyticsService.getBlogStats(1L, "7d");

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getBlogId());
        assertEquals("Test Blog", result.getBlogTitle());
        assertEquals(25, result.getTotalPageViews()); // 10 + 15
        assertEquals(13, result.getTotalUniqueVisitors()); // 5 + 8
        assertEquals(2, result.getDailyStats().size());
    }

    @Test
    void testGetBlogStats_returnsDailyStatsWith30DayPeriod() {
        // Given
        when(blogService.getById(1L)).thenReturn(testBlog);
        when(blogDailyStatsMapper.selectList(any())).thenReturn(List.of(
            createDailyStat(1L, LocalDate.now().minusDays(5), 20, 10),
            createDailyStat(1L, LocalDate.now().minusDays(15), 30, 15)
        ));
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(setOperations.size(anyString())).thenReturn(0L);

        // When
        AnalyticsDTO result = analyticsService.getBlogStats(1L, "30d");

        // Then
        assertNotNull(result);
        assertEquals(50, result.getTotalPageViews()); // 20 + 30
    }

    @Test
    void testGetBlogStats_returnsDailyStatsWith90DayPeriod() {
        // Given
        when(blogService.getById(1L)).thenReturn(testBlog);
        when(blogDailyStatsMapper.selectList(any())).thenReturn(List.of(
            createDailyStat(1L, LocalDate.now().minusDays(30), 50, 25),
            createDailyStat(1L, LocalDate.now().minusDays(60), 100, 50)
        ));
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(setOperations.size(anyString())).thenReturn(0L);

        // When
        AnalyticsDTO result = analyticsService.getBlogStats(1L, "90d");

        // Then
        assertNotNull(result);
        assertEquals(150, result.getTotalPageViews()); // 50 + 100
    }

    @Test
    void testGetBlogStats_returnsRefererSourcesWithCorrectPercentages() {
        // Given
        when(blogService.getById(1L)).thenReturn(testBlog);
        when(blogDailyStatsMapper.selectList(any())).thenReturn(List.of(
            createDailyStat(1L, LocalDate.now().minusDays(1), 100, 50)
        ));
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(setOperations.size(anyString())).thenReturn(0L);

        // Source stats: DIRECT=50, SEARCH_ENGINE=30, SOCIAL=20 (total=100)
        when(sourceStatsMapper.selectList(any())).thenReturn(List.of(
            createSourceStat(1L, LocalDate.now().minusDays(1), "DIRECT", 50),
            createSourceStat(1L, LocalDate.now().minusDays(1), "SEARCH_ENGINE", 30),
            createSourceStat(1L, LocalDate.now().minusDays(1), "SOCIAL", 20)
        ));

        // When
        AnalyticsDTO result = analyticsService.getBlogStats(1L, "7d");

        // Then
        assertNotNull(result.getRefererSources());
        assertEquals(3, result.getRefererSources().size());

        // Find DIRECT source
        AnalyticsDTO.RefererSourceStat directStat = result.getRefererSources().stream()
            .filter(s -> "DIRECT".equals(s.getSource()))
            .findFirst()
            .orElse(null);
        assertNotNull(directStat);
        assertEquals("Direct", directStat.getDisplayName());
        assertEquals(50, directStat.getPageViews());
        assertEquals(50, directStat.getPercentage()); // 50%

        // Find SEARCH_ENGINE source
        AnalyticsDTO.RefererSourceStat searchStat = result.getRefererSources().stream()
            .filter(s -> "SEARCH_ENGINE".equals(s.getSource()))
            .findFirst()
            .orElse(null);
        assertNotNull(searchStat);
        assertEquals("Search Engine", searchStat.getDisplayName());
        assertEquals(30, searchStat.getPageViews());
        assertEquals(30, searchStat.getPercentage()); // 30%

        // Find SOCIAL source
        AnalyticsDTO.RefererSourceStat socialStat = result.getRefererSources().stream()
            .filter(s -> "SOCIAL".equals(s.getSource()))
            .findFirst()
            .orElse(null);
        assertNotNull(socialStat);
        assertEquals("Social", socialStat.getDisplayName());
        assertEquals(20, socialStat.getPageViews());
        assertEquals(20, socialStat.getPercentage()); // 20%
    }

    @Test
    void testGetBlogStats_returnsEmptyListsForUnknownBlog() {
        // Given
        when(blogService.getById(999L)).thenReturn(null);

        // When
        AnalyticsDTO result = analyticsService.getBlogStats(999L, "7d");

        // Then
        assertNotNull(result);
        assertEquals(999L, result.getBlogId());
        assertEquals("Unknown", result.getBlogTitle());
        assertEquals(0, result.getTotalPageViews());
        assertEquals(0, result.getTotalUniqueVisitors());
        assertTrue(result.getDailyStats().isEmpty());
        assertTrue(result.getRefererSources().isEmpty());
    }

    @Test
    void testGetBlogStats_handlesZeroTotalPageViewsGracefully() {
        // Given
        when(blogService.getById(1L)).thenReturn(testBlog);
        when(blogDailyStatsMapper.selectList(any())).thenReturn(List.of());
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(setOperations.size(anyString())).thenReturn(0L);
        when(sourceStatsMapper.selectList(any())).thenReturn(List.of());

        // When
        AnalyticsDTO result = analyticsService.getBlogStats(1L, "7d");

        // Then
        assertNotNull(result);
        assertEquals(0, result.getTotalPageViews());
        assertTrue(result.getRefererSources().isEmpty());
    }

    private BlogDailyStats createDailyStat(Long blogId, LocalDate date, int pageViews, int uniqueVisitors) {
        BlogDailyStats stat = new BlogDailyStats();
        stat.setBlogId(blogId);
        stat.setStatDate(date);
        stat.setPageViews(pageViews);
        stat.setUniqueVisitors(uniqueVisitors);
        return stat;
    }

    private BlogDailySourceStats createSourceStat(Long blogId, LocalDate date, String source, int pageViews) {
        BlogDailySourceStats stat = new BlogDailySourceStats();
        stat.setBlogId(blogId);
        stat.setStatDate(date);
        stat.setSource(source);
        stat.setPageViews(pageViews);
        stat.setUniqueVisitors(pageViews);
        stat.setCreatedAt(LocalDateTime.now());
        return stat;
    }
}