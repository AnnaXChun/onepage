package com.onepage.service;

import com.onepage.exception.BusinessException;
import com.onepage.mapper.TemplateMapper;
import com.onepage.mapper.UserMapper;
import com.onepage.mapper.UserTemplatePurchaseMapper;
import com.onepage.model.Template;
import com.onepage.model.User;
import com.onepage.model.UserTemplatePurchase;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class VipService {

    private final UserMapper userMapper;
    private final UserTemplatePurchaseMapper purchaseMapper;
    private final TemplateMapper templateMapper;

    private static final BigDecimal VIP_MONTHLY_PRICE = new BigDecimal("10.00");
    private static final int VIP_DURATION_DAYS = 30;

    /**
     * Activate VIP subscription for a user.
     * PAY-01
     */
    public void activateVip(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw BusinessException.badRequest("User not found");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime newExpireTime;

        if (Boolean.TRUE.equals(user.getVipStatus()) && user.getVipExpireTime() != null
                && user.getVipExpireTime().isAfter(now)) {
            // Extend existing VIP
            newExpireTime = user.getVipExpireTime().plusDays(VIP_DURATION_DAYS);
        } else {
            // Start new VIP period
            newExpireTime = now.plusDays(VIP_DURATION_DAYS);
        }

        user.setVipStatus(true);
        user.setVipExpireTime(newExpireTime);
        userMapper.updateById(user);

        log.info("VIP activated for user {}: expires at {}", userId, newExpireTime);
    }

    /**
     * Check if user has VIP status (active subscription).
     * AUTH-03: VIP status checked on protected action
     */
    public boolean isVipActive(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            return false;
        }
        if (!Boolean.TRUE.equals(user.getVipStatus())) {
            return false;
        }
        if (user.getVipExpireTime() == null) {
            return false;
        }
        return user.getVipExpireTime().isAfter(LocalDateTime.now());
    }

    /**
     * Check if user has access to a specific template.
     * PAY-02: VIP users access all templates
     * PAY-03: Non-VIP users can purchase individual templates
     * AUTH-03: This is the service-layer integration point for VIP checks
     *
     * Called by: TemplateService.getTemplateById() before returning template to user
     * NOT called from SecurityConfig (that is for endpoint authentication, not template authorization)
     */
    public boolean hasAccessToTemplate(Long userId, String templateId) {
        // First get the template to check its price
        Template template = templateMapper.selectById(templateId);
        if (template == null) {
            throw BusinessException.badRequest("Template not found");
        }

        // Free templates are accessible to everyone
        if (template.getPrice() == null || template.getPrice().compareTo(BigDecimal.ZERO) == 0) {
            return true;
        }

        // Check VIP status - VIP has access to all templates
        if (isVipActive(userId)) {
            return true;
        }

        // Check individual template purchase
        UserTemplatePurchase purchase = purchaseMapper.selectOne(
            new LambdaQueryWrapper<UserTemplatePurchase>()
                .eq(UserTemplatePurchase::getUserId, userId)
                .eq(UserTemplatePurchase::getTemplateId, templateId)
        );

        return purchase != null;
    }

    /**
     * Get template by ID with access validation.
     * AUTH-03: This method enforces template access in the service layer.
     *
     * @throws BusinessException if template not found or user has no access
     */
    public Template getAccessibleTemplate(Long userId, String templateId) {
        Template template = templateMapper.selectById(templateId);
        if (template == null) {
            throw BusinessException.badRequest("Template not found");
        }

        if (!hasAccessToTemplate(userId, templateId)) {
            throw BusinessException.badRequest("You do not have access to this template. Please purchase or upgrade to VIP.");
        }

        return template;
    }

    /**
     * Get VIP monthly price.
     */
    public BigDecimal getVipMonthlyPrice() {
        return VIP_MONTHLY_PRICE;
    }

    /**
     * Deactivate VIP (called when expired or refunded).
     */
    public void deactivateVip(Long userId) {
        User user = userMapper.selectById(userId);
        if (user != null) {
            user.setVipStatus(false);
            userMapper.updateById(user);
            log.info("VIP deactivated for user: {}", userId);
        }
    }
}