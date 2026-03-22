package com.onepage.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("blogs")
public class Blog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String title;

    private String content;

    /**
     * Custom SEO meta title (max 255 chars)
     * Falls back to title if not set
     */
    private String metaTitle;

    /**
     * Custom SEO meta description (max 500 chars recommended)
     * Falls back to first 160 chars of content if not set
     */
    private String metaDescription;

    private String coverImage;

    private String templateId;

    private String shareCode;

    private Integer status;

    private String blocks;

    private String htmlContent;

    private LocalDateTime publishTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
