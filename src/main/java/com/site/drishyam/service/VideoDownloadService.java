package com.site.drishyam.service;

import com.site.drishyam.model.Video;
import com.site.drishyam.repository.VideoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class VideoDownloadService {

    private final VideoRepository videoRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${video.storage.path}")
    private String storagePath;

    @Value("${ytdlp.path:yt-dlp}")
    private String ytdlpPath;

    public VideoDownloadService(VideoRepository videoRepository) {
        this.videoRepository = videoRepository;
    }

    public Video downloadFromInstagram(String url) throws Exception {
        Path videoDir = Paths.get(storagePath).toAbsolutePath();
        Files.createDirectories(videoDir);

        String caption = "";
        String title = "Instagram Video";
        try {
            ProcessBuilder metaPb = new ProcessBuilder(
                ytdlpPath, "--dump-json", "--no-download", url
            );
            metaPb.redirectErrorStream(true);
            Process metaProcess = metaPb.start();
            StringBuilder jsonOutput = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(metaProcess.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    jsonOutput.append(line);
                }
            }
            metaProcess.waitFor();

            if (!jsonOutput.isEmpty()) {
                JsonNode json = objectMapper.readTree(jsonOutput.toString());
                if (json.has("description") && !json.get("description").isNull()) {
                    caption = json.get("description").asText();
                }
                if (json.has("title") && !json.get("title").isNull()) {
                    title = json.get("title").asText();
                }
                if (title.isBlank() && json.has("uploader") && !json.get("uploader").isNull()) {
                    title = "Video by " + json.get("uploader").asText();
                }
            }
        } catch (Exception e) {
            System.err.println("Could not fetch metadata: " + e.getMessage());
        }

        String fileName = UUID.randomUUID().toString() + ".mp4";
        Path outputPath = videoDir.resolve(fileName);

        ProcessBuilder pb = new ProcessBuilder(
            ytdlpPath,
            "-f", "mp4/best",
            "--merge-output-format", "mp4",
            "-o", outputPath.toString(),
            url
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                System.out.println("[yt-dlp] " + line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("yt-dlp failed with exit code " + exitCode + ": " + output);
        }

        String thumbName = UUID.randomUUID().toString() + ".jpg";
        Path thumbPath = videoDir.resolve(thumbName);
        try {
            ProcessBuilder thumbPb = new ProcessBuilder(
                ytdlpPath, "--write-thumbnail", "--skip-download",
                "--convert-thumbnails", "jpg",
                "-o", videoDir.resolve("thumb_temp").toString(),
                url
            );
            thumbPb.redirectErrorStream(true);
            Process thumbProcess = thumbPb.start();
            thumbProcess.waitFor();

            Files.list(videoDir)
                .filter(p -> p.getFileName().toString().startsWith("thumb_temp") &&
                           p.getFileName().toString().endsWith(".jpg"))
                .findFirst()
                .ifPresent(p -> {
                    try {
                        Files.move(p, thumbPath);
                    } catch (Exception e) {
                        System.err.println("Could not move thumbnail: " + e.getMessage());
                    }
                });
        } catch (Exception e) {
            System.err.println("Thumbnail generation failed: " + e.getMessage());
        }

        if (title.length() > 100) {
            title = title.substring(0, 100) + "...";
        }

        Video video = new Video();
        video.setTitle(title);
        video.setSourceUrl(url);
        video.setFileName(fileName);
        video.setCaption(caption);
        if (Files.exists(thumbPath)) {
            video.setThumbnailPath(thumbName);
        }

        return videoRepository.save(video);
    }

    public Video save(Video video) {
        return videoRepository.save(video);
    }

    public List<Video> getAllVideos() {
        return videoRepository.findAllByOrderByCreatedAtDesc();
    }

    public Video getVideo(Long id) {
        return videoRepository.findById(id).orElse(null);
    }

    public void deleteVideo(Long id) {
        Video video = videoRepository.findById(id).orElse(null);
        if (video != null) {
            try {
                Path videoFile = Paths.get(storagePath).toAbsolutePath().resolve(video.getFileName());
                Files.deleteIfExists(videoFile);
                if (video.getThumbnailPath() != null) {
                    Path thumbFile = Paths.get(storagePath).toAbsolutePath().resolve(video.getThumbnailPath());
                    Files.deleteIfExists(thumbFile);
                }
            } catch (Exception e) {
                System.err.println("Could not delete files: " + e.getMessage());
            }
            videoRepository.delete(video);
        }
    }
}
