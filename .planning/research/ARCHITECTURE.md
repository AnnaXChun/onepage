# Architecture Research: Rich Text Formatting in Lexical

**Domain:** Text editor rich text formatting (bold, italic, underline, links)
**Project:** Vibe Onepage v1.10 Rich Text Formatting
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

Adding rich text formatting to the existing Lexical editor requires:
1. Floating toolbar component that appears on text selection
2. Link editor modal for URL input and validation
3. Integration with Lexical's command-based architecture (FORMAT_TEXT_COMMAND, TOGGLE_LINK_COMMAND)

**No changes required to:**
- Zustand store or auto-save logic (Lexical JSON serialization already handles formatting)
- Backend API or database schema
- Existing LexicalBlockNode structure (formatting happens inside TextNodes)

**Key integration points:**
- RichTextPlugin already registered keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)
- LinkNode must be added to editor configuration if not present
- FloatingToolbar subscribes to SELECTION_CHANGE_COMMAND

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Component Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  RichText   │  │  FloatingToolbar │  │  LinkEditor    │  │
│  │  Plugin     │  │  (selection-     │  │  Modal         │  │
│  │  (existing) │  │   based)         │  │                │  │
│  └──────┬──────┘  └────────┬─────────┘  └───────┬────────┘  │
│         │                  │                      │           │
├─────────┴──────────────────┴──────────────────────┴──────────┤
│                      Lexical Editor Core                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐  ┌────────────────┐      │
│  │  TextNode   │  │   LinkNode      │  │  Selection     │      │
│  │  (styles)   │  │   (url, attrs)  │  │  (range)      │      │
│  └─────────────┘  └─────────────────┘  └────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                     Zustand State Store                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  editorState (Lexical JSON) ←→ Zustand ←→ Backend API  │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| RichTextPlugin | Registers keyboard shortcuts and formatting commands | Wraps Lexical's FORMAT_TEXT_COMMAND listeners |
| FloatingToolbar | Shows on text selection, positions near selection, dispatches format commands | React component + useEffect on SELECTION_CHANGE_COMMAND |
| LinkEditorModal | URL input, validation, insert/edit link | Modal component using TOGGLE_LINK_COMMAND |
| TextNode | Stores text with inline styles (bold, italic, etc.) | Lexical's TextNode with __style property |
| LinkNode | Hyperlink element with URL, target, rel | Lexical's LinkNode extends ElementNode |

---

## Recommended Project Structure

```
frontend/src/
├── editor/
│   ├── plugins/
│   │   └── RichTextPlugin.tsx       # Existing - wraps formatting
│   ├── components/
│   │   ├── FloatingToolbar.tsx      # NEW - text selection toolbar
│   │   └── LinkEditorModal.tsx      # NEW - link URL modal
│   ├── hooks/
│   │   ├── useTextFormat.ts         # NEW - formatting command dispatchers
│   │   └── useSelectionPosition.ts  # NEW - toolbar positioning logic
│   └── utils/
│       └── linkUtils.ts             # NEW - URL sanitization/validation
├── blocks/
│   └── LexicalBlockNode.tsx         # EXISTING - verify LinkNode in config
```

### Structure Rationale

- **plugins/:** RichTextPlugin wraps Lexical internals, already separated
- **components/:** UI components (FloatingToolbar, LinkEditorModal) are React-centric
- **hooks/:** Custom hooks encapsulate command dispatch logic for reuse
- **utils/:** Pure functions for URL validation, sanitization (security-critical)

---

## Architectural Patterns

### Pattern 1: Command Dispatch Pattern

**What:** Lexical uses a command-based architecture where actions dispatch commands that registered listeners handle.

**When to use:** All formatting operations (bold, italic, link toggle)

**Trade-offs:** Decoupled but requires understanding command flow

**Example:**
```typescript
// Dispatch bold formatting
editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');

// Toggle link (null URL removes existing link)
editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://example.com');
```

### Pattern 2: Selection Listener Pattern

**What:** Components subscribe to SELECTION_CHANGE_COMMAND to react when user selects text.

**When to use:** Floating toolbar visibility and positioning

**Trade-offs:** Requires cleanup on unmount; can fire frequently

**Example:**
```typescript
useEffect(() => {
  return editor.registerCommand(
    SELECTION_CHANGE_COMMAND,
    (payload) => {
      const newSelection = payload;
      setIsVisible($isRangeSelection(newSelection) && !newSelection.isCollapsed);
      return false;
    },
    COMMAND_PRIORITY_LOW
  );
}, [editor]);
```

### Pattern 3: Style Patch Pattern

**What:** $patchStyleText() applies inline CSS styles to selected text nodes atomically.

**When to use:** Applying/removing inline styles (bold via fontWeight, italic via fontStyle)

**Trade-offs:** Works on TextNodes only; selecting across nodes creates multiple styled regions

**Example:**
```typescript
const selection = $getSelection();
if ($isRangeSelection(selection)) {
  selection.patchStyleText(editor, {
    'font-weight': 'bold',
    'text-decoration': 'underline'
  });
}
```

---

## Data Flow

### Rich Text Formatting Flow

```
User selects text
    ↓
SELECTION_CHANGE_COMMAND fires
    ↓
FloatingToolbar detects $isRangeSelection + !isCollapsed
    ↓
Toolbar renders with available format buttons
    ↓
User clicks "Bold" button
    ↓
dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
    ↓
RichTextPlugin listener executes $patchStyleText
    ↓
Lexical updates TextNode __style property
    ↓
Zustand sync → Backend API (unchanged, JSON serialization)
```

### Link Insertion Flow

```
User selects text or places cursor
    ↓
User clicks "Link" button in toolbar
    ↓
LinkEditorModal opens with URL input
    ↓
User enters URL + clicks "Insert"
    ↓
dispatchCommand(TOGGLE_LINK_COMMAND, validatedUrl)
    ↓
LinkExtension:
  - If selection is text: wraps in LinkNode
  - If cursor in existing link: updates URL
  - If URL is null: removes link
    ↓
Lexical updates document tree
```

---

## Integration Points

### Existing LexicalBlockNode Integration

The existing LexicalBlockNode wraps a Lexical editor instance. Rich text formatting integrates at the **TextNode level** within each block:

```
LexicalBlockNode
  └── LexicalComposer
        └── RichTextPlugin (already registered)
        └── Editor
              └── BlockNode (custom element wrapper)
                    └── TextNode (rich text via FORMAT_TEXT_COMMAND)
```

**What changes:**
- LexicalBlockNode may need LinkNode added to initialConfig.nodes
- FloatingToolbar and LinkEditorModal are siblings to the editor, not children
- No changes to Zustand store, auto-save, or backend

### Zustand/Backend Compatibility

**No changes required to:**
- Zustand store (editorState JSON already contains formatting)
- Backend API (serialization unchanged)
- Auto-save debounce logic (Lexical JSON is already the state)

**What may be needed:**
- LinkNode added to initialConfig.nodes if not already present

---

## New vs Modified Files

### New Files

| File | Purpose |
|------|---------|
| FloatingToolbar.tsx | Selection-aware toolbar with format buttons |
| LinkEditorModal.tsx | Modal for URL input and validation |
| useTextFormat.ts | Hook wrapping dispatchCommand for each format |
| useSelectionPosition.ts | Hook calculating toolbar position from selection rect |
| linkUtils.ts | URL sanitization and validation utilities |
| toolbar.css | Floating toolbar styling (OKLCH colors, animations) |

### Modified Files

| File | Change |
|------|--------|
| LexicalBlockNode.tsx | Add LinkNode to initialConfig.nodes if missing |
| EditorContext.tsx | Add FloatingToolbar and LinkEditorModal to editor wrapper |

---

## Build Order (Dependency Order)

### Phase 1: Foundation
1. Add LinkNode to Lexical configuration (verify not already present)
2. Create linkUtils.ts with URL sanitization (sanitizeUrl from Lexical)
3. Create useTextFormat.ts with format command dispatchers

### Phase 2: Floating Toolbar
4. Create useSelectionPosition.ts for toolbar positioning
5. Build FloatingToolbar.tsx with basic buttons (bold, italic, underline)
6. Create toolbar.css with OKLCH styling
7. Integrate toolbar into editor wrapper with visibility logic

### Phase 3: Link Support
8. Build LinkEditorModal.tsx with URL input and validation
9. Connect Link button to modal
10. Handle edit-existing-link flow

### Phase 4: Polish
11. Add keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K)
12. Add strikethrough and code formatting
13. Test mixed formatting within paragraphs

---

## Anti-Patterns

### Anti-Pattern 1: Direct DOM Manipulation for Styling

**What people do:** Use execCommand() or directly manipulate DOM styles
**Why it's wrong:** Breaks Lexical's internal state consistency; state becomes desynchronized
**Do this instead:** Use $patchStyleText() for styles, TOGGLE_LINK_COMMAND for links

### Anti-Pattern 2: Toolbar Without Selection Check

**What people do:** Show toolbar whenever editor is focused
**Why it's wrong:** User expects toolbar only when text is selected
**Do this instead:** Check $isRangeSelection(selection) && !selection.isCollapsed

### Anti-Pattern 3: Storing Links as Plain Text

**What people do:** Store link URL in separate field, render as <a> in view mode
**Why it's wrong:** Loses editability; link formatting should be native Lexical state
**Do this instead:** Use LinkNode which is part of the serialized state

---

## Keyboard Shortcuts

RichTextPlugin already registers these via FORMAT_TEXT_COMMAND:

| Shortcut | Format |
|----------|--------|
| Ctrl+B / Cmd+B | Bold |
| Ctrl+I / Cmd+I | Italic |
| Ctrl+U / Cmd+U | Underline |
| Ctrl+Shift+S | Strikethrough |
| Ctrl+Shift+C | Code |

**Note:** Link shortcut (Ctrl+K) typically opens link modal, not just toggle.

---

## Sources

- [Lexical Rich Text Concepts](https://lexical.dev/docs/concepts/rich-text) — HIGH confidence
- [Lexical Link Module API](https://lexical.dev/docs/api/modules/lexical_link) — HIGH confidence
- [Lexical Selection Module](https://lexical.dev/docs/api/modules/lexical_selection) — HIGH confidence
- [Lexical Commands](https://lexical.dev/docs/concepts/commands) — HIGH confidence
- [Lexical React Plugins](https://lexical.dev/docs/react/plugins) — HIGH confidence
- [Lexical Playground ToolbarPlugin](https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/ToolbarPlugin/index.tsx) — MEDIUM confidence (implementation reference)

---

*Architecture research for: Vibe Onepage v1.10 Rich Text Formatting*
*Researched: 2026-03-25*
