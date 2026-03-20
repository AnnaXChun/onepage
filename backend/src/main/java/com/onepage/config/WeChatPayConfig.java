package com.onepage.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.io.InputStream;

/**
 * 微信支付配置
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "wechatpay")
public class WeChatPayConfig {

    private String appId;
    private String mchId;
    private String apiKey;
    private String notifyUrl;
    private String refundNotifyUrl;

    /**
     * 获取商户证书输入流
     * 如果使用退款功能，需要提供商户证书
     */
    public InputStream getCertStream() {
        // 从配置文件或类路径加载商户证书
        // 这里返回null，如果需要退款功能需要配置apiclient_cert.p12
        return null;
    }
}
