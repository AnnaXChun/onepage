package com.onepage.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("templates")
public class Template {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String description;

    private String thumbnail;

    private String config;

    private BigDecimal price;  // 0 for free, >0 for paid

    private Integer category;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
