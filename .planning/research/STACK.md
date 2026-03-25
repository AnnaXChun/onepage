# Stack Research: Rich Text Formatting in Lexical (v1.10)

**Domain:** Rich text formatting for existing Lexical editor
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

The project already has **all required packages** installed for rich text formatting. No new npm packages are needed. The work involves integrating existing packages (`@lexical/rich-text`, `@lexical/link`) and building a custom floating toolbar component for text selection formatting.

## Current State

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| `lexical` | 0.42.0 | Core editor framework | Installed |
| `@lexical/react` | 0.42.0 | React bindings, plugins | Installed |
| `@lexical/rich-text` | 0.42.0 | Rich text commands | Installed |
| `@lexical/link` | 0.42.0 | Link nodes and commands | Installed |
| `@lexical/list` | 0.42.0 | List formatting | Installed |
| `@lexical/utils` | 0.42.0 | Utilities | Installed |
| `@lexical/selection` | 0.42.0 | Selection handling | Installed |
| `@lexical/history` | 0.42.0 | Undo/redo | Installed |
| `@lexical/code-core` | 0.42.0 | Code highlighting | Installed |

## Required Additions

### 1. Custom Floating Toolbar (Required)

**No Lexical package provides a floating text format toolbar.** A custom component is required.

Reference: [Lexical Playground FloatingTextFormatToolbarPlugin](https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/FloatingTextFormatToolbarPlugin/index.tsx)

**Key imports needed:**
```typescript
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { mergeRegister } from '@lexical/utils';
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical';
import { createPortal } from 'react-dom';
```

**Toolbar features:**
- Bold, Italic, Underline, Strikethrough buttons
- Link toggle button
- Code formatting button
- Positioned via `createPortal` at selection

### 2. Plugins Integration

Add to `LexicalConfig.ts` or wrap with plugins:

```typescript
import { LexicalRichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin';

// In JSX:
<LexicalComposer initialConfig={...}>
  <LexicalRichTextPlugin />
  <LexicalLinkPlugin />
  {/* Your editor content */}
</LexicalComposer>
```

### 3. TextFormatType Available

From `lexical/nodes/LexicalTextNode`:

| Format Type | Command Payload | Keyboard |
|-------------|----------------|----------|
| bold | `'bold'` | Ctrl/Cmd+B |
| italic | `'italic'` | Ctrl/Cmd+I |
| underline | `'underline'` | Ctrl/Cmd+U |
| strikethrough | `'strikethrough'` | - |
| code | `'code'` | - |
| highlight | `'highlight'` | - |
| subscript | `'subscript'` | - |
| superscript | `'superscript'` | - |

### 4. Link Integration

```typescript
// Insert link
editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url: 'https://example.com' });

// Remove link
editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
```

## Optional Addition

### @lexical/code (React Bindings)

Only needed if inline code formatting requires React-specific UI:

| Package | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@lexical/code` | 0.42.0 | Code highlighting with React bindings | Only if `code-core` is insufficient |

**Current status:** `code-core` is installed but React bindings are not. Most use cases work with `code-core` alone.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@tiptap` or other editors | Lexical is already integrated; full replacement unnecessary | Build on existing Lexical foundation |
| `@lexical/yjs` | Collaborative editing; out of scope per constraints | Single-user editing only |
| `@lexical/markdown` | Markdown serialization; defer until rich text working | Plain text/JSON serialization |
| Custom `contentEditable` solutions | Project migrated to Lexical | Lexical commands and nodes |
| `@lexical/clipboard` | Already handled by `LexicalRichTextPlugin` | Built-in paste handling |

## Integration Points

### 1. LexicalEditor.tsx

Current implementation wraps content in `LexicalComposer`. Add plugins:

```typescript
// Already has: LexicalComposer with BlockNode
// Add: LexicalRichTextPlugin and LexicalLinkPlugin
```

### 2. TextBlock.tsx

Current uses plain `contentEditable`. Migrate to:

1. `ContentEditable` from `@lexical/react`
2. `LexicalComposer` wrapper (already in LexicalEditor.tsx)
3. Rich text formatting via `FORMAT_TEXT_COMMAND`

### 3. EditorToolbar.tsx

Add formatting buttons that dispatch Lexical commands:

```typescript
// Bold
editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');

// Italic
editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');

// Link
editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url });
```

## Keyboard Shortcuts

Lexical handles these automatically with `LexicalRichTextPlugin`:

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + B | Bold |
| Ctrl/Cmd + I | Italic |
| Ctrl/Cmd + U | Underline |
| Ctrl/Cmd + K | Insert link (requires custom binding) |

## Version Compatibility

All @lexical packages are aligned at **0.42.0**. No compatibility issues.

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `lexical@0.42.0` | All @lexical/*@0.42.0 | Core version |
| `@lexical/react@0.42.0` | lexical@0.42.0 | React bindings |
| `@lexical/rich-text@0.42.0` | lexical@0.42.0 | Rich text commands |
| `@lexical/link@0.42.0` | lexical@0.42.0 | Link support |
| `@lexical/code-core@0.42.0` | lexical@0.42.0 | Code highlighting |

## Installation

```bash
# No new packages required - all needed packages are already installed
# If @lexical/code React bindings are needed:
npm install @lexical/code@0.42.0
```

## Sources

| Technology | Source | Confidence |
|-----------|--------|------------|
| Lexical rich text packages | npm/frontend/node_modules/@lexical/* | HIGH - verified installed |
| FloatingTextFormatToolbarPlugin | [Lexical Playground GitHub](https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/FloatingTextFormatToolbarPlugin/index.tsx) | HIGH - official reference |
| TextFormatType | [Lexical source](file:///Users/chunxiang/Desktop/Vibe/Onepage/frontend/node_modules/lexical/nodes/LexicalTextNode.d.ts) | HIGH - type definition |
| TOGGLE_LINK_COMMAND | [Lexical @lexical/link](file:///Users/chunxiang/Desktop/Vibe/Onepage/frontend/node_modules/@lexical/link/index.d.ts) | HIGH - export verified |

---

*Stack research for: v1.10 Rich Text Formatting*
*Researched: 2026-03-25*
