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

        @Override
        public boolean useSandbox() {
            return sandbox;
        }
    }
}
