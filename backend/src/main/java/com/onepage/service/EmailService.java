package com.onepage.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username:noreply@vibe.com}")
    private String fromAddress;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    /**
     * Send email verification to user.
     * Uses SendGrid SMTP via Spring Mail with Thymeleaf template rendering (per D-10).
     */
    public void sendVerificationEmail(String to, String username, String token) {
        try {
            String verifyUrl = baseUrl + "/verify-email?token=" + token;
            int expiresInHours = 24;

            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("username", username);
            context.setVariable("verificationUrl", verifyUrl);
            context.setVariable("expiresInHours", expiresInHours);

            // Render template using Thymeleaf
            String htmlContent = templateEngine.process("email/email-verification", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Verify your Vibe account email");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Verification email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", to, e.getMessage());
            // Retry up to 3 times with exponential backoff
            retrySendVerificationEmail(to, username, token, 1);
        }
    }

    private void retrySendVerificationEmail(String to, String username, String token, int attempt) {
        if (attempt > 3) {
            log.error("Failed to send verification email after 3 attempts: {}", to);
            return;
        }
        try {
            long delay = (long) Math.pow(2, attempt) * 1000; // 2, 4, 8 seconds
            Thread.sleep(delay);

            String verifyUrl = baseUrl + "/verify-email?token=" + token;
            int expiresInHours = 24;

            Context context = new Context();
            context.setVariable("username", username);
            context.setVariable("verificationUrl", verifyUrl);
            context.setVariable("expiresInHours", expiresInHours);

            String htmlContent = templateEngine.process("email/email-verification", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Verify your Vibe account email");
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Verification email sent after {} attempts to: {}", attempt, to);
        } catch (Exception e) {
            log.error("Retry {} failed for {}: {}", attempt, to, e.getMessage());
            retrySendVerificationEmail(to, username, token, attempt + 1);
        }
    }

    /**
     * Send first visitor notification email to blog owner.
     * Fire-and-forget: failures are logged but do not throw.
     */
    public void sendFirstVisitorEmail(String to, String username, String siteName, String shareCode) {
        try {
            String shareUrl = baseUrl + "/share/" + shareCode;

            Context context = new Context();
            context.setVariable("username", username);
            context.setVariable("siteName", siteName);
            context.setVariable("shareUrl", shareUrl);

            String htmlContent = templateEngine.process("email/first-visitor", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Your first visitor! - " + siteName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("First visitor email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send first visitor email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Send generation complete notification email to user.
     * Fire-and-forget: failures are logged but do not block completion.
     */
    public void sendGenerationCompleteEmail(String to, String username, String siteName, String shareCode) {
        try {
            String shareUrl = baseUrl + "/share/" + shareCode;

            Context context = new Context();
            context.setVariable("username", username);
            context.setVariable("siteName", siteName);
            context.setVariable("shareUrl", shareUrl);

            String htmlContent = templateEngine.process("email/generation-complete", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Your website is ready - " + siteName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Generation complete email sent to: {} for site: {}", to, siteName);
        } catch (Exception e) {
            log.error("Failed to send generation complete email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Send PDF delivery email with PDF attachment.
     * EML-05, EML-06: PDF delivered via email with 24h download link
     */
    public void sendPdfDeliveryEmail(String to, String username, String siteName, byte[] pdfBytes, String downloadToken) {
        try {
            String downloadUrl = baseUrl + "/pdf/download-email/" + downloadToken;

            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("username", username);
            context.setVariable("siteName", siteName);
            context.setVariable("downloadUrl", downloadUrl);

            // Render template using Thymeleaf
            String htmlContent = templateEngine.process("email/pdf-delivery", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Your PDF Export - " + siteName);
            helper.setText(htmlContent, true);

            // Add PDF attachment
            helper.addAttachment(siteName + ".pdf", new ByteArrayResource(pdfBytes));

            mailSender.send(message);
            log.info("PDF delivery email sent to: {} for site: {}", to, siteName);
        } catch (Exception e) {
            log.error("Failed to send PDF delivery email to {}: {}", to, e.getMessage());
            // Fire-and-forget: failures are logged but do not block the operation
        }
    }
}