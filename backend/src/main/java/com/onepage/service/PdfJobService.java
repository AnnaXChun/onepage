package com.onepage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.onepage.mapper.PdfJobMapper;
import com.onepage.model.PdfJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfJobService {

    private final PdfJobMapper pdfJobMapper;

    /**
     * Get job by jobId (UUID).
     */
    public PdfJob getJobByJobId(String jobId) {
        return pdfJobMapper.selectOne(new LambdaQueryWrapper<PdfJob>()
            .eq(PdfJob::getJobId, jobId));
    }

    /**
     * Create a new PDF job record.
     */
    public void createJob(String jobId, Long userId, Long blogId, Integer jobType, LocalDateTime expiresAt) {
        PdfJob job = new PdfJob();
        job.setJobId(jobId);
        job.setUserId(userId);
        job.setBlogId(blogId);
        job.setJobType(jobType);
        job.setStatus(0); // pending
        job.setCreatedAt(LocalDateTime.now());
        job.setExpiresAt(expiresAt);
        pdfJobMapper.insert(job);
        log.info("Created PDF job: jobId={}, userId={}, blogId={}, jobType={}", jobId, userId, blogId, jobType);
    }

    /**
     * Mark job as completed with download URL.
     */
    public void completeJob(String jobId, String filePath) {
        PdfJob job = getJobByJobId(jobId);
        if (job != null) {
            job.setStatus(1); // completed
            job.setFilePath(filePath);
            job.setCompletedAt(LocalDateTime.now());
            pdfJobMapper.updateById(job);
            log.info("Completed PDF job: jobId={}, filePath={}", jobId, filePath);
        }
    }

    /**
     * Mark job as failed.
     */
    public void failJob(String jobId) {
        PdfJob job = getJobByJobId(jobId);
        if (job != null) {
            job.setStatus(2); // failed
            pdfJobMapper.updateById(job);
            log.info("Failed PDF job: jobId={}", jobId);
        }
    }
}