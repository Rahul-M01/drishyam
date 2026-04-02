package com.site.drishyam.repository;

import com.site.drishyam.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findAllByOrderByCreatedAtDesc();
    List<Recipe> findByVideoId(Long videoId);
    List<Recipe> findByTitleContainingIgnoreCase(String title);
}
