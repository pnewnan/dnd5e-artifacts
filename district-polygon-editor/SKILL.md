---
name: district-polygon-editor
description: >
  Generates a self-contained HTML/JS polygon editor for drawing district boundaries
  on a D&D town map image. Use this skill whenever the user wants to define, edit,
  or trace district polygons for a town map — for example "help me draw district polygons",
  "I need to trace the districts on my map", "create the polygon editor for my town",
  "let me draw the district boundaries", or any time they're working on the dnd-town-map
  skill and need to produce the polygon coordinates. The output is a single HTML file
  the user opens in their browser to click-trace polygons, then exports JSON to paste
  back into their town-data.json.
---

# District Polygon Editor Skill

You are generating a single self-contained HTML polygon-editor tool that the user
opens in their browser to trace district boundaries on a town map image. When they're
done, they click Export and get JSON ready to paste into a `town-data.json` file used
by the dnd-town-map skill.

## Output

Produce exactly one file: `{town-name}_polygon-editor.html`

Save it to the outputs folder and present it with `mcp__cowork__present_files`.

## Step 1 — Get the town name

Ask the user: "What's the town name?" (used to name the output file and pre-populate
district color options).

If the user has already stated the town name in the conversation, skip asking and use it.

## Step 2 — Generate the file

Copy the complete template from `assets/editor-template.html` verbatim. Make no changes
to the HTML/JS — it is fully self-contained and handles everything at runtime.

Save it as `{town-name}_polygon-editor.html` in the outputs folder.

## Step 3 — Brief the user

Tell the user:

> Open the file in your browser. Use the file picker to load your day map image.
> For each district: click **+ Add District**, give it a name and color, then click
> points on the map to trace the boundary. Click an existing vertex dot to remove it.
> When done, click **Export JSON** — the textarea shows the polygon block ready to
> paste into your `town-data.json` districts array.

That's it. Don't over-explain — the UI is self-documenting.

## Notes on the polygon format

The exported JSON matches the dnd-town-map skill's district schema exactly:

```json
[
  {
    "id": "market",
    "name": "Market District",
    "color": "gold",
    "polygon": [[30,26],[56,24],[60,40],[56,54],[28,56],[20,44]]
  }
]
```

Coordinates are `[x, y]` pairs in 0–100 percentage space (matching `viewBox="0 0 100 100"`).
x=0 is left, x=100 is right, y=0 is top, y=100 is bottom.

The user pastes the exported array into the `"districts"` field of their `town-data.json`,
adding `"description"` fields manually. The polygon coordinates are what matter most —
the editor handles the geometry, Claude handles the lore.
