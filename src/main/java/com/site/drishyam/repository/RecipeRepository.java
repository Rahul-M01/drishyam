package com.site.drishyam.repository;

import com.site.drishyam.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findAllByOrderByCreatedAtDesc();
    List<Recipe> findByVideoId(Long videoId);
    List<Recipe> findByTitleContainingIgnoreCase(String title);

    @Query("SELECT r FROM Recipe r WHERE " +
           "LOWER(r.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(r.ingredients) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(r.instructions) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(r.cuisine) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Recipe> searchAll(@Param("q") String query);
}
