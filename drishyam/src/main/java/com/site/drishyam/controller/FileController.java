package com.site.drishyam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Path VIDEO_DIRECTORY = Paths.get(System.getProperty("user.dir"), "drishyam", "videos");

    @GetMapping("/list")
    public ResponseEntity<List<String>> listAllVideos() {
        try {
            System.out.println("Resolved video directory: " + VIDEO_DIRECTORY.toAbsolutePath());

            File directory = VIDEO_DIRECTORY.toFile();

            if (!directory.exists() || !directory.isDirectory()) {
                System.err.println("Directory does not exist or is not accessible.");
                return ResponseEntity.badRequest().body(List.of("Directory does not exist or is not accessible."));
            }

            File[] files = directory.listFiles((dir, name) ->
                    name.toLowerCase().endsWith(".mp4") ||
                            name.toLowerCase().endsWith(".mkv") ||
                            name.toLowerCase().endsWith(".avi")
            );

            List<String> videoFiles = new ArrayList<>();
            if (files != null) {
                for (File file : files) {
                    videoFiles.add(file.getName());
                }
            }

            System.out.println("Videos found: " + videoFiles);
            return ResponseEntity.ok(videoFiles);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(List.of("An error occurred while listing files."));
        }
    }
}
