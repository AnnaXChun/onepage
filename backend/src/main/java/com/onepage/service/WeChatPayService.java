package com.onepage.service;

import com.github.wxpay.sdk.WXPay;
import com.github.wxpay.sdk.WXPayUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class WeChatPayService {

    private final PaymentLockService paymentLockService;
    private final UserCreditsService userCreditsService;

    @Value("${wechat.appid:}")
    private String appId;

    @Value("${wechat.mchid:}")
    private String mchId;

    @Value("${wechat.apikey:}")
    private String apiKey;

    @Value("${wechat.notifyUrl:}")
    private String notifyUrl;

    @Value("${wechat.sandbox:false}")
    private boolean sandbox;

    public WeChatPayService(PaymentLockService paymentLockService, UserCreditsService userCreditsService) {
        this.paymentLockService = paymentLockService;
        this.userCreditsService = userCreditsService;
    }

    /**
     * 创建预支付订单，返回支付二维码链接
     */
    public Map<String, Object> createPrepayOrder(String orderNo, BigDecimal amount, String description) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 模拟支付（沙箱环境或配置不完整时使用）
            if (!isConfigured()) {
                return createMockPayOrder(orderNo, amount);
            }

            WXPay wxPay = new WXPay(new WeChatPayConfig(appId, mchId, apiKey, sandbox));

            Map<String, String> params = new HashMap<>();
            params.put("body", description);
            params.put("out_trade_no", orderNo);
            params.put("total_fee", String.valueOf(amount.multiply(new BigDecimal("100")).intValue()));
            params.put("spbill_create_ip", "127.0.0.1");
            params.put("notify_url", notifyUrl);
            params.put("trade_type", "NATIVE");

            Map<String, String> response = wxPay.unifiedOrder(params);

            if ("SUCCESS".equals(response.get("return_code"))) {
                result.put("success", true);
                result.put("orderNo", orderNo);
                result.put("qrcodeUrl", response.get("code_url"));
                result.put("prepayId", response.get("prepay_id"));
            } else {
                log.error("微信支付创建失败: {}", response.get("return_msg"));
                result.put("success", false);
                result.put("message", response.get("return_msg"));
            }

        } catch (Exception e) {
            log.error("微信支付异常: {}", e.getMessage());
            return createMockPayOrder(orderNo, amount);
        }

        return result;
    }

    /**
     * 查询支付状态
     */
    public String queryOrderStatus(String orderNo) {
        try {
            if (!isConfigured()) {
                return "SUCCESS";
            }

            WXPay wxPay = new WXPay(new WeChatPayConfig(appId, mchId, apiKey, sandbox));

            Map<String, String> params = new HashMap<>();
            params.put("out_trade_no", orderNo);

            Map<String, String> response = wxPay.orderQuery(params);

            if ("SUCCESS".equals(response.get("return_code"))) {
                return response.get("trade_state");
            }

        } catch (Exception e) {
            log.error("查询订单状态异常: {}", e.getMessage());
        }

        return "UNKNOWN";
    }

    /**
     * 验证支付回调签名
     */
    public boolean verifyCallback(Map<String, String> params) {
        try {
            if (!isConfigured()) {
                return true; // 模拟环境直接返回true
            }

            String sign = params.get("sign");
            params.remove("sign");

            String calculatedSign = WXPayUtil.generateSignature(params, apiKey);
            return sign != null && sign.equals(calculatedSign);

        } catch (Exception e) {
            log.error("验证签名异常: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 创建模拟支付订单（用于测试）
     */
    private Map<String, Object> createMockPayOrder(String orderNo, BigDecimal amount) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("orderNo", orderNo);
        // 生成模拟的支付二维码URL
        result.put("qrcodeUrl", "weixin://wxpay/bizpayurl?pr=" + orderNo);
        result.put("mock", true);
        result.put("message", "模拟支付环境");
        log.info("创建模拟支付订单: {}, 金额: {}", orderNo, amount);
        return result;
    }

    /**
     * Process credit top-up callback from WeChat Pay.
     * Called by PaymentController callback endpoint.
     * @param params callback parameters from WeChat
     * @return true if processed successfully
     */
    public boolean processCreditTopupCallback(Map<String, String> params) {
        String orderNo = params.get("out_trade_no");
        String tradeState = params.get("trade_state");

        // Only process successful payments
        if (!"SUCCESS".equals(tradeState)) {
            log.info("Credit topup order {} not success: {}", orderNo, tradeState);
            return false;
        }

        // Check if already processed (idempotency)
        if (paymentLockService.checkIdempotentKey(orderNo)) {
            log.info("Credit topup order {} already processed", orderNo);
            return true;
        }

        // Extract credits from order metadata
        // Order format: CRD{timestamp}{userId}
        // In production, store credits in order metadata
        String orderInfo = orderNo.substring(3); // Remove CRD prefix
        long userId = Long.parseLong(orderInfo.substring(13)); // Extract userId from order

        // Parse amount - 1 credit = 1 RMB
        String totalFee = params.get("total_fee");
        BigDecimal credits = new BigDecimal(totalFee).divide(new BigDecimal("100"));

        // Add credits to user
        userCreditsService.addCredits(userId, credits);

        // Mark as processed
        paymentLockService.storeIdempotentKey(orderNo, "CREDIT_TOPUP");

        log.info("Processed credit topup for user {}: {} credits", userId, credits);
        return true;
    }

    /**
     * 检查微信支付是否配置
     */
    private boolean isConfigured() {
        return appId != null && !appId.isEmpty()
                && mchId != null && !mchId.isEmpty()
                && apiKey != null && !apiKey.isEmpty();
    }

    /**
     * 微信支付配置类
     */
    private static class WeChatPayConfig implements com.github.wxpay.sdk.WXPayConfig {
        private final String appId;
        private final String mchId;
        private final String apiKey;
        private final boolean sandbox;

        public WeChatPayConfig(String appId, String mchId, String apiKey, boolean sandbox) {
            this.appId = appId;
            this.mchId = mchId;
            this.apiKey = apiKey;
            this.sandbox = sandbox;
        }

        @Override
        public String getAppID() {
            return appId;
        }

        @Override
        public String getMchID() {
            return mchId;
        }

        @Override
        public String getKey() {
            return apiKey;
        }

        @Override
        public InputStream getCertStream() {
            return null;
        }

        @Override
        public int getHttpConnectTimeoutMs() {
            return 6000;
        }

        @Override
        public int getHttpReadTimeoutMs() {
            return 8000;
        }
    }
}
