package com.site.drishyam.controller;

import com.site.drishyam.model.Video;
import com.site.drishyam.service.RecipeScrapingService;
import com.site.drishyam.service.VideoDownloadService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoDownloadService videoDownloadService;
    private final RecipeScrapingService recipeScrapingService;

    @Value("${video.storage.path}")
    private String storagePath;

    public VideoController(VideoDownloadService videoDownloadService, RecipeScrapingService recipeScrapingService) {
        this.videoDownloadService = videoDownloadService;
        this.recipeScrapingService = recipeScrapingService;
    }

    @PostMapping("/download")
    public ResponseEntity<?> downloadVideo(@RequestBody Map<String, String> request) {
        String url = request.get("url");
        boolean extractRecipe = Boolean.parseBoolean(request.getOrDefault("extractRecipe", "true"));

        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "URL is required"));
        }

        try {
            Video video = videoDownloadService.downloadFromInstagram(url);

            if (extractRecipe && video.getCaption() != null && !video.getCaption().isBlank()) {
                recipeScrapingService.extractFromCaption(video.getCaption(), video);
            }

            return ResponseEntity.ok(video);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Download failed: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Video>> getAllVideos() {
        return ResponseEntity.ok(videoDownloadService.getAllVideos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Video> getVideo(@PathVariable Long id) {
        Video video = videoDownloadService.getVideo(id);
        if (video == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(video);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVideo(@PathVariable Long id) {
        videoDownloadService.deleteVideo(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @GetMapping("/stream/{fileName}")
    public ResponseEntity<Resource> streamVideo(@PathVariable String fileName) {
        Path filePath = Paths.get(storagePath).toAbsolutePath().resolve(fileName);
        if (!filePath.toFile().exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("video/mp4"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
            .body(resource);
    }

    @GetMapping("/thumbnail/{fileName}")
    public ResponseEntity<Resource> getThumbnail(@PathVariable String fileName) {
        Path filePath = Paths.get(storagePath).toAbsolutePath().resolve(fileName);
        if (!filePath.toFile().exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG)
            .body(resource);
    }
}
