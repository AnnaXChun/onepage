package com.onepage.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("pdf_jobs")
public class PdfJob {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String jobId;           // UUID from PdfJobMessage

    private Long userId;

    private Long blogId;

    private Integer jobType;        // 1=preview(free), 2=export(paid)

    private Integer status;         // 0=pending, 1=completed, 2=failed

    private String filePath;         // Path to stored PDF

    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    private LocalDateTime expiresAt; // When preview/export link expires
}
