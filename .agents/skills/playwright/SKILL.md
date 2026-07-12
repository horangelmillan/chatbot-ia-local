---
name: playwright
description: "Browser automation via Playwright MCP + CLI for end-to-end testing, UI verification, data extraction, screenshots, and form automation. Use when the task requires interacting with a real browser — navigating pages, clicking elements, filling forms, verifying UI state, capturing screenshots, or generating Playwright tests. Covers SAPUI5-specific patterns for the chatbot project."
metadata:
  source: "Microsoft Playwright MCP + CLI"
  documentation: "https://playwright.dev/mcp/introduction"
  cli_docs: "https://playwright.dev/docs/getting-started-cli"
  best_practices: "https://playwright.dev/docs/best-practices"
  testing_caps: "https://playwright.dev/mcp/tools/assertions"
---

# Playwright Browser Automation Skill

## Related Skills

- **sapui5**: Use for building SAPUI5 views, controllers, and models — complementa playwright para entender la app bajo prueba
- **sapui5-cli**: Use for UI5 build/dev server config — playwright tests against the running dev server

## When to Use This Skill

Use this skill when the task needs a real browser:

- **UI verification**: Confirm a page renders correctly, elements exist, text is visible
- **E2E testing**: Navigate through a complete user flow (login → chat → send message → verify response)
- **Form automation**: Fill inputs, submit forms, verify validation
- **Data extraction**: Scrape structured data from pages
- **Screenshots**: Capture visual state of pages or elements
- **Test generation**: Record interactions and generate Playwright test code
- **Debugging**: Inspect console errors, network requests, or accessibility tree

This project's frontend is SAPUI5 (`chatbot.ui`). The backend runs on Express (`localhost:3001`).

## Two Interfaces

| Interface | When to Use | Token Cost |
|-----------|------------|-----------|
| **Playwright MCP** (tools `browser_*`) | Exploratory testing, iterative workflows, debugging visual state, complex multi-step flows | Higher (accessibility trees in context) |
| **Playwright CLI** (`playwright-cli` via bash) | Quick verifications, test generation, token-constrained sessions, known commands | Lower (no tool schemas in context) |

Use MCP when you need to **reason about page structure** before deciding what to do. Use CLI when you **already know** the command sequence.

---

## Playwright MCP Tools Reference

### Navigation & Page

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Navigate to a URL |
| `browser_tabs` | List, create, close, or switch tabs |
| `browser_close` | Close browser page |
| `browser_resize` | Change viewport size |
| `browser_wait_for` | Wait for text, timeout, or text to disappear |

### Interaction

| Tool | Purpose |
|------|---------|
| `browser_snapshot` | **Primary tool** — capture accessibility tree; use this to get `ref` identifiers for elements |
| `browser_click` | Click element by `ref` from snapshot |
| `browser_type` | Type text into input by `ref` |
| `browser_select_option` | Select dropdown option |
| `browser_hover` | Hover over element |
| `browser_fill_form` | Fill multiple form fields at once |
| `browser_drag` / `browser_drop` | Drag & drop files or elements |
| `browser_press_key` | Press a keyboard key |

### Data Extraction

| Tool | Purpose |
|------|---------|
| `browser_evaluate` | Execute JavaScript on page, return JSON |
| `browser_console_messages` | Get console logs (error, warning, info) |
| `browser_find` | Search snapshot for text/pattern |

### Screenshots & Media

| Tool | Purpose |
|------|---------|
| `browser_take_screenshot` | Capture screenshot (PNG/JPEG) |
| `browser_pdf_save` | Export page as PDF *(requires `--caps=pdf`)* |

### Testing & Assertions *(via `--caps=testing`)*

| Tool | Purpose |
|------|---------|
| `browser_verify_element_visible` | Assert element by role + accessible name |
| `browser_verify_text_visible` | Assert text is visible on page |
| `browser_verify_list_visible` | Assert list with expected items |
| `browser_verify_value` | Assert element value (checkbox, input) |
| `browser_generate_locator` | Generate a Playwright `getByRole` locator from a ref — use this to write test files |

### Network *(via `--caps=network`)*

| Tool | Purpose |
|------|---------|
| `browser_network_requests` | List all network requests since navigation |
| `browser_network_request` | Inspect headers/body of a specific request |

### File Upload

| Tool | Purpose |
|------|---------|
| `browser_file_upload` | Upload files via file chooser |

---

## Core Workflow

```
browser_navigate → browser_snapshot (get refs) → interact (click/type) → verify (snapshot/verify tool) → next action
```

### Step-by-step

1. **Navigate**: `browser_navigate { url: "http://localhost:3001" }`
2. **Snapshot**: `browser_snapshot` — returns an accessibility tree with `ref` IDs (e.g., `e1`, `e2`) on interactive elements. Use the `ref` as the `target` parameter in subsequent calls.
3. **Interact**: `browser_click { target: "e5" }` or `browser_type { target: "e3", text: "hello" }`
4. **Verify**: `browser_snapshot` again, or use `browser_verify_text_visible { text: "expected message" }`
5. **Repeat**: Continue the flow

### Token-Saving Tips

- Use `browser_snapshot` with `depth` parameter to limit tree depth for large SPAs
- Use `browser_find` to search within snapshots instead of requesting the full tree
- Prefer `browser_verify_*` tools over full snapshots when you only need an assertion

---

## SAPUI5-Specific Patterns

This project's app is `chatbot.ui` at `http://localhost:3001` with the backend API at `http://localhost:3001`.

### Pattern 1: Verify Page Loaded

```text
browser_navigate { url: "http://localhost:3001" }
browser_snapshot
→ Look for: App with "app", Page with "chatPage", Input with "chatInput", Button with "sendButton"
browser_verify_element_visible { role: "textbox", name: "chatInput" }
browser_verify_element_visible { role: "button", name: "sendButton" }
```

The snapshot returns SAPUI5 controls by their ARIA roles:
- `Input` → `role: "textbox"` with name from `id` or `aria-label`
- `Button` → `role: "button"` with name from text or `tooltip`
- `List` → `role: "list"` or `role: "listbox"`
- `Page` → `role: "main"` or region landmark

### Pattern 2: Send a Chat Message

```text
browser_navigate { url: "http://localhost:3001" }
browser_snapshot                                          → get ref for chatInput
browser_type { target: "e3", text: "What is SAPUI5?" }    → type into input
browser_click { target: "e5" }                            → click send button
browser_wait_for { time: 2 }                               → wait for response
browser_snapshot                                           → verify message appears
browser_verify_text_visible { text: "What is SAPUI5?" }   → assert user message visible
```

### Pattern 3: Verify Backend API via Network

```text
browser_navigate { url: "http://localhost:3001" }
browser_type { target: "e3", text: "Hello", submit: true }
browser_wait_for { time: 3 }
browser_network_requests                                   → list all API calls
browser_network_request { index: 3 }                       → inspect POST /api/chat/send
→ Verify: status 200, response body contains `answer`
```

### Pattern 4: Generate Playwright Test Code

```text
browser_navigate { url: "http://localhost:3001" }
browser_type { target: "e3", text: "test message", submit: true }
browser_wait_for { time: 2 }
browser_generate_locator { target: "e3" }                  → generates the getByRole locator
→ Use the generated locator in a playwright test file
```

### Pattern 5: Screenshot for Visual Review

```text
browser_navigate { url: "http://localhost:3001" }
browser_take_screenshot { filename: "chat-ui.png" }
```

### Pattern 6: Test Chat Session Reset

```text
browser_navigate { url: "http://localhost:3001" }
browser_type { target: "e3", text: "message 1", submit: true }
browser_wait_for { time: 2 }
browser_snapshot                                           → verify message 1 exists
browser_click { target: "e7" }                             → click reset/new session button
browser_wait_for { time: 1 }
browser_snapshot                                           → verify messages cleared
→ Assert: messages list is empty or welcome text visible
```

### Pattern 7: File Upload (Document Processing)

```text
browser_navigate { url: "http://localhost:3001" }
browser_file_upload { paths: ["C:/path/to/document.pdf"] }
browser_wait_for { time: 3 }
browser_snapshot                                           → verify upload success message
browser_verify_text_visible { text: "Document processed" }
```

---

## Playwright CLI Reference

When token efficiency matters, use `playwright-cli` directly via bash.

### Common Commands

```powershell
# Navigate and snapshot
playwright-cli open http://localhost:3001
playwright-cli snapshot

# Type and click
playwright-cli type "What is UI5?" --submit
playwright-cli click "sendButton"
playwright-cli snapshot

# Screenshot
playwright-cli screenshot --path chat-ui.png

# Generate test code
playwright-cli codegen http://localhost:3001

# Run existing tests
playwright-cli test

# Session management
playwright-cli sessions
playwright-cli session use <id>

# View dashboard for running sessions
playwright-cli show
```

The skills installed by `playwright-cli install --skills` include detailed guides for: test generation, tracing, video recording, request mocking, spec-driven testing, storage state, and element inspection.

---

## Best Practices

### Do's

- **Use `browser_snapshot` to decide what to click** — the accessibility tree gives stable `ref` IDs that are resilient to layout changes. Never guess selectors.
- **Limit snapshot depth** on large SPAs:
  ```
  browser_snapshot { depth: 3 }
  ```
- **Verify with assertions** once you know what to expect:
  ```
  browser_verify_text_visible { text: "Message sent" }
  ```
- **Handle dialogs** when they appear — the MCP server pauses until you call `browser_handle_dialog`:
  ```
  browser_handle_dialog { accept: true }
  ```
- **Inspect network** to verify API calls happened correctly:
  ```
  browser_network_requests
  browser_network_request { index: 1 }
  ```
- **Use `browser_find`** to search within a snapshot without loading the full tree.
- **Isolate sessions** when running tests in parallel — add `--isolated` to MCP or use `playwright-cli session new` for CLI.

### Don'ts

- **Don't use `browser_run_code_unsafe`** — it's RCE-equivalent. Only use in isolated/throwaway environments. The standard tools cover 99% of use cases.
- **Don't hardcode `ref` IDs** — they change between sessions. Always do a snapshot first, then use the current refs.
- **Don't rely on screenshots** for LLM decisions — the vision model is not available by default. Use accessibility snapshots instead.
- **Don't share persistent profiles** across concurrent MCP clients — each needs `--isolated` or a distinct `--user-data-dir`.

### Security

- This project runs locally at `localhost:3001`. No credentials are exposed in the development setup.
- If adding authentication later, use the `secrets` configuration in `~/.config/opencode/opencode.jsonc` to redact tokens from snapshots and logs.
- The `--allowed-hosts` flag restricts which domains the browser can navigate to.
- The `--blocked-origins` flag blocks specific origins.

---

## MCP Configuration

This skill expects Playwright MCP configured in `~/.config/opencode/opencode.jsonc`:

```json
{
  "playwright": {
    "type": "local",
    "enabled": true,
    "command": ["npx", "@playwright/mcp@latest", "--caps=testing,network"]
  }
}
```

Optional but recommended (project-level, auto-loaded):
`.playwright/cli.config.json`:
```json
{
  "browser": { "browserName": "chromium" },
  "timeout": { "action": 10000, "navigation": 30000 }
}
```

---

## References

- [Playwright MCP Documentation](https://playwright.dev/mcp/introduction)
- [Playwright MCP Assertions (testing caps)](https://playwright.dev/mcp/tools/assertions)
- [Playwright CLI with Skills](https://playwright.dev/docs/getting-started-cli)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Playwright CLI GitHub](https://github.com/microsoft/playwright-cli)
