package com.onepage.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageService {

    @Value("${upload.path}")
    private String uploadPath;

    public String uploadImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new RuntimeException("文件为空");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = UUID.randomUUID().toString() + extension;

        Path path = Paths.get(uploadPath);
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }

        File dest = new File(path.toFile(), filename);
        file.transferTo(dest);

        return "/uploads/" + filename;
    }

    public void deleteImage(String imageUrl) {
        if (imageUrl != null && imageUrl.startsWith("/uploads/")) {
            String filename = imageUrl.substring("/uploads/".length());
            File file = new File(uploadPath, filename);
            if (file.exists()) {
                file.delete();
            }
        }
    }
}
