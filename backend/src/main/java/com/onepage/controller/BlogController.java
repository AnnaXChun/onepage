package com.onepage.controller;

import com.onepage.config.JwtUserPrincipal;
import com.onepage.dto.BlogDTO;
import com.onepage.dto.Result;
import com.onepage.exception.BusinessException;
import com.onepage.model.Blog;
import com.onepage.service.BlogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;

    @PostMapping("/create")
    public Result<Blog> createBlog(@Valid @RequestBody BlogDTO dto) {
        Long userId = getCurrentUserId();
        // Use default user ID (1) for guest/demo users
        if (userId == null) {
            userId = 1L;
        }
        Blog blog = blogService.createBlog(
                userId,
                dto.getTitle(),
                dto.getContent(),
                dto.getCoverImage(),
                dto.getTemplateId()
        );
        return Result.success(blog);
    }

    @PostMapping("/generate")
    public Result<Blog> generateBlogFromImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "templateId", required = false) String templateId) {
        Long userId = getCurrentUserId();
        // 预留AI生成功能
        Blog blog = blogService.createBlog(userId, "新博客", "AI生成的内容", null, templateId);
        return Result.success(blog);
    }

    @PutMapping("/update/{id}")
    public Result<Blog> updateBlog(@PathVariable Long id, @Valid @RequestBody BlogDTO dto) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw BusinessException.unauthorized("Please login first");
        }
        Blog blog = blogService.updateBlog(id, userId, dto.getTitle(), dto.getContent(), dto.getCoverImage(), dto.getTemplateId());
        return Result.success(blog);
    }

    @GetMapping("/{id}")
    public Result<Blog> getBlog(@PathVariable Long id) {
        Blog blog = blogService.getBlogById(id);
        return Result.success(blog);
    }

    @GetMapping("/share/{shareCode}")
    public Result<Blog> getBlogByShareCode(@PathVariable String shareCode) {
        Blog blog = blogService.getBlogByShareCode(shareCode);
        return Result.success(blog);
    }

    @GetMapping("/list")
    public Result<List<Blog>> listMyBlogs() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw BusinessException.unauthorized("Please login first");
        }
        List<Blog> blogs = blogService.lambdaQuery().eq(Blog::getUserId, userId).list();
        return Result.success(blogs);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteBlog(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw BusinessException.unauthorized("Please login first");
        }
        blogService.deleteBlog(id, userId);
        return Result.success();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof JwtUserPrincipal principal) {
            return principal.getUserId();
        }
        return null;
    }
}
