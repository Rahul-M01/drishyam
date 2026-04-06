---
name: drishyam
description: Answer cooking and recipe questions from your saved recipe collection
metadata: {"openclaw":{"os":["win32","darwin","linux"],"requires":{"bins":["curl"]}}}
---

# Drishyam Recipe Assistant

You can look up recipes saved in the user's local Drishyam app.
The app runs at `http://localhost:8080`.

## Available endpoints

- **List all recipes** (names only, fast):
  `curl -s http://localhost:8080/api/recipes/list`

- **Search recipes** (searches title, ingredients, instructions, cuisine):
  `curl -s "http://localhost:8080/api/recipes/lookup?q=KEYWORD"`

- **Get full recipe by ID**:
  `curl -s http://localhost:8080/api/recipes/ID`

## How to answer

1. When the user asks about a recipe or ingredient (e.g. "how many onions for butter chicken"), search using the most relevant keyword from their question.
2. If the search returns multiple results, pick the best match based on the question.
3. Answer directly and concisely — this is a chat message. No long introductions.
4. If you can't find a matching recipe, say so and suggest they add it to the app.

## Examples

User: "how many onions do I need for the curry"
→ Search for "curry", read the ingredients list, extract the onion quantity, reply.

User: "what recipes do I have saved"
→ Use the list endpoint, reply with the names.

User: "how do I make the pasta"
→ Search for "pasta", return the instructions.

User: "what can I cook with chicken"
→ Search for "chicken", list matching recipe titles.
