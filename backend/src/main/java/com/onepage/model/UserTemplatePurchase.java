package com.onepage.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_template_purchases")
public class UserTemplatePurchase {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String templateId;   // Template ID purchased

    private String orderNo;       // Order number for this purchase

    private LocalDateTime purchaseTime;

    private LocalDateTime createTime;
}