package com.onepage.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("user_credits")
public class UserCredits {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private BigDecimal balance;     // Current credits balance

    private BigDecimal totalSpent;   // Total credits spent

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
