package com.onepage.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.dto.BlogDTO;
import com.onepage.exception.BusinessException;
import com.onepage.mapper.BlogMapper;
import com.onepage.mapper.UserMapper;
import com.onepage.model.Blog;
import com.onepage.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlogService extends ServiceImpl<BlogMapper, Blog> {

    private final RedisTemplate<String, Object> redisTemplate;
    private final StaticSiteService staticSiteService;
    private final UserMapper userMapper;

    @Value("${app.site.base-url:http://localhost:8080}")
    private String siteBaseUrl;

    private static final String BLOG_CACHE_PREFIX = "blog:";
    private static final long CACHE_EXPIRE_HOURS = 24;
    private static final int MAX_TITLE_LENGTH = 200;
    private static final int MAX_CONTENT_LENGTH = 50000;
    private static final int MAX_COVER_IMAGE_LENGTH = 5000000;

    /**
     * Create a new blog with comprehensive input validation.
     */
    public Blog createBlog(Long userId, String title, String content, String coverImage, String templateId) {
        log.info("createBlog called - coverImage length: {}", coverImage != null ? coverImage.length() : "null");
        log.info("createBlog - coverImage starts with: {}", coverImage != null ? coverImage.substring(0, Math.min(50, coverImage.length())) : "null");

        // 1. Validate userId
        if (userId == null) {
            throw BusinessException.badRequest("User ID cannot be null");
        }

        // 2. Validate and sanitize title
        if (title == null || title.trim().isEmpty()) {
            throw BusinessException.badRequest("Title cannot be empty");
        }
        String trimmedTitle = title.trim();
        if (trimmedTitle.length() > MAX_TITLE_LENGTH) {
            throw BusinessException.badRequest("Title cannot exceed " + MAX_TITLE_LENGTH + " characters");
        }

        // 3. Validate content length
        if (content != null && content.length() > MAX_CONTENT_LENGTH) {
            throw BusinessException.badRequest("Content exceeds maximum length of " + MAX_CONTENT_LENGTH + " characters");
        }

        // 4. Validate cover image URL length (if provided)
        if (coverImage != null && coverImage.length() > MAX_COVER_IMAGE_LENGTH) {
            throw BusinessException.badRequest("Cover image URL is too long");
        }

        // 5. Validate templateId format (if provided)
        if (templateId != null && !templateId.isBlank()) {
            if (templateId.length() > 100) {
                throw BusinessException.badRequest("Template ID is too long");
            }
            // Prevent injection in templateId
            if (!templateId.matches("^[A-Za-z0-9_-]+$")) {
                throw BusinessException.badRequest("Invalid template ID format");
            }
        }

        String sanitizedCoverImage = sanitizeUrl(coverImage);
        log.info("sanitizedCoverImage: {}", sanitizedCoverImage != null ? "not null (length=" + sanitizedCoverImage.length() + ")" : "null");

        Blog blog = new Blog();
        blog.setUserId(userId);
        blog.setTitle(trimmedTitle);
        blog.setContent(sanitizeContent(content));
        blog.setCoverImage(sanitizedCoverImage);
        blog.setTemplateId(templateId);
        blog.setShareCode(generateShareCode());
        blog.setStatus(1);
        blog.setCreateTime(LocalDateTime.now());
        blog.setUpdateTime(LocalDateTime.now());
        this.save(blog);

        cacheBlog(blog);
        log.info("Blog created: id={}, title={}, userId={}", blog.getId(), trimmedTitle, userId);
        return blog;
    }

    /**
     * Create blog from DTO with validation.
     */
    public Blog createBlog(BlogDTO dto, Long userId) {
        if (dto == null) {
            throw BusinessException.badRequest("Blog data cannot be null");
        }
        return createBlog(userId, dto.getTitle(), dto.getContent(), dto.getCoverImage(), dto.getTemplateId());
    }

    /**
     * Update an existing blog with ownership and input validation.
     */
    public Blog updateBlog(Long id, Long userId, String title, String content, String coverImage, String templateId) {
        // 1. Validate IDs
        if (id == null) {
            throw BusinessException.badRequest("Blog ID cannot be null");
        }
        if (userId == null) {
            throw BusinessException.badRequest("User ID cannot be null");
        }

        // 2. Fetch and verify ownership
        Blog blog = this.getById(id);
        if (blog == null) {
            throw BusinessException.blogNotFound();
        }
        if (!blog.getUserId().equals(userId)) {
            throw BusinessException.forbidden("No permission to modify this blog");
        }

        // 3. Validate and update title
        if (title != null) {
            String trimmedTitle = title.trim();
            if (trimmedTitle.isEmpty()) {
                throw BusinessException.badRequest("Title cannot be empty");
            }
            if (trimmedTitle.length() > MAX_TITLE_LENGTH) {
                throw BusinessException.badRequest("Title cannot exceed " + MAX_TITLE_LENGTH + " characters");
            }
            blog.setTitle(trimmedTitle);
        }

        // 4. Validate content length
        if (content != null && content.length() > MAX_CONTENT_LENGTH) {
            throw BusinessException.badRequest("Content exceeds maximum length");
        }
        if (content != null) {
            blog.setContent(sanitizeContent(content));
        }

        // 5. Validate cover image
        if (coverImage != null && coverImage.length() > MAX_COVER_IMAGE_LENGTH) {
            throw BusinessException.badRequest("Cover image URL is too long");
        }
        if (coverImage != null) {
            blog.setCoverImage(sanitizeUrl(coverImage));
        }

        // 6. Validate templateId
        if (templateId != null && !templateId.isBlank()) {
            if (templateId.length() > 100) {
                throw BusinessException.badRequest("Template ID is too long");
            }
            if (!templateId.matches("^[A-Za-z0-9_-]+$")) {
                throw BusinessException.badRequest("Invalid template ID format");
            }
            blog.setTemplateId(templateId);
        }

        blog.setUpdateTime(LocalDateTime.now());
        this.updateById(blog);

        // Invalidate cache
        redisTemplate.delete(BLOG_CACHE_PREFIX + id);
        cacheBlog(blog);
        log.info("Blog updated: id={}", id);
        return blog;
    }

    /**
     * Get blog by ID with cache.
     */
    public Blog getBlogById(Long id) {
        if (id == null) {
            throw BusinessException.badRequest("Blog ID cannot be null");
        }
        String cacheKey = BLOG_CACHE_PREFIX + id;
        Blog cached = (Blog) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        Blog blog = this.getById(id);
        if (blog != null) {
            cacheBlog(blog);
        }
        return blog;
    }

    /**
     * Get blog by share code with validation.
     */
    public Blog getBlogByShareCode(String shareCode) {
        if (shareCode == null || shareCode.isBlank()) {
            throw BusinessException.badRequest("Share code cannot be empty");
        }
        if (!shareCode.matches("^[A-Za-z0-9]{4,32}$")) {
            throw BusinessException.badRequest("Invalid share code format");
        }

        String cacheKey = BLOG_CACHE_PREFIX + "share:" + shareCode;
        Blog cached = (Blog) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        Blog blog = this.lambdaQuery().eq(Blog::getShareCode, shareCode).one();
        if (blog != null) {
            redisTemplate.opsForValue().set(cacheKey, blog, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
        }
        return blog;
    }

    /**
     * Delete blog with ownership validation.
     */
    public void deleteBlog(Long id, Long userId) {
        if (id == null) {
            throw BusinessException.badRequest("Blog ID cannot be null");
        }
        if (userId == null) {
            throw BusinessException.badRequest("User ID cannot be null");
        }

        Blog blog = this.getById(id);
        if (blog == null) {
            throw BusinessException.blogNotFound();
        }
        if (!blog.getUserId().equals(userId)) {
            throw BusinessException.forbidden("No permission to delete this blog");
        }

        this.removeById(id);
        redisTemplate.delete(BLOG_CACHE_PREFIX + id);
        redisTemplate.delete(BLOG_CACHE_PREFIX + "share:" + blog.getShareCode());
        log.info("Blog deleted: id={}", id);
    }

    private void cacheBlog(Blog blog) {
        redisTemplate.opsForValue().set(
                BLOG_CACHE_PREFIX + blog.getId(),
                blog,
                CACHE_EXPIRE_HOURS,
                TimeUnit.HOURS
        );
    }

    private String generateShareCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8).toLowerCase();
    }

    /**
     * Basic content sanitization - strip potentially dangerous HTML/scripts.
     */
    private String sanitizeContent(String content) {
        if (content == null) {
            return null;
        }
        // Remove script tags and event handlers as a basic XSS protection
        return content
                .replaceAll("(?i)<script[^>]*>.*?</script>", "")
                .replaceAll("(?i)<iframe[^>]*>.*?</iframe>", "")
                .replaceAll("(?i)on\\w+\\s*=", "");
    }

    /**
     * Basic URL sanitization - only allow http/https and relative URLs.
     */
    private String sanitizeUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        // Allow http://, https://, relative paths, and data URLs
        if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/") && !url.startsWith("data:")) {
            return null;
        }
        return url;
    }

    /**
     * Update blog blocks (for block editor persistence).
     */
    public void updateBlogBlocks(Long id, String blocksJson) {
        if (id == null) {
            throw BusinessException.badRequest("Blog ID cannot be null");
        }

        Blog blog = this.getById(id);
        if (blog == null) {
            throw BusinessException.blogNotFound();
        }

        blog.setBlocks(blocksJson);
        blog.setUpdateTime(LocalDateTime.now());
        this.updateById(blog);

        // Invalidate cache
        redisTemplate.delete(BLOG_CACHE_PREFIX + id);
        cacheBlog(blog);
        log.info("Blog blocks updated: id={}", id);
    }

    /**
     * Publish a blog - generates static HTML and sets status to published.
     * HOST-01, HOST-03
     */
    public Blog publish(Long blogId, Long userId) {
        if (blogId == null) {
            throw BusinessException.badRequest("Blog ID cannot be null");
        }
        if (userId == null) {
            throw BusinessException.badRequest("User ID cannot be null");
        }

        Blog blog = this.getById(blogId);
        if (blog == null) {
            throw BusinessException.blogNotFound();
        }
        if (!blog.getUserId().equals(userId)) {
            throw BusinessException.forbidden("No permission to publish this blog");
        }

        // Get username for og:url
        User user = userMapper.selectById(blog.getUserId());
        String username = user != null ? user.getUsername() : "";

        // Generate static HTML from blocks with SEO fields
        String staticHtml = staticSiteService.generateStaticHtml(
            blog.getTitle(),
            blog.getCoverImage(),
            blog.getBlocks(),
            blog.getMetaTitle(),
            blog.getMetaDescription(),
            siteBaseUrl,
            username
        );

        blog.setHtmlContent(staticHtml);
        blog.setStatus(1); // published
        blog.setPublishTime(LocalDateTime.now());
        blog.setUpdateTime(LocalDateTime.now());
        this.updateById(blog);

        // Invalidate cache
        redisTemplate.delete(BLOG_CACHE_PREFIX + blogId);
        log.info("Blog published: id={}, shareCode={}", blogId, blog.getShareCode());
        return blog;
    }

    /**
     * Unpublish a blog - sets status to unpublished.
     * HOST-05
     */
    public Blog unpublish(Long blogId, Long userId) {
        if (blogId == null) {
            throw BusinessException.badRequest("Blog ID cannot be null");
        }
        if (userId == null) {
            throw BusinessException.badRequest("User ID cannot be null");
        }

        Blog blog = this.getById(blogId);
        if (blog == null) {
            throw BusinessException.blogNotFound();
        }
        if (!blog.getUserId().equals(userId)) {
            throw BusinessException.forbidden("No permission to unpublish this blog");
        }

        blog.setStatus(2); // unpublished
        blog.setUpdateTime(LocalDateTime.now());
        this.updateById(blog);

        // Invalidate cache
        redisTemplate.delete(BLOG_CACHE_PREFIX + blogId);
        log.info("Blog unpublished: id={}", blogId);
        return blog;
    }

    /**
     * Update SEO settings for a blog.
     * SEO-01
     */
    public void updateSeo(Long blogId, Long userId, String metaTitle, String metaDescription) {
        if (blogId == null) {
            throw BusinessException.badRequest("Blog ID cannot be null");
        }
        if (userId == null) {
            throw BusinessException.badRequest("User ID cannot be null");
        }

        Blog blog = this.getById(blogId);
        if (blog == null) {
            throw BusinessException.blogNotFound();
        }
        if (!blog.getUserId().equals(userId)) {
            throw BusinessException.forbidden("No permission to modify this blog");
        }

        // Validate lengths
        if (metaTitle != null && metaTitle.length() > 255) {
            throw BusinessException.badRequest("Meta title cannot exceed 255 characters");
        }
        if (metaDescription != null && metaDescription.length() > 1000) {
            throw BusinessException.badRequest("Meta description cannot exceed 1000 characters");
        }

        blog.setMetaTitle(metaTitle != null ? metaTitle.trim() : null);
        blog.setMetaDescription(metaDescription != null ? metaDescription.trim() : null);
        blog.setUpdateTime(LocalDateTime.now());
        this.updateById(blog);

        // Invalidate cache
        redisTemplate.delete(BLOG_CACHE_PREFIX + blogId);
        log.info("Blog SEO updated: id={}", blogId);
    }
}
