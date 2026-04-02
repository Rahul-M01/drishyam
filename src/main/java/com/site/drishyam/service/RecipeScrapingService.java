package com.site.drishyam.service;

import com.site.drishyam.model.Recipe;
import com.site.drishyam.model.Video;
import com.site.drishyam.repository.RecipeRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RecipeScrapingService {

    private final RecipeRepository recipeRepository;

    public RecipeScrapingService(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    public Recipe scrapeFromUrl(String url) throws Exception {
        Document doc = Jsoup.connect(url)
            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .timeout(10000)
            .get();

        Recipe recipe = new Recipe();
        recipe.setSourceUrl(url);
        recipe.setSource(doc.baseUri() != null ? extractDomain(url) : "Web");

        // Try to extract from JSON-LD structured data first (most recipe sites use this)
        Elements jsonLdScripts = doc.select("script[type=application/ld+json]");
        for (Element script : jsonLdScripts) {
            String json = script.html();
            if (json.contains("\"Recipe\"") || json.contains("\"@type\":\"Recipe\"")) {
                return parseJsonLdRecipe(json, recipe);
            }
        }

        // Fallback: extract from HTML meta tags and content
        recipe.setTitle(extractTitle(doc));
        recipe.setDescription(extractDescription(doc));
        recipe.setImageUrl(extractImage(doc));
        recipe.setIngredients(extractIngredients(doc));
        recipe.setInstructions(extractInstructions(doc));

        return recipeRepository.save(recipe);
    }

    public Recipe extractFromCaption(String caption, Video video) {
        if (caption == null || caption.isBlank()) return null;

        Recipe recipe = new Recipe();
        recipe.setSource("Instagram");
        recipe.setSourceUrl(video.getSourceUrl());
        recipe.setVideo(video);

        // Extract title - first line or first sentence
        String[] lines = caption.split("\n");
        String title = lines[0].replaceAll("[#@]\\S+", "").trim();
        if (title.length() > 100) title = title.substring(0, 100) + "...";
        recipe.setTitle(title.isEmpty() ? "Instagram Recipe" : title);

        // The full caption is the recipe description
        recipe.setDescription(cleanCaption(caption));

        // Try to extract ingredients if listed with bullet points or dashes
        StringBuilder ingredients = new StringBuilder();
        StringBuilder instructions = new StringBuilder();
        boolean inIngredients = false;
        boolean inInstructions = false;

        for (String line : lines) {
            String trimmed = line.trim().toLowerCase();
            if (trimmed.contains("ingredient") || trimmed.contains("you need") || trimmed.contains("what you need")) {
                inIngredients = true;
                inInstructions = false;
                continue;
            }
            if (trimmed.contains("method") || trimmed.contains("direction") || trimmed.contains("instruction") || trimmed.contains("steps") || trimmed.contains("how to")) {
                inInstructions = true;
                inIngredients = false;
                continue;
            }

            if (inIngredients && !line.trim().isEmpty()) {
                ingredients.append(line.trim()).append("\n");
            }
            if (inInstructions && !line.trim().isEmpty()) {
                instructions.append(line.trim()).append("\n");
            }
        }

        if (!ingredients.isEmpty()) recipe.setIngredients(ingredients.toString().trim());
        if (!instructions.isEmpty()) recipe.setInstructions(instructions.toString().trim());

        return recipeRepository.save(recipe);
    }

    public Recipe saveManual(Recipe recipe) {
        return recipeRepository.save(recipe);
    }

    public List<Recipe> getAllRecipes() {
        return recipeRepository.findAllByOrderByCreatedAtDesc();
    }

    public Recipe getRecipe(Long id) {
        return recipeRepository.findById(id).orElse(null);
    }

    public void deleteRecipe(Long id) {
        recipeRepository.deleteById(id);
    }

    public List<Recipe> searchRecipes(String query) {
        return recipeRepository.findByTitleContainingIgnoreCase(query);
    }

    private Recipe parseJsonLdRecipe(String json, Recipe recipe) throws Exception {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(json);

        // Handle arrays - some sites wrap in an array
        if (root.isArray()) {
            for (com.fasterxml.jackson.databind.JsonNode node : root) {
                if (node.has("@type") && node.get("@type").asText().contains("Recipe")) {
                    root = node;
                    break;
                }
            }
        }

        if (root.has("name")) recipe.setTitle(root.get("name").asText());
        if (root.has("description")) recipe.setDescription(root.get("description").asText());
        if (root.has("image")) {
            com.fasterxml.jackson.databind.JsonNode img = root.get("image");
            if (img.isTextual()) recipe.setImageUrl(img.asText());
            else if (img.isArray() && !img.isEmpty()) recipe.setImageUrl(img.get(0).asText());
            else if (img.has("url")) recipe.setImageUrl(img.get("url").asText());
        }
        if (root.has("recipeIngredient")) {
            StringBuilder sb = new StringBuilder();
            for (com.fasterxml.jackson.databind.JsonNode ing : root.get("recipeIngredient")) {
                sb.append(ing.asText()).append("\n");
            }
            recipe.setIngredients(sb.toString().trim());
        }
        if (root.has("recipeInstructions")) {
            StringBuilder sb = new StringBuilder();
            for (com.fasterxml.jackson.databind.JsonNode step : root.get("recipeInstructions")) {
                if (step.isTextual()) {
                    sb.append(step.asText()).append("\n");
                } else if (step.has("text")) {
                    sb.append(step.get("text").asText()).append("\n");
                }
            }
            recipe.setInstructions(sb.toString().trim());
        }
        if (root.has("totalTime")) recipe.setCookTime(root.get("totalTime").asText().replace("PT", ""));
        if (root.has("recipeYield")) {
            com.fasterxml.jackson.databind.JsonNode yield = root.get("recipeYield");
            recipe.setServings(yield.isArray() ? yield.get(0).asText() : yield.asText());
        }
        if (root.has("recipeCuisine")) {
            com.fasterxml.jackson.databind.JsonNode cuisine = root.get("recipeCuisine");
            recipe.setCuisine(cuisine.isArray() ? cuisine.get(0).asText() : cuisine.asText());
        }

        return recipeRepository.save(recipe);
    }

    private String extractTitle(Document doc) {
        Element ogTitle = doc.selectFirst("meta[property=og:title]");
        if (ogTitle != null) return ogTitle.attr("content");
        Element h1 = doc.selectFirst("h1");
        if (h1 != null) return h1.text();
        return doc.title();
    }

    private String extractDescription(Document doc) {
        Element ogDesc = doc.selectFirst("meta[property=og:description]");
        if (ogDesc != null) return ogDesc.attr("content");
        Element metaDesc = doc.selectFirst("meta[name=description]");
        if (metaDesc != null) return metaDesc.attr("content");
        return "";
    }

    private String extractImage(Document doc) {
        Element ogImage = doc.selectFirst("meta[property=og:image]");
        if (ogImage != null) return ogImage.attr("content");
        return null;
    }

    private String extractIngredients(Document doc) {
        Elements items = doc.select("[class*=ingredient], [itemprop=recipeIngredient]");
        if (!items.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (Element item : items) {
                sb.append(item.text()).append("\n");
            }
            return sb.toString().trim();
        }
        return "";
    }

    private String extractInstructions(Document doc) {
        Elements steps = doc.select("[class*=instruction], [class*=direction], [itemprop=recipeInstructions]");
        if (!steps.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (Element step : steps) {
                sb.append(step.text()).append("\n");
            }
            return sb.toString().trim();
        }
        return "";
    }

    private String extractDomain(String url) {
        try {
            java.net.URI uri = new java.net.URI(url);
            String host = uri.getHost();
            return host != null ? host.replaceFirst("^www\\.", "") : "Web";
        } catch (Exception e) {
            return "Web";
        }
    }

    private String cleanCaption(String caption) {
        return caption.replaceAll("#\\S+", "").replaceAll("@\\S+", "").trim();
    }
}
