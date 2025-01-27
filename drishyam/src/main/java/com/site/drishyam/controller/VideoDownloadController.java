package com.site.drishyam.controller;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/videos")
public class VideoDownloadController {

    @Value("${video.site}")
    private String WEBSITE;

    @PostMapping(value = "/download", consumes = "text/plain")
    public ResponseEntity<InputStreamResource> downloadInstagramVideo(@RequestBody String videoUrl) {
        System.out.println("Automation process started");

        WebDriverManager.chromedriver().setup();

        Path customDownloadDir = Paths.get(System.getProperty("user.dir"), "drishyam", "videos");
        try {
            Files.createDirectories(customDownloadDir);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }

        ChromeOptions options = new ChromeOptions();
        Map<String, Object> prefs = new HashMap<>();
        prefs.put("download.default_directory", customDownloadDir.toAbsolutePath().toString());
        prefs.put("download.prompt_for_download", false);
        prefs.put("download.directory_upgrade", true);
        prefs.put("safebrowsing.enabled", true);

        options.setExperimentalOption("prefs", prefs);
        options.addArguments("--disable-gpu");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");

        WebDriver driver = new ChromeDriver(options);

        try {
            driver.get(WEBSITE);

            WebElement inputField = driver.findElement(By.id("search-form-input"));
            inputField.sendKeys(videoUrl);

            WebElement downloadButton = driver.findElement(By.className("search-form__button"));
            downloadButton.click();

            TimeUnit.SECONDS.sleep(5);

            WebElement secondaryDownloadButton = driver.findElement(By.className("button__download"));
            String downloadUrl = secondaryDownloadButton.getAttribute("href");
            System.out.println("Secondary download URL: " + downloadUrl);

            Path videoPath = customDownloadDir.resolve("video.mp4");
            try (InputStream in = new java.net.URL(downloadUrl).openStream();
                 FileOutputStream out = new FileOutputStream(videoPath.toFile())) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }
            System.out.println("File downloaded to: " + videoPath);

            InputStreamResource resource = new InputStreamResource(Files.newInputStream(videoPath));
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"video.mp4\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();

        } finally {
            driver.quit();
            System.out.println("WebDriver closed");
        }
    }
}
