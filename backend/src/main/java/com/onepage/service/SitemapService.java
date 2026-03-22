package com.onepage.service;

import com.onepage.mapper.BlogMapper;
import com.onepage.mapper.UserMapper;
import com.onepage.model.Blog;
import com.onepage.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SitemapService {

    private final BlogMapper blogMapper;
    private final UserMapper userMapper;

    private static final String SITEMAP_HEADER = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">";
    private static final String SITEMAP_FOOTER = "\n</urlset>";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    /**
     * Generate sitemap.xml for a user's published blogs.
     * Only includes blogs with status=1 (published).
     * SEO-02
     */
    public String generateSitemap(String username, String siteBaseUrl) {
        // Find user by username
        User user = userMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
        );

        if (user == null) {
            log.warn("Sitemap requested for unknown username: {}", username);
            return getEmptySitemap();
        }

        // Get all published blogs for this user (status = 1)
        List<Blog> publishedBlogs = blogMapper.selectList(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Blog>()
                .eq(Blog::getUserId, user.getId())
                .eq(Blog::getStatus, 1)
        );

        if (publishedBlogs.isEmpty()) {
            return getEmptySitemap();
        }

        StringBuilder xml = new StringBuilder(SITEMAP_HEADER);

        for (Blog blog : publishedBlogs) {
            String blogUrl = siteBaseUrl + "/host/" + username;
            String lastMod = blog.getUpdateTime() != null
                ? blog.getUpdateTime().toLocalDate().format(DATE_FORMATTER)
                : LocalDate.now().format(DATE_FORMATTER);

            xml.append("\n  <url>")
               .append("\n    <loc>").append(escapeXml(blogUrl)).append("</loc>")
               .append("\n    <lastmod>").append(lastMod).append("</lastmod>")
               .append("\n    <changefreq>weekly</changefreq>")
               .append("\n    <priority>1.0</priority>")
               .append("\n  </url>");
        }

        xml.append(SITEMAP_FOOTER);
        return xml.toString();
    }

    private String getEmptySitemap() {
        return SITEMAP_HEADER + SITEMAP_FOOTER;
    }

    private String escapeXml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&apos;");
    }
}
