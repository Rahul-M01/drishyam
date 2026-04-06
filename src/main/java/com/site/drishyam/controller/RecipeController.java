package com.site.drishyam.controller;

import com.site.drishyam.model.Recipe;
import com.site.drishyam.service.RecipeScrapingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeScrapingService recipeScrapingService;

    public RecipeController(RecipeScrapingService recipeScrapingService) {
        this.recipeScrapingService = recipeScrapingService;
    }

    @GetMapping
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        return ResponseEntity.ok(recipeScrapingService.getAllRecipes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipe(@PathVariable Long id) {
        Recipe recipe = recipeScrapingService.getRecipe(id);
        if (recipe == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(recipe);
    }

    @PostMapping("/scrape")
    public ResponseEntity<?> scrapeRecipe(@RequestBody Map<String, String> request) {
        String url = request.get("url");
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "URL is required"));
        }
        try {
            Recipe recipe = recipeScrapingService.scrapeFromUrl(url);
            return ResponseEntity.ok(recipe);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Scraping failed: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<Recipe> createRecipe(@RequestBody Recipe recipe) {
        return ResponseEntity.ok(recipeScrapingService.saveManual(recipe));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecipe(@PathVariable Long id) {
        recipeScrapingService.deleteRecipe(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Recipe>> searchRecipes(@RequestParam String q) {
        return ResponseEntity.ok(recipeScrapingService.searchRecipes(q));
    }

    // searches across title, ingredients, instructions, and cuisine
    @GetMapping("/lookup")
    public ResponseEntity<List<Map<String, Object>>> lookup(@RequestParam String q) {
        List<Recipe> results = recipeScrapingService.deepSearch(q);
        List<Map<String, Object>> compact = results.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("title", r.getTitle());
            m.put("cuisine", r.getCuisine());
            m.put("cookTime", r.getCookTime());
            m.put("servings", r.getServings());
            m.put("ingredients", r.getIngredients());
            m.put("instructions", r.getInstructions());
            return m;
        }).toList();
        return ResponseEntity.ok(compact);
    }

    // compact list of all recipe names and ids for the bot
    @GetMapping("/list")
    public ResponseEntity<List<Map<String, Object>>> listRecipes() {
        List<Recipe> all = recipeScrapingService.getAllRecipes();
        List<Map<String, Object>> compact = all.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("title", r.getTitle());
            m.put("cuisine", r.getCuisine());
            return m;
        }).toList();
        return ResponseEntity.ok(compact);
    }
}
