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

    private String coverImage;

    private String templateId;

    private String shareCode;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
