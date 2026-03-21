package com.onepage.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.exception.BusinessException;
import com.onepage.mapper.BlogMapper;
import com.onepage.model.Blog;
import com.onepage.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for serving published blogs via subdomain hosting.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SiteService extends ServiceImpl<BlogMapper, Blog> {

    private final UserService userService;

    /**
     * Get the most recently published blog for a user by username.
     * @param username The username to look up
     * @return The published blog with static HTML content
     * @throws BusinessException if user or published blog not found
     */
    public Blog getPublishedBlogByUsername(String username) {
        User user = userService.findByUsername(username);
        if (user == null) {
            throw BusinessException.notFound("User not found: " + username);
        }

        Blog blog = this.lambdaQuery()
                .eq(Blog::getUserId, user.getId())
                .eq(Blog::getStatus, 1)  // published status
                .orderByDesc(Blog::getPublishTime)
                .one();

        if (blog == null) {
            throw BusinessException.notFound("No published blog found for user: " + username);
        }

        log.info("Serving published blog: id={}, username={}", blog.getId(), username);
        return blog;
    }
}
