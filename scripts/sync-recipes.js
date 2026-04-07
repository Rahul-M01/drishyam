const http = require('http');
const fs = require('fs');
const path = require('path');

const API = 'http://localhost:8080/api/recipes/lookup?q=';
const WORKSPACE = path.join(process.env.USERPROFILE, '.openclaw', 'workspace');
const OUTPUT = path.join(WORKSPACE, 'TOOLS.md');

http.get(API, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const recipes = JSON.parse(data);
      let md = '# TOOLS.md — Saved Recipes\n\n';
      md += 'This is the complete list of saved recipes. ONLY use these recipes when answering. Do NOT make up recipes that are not listed here.\n\n';

      if (!recipes.length) {
        md += 'No recipes saved yet.\n';
      } else {
        recipes.forEach((r) => {
          md += `## ${r.title}\n`;
          if (r.cuisine) md += `- Cuisine: ${r.cuisine}\n`;
          if (r.cookTime) md += `- Cook time: ${r.cookTime}\n`;
          if (r.servings) md += `- Servings: ${r.servings}\n`;
          if (r.ingredients) {
            md += '\nIngredients:\n';
            r.ingredients.split('\n').forEach((i) => {
              if (i.trim()) md += `- ${i.trim()}\n`;
            });
          }
          if (r.instructions) {
            md += '\nInstructions:\n';
            r.instructions.split('\n').forEach((s, idx) => {
              if (s.trim()) md += `${idx + 1}. ${s.trim()}\n`;
            });
          }
          md += '\n---\n\n';
        });
      }

      fs.writeFileSync(OUTPUT, md);
      console.log(`Synced ${recipes.length} recipe(s) to ${OUTPUT}`);
    } catch (e) {
      console.error('Sync failed:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('API unreachable:', e.message);
});
