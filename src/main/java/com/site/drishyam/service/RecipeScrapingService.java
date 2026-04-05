package com.site.drishyam.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.site.drishyam.model.Recipe;
import com.site.drishyam.model.Video;
import com.site.drishyam.repository.RecipeRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.List;

@Service
public class RecipeScrapingService {

    private final RecipeRepository recipeRepository;
    private final ObjectMapper mapper = new ObjectMapper();

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
        recipe.setSource(extractDomain(url));

        // try structured data first — most recipe sites have this
        Elements jsonLdScripts = doc.select("script[type=application/ld+json]");
        for (Element script : jsonLdScripts) {
            String json = script.html();
            if (json.contains("\"Recipe\"") || json.contains("\"@type\":\"Recipe\"")) {
                return parseJsonLd(json, recipe);
            }
        }

        // fall back to scraping the recipe card widget directly
        Element card = findRecipeCard(doc);
        if (card != null) {
            recipe.setTitle(extractTitleFromCard(card, doc));
            recipe.setDescription(extractDescription(doc));
            recipe.setImageUrl(extractImageFromCard(card, doc));
            recipe.setIngredients(extractIngredientsFromCard(card));
            recipe.setInstructions(extractInstructionsFromCard(card));
            extractCardMeta(card, recipe);
        } else {
            recipe.setTitle(extractTitle(doc));
            recipe.setDescription(extractDescription(doc));
            recipe.setImageUrl(extractImage(doc));
            recipe.setIngredients(extractIngredients(doc));
            recipe.setInstructions(extractInstructions(doc));
        }

        return recipeRepository.save(recipe);
    }

    public Recipe extractFromCaption(String caption, Video video) {
        if (caption == null || caption.isBlank()) return null;

        Recipe recipe = new Recipe();
        recipe.setSource("Instagram");
        recipe.setSourceUrl(video.getSourceUrl());
        recipe.setVideo(video);

        String[] lines = caption.split("\n");
        String title = lines[0].replaceAll("[#@]\\S+", "").trim();
        if (title.length() > 100) title = title.substring(0, 100) + "...";
        recipe.setTitle(title.isEmpty() ? "Instagram Recipe" : title);
        recipe.setDescription(caption.replaceAll("#\\S+", "").replaceAll("@\\S+", "").trim());

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
            if (inIngredients && !line.trim().isEmpty()) ingredients.append(line.trim()).append("\n");
            if (inInstructions && !line.trim().isEmpty()) instructions.append(line.trim()).append("\n");
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

    // ---- JSON-LD parsing ----

    private Recipe parseJsonLd(String json, Recipe recipe) throws Exception {
        JsonNode root = mapper.readTree(json);
        JsonNode node = findRecipeNode(root);
        if (node == null) return recipeRepository.save(recipe);

        if (node.has("name")) recipe.setTitle(node.get("name").asText());
        if (node.has("description")) recipe.setDescription(node.get("description").asText());

        if (node.has("image")) {
            JsonNode img = node.get("image");
            if (img.isTextual()) recipe.setImageUrl(img.asText());
            else if (img.isArray() && !img.isEmpty()) {
                JsonNode first = img.get(0);
                recipe.setImageUrl(first.isTextual() ? first.asText() : first.path("url").asText(null));
            } else if (img.has("url")) recipe.setImageUrl(img.get("url").asText());
        }

        if (node.has("recipeIngredient")) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode ing : node.get("recipeIngredient")) sb.append(ing.asText()).append("\n");
            recipe.setIngredients(sb.toString().trim());
        }

        if (node.has("recipeInstructions")) {
            StringBuilder sb = new StringBuilder();
            collectSteps(node.get("recipeInstructions"), sb);
            recipe.setInstructions(sb.toString().trim());
        }

        if (node.has("totalTime")) recipe.setCookTime(formatDuration(node.get("totalTime").asText()));
        else if (node.has("cookTime")) recipe.setCookTime(formatDuration(node.get("cookTime").asText()));

        if (node.has("recipeYield")) {
            JsonNode y = node.get("recipeYield");
            recipe.setServings(y.isArray() ? y.get(0).asText() : y.asText());
        }
        if (node.has("recipeCuisine")) {
            JsonNode c = node.get("recipeCuisine");
            recipe.setCuisine(c.isArray() ? c.get(0).asText() : c.asText());
        }

        return recipeRepository.save(recipe);
    }

    // walks through the json-ld tree to find the Recipe node
    // handles @graph arrays (wordpress/yoast), top-level arrays, and @type as array
    private JsonNode findRecipeNode(JsonNode node) {
        if (node == null) return null;
        if (node.isArray()) {
            for (JsonNode child : node) {
                JsonNode found = findRecipeNode(child);
                if (found != null) return found;
            }
            return null;
        }
        if (node.isObject()) {
            if (isRecipeType(node)) return node;
            if (node.has("@graph")) return findRecipeNode(node.get("@graph"));
        }
        return null;
    }

    private boolean isRecipeType(JsonNode node) {
        JsonNode type = node.get("@type");
        if (type == null) return false;
        if (type.isTextual()) return type.asText().contains("Recipe");
        if (type.isArray()) {
            for (JsonNode t : type) if (t.asText().contains("Recipe")) return true;
        }
        return false;
    }

    // handles HowToStep, HowToSection (with nested itemListElement), and plain strings
    private void collectSteps(JsonNode instructions, StringBuilder sb) {
        for (JsonNode step : instructions) {
            if (step.isTextual()) sb.append(step.asText()).append("\n");
            else if (step.has("text")) sb.append(step.get("text").asText()).append("\n");
            else if (step.has("itemListElement")) collectSteps(step.get("itemListElement"), sb);
        }
    }

    private String formatDuration(String iso) {
        if (iso == null) return null;
        return iso.replace("PT", "").replace("pt", "")
            .replaceAll("(\\d+)H", "$1h ").replaceAll("(\\d+)M", "$1min").trim();
    }

    // ---- recipe card extraction (html fallback) ----

    private Element findRecipeCard(Document doc) {
        String[] selectors = {
            ".wprm-recipe-container, .wprm-recipe",   // WP Recipe Maker
            ".tasty-recipes",                          // Tasty Recipes
            ".mv-recipe-card, .mv-create-card",        // Mediavine Create
            ".easyrecipe",                             // EasyRecipe
            ".recipe-card, #recipe-card, .recipe-container, #recipe",
            "[itemtype*=schema.org/Recipe]"             // schema.org microdata
        };
        for (String sel : selectors) {
            Element card = doc.selectFirst(sel);
            if (card != null) return card;
        }
        return null;
    }

    private String extractTitleFromCard(Element card, Document doc) {
        Element el = card.selectFirst(".wprm-recipe-name, .tasty-recipes-title, .mv-create-title, .recipe-title, [itemprop=name]");
        if (el != null) return el.text();
        Element h2 = card.selectFirst("h2");
        if (h2 != null) return h2.text();
        return extractTitle(doc);
    }

    private String extractImageFromCard(Element card, Document doc) {
        Element img = card.selectFirst("img[src]");
        if (img != null) return img.absUrl("src");
        return extractImage(doc);
    }

    private String extractIngredientsFromCard(Element card) {
        Elements items = card.select(".wprm-recipe-ingredient, .tasty-recipe-ingredients li, .mv-create-ingredients li, [itemprop=recipeIngredient], [class*=ingredient] li");
        if (!items.isEmpty()) return collectText(items);

        // fallback: list items inside any ingredient-ish container
        Elements sections = card.select("[class*=ingredient]");
        for (Element section : sections) {
            Elements lis = section.select("li");
            if (!lis.isEmpty()) return collectText(lis);
        }
        return "";
    }

    private String extractInstructionsFromCard(Element card) {
        Elements items = card.select(".wprm-recipe-instruction, .tasty-recipe-instructions li, .mv-create-instructions li, [itemprop=recipeInstructions], [class*=instruction] li, [class*=direction] li");
        if (!items.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            int n = 1;
            for (Element item : items) {
                String text = item.text().trim();
                if (!text.isEmpty()) sb.append(n++).append(". ").append(text).append("\n");
            }
            return sb.toString().trim();
        }

        Elements sections = card.select("[class*=instruction], [class*=direction]");
        for (Element section : sections) {
            Elements els = section.select("li, p");
            if (!els.isEmpty()) return collectText(els);
        }
        return "";
    }

    private void extractCardMeta(Element card, Recipe recipe) {
        Element time = card.selectFirst("[class*=total-time], [class*=cook-time], [itemprop=totalTime], [itemprop=cookTime]");
        if (time != null) {
            String c = time.attr("content");
            recipe.setCookTime(!c.isEmpty() ? c.replace("PT", "") : time.text());
        }
        Element servings = card.selectFirst("[class*=servings], [itemprop=recipeYield]");
        if (servings != null) {
            String c = servings.attr("content");
            recipe.setServings(!c.isEmpty() ? c : servings.text());
        }
        Element cuisine = card.selectFirst("[itemprop=recipeCuisine], [class*=cuisine]");
        if (cuisine != null) recipe.setCuisine(cuisine.text());
    }

    // ---- generic page-level extraction (last resort) ----

    private String extractTitle(Document doc) {
        Element ogTitle = doc.selectFirst("meta[property=og:title]");
        if (ogTitle != null) return ogTitle.attr("content");
        Element h1 = doc.selectFirst("h1");
        if (h1 != null) return h1.text();
        return doc.title();
    }

    private String extractDescription(Document doc) {
        Element el = doc.selectFirst("meta[property=og:description]");
        if (el != null) return el.attr("content");
        el = doc.selectFirst("meta[name=description]");
        if (el != null) return el.attr("content");
        return "";
    }

    private String extractImage(Document doc) {
        Element el = doc.selectFirst("meta[property=og:image]");
        return el != null ? el.attr("content") : null;
    }

    private String extractIngredients(Document doc) {
        Elements items = doc.select("[class*=ingredient], [itemprop=recipeIngredient]");
        return !items.isEmpty() ? collectText(items) : "";
    }

    private String extractInstructions(Document doc) {
        Elements items = doc.select("[class*=instruction], [class*=direction], [itemprop=recipeInstructions]");
        return !items.isEmpty() ? collectText(items) : "";
    }

    // ---- util ----

    private String collectText(Elements elements) {
        StringBuilder sb = new StringBuilder();
        for (Element el : elements) {
            String text = el.text().trim();
            if (!text.isEmpty()) sb.append(text).append("\n");
        }
        return sb.toString().trim();
    }

    private String extractDomain(String url) {
        try {
            String host = new URI(url).getHost();
            return host != null ? host.replaceFirst("^www\\.", "") : "Web";
        } catch (Exception e) {
            return "Web";
        }
    }
}
