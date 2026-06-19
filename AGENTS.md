# JSON Nexus: Agent Developer Documentation

Welcome to the development team of **JSON Nexus**! This document serves as a handoff manual and reference guide for any agentic AI or developer picking up this project in the future. It captures key design decisions, architectural layouts, and extension opportunities.

---

## 🚀 Project Overview & Stack

JSON Nexus is a premium, client-side developer workbench designed to format, validate, convert, compare, query, and visualize JSON structures.

### The Stack:
- **Core Framework:** React 19 + TypeScript + Vite 6
- **Code Editor:** `@monaco-editor/react` (for editor, side-by-side diff views, and type validation)
- **Icons:** `lucide-react` (premium clean icon set)
- **Data Parsers:** `yaml` (for YAML) and `ajv` (for standard JSON Schema validation)
- **Styling:** Vanilla CSS ([src/index.css](file:///d:/Projects/json-nexus/src/index.css)) utilizing CSS variables, dark slate backgrounds, glassmorphism, and responsive flex/grid splits.

---

## 📂 Codebase Architecture

```
d:/Projects/json-nexus/
├── index.html                   # Entry point (Outfit Google Font & SEO description)
├── package.json                 # Project dependencies & build commands
├── src/
│   ├── main.tsx                 # React DOM mount point
│   ├── App.tsx                  # Main router, coordinative hooks, layout slots
│   ├── index.css                # Global stylesheet & design tokens
│   ├── App.css                  # Cleared boilerplate stylesheet
│   ├── utils/
│   │   ├── converters.ts        # Custom parsers (XML, CSV, TOML) & model generators (TS/Go/Python/Rust)
│   │   └── jsonpath.ts          # Dot-notation tokenizer & Function compiler
│   └── components/
│       ├── Sidebar.tsx          # Left-pane navigation menu
│       ├── FormatterView.tsx    # Text editor, Stats bar, Tree explorer, Table, Graph & Filters
│       ├── SchemaValidatorView.tsx  # Side-by-side AJV validator
│       ├── ConverterView.tsx    # Bi-directional format switcher & code compiler
│       ├── DiffView.tsx         # Interactive side-by-side Monaco DiffEditor
│       ├── MockGeneratorView.tsx # Randomized template generator (Users, Products, etc.)
│       └── EscaperView.tsx      # Inline quote escaper / unescaper
```

---

## 🛠️ Key Architectural Decisions & Decisions Log

### 1. 100% Client-Side Privacy
- **Decision:** All converters, validators, DiffEditors, and generators run completely client-side in the browser.
- **Rationale:** Developer security. JSON payloads frequently contain API keys, passwords, database queries, and sensitive user records. Sending them to a third-party server poses security risks.
- **Constraint:** Do not introduce server-side microservices or network routers for data operations in future expansions.

### 2. No direct `eval` for JS Queries
- **Decision:** We evaluate JS filtering queries via `new Function('data', 'return (' + fnStr + ')(data)')` rather than `eval()`.
- **Rationale:** Rollup/Vite displays optimization warnings and security alerts on direct `eval`. Using the `new Function` constructor isolates scopes, compiles cleanly, and satisfies standard build criteria.

### 3. Native XML parsing via DOMParser
- **Decision:** Instead of using heavy, legacy npm XML parsers, we use the browser's native `DOMParser` inside [converters.ts](file:///d:/Projects/json-nexus/src/utils/converters.ts) to parse XML documents into standard JSON.
- **Rationale:** Native browser APIs run substantially faster and avoid bloating the production JavaScript bundle.

### 4. Interactive, Editable Diff Editor
- **Decision:** Monaco's DiffEditor is configured with:
  ```json
  { "originalEditable": true, "readOnly": false }
  ```
- **Rationale:** Standard online diff engines only let users edit one pane or are completely read-only. Letting developers write/paste into both original (left) and modified (right) panes provides an elite workspace experience. State changes are synchronized in real-time using Monaco event listeners (`onDidChangeModelContent`).

### 5. SVG bezier curved connections in Graphs
- **Decision:** We render node relationships in the Graph View using SVG elements with cubic Bezier paths:
  ```typescript
  const midX = (link.x1 + link.x2) / 2;
  const pathData = `M ${link.x1} ${link.y1} C ${midX} ${link.y1}, ${midX} ${link.y2}, ${link.x2} ${link.y2}`;
  ```
- **Rationale:** Provides organic, flowing connection curves resembling advanced node editors (e.g. JSON Crack) without loading complex graph physics or canvas rendering engines.

### 6. Scrollbar Flicker Prevention
- **Decision:** We do not style `::-webkit-scrollbar` globally. We isolate it to specific layout containers (like `.pane-body`, `.table-container`, etc.), and set `.pane-body { overflow: hidden }` when editors are nested.
- **Rationale:** Global Webkit-scrollbar styling overrides Monaco's synthetic custom scrollbars, throwing off its container width offset calculations. This causes continuous re-layout triggers (loop loops). Confining scrollbars and wrapping Monaco editors in `overflow: hidden` containers completely eliminates visual scrollbar flickering.

---

## 🔮 Suggested Next Features (Backlog)

If you are tasked with expanding the application, consider these premium upgrades:

1. **GraphQL to JSON schema generator:** Compile a GraphQL schema definitions list into mockup JSON payloads.
2. **Interactive SVG Graph controls:** Implement mouse drag-and-pan and scroll-wheel zoom modifications on the Graph SVG wrapper by updating translation `x, y, scale` states.
3. **JSON Schema Generator:** Auto-deduce and generate a matching JSON Schema definition based on an active JSON payload loaded in the Formatter.
4. **Session History presets:** Save successful JSON states to `localStorage` and display them in a "Recent Actions" drawer inside the Sidebar, so users don't lose active workspaces on page reload.

---

## 7. GitHub Repository & Auto-Deployment
*   **Remote URL**: `https://github.com/parth2844/json-nexus`
*   **CI/CD Pipeline**: The project relies on an automated GitHub Actions workflow [.github/workflows/deploy.yml](file:///d:/Projects/json-nexus/.github/workflows/deploy.yml) to build and push the production bundle seamlessly to **GitHub Pages**.
*   **Vite Configuration**: To support the GitHub Pages subpath environment, [vite.config.ts](file:///d:/Projects/json-nexus/vite.config.ts) is explicitly configured with `base: '/json-nexus/'`. **Do not** remove this base URL path unless migrating away from GitHub Pages.
