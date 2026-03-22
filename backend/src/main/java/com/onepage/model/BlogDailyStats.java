package com.onepage.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("blog_daily_stats")
public class BlogDailyStats {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long blogId;

    private LocalDate statDate;

    private Integer pageViews;

    private Integer uniqueVisitors;

    private LocalDateTime createdAt;
}
