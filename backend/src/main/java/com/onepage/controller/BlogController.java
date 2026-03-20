package com.onepage.controller;

import com.onepage.dto.BlogDTO;
import com.onepage.dto.Result;
import com.onepage.model.Blog;
import com.onepage.service.BlogService;
import com.onepage.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;
    private final JwtUtil jwtUtil;

    @PostMapping("/create")
    public Result<Blog> createBlog(
            @RequestBody BlogDTO dto,
            HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            Blog blog = blogService.createBlog(
                userId,
                dto.getTitle(),
                dto.getContent(),
                dto.getCoverImage(),
                dto.getTemplateId()
            );
            return Result.success(blog);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/generate")
    public Result<Blog> generateBlogFromImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "templateId", required = false) String templateId,
            HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            // 预留AI生成功能
            Blog blog = blogService.createBlog(userId, "新博客", "AI生成的内容", null, templateId);
            return Result.success(blog);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public Result<Blog> updateBlog(
            @PathVariable Long id,
            @RequestBody BlogDTO dto,
            HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            Blog blog = blogService.updateBlog(id, userId, dto.getTitle(), dto.getContent(), dto.getCoverImage(), dto.getTemplateId());
            return Result.success(blog);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public Result<Blog> getBlog(@PathVariable Long id) {
        try {
            Blog blog = blogService.getBlogById(id);
            return Result.success(blog);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/share/{shareCode}")
    public Result<Blog> getBlogByShareCode(@PathVariable String shareCode) {
        try {
            Blog blog = blogService.getBlogByShareCode(shareCode);
            return Result.success(blog);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/list")
    public Result<List<Blog>> listMyBlogs(HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            List<Blog> blogs = blogService.lambdaQuery().eq(Blog::getUserId, userId).list();
            return Result.success(blogs);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteBlog(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            blogService.deleteBlog(id, userId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return jwtUtil.getUserIdFromToken(token);
    }
}
