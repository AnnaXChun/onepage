# Phase 2: Block Editor Core - Research

**Researched:** 2026-03-21
**Domain:** React drag-and-drop block editor, inline editing, Zustand state management
**Confidence:** MEDIUM-HIGH (Context7/Stack.md verified, training data for implementation patterns)

## Summary

Phase 2 transforms static template HTML into an interactive block editor where users can drag-and-drop reorder blocks, click to edit text/images inline, and configure block-specific settings. The editor consumes `blocks.json` (from Phase 1) to construct a tree of typed block components, uses `dnd-kit` for drag-and-drop, `Zustand` for state management with undo/redo, and a click-to-edit pattern using contenteditable with controlled overlays.

The key insight is that blocks.json declares block structure, but the editor must reconcile two rendering modes: (1) React component rendering for editor interactions, and (2) the underlying template HTML for final output. The editor overlays React components onto the iframe's DOM using CSS selectors, or renders blocks as React components when the template HTML is replaced with React.

**Primary recommendation:** Build a hybrid editor that renders blocks as React components in edit mode, maintaining block state in Zustand with debounced persistence. Use dnd-kit's `SortableContext` + `useSortable` for block reordering, Zustand's `useStore` with temporal middleware for undo/redo, and a contenteditable wrapper for inline text editing.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use Blog / Resume / Personal Intro as template categories (not personal/tech/portfolio)
- **D-02:** Template categorization: Portfolio (Gallery, Creative), Personal Intro (Vintage, Ultra, Paper, Zen, Minimal), Blog (Retro, Glass, Neon)
- **D-03:** Each template has a `blocks.json` file declaring its block components
- **D-04:** Each block entry contains: `type`, `placeholder` token, `defaultContent` string
- **D-05:** Supported block types: Text (H1, H2, paragraph, list), Image (single, gallery), Social Links, Contact Form, Divider
- **Stack decision (from STACK.md):** Use `dnd-kit` for drag-and-drop (not react-dnd or GrapesJS)

### Claude's Discretion

- Editor UI layout (header toolbar, left/right sidebar placement)
- Block component internal structure (how props flow through)
- Backend API design for block persistence
- Debounce timing and localStorage backup strategy

### Deferred Ideas (OUT OF SCOPE)

- AI writing assist (sparkle icon) - Phase 3
- AI generation pipeline - Phase 3
- Multi-page support - explicitly excluded

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDIT-01 | Block-level drag-and-drop using dnd-kit | dnd-kit SortableContext + useSortable pattern |
| EDIT-02 | Block component library: Text (H1, H2, paragraph, list), Image (single, gallery), Social Links, Contact Form, Divider | Block type union from Phase 1 blocks.json |
| EDIT-03 | Drag handle on each block for reordering | useSortable with separate drag handle overlay |
| EDIT-04 | Click-to-Edit: click any text element to edit inline | contenteditable wrapper with blur/escape handling |
| EDIT-05 | Click-to-Edit: click image to replace with uploaded image | Click handler triggers upload flow |
| EDIT-06 | Block configuration panel (right sidebar) for block-specific settings | Context-based panel with selected block state |
| EDIT-07 | Editor state persisted to backend on change (debounced 500ms) | Zustand middleware + debounced API call |
| EDIT-08 | Editor state backed up to localStorage on each change | Zustand persist middleware |
| EDIT-09 | Undo/redo support via Zustand history store | Zustand temporal middleware |

---

## Standard Stack

### Core Dependencies

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | 6.3.1 | Drag-and-drop context, sensors, collision detection | Modern React-first DnD, accessible, modular |
| `@dnd-kit/sortable` | 10.0.0 | SortableContext, useSortable, vertical/horizontal strategies | Built on core, handles list reordering |
| `@dnd-kit/utilities` | (bundled) | CSS transform utilities | Transform helpers for smooth animations |
| `zustand` | 5.0.12 | Lightweight state management | Simple API, middleware support (persist, temporal) |

**Installation:**
```bash
cd frontend && npm install @dnd-kit/core @dnd-kit/sortable zustand
```

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `use-debounce` | ^10.0.0 | Debounce for auto-save | EDIT-07 debounced persistence |
| `@dnd-kit/modifiers` | (bundled) | Keyboard drag support | Accessibility for EDIT-01 |

---

## Architecture Patterns

### Recommended Project Structure

```
frontend/src/
├── components/
│   ├── Editor/
│   │   ├── Editor.tsx              # Main editor orchestrator
│   │   ├── EditorToolbar.tsx       # Header with undo/redo, publish
│   │   ├── BlockCanvas.tsx         # DndContext + SortableContext wrapper
│   │   ├── BlockRenderer.tsx       # Maps BlockType to React component
│   │   ├── blocks/
│   │   │   ├── TextBlock.tsx       # H1, H2, paragraph, list variants
│   │   │   ├── ImageBlock.tsx      # Single image + gallery variants
│   │   │   ├── SocialLinksBlock.tsx
│   │   │   ├── ContactFormBlock.tsx
│   │   │   ├── DividerBlock.tsx
│   │   │   └── TextContainerBlock.tsx  # Container for nested blocks
│   │   ├── DragHandle.tsx          # Separate drag handle component
│   │   ├── BlockConfigPanel.tsx    # Right sidebar for block settings
│   │   └── InlineEdit.tsx          # contenteditable wrapper
│   └── common/
├── stores/
│   └── editorStore.ts              # Zustand store with temporal middleware
├── types/
│   └── block.ts                    # Existing BlockType, BlockDefinition, BlockManifest
├── config/
│   └── templates.ts                # Existing template config
└── pages/
    └── EditorPage.tsx              # Route component that loads blocks.json
```

### Pattern 1: dnd-kit Block Reordering

**What:** Using `DndContext`, `SortableContext`, and `useSortable` to enable drag-and-drop block reordering.

**When to use:** EDIT-01 (drag-and-drop reordering), EDIT-03 (drag handle).

**Implementation:**
```tsx
// BlockCanvas.tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

function BlockCanvas({ blocks, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        {blocks.map(block => (
          <SortableBlock key={block.id} block={block} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

// SortableBlock.tsx - drag handle pattern
function SortableBlock({ block }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle - separate from content */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-8 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10"
      >
        <DragIcon />
      </div>

      {/* Block content */}
      <BlockRenderer block={block} />
    </div>
  );
}
```

**Key insight:** `activationConstraint: { distance: 8 }` prevents accidental drags during click-to-edit. Drag handle separates drag from content click.

### Pattern 2: Click-to-Edit Inline Editing

**What:** Using contenteditable with controlled input overlay for text editing.

**When to use:** EDIT-04 (click text to edit), EDIT-05 (click image to replace).

**Implementation:**
```tsx
// InlineEdit.tsx
interface InlineEditProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  blockType: 'text-h1' | 'text-h2' | 'text-paragraph' | 'text-list';
}

function InlineEdit({ value, onChange, placeholder, blockType }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const spanRef = useRef<HTMLSpanElement>(null);

  const handleClick = () => {
    setIsEditing(true);
    // Focus the element after state update
    setTimeout(() => spanRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalValue(value); // Revert
      setIsEditing(false);
    }
    // Allow Enter for paragraph breaks, but not for H1/H2
    if (e.key === 'Enter' && (blockType === 'text-h1' || blockType === 'text-h2')) {
      e.preventDefault();
      spanRef.current?.blur();
    }
  };

  // For H1/H2: single line only
  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    const text = e.currentTarget.textContent || '';
    // Strip newlines for headings
    if (blockType === 'text-h1' || blockType === 'text-h2') {
      e.currentTarget.textContent = text.replace(/\n/g, '');
    }
    setLocalValue(e.currentTarget.textContent || '');
  };

  const Tag = blockType === 'text-h1' ? 'h1' : blockType === 'text-h2' ? 'h2' : 'p';

  return (
    <Tag
      ref={spanRef}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onClick={handleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      className={`cursor-text outline-none ${
        isEditing ? 'ring-2 ring-primary ring-offset-2' : 'hover:bg-primary/5'
      }`}
    >
      {localValue}
    </Tag>
  );
}
```

**For image click-to-replace:**
```tsx
function ImageBlock({ block, content, onContentChange }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onContentChange(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <img src={content} alt="" className="w-full h-full object-cover" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
```

**Key insight:** Single click activates editing (not double-click). `suppressContentEditableWarning` suppresses React's warning about contentEditable + React state mismatch. Escape reverts changes.

### Pattern 3: Block Configuration Panel

**What:** Right sidebar that shows settings for the currently selected block.

**When to use:** EDIT-06.

**Implementation:**
```tsx
// BlockConfigPanel.tsx
function BlockConfigPanel({ selectedBlock, onUpdate }) {
  if (!selectedBlock) {
    return (
      <div className="w-72 p-4 border-l border-border">
        <p className="text-muted text-sm">Select a block to configure</p>
      </div>
    );
  }

  return (
    <div className="w-72 p-4 border-l border-border animate-slide-in">
      <h3 className="font-semibold mb-4 capitalize">
        {selectedBlock.type.replace('-', ' ')} Settings
      </h3>

      {selectedBlock.type === 'image-single' && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-muted">Aspect Ratio</span>
            <select
              value={selectedBlock.config.aspectRatio || '1/1'}
              onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background"
            >
              <option value="1/1">Square (1:1)</option>
              <option value="16/9">Landscape (16:9)</option>
              <option value="4/3">Photo (4:3)</option>
              <option value="3/4">Portrait (3:4)</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedBlock.config.rounded || false}
              onChange={(e) => onUpdate({ rounded: e.target.checked })}
            />
            <span className="text-sm">Rounded corners</span>
          </label>
        </div>
      )}

      {selectedBlock.type.startsWith('text-') && selectedBlock.type !== 'text-container' && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-muted">Text Align</span>
            <select
              value={selectedBlock.config.align || 'left'}
              onChange={(e) => onUpdate({ align: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
```

**Key insight:** Panel updates the selected block's `config` object. Config is block-type-specific (aspect ratio for images, alignment for text).

### Pattern 4: Zustand Editor Store with Undo/Redo

**What:** Single Zustand store managing block state with temporal middleware for undo/redo and persist middleware for localStorage backup.

**When to use:** EDIT-07 (auto-save), EDIT-08 (localStorage backup), EDIT-09 (undo/redo).

**Implementation:**
```tsx
// stores/editorStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';

interface BlockState {
  id: string;
  type: BlockType;
  content: string;
  config: BlockConfig;
}

interface EditorState {
  blocks: BlockState[];
  selectedBlockId: string | null;
  isDirty: boolean;
  lastSaved: Date | null;

  // Actions
  setBlocks: (blocks: BlockState[]) => void;
  addBlock: (block: BlockState, index?: number) => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, updates: Partial<BlockState>) => void;
  reorderBlocks: (oldIndex: number, newIndex: number) => void;
  selectBlock: (id: string | null) => void;
  markSaved: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    temporal(
      (set, get) => ({
        blocks: [],
        selectedBlockId: null,
        isDirty: false,
        lastSaved: null,

        setBlocks: (blocks) => set({ blocks, isDirty: true }),

        addBlock: (block, index) => set((state) => {
          const newBlocks = [...state.blocks];
          if (index !== undefined) {
            newBlocks.splice(index, 0, block);
          } else {
            newBlocks.push(block);
          }
          return { blocks: newBlocks, isDirty: true };
        }),

        removeBlock: (id) => set((state) => ({
          blocks: state.blocks.filter(b => b.id !== id),
          selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
          isDirty: true,
        })),

        updateBlock: (id, updates) => set((state) => ({
          blocks: state.blocks.map(b => b.id === id ? { ...b, ...updates } : b),
          isDirty: true,
        })),

        reorderBlocks: (oldIndex, newIndex) => set((state) => {
          const newBlocks = [...state.blocks];
          const [removed] = newBlocks.splice(oldIndex, 1);
          newBlocks.splice(newIndex, 0, removed);
          return { blocks: newBlocks, isDirty: true };
        }),

        selectBlock: (id) => set({ selectedBlockId: id }),

        markSaved: () => set({ isDirty: false, lastSaved: new Date() }),
      }),
      {
        // temporal middleware config
        limit: 50, // Max undo history
        equality: (pastState, currentState) => pastState.blocks === currentState.blocks,
      }
    ),
    {
      name: 'editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ blocks: state.blocks }), // Only persist blocks
    }
  )
);

// Debounced auto-save hook
function useAutoSave() {
  const { blocks, isDirty, markSaved } = useEditorStore();
  const [save] = useDebouncedCallback(
    async () => {
      if (!isDirty) return;
      try {
        await saveBlocksToBackend(blocks);
        markSaved();
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    },
    500,
    { maxWait: 2000 }
  );

  useEffect(() => {
    if (isDirty) {
      save();
    }
  }, [blocks, isDirty, save]);
}
```

**Key insight:** Zustand's `temporal` middleware (from `zundo`) wraps the store to track history. `persist` middleware saves to localStorage. The `useDebouncedCallback` from `use-debounce` handles EDIT-07's 500ms debounce.

### Pattern 5: Block Rendering from blocks.json

**What:** Dynamically mapping BlockType to React components based on blocks.json.

**When to use:** Initial render from Phase 1's blocks.json structure.

**Implementation:**
```tsx
// BlockRenderer.tsx
import { BlockType, BlockDefinition } from '../../types/block';

interface BlockRendererProps {
  block: BlockDefinition;
  content: string;
  onContentChange: (content: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function BlockRenderer({ block, content, onContentChange, isSelected, onSelect }: BlockRendererProps) {
  const commonProps = {
    block,
    content,
    onContentChange,
    isSelected,
    onSelect,
  };

  switch (block.type) {
    case 'text-h1':
    case 'text-h2':
    case 'text-paragraph':
      return <TextBlock {...commonProps} />;
    case 'text-list':
      return <TextBlock {...commonProps} />;
    case 'image-single':
      return <ImageBlock {...commonProps} />;
    case 'image-gallery':
      return <ImageGalleryBlock {...commonProps} />;
    case 'social-links':
      return <SocialLinksBlock {...commonProps} />;
    case 'contact-form':
      return <ContactFormBlock {...commonProps} />;
    case 'divider':
      return <DividerBlock {...commonProps} />;
    case 'text-container':
      return <TextContainerBlock {...commonProps} />;
    default:
      return <div>Unknown block type: {block.type}</div>;
  }
}

// Usage in editor - load from blocks.json
function useBlocksFromJson(blocksJson: BlockManifest): BlockState[] {
  return useMemo(() => {
    return blocksJson.blocks.map(block => ({
      id: block.id,
      type: block.type,
      content: block.defaultContent,
      config: block.config,
    }));
  }, [blocksJson]);
}
```

**Key insight:** `BlockRenderer` is a simple switch statement mapping types to components. The store holds `BlockState[]` which extends `BlockDefinition` with `content` (editable).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop | Custom mouse event handlers | dnd-kit | Handles touch, keyboard, accessibility; collision detection is hard |
| Undo/redo | Custom history array | Zustand temporal middleware | Handles edge cases (limit, equality, middleware) |
| State persistence | localStorage directly | Zustand persist middleware | Handles serialization, atomic updates |
| Debounce | setTimeout + cleanup | use-debounce library | Handles edge cases (maxWait, leading/trailing) |
| ContentEditable | Raw implementation | Controlled wrapper with ref | React state sync issues without proper ref handling |

---

## Common Pitfalls

### Pitfall 1: Drag Activating During Click-to-Edit
**What goes wrong:** Drag starts when user clicks to edit text, causing unexpected reorder.
**Why it happens:** Pointer sensor has no activation constraint, so any pointer movement starts drag.
**How to avoid:** Use `activationConstraint: { distance: 8 }` - drag only starts after 8px movement.
**Warning signs:** Blocks reorder unexpectedly when clicking text.

### Pitfall 2: ContentEditable State Desync
**What goes wrong:** React state and DOM get out of sync, causing cursor jump or lost input.
**Why it happens:** Updating React state during `onInput` while browser is still composing.
**How to avoid:** Use `suppressContentEditableWarning`, update state only on `blur`, use `useRef` for DOM access.
**Warning signs:** Cursor jumps to start, typed characters appear in wrong position.

### Pitfall 3: Undo/Redo Losing Local Edits
**What goes wrong:** Undo reverts to server state, losing local unsaved changes.
**Why it happens:** Temporal middleware tracks Zustand state, not server sync state.
**How to avoid:** Track `isDirty` flag, show warning before undo if dirty, implement proper merge strategy.
**Warning signs:** User loses edits after undo.

### Pitfall 4: ContentEditable Pasted HTML
**What goes wrong:** User pastes rich text (from Word/Chrome), HTML tags get stored.
**Why it happens:** ContentEditable accepts all paste content by default.
**How to avoid:** Intercept `onPaste`, strip HTML tags, keep only plain text.
**Warning signs:** `<p>` tags appearing in stored content, rendered HTML in output.

### Pitfall 5: Block Selection State Clashing with Edit State
**What goes wrong:** Clicking to edit deselects block, panel closes.
**Why it happens:** `onClick` handler on block both triggers edit AND calls `selectBlock(null)`.
**How to avoid:** Stop propagation on edit activation, or use double-click for edit, single-click for select.
**Warning signs:** Config panel closes immediately when trying to edit.

---

## Code Examples

### DndContext with Keyboard Navigation
```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);

<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
    {blocks.map(block => <SortableBlock key={block.id} block={block} />)}
  </SortableContext>
</DndContext>
```

### Zustand Store with Temporal (Undo/Redo)
```tsx
import { create } from 'zustand';
import { temporal } from 'zundo';

const useEditorStore = create(
  temporal(
    (set) => ({
      blocks: [],
      setBlocks: (blocks) => set({ blocks }),
      updateBlock: (id, content) => set((state) => ({
        blocks: state.blocks.map(b => b.id === id ? { ...b, content } : b)
      })),
    }),
    { limit: 50 }
  )
);

// Usage
const { blocks, undo, redo, pastStates, futureStates } = useEditorStore();
```

### Debounced Auto-Save
```tsx
import { useDebouncedCallback } from 'use-debounce';

function useAutoSave(blocks, onSave) {
  const save = useDebouncedCallback(
    () => onSave(blocks),
    500,
    { maxWait: 2000 }
  );

  useEffect(() => {
    save();
  }, [blocks]);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-dnd | dnd-kit | 2025 | Modular sensors, better accessibility |
| Redux + redux-undo | Zustand + temporal | 2024 | Less boilerplate, simpler API |
| Double-click to edit | Single-click to edit | 2019 (Notion) | More intuitive, matches mobile patterns |
| contenteditable uncontrolled | contenteditable controlled wrapper | 2020 | React state sync, cursor control |

**Deprecated/outdated:**
- `react-dnd`: Pre-Hooks API, steeper learning curve, less accessible
- Redux for editor state: Overkill for simple block list with undo/redo

---

## Open Questions

1. **Should blocks.json be fetched at runtime or bundled?**
   - What we know: Phase 1 serves blocks.json as static file from `/templates/{slug}/blocks.json`
   - What's unclear: Should the editor fetch it at runtime, or should Phase 1 have bundled it into the JS bundle?
   - Recommendation: Fetch at runtime. Templates may update independently of the JS bundle.

2. **How to handle text-container's nested block structure?**
   - What we know: `text-container` blocks have `allowedBlockTypes` and contain other blocks
   - What's unclear: Does the editor render these as nested SortableContexts, or as a flat list with visual indentation?
   - Recommendation: Treat as nested containers with their own SortableContext, visual indentation in editor.

3. **Backend API for block persistence?**
   - What we know: Phase 1 has no backend API for blocks
   - What's unclear: Should blocks be saved as part of blog entity, or as separate endpoint?
   - Recommendation: `PUT /api/v1/blogs/{id}/blocks` with full block array replacement (EDIT-07).

4. **Image upload during inline edit?**
   - What we know: `ImageBlock` click-to-edit triggers upload flow (EDIT-05)
   - What's unclear: Should uploaded images go directly to OSS/CDN, or through backend API?
   - Recommendation: Direct to backend API for processing (resize, optimize), then update content with CDN URL.

---

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false in .planning/config.json.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (React 18 + Vite project, existing test setup) |
| Config file | `frontend/vitest.config.ts` (if exists) or `frontend/package.json` vitest config |
| Quick run command | `npm run test -- --run --reporter=verbose` |
| Full suite command | `npm run test -- --run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDIT-01 | Blocks can be reordered via drag-and-drop | unit | `vitest run tests/editor/dnd.test.ts` | TBD |
| EDIT-02 | All block types render correctly | unit | `vitest run tests/editor/blocks.test.ts` | TBD |
| EDIT-03 | Drag handle is visible on hover, drag works | unit | `vitest run tests/editor/dragHandle.test.ts` | TBD |
| EDIT-04 | Text blocks are editable on click | integration | `vitest run tests/editor/inlineEdit.test.tsx` | TBD |
| EDIT-05 | Image blocks trigger upload on click | integration | `vitest run tests/editor/imageBlock.test.tsx` | TBD |
| EDIT-06 | Config panel shows selected block settings | unit | `vitest run tests/editor/configPanel.test.tsx` | TBD |
| EDIT-07 | Auto-save debounced to 500ms | unit | `vitest run tests/editor/autoSave.test.ts` | TBD |
| EDIT-08 | localStorage backup on each change | unit | `vitest run tests/editor/localStorage.test.ts` | TBD |
| EDIT-09 | Undo/redo works via Zustand temporal | unit | `vitest run tests/editor/undoRedo.test.ts` | TBD |

### Sampling Rate
- **Per task commit:** `npm run test -- --run --reporter=verbose`
- **Per wave merge:** Full suite
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/tests/editor/blocks.test.ts` -- validates all block types render
- [ ] `frontend/tests/editor/dnd.test.ts` -- validates drag-and-drop reordering
- [ ] `frontend/tests/editor/inlineEdit.test.tsx` -- validates click-to-edit
- [ ] `frontend/tests/editor/configPanel.test.tsx` -- validates config panel
- [ ] `frontend/tests/editor/undoRedo.test.ts` -- validates undo/redo
- [ ] `frontend/tests/conftest.ts` -- shared test fixtures
- [ ] Framework install: `npm install @dnd-kit/core @dnd-kit/sortable zustand use-debounce vitest @testing-library/react --save-dev` if not detected

---

## Sources

### Primary (HIGH confidence)
- `frontend/src/types/block.ts` - Block type definitions
- `frontend/public/templates/minimal-simple/blocks.json` - Block manifest schema
- `.planning/research/STACK.md` - dnd-kit recommendation with version 382 releases
- Context7/npm registry - Package versions verified 2026-03-21

### Secondary (MEDIUM confidence)
- dnd-kit documentation (dndkit.com) - SortableContext patterns
- Zustand documentation - Temporal middleware for undo/redo
- `use-debounce` documentation - Debounce patterns

### Tertiary (LOW confidence)
- Inline editing patterns - General web best practices, needs verification with project constraints

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via STACK.md and npm registry
- Architecture: MEDIUM - Patterns based on dnd-kit docs, but hybrid iframe/React approach needs validation
- Pitfalls: MEDIUM - Identified from common contenteditable and dnd-kit issues

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days - dnd-kit and Zustand are stable libraries)
