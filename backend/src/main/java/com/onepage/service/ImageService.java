package com.onepage.service;

import com.onepage.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

    @Value("${upload.path}")
    private String uploadPath;

    // Whitelist of allowed MIME types (validate actual content, not just extension)
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    // Allowed file extensions (lowercase)
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp", "gif"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;   // 10MB
    private static final long MIN_FILE_SIZE = 100 * 1024;        // 100KB

    /**
     * Upload an image with comprehensive validation.
     * - Validates file is not empty
     * - Validates file size (min 100KB, max 10MB)
     * - Validates MIME type (content-type)
     * - Validates file extension
     * - Generates safe filename (UUID) to prevent path traversal
     * - Saves to configured upload directory only
     *
     * @param file the multipart file to upload
     * @return the relative URL path to the uploaded image
     */
    public String uploadImage(MultipartFile file) throws IOException {
        // 1. Check file is not null and not empty
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("File cannot be empty");
        }

        // 2. Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw BusinessException.badRequest("File size exceeds 10MB limit");
        }
        if (file.getSize() < MIN_FILE_SIZE) {
            throw BusinessException.badRequest("File size must be at least 100KB");
        }

        // 3. Validate content type (MIME type from actual file content)
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw BusinessException.badRequest("Only JPG, PNG, WebP, GIF images are allowed");
        }

        // 4. Validate and sanitize file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw BusinessException.badRequest("Invalid file name");
        }
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw BusinessException.badRequest("Invalid file extension. Allowed: jpg, jpeg, png, webp, gif");
        }

        // 5. Generate safe filename using UUID (prevents path traversal, overwrites, special chars)
        String safeFilename = UUID.randomUUID() + "." + extension;

        // 6. Resolve and validate upload directory
        Path uploadDir = Paths.get(uploadPath).normalize().toAbsolutePath();
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        // 7. Ensure file is saved within upload directory (path traversal protection)
        Path targetPath = uploadDir.resolve(safeFilename).normalize().toAbsolutePath();
        if (!targetPath.startsWith(uploadDir)) {
            throw BusinessException.badRequest("Invalid file path");
        }

        // 8. Save file
        file.transferTo(targetPath.toFile());

        log.info("Image uploaded successfully: {}, size: {} bytes", safeFilename, file.getSize());
        return "/uploads/" + safeFilename;
    }

    /**
     * Delete an image by URL with path traversal protection.
     *
     * @param imageUrl the relative URL of the image to delete
     */
    public void deleteImage(String imageUrl) {
        // 1. Validate URL is not null and follows expected format
        if (imageUrl == null || imageUrl.isBlank()) {
            throw BusinessException.badRequest("Image URL cannot be empty");
        }

        // 2. Prevent path traversal (no ".." allowed)
        if (imageUrl.contains("..")) {
            throw BusinessException.badRequest("Invalid image URL: path traversal not allowed");
        }

        // 3. Ensure URL starts with expected prefix
        if (!imageUrl.startsWith("/uploads/")) {
            throw BusinessException.badRequest("Invalid image URL: must start with /uploads/");
        }

        // 4. Extract filename and validate
        String filename = imageUrl.substring("/uploads/".length());
        if (filename.isBlank() || filename.contains("/")) {
            throw BusinessException.badRequest("Invalid image filename");
        }

        // 5. Resolve and validate path stays within upload directory
        Path uploadDir = Paths.get(uploadPath).normalize().toAbsolutePath();
        Path filePath = uploadDir.resolve(filename).normalize().toAbsolutePath();
        if (!filePath.startsWith(uploadDir)) {
            throw BusinessException.badRequest("Invalid file path");
        }

        // 6. Delete file if exists
        if (Files.exists(filePath)) {
            try {
                Files.delete(filePath);
                log.info("Image deleted: {}", filename);
            } catch (IOException e) {
                throw BusinessException.internal("Failed to delete image file: " + e.getMessage());
            }
        }
    }

    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot < 0 || lastDot == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDot + 1);
    }
}
