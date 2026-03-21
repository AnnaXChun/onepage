package com.onepage.controller;

import com.onepage.dto.Result;
import com.onepage.model.Template;
import com.onepage.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    /**
     * Get all active templates.
     * PERF-02
     */
    @GetMapping
    public Result<List<Template>> getAllTemplates() {
        return Result.success(templateService.getAllTemplates());
    }

    /**
     * Get templates by category.
     * PERF-02
     */
    @GetMapping("/category/{category}")
    public Result<List<Template>> getTemplatesByCategory(@PathVariable Integer category) {
        return Result.success(templateService.getTemplatesByCategory(category));
    }

    /**
     * Get template by ID.
     */
    @GetMapping("/{id}")
    public Result<Template> getTemplateById(@PathVariable Long id) {
        Template template = templateService.getTemplateById(id);
        if (template == null) {
            return Result.error(404, "Template not found");
        }
        return Result.success(template);
    }
}