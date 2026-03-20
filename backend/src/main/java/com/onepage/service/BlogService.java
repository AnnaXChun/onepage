package com.onepage.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.mapper.BlogMapper;
import com.onepage.model.Blog;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BlogService extends ServiceImpl<BlogMapper, Blog> {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String BLOG_CACHE_PREFIX = "blog:";
    private static final long CACHE_EXPIRE_HOURS = 24;

    public Blog createBlog(Long userId, String title, String content, String coverImage, String templateId) {
        Blog blog = new Blog();
        blog.setUserId(userId);
        blog.setTitle(title);
        blog.setContent(content);
        blog.setCoverImage(coverImage);
        blog.setTemplateId(templateId);
        blog.setShareCode(generateShareCode());
        blog.setStatus(1);
        blog.setCreateTime(LocalDateTime.now());
        blog.setUpdateTime(LocalDateTime.now());
        this.save(blog);

        cacheBlog(blog);
        return blog;
    }

    public Blog updateBlog(Long id, Long userId, String title, String content, String coverImage, String templateId) {
        Blog blog = this.getById(id);
        if (blog == null || !blog.getUserId().equals(userId)) {
            throw new RuntimeException("博客不存在或无权限修改");
        }

        blog.setTitle(title);
        blog.setContent(content);
        blog.setCoverImage(coverImage);
        blog.setTemplateId(templateId);
        blog.setUpdateTime(LocalDateTime.now());
        this.updateById(blog);

        cacheBlog(blog);
        return blog;
    }

    public Blog getBlogById(Long id) {
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

    public Blog getBlogByShareCode(String shareCode) {
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

    public void deleteBlog(Long id, Long userId) {
        Blog blog = this.getById(id);
        if (blog == null || !blog.getUserId().equals(userId)) {
            throw new RuntimeException("博客不存在或无权限删除");
        }

        this.removeById(id);
        redisTemplate.delete(BLOG_CACHE_PREFIX + id);
    }

    private void cacheBlog(Blog blog) {
        redisTemplate.opsForValue().set(BLOG_CACHE_PREFIX + blog.getId(), blog, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
    }

    private String generateShareCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
}
