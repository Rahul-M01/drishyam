package com.site.drishyam.repository;

import com.site.drishyam.model.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VideoRepository extends JpaRepository<Video, Long> {
    List<Video> findAllByOrderByCreatedAtDesc();
    boolean existsBySourceUrl(String sourceUrl);
}
