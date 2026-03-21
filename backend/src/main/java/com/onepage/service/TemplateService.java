package com.onepage.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.mapper.TemplateMapper;
import com.onepage.model.Template;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateService extends ServiceImpl<TemplateMapper, Template> {

    /**
     * Get all active templates with 24h cache.
     * PERF-02
     */
    @Cacheable(value = "templates", key = "'all'", unless = "#result == null || #result.isEmpty()")
    public List<Template> getAllTemplates() {
        log.info("Fetching templates from database (cache miss)");
        return this.lambdaQuery()
            .eq(Template::getStatus, 1)
            .orderByDesc(Template::getCreateTime)
            .list();
    }

    /**
     * Get templates by category with 24h cache.
     */
    @Cacheable(value = "templates", key = "'category:' + #category", unless = "#result == null || #result.isEmpty()")
    public List<Template> getTemplatesByCategory(Integer category) {
        log.info("Fetching templates by category {} from database (cache miss)", category);
        return this.lambdaQuery()
            .eq(Template::getStatus, 1)
            .eq(Template::getCategory, category)
            .orderByDesc(Template::getCreateTime)
            .list();
    }

    /**
     * Get template by ID with 24h cache.
     */
    @Cacheable(value = "templates", key = "'id:' + #id")
    public Template getTemplateById(Long id) {
        return this.getById(id);
    }

    /**
     * Evict all template cache (called when admin updates templates).
     * PERF-02
     */
    @CacheEvict(value = "templates", allEntries = true)
    public void evictAllCache() {
        log.info("Evicting all template cache");
    }
}