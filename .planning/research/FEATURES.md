# Feature Research: Rich Text Formatting (v1.10)

**Domain:** Lexical-based block editor rich text formatting
**Researched:** 2026-03-25
**Confidence:** MEDIUM-HIGH

---

## Feature Landscape

### Table Stakes (Users Expect These)

Users expect text editing to behave like Google Docs or Notion -- standard rich text that "just works."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Bold (Ctrl+B / Cmd+B) | Universal editing expectation | LOW | Lexical `FORMAT_TEXT_COMMAND` with `bold` type. Theme class `vibe-text-bold` already defined in LexicalConfig. |
| Italic (Ctrl+I / Cmd+I) | Universal editing expectation | LOW | Same mechanism as bold, using `italic` format type. Theme class `vibe-text-italic` already defined. |
| Underline (Ctrl+U / Cmd+U) | Universal editing expectation | LOW | Same mechanism using `underline` format type. Theme class `vibe-text-underline` already defined. |
| Strikethrough | Common editing need | LOW | Uses `strikethrough` format type. Not yet in theme config. |
| Inline code | Technical content formatting | LOW | Uses `code` format type. |
| Clickable links (Ctrl+K) | Web-standard expectation | MEDIUM | Requires `@lexical/link` package (NOT in package.json). Needs `LinkNode`, `TOGGLE_LINK_COMMAND`. |
| Floating toolbar on selection | Modern editor UX pattern | MEDIUM | Lexical Playground pattern: multi-listener approach (selectionchange + SELECTION_CHANGE_COMMAND + registerUpdateListener). |
| Mixed formatting within paragraphs | Rich text expectation | MEDIUM | Lexical TextNodes natively support multiple format flags simultaneously. |

### Differentiators (Competitive Advantage)

These are not expected by default but add significant value for a website builder.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Format-preserving AI Write Assist | AI suggestions respect existing formatting | MEDIUM | Current AI Write replaces entire text. With rich text, AI should preserve/respect inline formatting. |
| Block-level format toolbar vs floating | Consistent with block-editor mental model | LOW | Floating toolbar on text selection is the standard pattern, but a block-level toolbar when block is selected could be simpler. |
| Link URL editing inline | Professional feel | MEDIUM | Requires URL input in floating toolbar, URL validation, link security (no javascript: URLs). |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time collaborative formatting | "Google Docs has it" | Significant complexity: CRDTs, presence cursors, conflict resolution. Lexical supports this but requires Yjs integration. | Single-user editing for v1.10 |
| Inline image formatting | "Can add images in text" | Images in text flow require complex node types and rendering logic. | Keep images as separate blocks |
| Table formatting | "Notion has tables" | Tables in a single-page website builder are low-value vs complexity. | No tables in v1 |
| Custom formatting styles | "Want my own bold style" | Theme inconsistency, CSS explosion. | Limit to standard formats |

---

## Feature Dependencies

```
Bold/Italic/Underline/Strikethrough/Code
    └──requires──> Lexical RichTextPlugin + FORMAT_TEXT_COMMAND
                       └──requires──> @lexical/rich-text (already in package.json)

Links
    └──requires──> @lexical/link (MISSING from package.json)
                       └──requires──> LinkNode registration in lexicalConfig
                                  └──requires──> TOGGLE_LINK_COMMAND handling

Floating Toolbar
    └──requires──> Selection detection (SELECTION_CHANGE_COMMAND + selectionchange)
                       └──requires──> FloatingElemPosition for positioning
                                  └──requires──> Toolbar state from selection.hasFormat()

Keyboard Shortcuts
    └──requires──> editor.registerCommand for FORMAT_TEXT_COMMAND
    └──requires──> LinkPlugin for Ctrl+K
```

### Dependency Notes

- **Bold/Italic/Underline require RichTextPlugin:** The existing `@lexical/rich-text` package provides `registerRichText` which registers `FORMAT_TEXT_COMMAND` with the editor.
- **Links require @lexical/link:** This package is NOT in package.json and must be installed. It provides `LinkNode`, `$createLinkNode`, and `TOGGLE_LINK_COMMAND`.
- **Floating toolbar requires selection tracking:** Uses Lexical's `SELECTION_CHANGE_COMMAND` and native `selectionchange` events to detect when to show/hide.
- **TextBlock must migrate from contentEditable:** Current TextBlock uses plain `contentEditable` divs. It needs to use Lexical's `ContentEditable` component with proper node rendering.

---

## Current Architecture Assessment

### What Exists

1. **LexicalComposer setup** (`LexicalEditor.tsx`) - wraps editor in Lexical context
2. **Custom BlockNode** (`LexicalBlockNode.ts`) - stores blockId/blockType for each block
3. **Theme config** (`LexicalConfig.ts`) - already has `text.bold`, `text.italic`, `text.underline` CSS classes
4. **@lexical/rich-text, @lexical/list, @lexical/utils** - all in package.json
5. **Plain contentEditable TextBlock** (`TextBlock.tsx`) - NOT using Lexical's rich text API

### What Is Missing

1. **@lexical/link** - NOT in package.json, required for links
2. **RichTextPlugin** - NOT registered in LexicalConfig
3. **ContentEditable integration** - TextBlock uses native contentEditable, not Lexical's ContentEditable
4. **FloatingTextFormatToolbarPlugin** - does not exist
5. **LinkPlugin** - not registered

---

## Implementation Approach

### Option A: True Lexical Rich Text (Recommended)
Replace TextBlock's `contentEditable` with Lexical's `ContentEditable` inside each block. Each text block becomes its own Lexical editor instance.

**Pros:** Full rich text support, proper undo/redo per block, AI integration benefits
**Cons:** More complex; each block is its own editor instance (not one global editor)
**Complexity:** HIGH

### Option B: Floating Toolbar on Existing Structure (v1.10 Path)
Keep TextBlock's contentEditable but add a floating toolbar that dispatches `FORMAT_TEXT_COMMAND` to a shared Lexical editor instance.

**Pros:** Lower complexity, leverages existing code
**Cons:** Mixed architecture (plain contentEditable + Lexical commands), undo/redo complexity
**Complexity:** MEDIUM

### Option C: Block-Level Lexical with Shared State
One Lexical editor instance per block, but using `BlockNode` as a wrapper that manages a nested Lexical editor for rich text.

**Pros:** Clean architecture, each block is self-contained
**Cons:** Requires significant refactoring of BlockNode
**Complexity:** HIGH

**Recommendation:** Option B for v1.10 (fastest path to working rich text), with migration path to Option A in v1.x.

---

## MVP Definition

### Launch With (v1.10)

- [ ] **Bold, Italic, Underline** - via floating toolbar + keyboard shortcuts. Uses `FORMAT_TEXT_COMMAND` with `RichTextPlugin`.
- [ ] **Strikethrough, Code** - same toolbar, additional format types.
- [ ] **Links** - via Ctrl+K and toolbar button. Requires `@lexical/link` installation.
- [ ] **Floating toolbar** - appears on text selection, positioned near selection. Shows format buttons with active state.
- [ ] **Keyboard shortcuts** - Ctrl/Cmd+B, +I, +U, +K for link insertion.
- [ ] **Theme CSS classes** - `vibe-text-bold`, `vibe-text-italic`, `vibe-text-underline` already defined.

### Add After Validation (v1.x)

- [ ] **Inline code formatting with background** - add `code` styling to theme
- [ ] **Link URL editing inline** - show URL in toolbar when link selected
- [ ] **Highlight formatting** - `highlight` format type
- [ ] **Format-preserving AI** - AI suggestions respect inline formatting

### Future Consideration (v2+)

- [ ] **Real-time collaboration** - Yjs integration with Lexical
- [ ] **Table blocks** - dedicated table block type
- [ ] **Custom formatting presets** - user-defined text styles

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Bold/Italic/Underline | HIGH | LOW | P1 |
| Strikethrough | MEDIUM | LOW | P1 |
| Inline code | MEDIUM | LOW | P1 |
| Links (Ctrl+K) | HIGH | MEDIUM | P1 |
| Floating toolbar | HIGH | MEDIUM | P1 |
| Keyboard shortcuts | HIGH | LOW | P1 |
| Link URL editing | MEDIUM | MEDIUM | P2 |
| Highlight | LOW | LOW | P2 |
| Format-preserving AI | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.10 launch
- P2: Should have, add shortly after
- P3: Nice to have, future consideration

---

## Technical Implementation Notes

### Packages Needed

```bash
npm install @lexical/link  # MISSING - required for links
# Already installed:
# @lexical/react, lexical, @lexical/rich-text, @lexical/list, @lexical/utils
```

### Key Lexical APIs

1. **FORMAT_TEXT_COMMAND** - Dispatch with format type:
   ```typescript
   editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
   editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
   editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
   ```

2. **TextFormatType** (from `lexical`):
   ```typescript
   type TextFormatType = 'bold' | 'underline' | 'strikethrough' | 'italic' |
     'highlight' | 'code' | 'subscript' | 'superscript' |
     'lowercase' | 'uppercase' | 'capitalize';
   ```

3. **TOGGLE_LINK_COMMAND** (from `@lexical/link`):
   ```typescript
   editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url: 'https://...' });
   editor.dispatchCommand(TOGGLE_LINK_COMMAND, null); // remove link
   ```

4. **Floating toolbar positioning** (from Lexical Playground):
   - Track selection via `selectionchange` + `SELECTION_CHANGE_COMMAND`
   - Use `getBoundingRect()` on selection range for positioning
   - Show only when `!nativeSelection.isCollapsed` and selection contains text

### Keyboard Shortcut Mapping

| Shortcut | Action | Command |
|----------|--------|---------|
| Ctrl/ Cmd + B | Bold | `FORMAT_TEXT_COMMAND` with `bold` |
| Ctrl/ Cmd + I | Italic | `FORMAT_TEXT_COMMAND` with `italic` |
| Ctrl/ Cmd + U | Underline | `FORMAT_TEXT_COMMAND` with `underline` |
| Ctrl/ Cmd + K | Insert link | `TOGGLE_LINK_COMMAND` |

### State Sync Concern

The existing architecture syncs between Zustand (blocks array with plain strings) and Lexical (BlockNode with text). For v1.10:

- TextBlock currently stores `content: string` in Zustand
- With rich text, content becomes structured (formatting metadata)
- Options: (a) store Lexical JSON in Zustand, or (b) serialize to HTML/plain text on save
- **Recommended:** Store Lexical editor state as JSON in `content` field, deserialize on load

---

## Sources

- [Lexical TextFormatType definition](https://raw.githubusercontent.com/facebook/lexical/main/packages/lexical/src/nodes/LexicalTextNode.ts) - HIGH confidence
- [Lexical FORMAT_TEXT_COMMAND](https://raw.githubusercontent.com/facebook/lexical/main/packages/lexical-rich-text/src/index.ts) - HIGH confidence
- [Lexical TOGGLE_LINK_COMMAND](https://raw.githubusercontent.com/facebook/lexical/main/packages/lexical-link/src/index.ts) - HIGH confidence
- [Lexical FloatingTextFormatToolbarPlugin pattern](https://raw.githubusercontent.com/facebook/lexical/main/packages/lexical-playground/src/plugins/FloatingTextFormatToolbarPlugin/index.tsx) - HIGH confidence
- [Lexical rich-text package](https://lexical.dev/docs/packages/lexical-react) - MEDIUM confidence
- Existing codebase: LexicalConfig.ts, TextBlock.tsx, LexicalBlockNode.ts, editorStore.ts - HIGH confidence

---

*Research completed: 2026-03-25*
