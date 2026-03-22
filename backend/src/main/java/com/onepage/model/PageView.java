package com.onepage.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("page_views")
public class PageView {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long blogId;

    private String visitorFingerprint;

    private LocalDateTime visitedAt;

    private String referer;

    private String refererSource;  // DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER

    private String userAgent;
}
