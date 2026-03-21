package com.onepage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.onepage.exception.BusinessException;
import com.onepage.mapper.TemplateMapper;
import com.onepage.mapper.UserTemplatePurchaseMapper;
import com.onepage.model.Template;
import com.onepage.model.UserTemplatePurchase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplatePurchaseService {

    private final UserTemplatePurchaseMapper purchaseMapper;
    private final UserCreditsService userCreditsService;
    private final TemplateMapper templateMapper;

    /**
     * Purchase a template for a user (one-time purchase).
     * PAY-03, PAY-05
     */
    @Transactional
    public void purchaseTemplate(Long userId, String templateId, String orderNo) {
        // Check if already purchased
        if (hasPurchasedTemplate(userId, templateId)) {
            throw BusinessException.badRequest("Template already purchased");
        }

        // Get template price
        Template template = templateMapper.selectById(templateId);
        if (template == null) {
            throw BusinessException.badRequest("Template not found");
        }
        if (template.getPrice() == null || template.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw BusinessException.badRequest("Template is free, no purchase needed");
        }

        // Deduct credits
        userCreditsService.deductCredits(userId, template.getPrice());

        // Record purchase
        UserTemplatePurchase purchase = new UserTemplatePurchase();
        purchase.setUserId(userId);
        purchase.setTemplateId(templateId);
        purchase.setOrderNo(orderNo);
        purchase.setPurchaseTime(LocalDateTime.now());
        purchase.setCreateTime(LocalDateTime.now());

        purchaseMapper.insert(purchase);
        log.info("Template purchased: userId={}, templateId={}, orderNo={}, price={}",
            userId, templateId, orderNo, template.getPrice());
    }

    /**
     * Check if user has already purchased a template.
     * PAY-05: Template purchase is one-time (lifetime access)
     */
    public boolean hasPurchasedTemplate(Long userId, String templateId) {
        return purchaseMapper.selectCount(
            new LambdaQueryWrapper<UserTemplatePurchase>()
                .eq(UserTemplatePurchase::getUserId, userId)
                .eq(UserTemplatePurchase::getTemplateId, templateId)
        ) > 0;
    }
}
