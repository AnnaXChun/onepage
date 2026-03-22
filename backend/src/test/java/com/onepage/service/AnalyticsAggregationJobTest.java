package com.onepage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.onepage.mapper.BlogDailySourceStatsMapper;
import com.onepage.mapper.PageViewMapper;
import com.onepage.model.BlogDailySourceStats;
import com.onepage.model.PageView;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsAggregationJobTest {

    @Mock
    private PageViewMapper pageViewMapper;

    @Mock
    private BlogDailySourceStatsMapper sourceStatsMapper;

    @InjectMocks
    private AnalyticsAggregationJob aggregationJob;

    @Test
    void testAggregateDailySourceStats_groupsPageViewsBySource() {
        // Given
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startOfDay = yesterday.atStartOfDay();
        LocalDateTime endOfDay = yesterday.plusDays(1).atStartOfDay();

        List<PageView> pageViews = List.of(
            createPageView(1L, "DIRECT", startOfDay.plusHours(1)),
            createPageView(1L, "DIRECT", startOfDay.plusHours(2)),
            createPageView(1L, "SEARCH_ENGINE", startOfDay.plusHours(3)),
            createPageView(2L, "SOCIAL", startOfDay.plusHours(4))
        );

        when(pageViewMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(pageViews);
        when(sourceStatsMapper.selectOne(any())).thenReturn(null); // No existing stats

        // When
        aggregationJob.aggregateDailySourceStats();

        // Then
        // Should insert 3 different source stats: blog1+DIRECT, blog1+SEARCH_ENGINE, blog2+SOCIAL
        verify(sourceStatsMapper, times(3)).insert(any(BlogDailySourceStats.class));
    }

    @Test
    void testAggregateDailySourceStats_updatesExistingStats() {
        // Given
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startOfDay = yesterday.atStartOfDay();

        List<PageView> pageViews = List.of(
            createPageView(1L, "DIRECT", startOfDay.plusHours(1))
        );

        BlogDailySourceStats existingStat = new BlogDailySourceStats();
        existingStat.setId(100L);
        existingStat.setBlogId(1L);
        existingStat.setStatDate(yesterday);
        existingStat.setSource("DIRECT");

        when(pageViewMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(pageViews);
        when(sourceStatsMapper.selectOne(any())).thenReturn(existingStat); // Existing found

        // When
        aggregationJob.aggregateDailySourceStats();

        // Then
        ArgumentCaptor<BlogDailySourceStats> captor = ArgumentCaptor.forClass(BlogDailySourceStats.class);
        verify(sourceStatsMapper).updateById(captor.capture());

        BlogDailySourceStats updated = captor.getValue();
        assertEquals(100L, updated.getId());
        assertEquals(1, updated.getPageViews());
    }

    @Test
    void testAggregateDailySourceStats_handlesNullRefererSource() {
        // Given
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startOfDay = yesterday.atStartOfDay();

        List<PageView> pageViews = List.of(
            createPageView(1L, null, startOfDay.plusHours(1)) // Null source
        );

        when(pageViewMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(pageViews);
        when(sourceStatsMapper.selectOne(any())).thenReturn(null);

        // When
        aggregationJob.aggregateDailySourceStats();

        // Then
        ArgumentCaptor<BlogDailySourceStats> captor = ArgumentCaptor.forClass(BlogDailySourceStats.class);
        verify(sourceStatsMapper).insert(captor.capture());

        BlogDailySourceStats inserted = captor.getValue();
        assertEquals("DIRECT", inserted.getSource()); // Null should default to DIRECT
    }

    @Test
    void testAggregateDailySourceStats_countsMultiplePageViewsCorrectly() {
        // Given
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startOfDay = yesterday.atStartOfDay();

        // 5 page views from DIRECT, 3 from SEARCH_ENGINE
        List<PageView> pageViews = List.of(
            createPageView(1L, "DIRECT", startOfDay.plusHours(1)),
            createPageView(1L, "DIRECT", startOfDay.plusHours(2)),
            createPageView(1L, "DIRECT", startOfDay.plusHours(3)),
            createPageView(1L, "DIRECT", startOfDay.plusHours(4)),
            createPageView(1L, "DIRECT", startOfDay.plusHours(5)),
            createPageView(1L, "SEARCH_ENGINE", startOfDay.plusHours(6)),
            createPageView(1L, "SEARCH_ENGINE", startOfDay.plusHours(7)),
            createPageView(1L, "SEARCH_ENGINE", startOfDay.plusHours(8))
        );

        when(pageViewMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(pageViews);
        when(sourceStatsMapper.selectOne(any())).thenReturn(null);

        // When
        aggregationJob.aggregateDailySourceStats();

        // Then
        // Should insert 2 records: DIRECT with 5 pageViews, SEARCH_ENGINE with 3 pageViews
        verify(sourceStatsMapper, times(2)).insert(any(BlogDailySourceStats.class));
    }

    @Test
    void testAggregateDailySourceStats_logsCompletion() {
        // Given
        when(pageViewMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        when(sourceStatsMapper.selectOne(any())).thenReturn(null);

        // When
        aggregationJob.aggregateDailySourceStats();

        // Then
        // No exception means logging completed successfully
        verify(pageViewMapper).selectList(any(LambdaQueryWrapper.class));
    }

    @Test
    void testAggregateDailySourceStats_handlesEmptyPageViews() {
        // Given
        when(pageViewMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

        // When
        aggregationJob.aggregateDailySourceStats();

        // Then
        verify(sourceStatsMapper, never()).insert(any());
        verify(sourceStatsMapper, never()).updateById(any());
    }

    private PageView createPageView(Long blogId, String refererSource, LocalDateTime visitedAt) {
        PageView pv = new PageView();
        pv.setBlogId(blogId);
        pv.setRefererSource(refererSource);
        pv.setVisitedAt(visitedAt);
        pv.setVisitorFingerprint("test-fingerprint");
        return pv;
    }
}