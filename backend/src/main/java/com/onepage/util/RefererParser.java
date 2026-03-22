package com.onepage.util;

import lombok.extern.slf4j.Slf4j;

import java.util.Set;

/**
 * Utility for categorizing HTTP referer URLs into standard analytics source categories.
 * Categories: DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER.
 */
@Slf4j
public class RefererParser {

    private static final Set<String> SEARCH_ENGINE_DOMAINS = Set.of(
        "google.com", "www.google.com", "google.co.uk", "google.cn",
        "google.com.hk", "google.de", "google.fr", "google.jp",
        "bing.com", "www.bing.com",
        "baidu.com", "www.baidu.com",
        "yahoo.com", "www.yahoo.com", "yahoo.co.jp",
        "yandex.com", "www.yandex.com", "yandex.ru",
        "sogou.com", "www.sogou.com",
        "so.com", "www.so.com",
        "360.cn", "www.360.cn"
    );

    private static final Set<String> SOCIAL_DOMAINS = Set.of(
        "twitter.com", "www.twitter.com", "x.com",
        "facebook.com", "www.facebook.com",
        "instagram.com", "www.instagram.com",
        "linkedin.com", "www.linkedin.com",
        "weibo.com", "www.weibo.com",
        "reddit.com", "www.reddit.com",
        "pinterest.com", "www.pinterest.com",
        "douban.com", "www.douban.com",
        "zhihu.com", "www.zhihu.com",
        "douyin.com", "www.douyin.com",
        "xiaohongshu.com", "www.xiaohongshu.com",
        "threads.net", "www.threads.net",
        "tiktok.com", "www.tiktok.com"
    );

    public enum Source {
        DIRECT("Direct"),
        SEARCH_ENGINE("Search Engine"),
        SOCIAL("Social"),
        REFERRAL("Referral"),
        OTHER("Other");

        private final String displayName;

        Source(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * Categorize a referer URL into a Source enum value.
     * Returns DIRECT for null/empty referer (direct traffic).
     */
    public static Source categorize(String referer) {
        if (referer == null || referer.isEmpty()) {
            return Source.DIRECT;
        }

        try {
            String domain = extractDomain(referer);
            if (domain == null) {
                return Source.OTHER;
            }

            String lowerDomain = domain.toLowerCase();

            // Check search engines
            if (isSearchEngine(lowerDomain)) {
                return Source.SEARCH_ENGINE;
            }

            // Check social media
            if (isSocialMedia(lowerDomain)) {
                return Source.SOCIAL;
            }

            // Otherwise it's a referral
            return Source.REFERRAL;

        } catch (Exception e) {
            log.warn("Failed to parse referer: {}", referer, e);
            return Source.OTHER;
        }
    }

    private static boolean isSearchEngine(String domain) {
        return SEARCH_ENGINE_DOMAINS.stream().anyMatch(d ->
            domain.equals(d) || domain.endsWith("." + d));
    }

    private static boolean isSocialMedia(String domain) {
        return SOCIAL_DOMAINS.stream().anyMatch(d ->
            domain.equals(d) || domain.endsWith("." + d));
    }

    private static String extractDomain(String url) {
        if (url.startsWith("//")) {
            url = "https:" + url;
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        try {
            java.net.URL parsed = new java.net.URL(url);
            String host = parsed.getHost();
            // Invalid domain: empty, or no dots (e.g. "not-a-url" is not a valid domain)
            if (host == null || host.isEmpty() || !host.contains(".")) {
                return null;
            }
            return host;
        } catch (Exception e) {
            return null;
        }
    }
}
