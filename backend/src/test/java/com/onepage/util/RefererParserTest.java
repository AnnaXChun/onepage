package com.onepage.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.platform.runner.JUnitPlatform;
import org.junit.runner.RunWith;

import static org.junit.jupiter.api.Assertions.*;

@RunWith(JUnitPlatform.class)
class RefererParserTest {

    @Test
    void categorize_returnsDirectForNull() {
        assertEquals(RefererParser.Source.DIRECT, RefererParser.categorize(null));
    }

    @Test
    void categorize_returnsDirectForEmpty() {
        assertEquals(RefererParser.Source.DIRECT, RefererParser.categorize(""));
    }

    @ParameterizedTest
    @CsvSource({
        "https://www.google.com, SEARCH_ENGINE",
        "https://google.com, SEARCH_ENGINE",
        "https://bing.com/search, SEARCH_ENGINE",
        "https://www.bing.com, SEARCH_ENGINE",
        "https://baidu.com/s, SEARCH_ENGINE",
        "https://www.baidu.com, SEARCH_ENGINE",
        "https://yandex.ru/search, SEARCH_ENGINE",
        "https://www.bing.com/search?q=test, SEARCH_ENGINE"
    })
    void categorize_identifiesSearchEngines(String url, String expected) {
        assertEquals(RefererParser.Source.valueOf(expected), RefererParser.categorize(url));
    }

    @ParameterizedTest
    @CsvSource({
        "https://twitter.com, SOCIAL",
        "https://www.twitter.com, SOCIAL",
        "https://x.com, SOCIAL",
        "https://www.facebook.com, SOCIAL",
        "https://www.instagram.com, SOCIAL",
        "https://www.linkedin.com, SOCIAL",
        "https://weibo.com, SOCIAL",
        "https://www.weibo.com, SOCIAL",
        "https://reddit.com/r/java, SOCIAL",
        "https://www.reddit.com, SOCIAL",
        "https://www.douyin.com, SOCIAL",
        "https://www.tiktok.com, SOCIAL"
    })
    void categorize_identifiesSocialMedia(String url, String expected) {
        assertEquals(RefererParser.Source.valueOf(expected), RefererParser.categorize(url));
    }

    @Test
    void categorize_identifiesReferrals() {
        assertEquals(RefererParser.Source.REFERRAL, RefererParser.categorize("https://example.com"));
        assertEquals(RefererParser.Source.REFERRAL, RefererParser.categorize("https://blog.example.com"));
        assertEquals(RefererParser.Source.REFERRAL, RefererParser.categorize("https://news.ycombinator.com/item?id=123"));
    }

    @Test
    void categorize_returnsOtherForInvalidUrls() {
        assertEquals(RefererParser.Source.OTHER, RefererParser.categorize("not-a-url"));
        assertEquals(RefererParser.Source.OTHER, RefererParser.categorize("javascript:void(0)"));
    }

    @Test
    void source_getDisplayName_returnsCorrectNames() {
        assertEquals("Direct", RefererParser.Source.DIRECT.getDisplayName());
        assertEquals("Search Engine", RefererParser.Source.SEARCH_ENGINE.getDisplayName());
        assertEquals("Social", RefererParser.Source.SOCIAL.getDisplayName());
        assertEquals("Referral", RefererParser.Source.REFERRAL.getDisplayName());
        assertEquals("Other", RefererParser.Source.OTHER.getDisplayName());
    }
}
