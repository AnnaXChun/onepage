package com.onepage.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;

    private String email;

    private String avatar;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private Boolean vipStatus;          // true if VIP is active

    private LocalDateTime vipExpireTime; // VIP subscription expiration

    private String robotsTxt;            // custom robots.txt content for SEO-03

    private Boolean emailVerified = false;           // email verification status
    private String verificationToken;                  // UUID token for email verification
    private LocalDateTime verificationExpiresAt;      // token expiry time (24hrs from creation)
    private Integer verificationResendCount = 0;       // count of resend requests (max 3 per 24hrs)
    private LocalDateTime verificationResendResetAt;  // when the resend count resets (24hrs)

    // Phone and SMS verification
    private String phone;                              // 手机号
    private Boolean phoneVerified = false;            // 手机号是否已验证
    private String smsCode;                            // SMS验证码
    private LocalDateTime smsCodeExpiresAt;           // 验证码过期时间
    private Integer smsSendCount = 0;                 // 今日发送次数
    private LocalDateTime smsSendResetAt;             // 发送计数重置时间
}
