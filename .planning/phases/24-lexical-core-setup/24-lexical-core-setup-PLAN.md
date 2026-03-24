---
phase: 24-lexical-core-setup
plan: 01
type: execute
wave: 1
depends_on: []
requirements_addressed: [LEXICAL-01, LEXICAL-02, LEXICAL-03, LEXICAL-04]
files_modified:
  - frontend/package.json
  - frontend/src/components/Editor/Editor.tsx
  - frontend/src/components/Editor/LexicalEditor.tsx
  - frontend/src/components/Editor/LexicalBlockNode.ts
  - frontend/src/components/Editor/LexicalConfig.ts
  - frontend/src/stores/editorStore.ts
  - frontend/src/components/Editor/useAutoSave.ts
autonomous: true

must_haves:
  truths:
    - "User can edit text inline in blocks with stable contentEditable behavior"
    - "User can drag-and-drop reorder blocks using @dnd-kit integrated with Lexical"
    - "Lexical editor state syncs to Zustand store on every change"
    - "Editor auto-saves to backend API with 500ms debounce"
  artifacts:
    - path: "frontend/node_modules/@lexical/react"
      exists: true
      min_version: "0.14.0"
    - path: "frontend/node_modules/@lexical/core"
      exists: true
      min_version: "0.14.0"
    - path: "frontend/src/components/Editor/LexicalEditor.tsx"
      provides: "Lexical editor wrapper with composer and plugins"
      exports: ["LexicalEditor", "useLexicalEditor"]
    - path: "frontend/src/components/Editor/LexicalBlockNode.ts"
      provides: "Custom block node for Lexical with JSON serialization"
      exports: ["BlockNode", "$createBlockNode", "$isBlockNode"]
    - path: "frontend/src/components/Editor/LexicalConfig.ts"
      provides: "Lexical initial config with block nodes and listeners"
      exports: ["lexicalConfig", "createLexicalUpdateListener"]
    - path: "frontend/src/stores/editorStore.ts"
      provides: "Zustand store extended with Lexical sync methods"
      adds: ["lexicalEditor", "setLexicalEditor", "syncFromLexical"]
  key_links:
    - from: "frontend/src/components/Editor/LexicalEditor.tsx"
      to: "frontend/src/stores/editorStore.ts"
      via: "registerUpdateListener syncs editor state to Zustand"
      pattern: "editorState.*JSON.*stringify"
    - from: "frontend/src/components/Editor/LexicalEditor.tsx"
      to: "frontend/src/components/Editor/useAutoSave.ts"
      via: "debounced callback triggers save on Zustand state change"
      pattern: "isDirty.*debounce.*500"
    - from: "frontend/src/components/Editor/LexicalBlockNode.ts"
      to: "frontend/src/types/block.ts"
      via: "BlockNode stores BlockType and BlockConfig"
      pattern: "BlockType.*BlockConfig"
---

# Phase 24: Lexical Core Setup - Implementation Plan

## Objective
Install Lexical framework, create editor wrapper with custom block nodes, integrate @dnd-kit drag-and-drop with Lexical commands, sync editor state to Zustand store, and ensure auto-save works with 500ms debounce.

## Context
@./frontend/src/components/Editor/Editor.tsx
@./frontend/src/components/Editor/SortableBlock.tsx
@./frontend/src/components/Editor/EditorCanvas.tsx
@./frontend/src/stores/editorStore.ts
@./frontend/src/components/Editor/useAutoSave.ts
@./frontend/src/services/api.ts
@./frontend/src/types/block.ts

## Tasks

### Task 1: Install Lexical packages
<files>
  frontend/package.json
</files>
<action>
Install Lexical packages via npm. Add the following to dependencies in package.json:
- @lexical/react: ^0.14.0
- @lexical/core: ^0.14.0
- @lexical/rich-text: ^0.14.0
- @lexical/list: ^0.14.0
- @lexical/utils: ^0.14.0

Run `npm install` to install the packages.
</action>
<verify>
npm list @lexical/react @lexical/core @lexical/rich-text @lexical/list @lexical/utils
</verify>
<done>All @lexical/* packages appear in npm list with versions >= 0.14.0</done>

---

### Task 2: Create Lexical custom block node
<files>
  frontend/src/components/Editor/LexicalBlockNode.ts
</files>
<action>
Create Lexical custom node type for storing block data. This node will:

1. Extend Lexical's `ElementNode` to support children
2. Store block properties as node attributes:
   - `blockId: string` - Unique identifier
   - `blockType: string` - BlockType from block.ts
   - `blockConfig: string` - JSON serialized BlockConfig
3. Export factory function `$createBlockNode(blockId, blockType, blockConfig)`
4. Export type guard `$isBlockNode(node)`
5. Implement `clone()` for serialization
6. Implement `getJSON()` for state persistence
7. Import `BlockType` from `@/types/block` - NOT import BlockConfig (serialize as string)

The node structure:
```typescript
import { ElementNode } from '@lexical/rich-text';
import { BlockType } from '@/types/block';

export class BlockNode extends ElementNode {
  blockId: string;
  blockType: BlockType;
  blockConfig: string; // JSON stringified

  // constructor, __create(), clone(), getJSON(), etc.
}
```

</action>
<verify>
grep -l "export class BlockNode" frontend/src/components/Editor/LexicalBlockNode.ts && grep -l "\$createBlockNode\|\$isBlockNode" frontend/src/components/Editor/LexicalBlockNode.ts
</verify>
<done>LexicalBlockNode.ts exports BlockNode class, $createBlockNode factory, and $isBlockNode type guard</done>

---

### Task 3: Create Lexical configuration with update listener
<files>
  frontend/src/components/Editor/LexicalConfig.ts
</files>
<action>
Create Lexical configuration file that exports:

1. `lexicalConfig` - Initial editor config for LexicalComposer:
   - `nodes`: Array containing BlockNode (imported from LexicalBlockNode.ts)
   - `onError`: Error handler function
   - `theme`: Object with CSS class mappings for blocks

2. `createLexicalUpdateListener` - Factory function that returns a listener function:
   - Accepts `setLexicalEditor` callback to store editor reference
   - Accepts `onUpdate` callback for state sync
   - Returns Lexical `registerUpdateListener` compatible callback
   - The listener should:
     a. Get editor state via `editor.getEditorState()`
     b. Get updated blocks from Zustand store via `useEditorStore.getState().blocks`
     c. Compare if blocks changed
     d. If changed, call `onUpdate(editorState)` to persist

The listener pattern:
```typescript
editor.update(() => {
  const editorState = editor.getEditorState();
  const json = editorState.toJSON();
  // Trigger sync to Zustand
}, { batch: true });
```

</action>
<verify>
grep -l "lexicalConfig\|createLexicalUpdateListener" frontend/src/components/Editor/LexicalConfig.ts
</verify>
<done>LexicalConfig.ts exports lexicalConfig object and createLexicalUpdateListener factory function</done>

---

### Task 4: Create LexicalEditor wrapper component
<files>
  frontend/src/components/Editor/LexicalEditor.tsx
</files>
<action>
Create LexicalEditor React component that:

1. Uses `LexicalComposer` as root with `initialConfig` from LexicalConfig.ts
2. Uses `useLexicalEditor` hook to get editor reference
3. On mount: Calls `setLexicalEditor(editor)` to store reference in Zustand
4. Sets up `registerUpdateListener` using `createLexicalUpdateListener`:
   - `setLexicalEditor`: Stores editor in Zustand
   - `onUpdate`: Syncs changed blocks back to Zustand store
5. Renders editor content area where blocks are displayed
6. Accepts props:
   - `blockId: string`
   - `blockType: BlockType`
   - `content: string` (initial content from BlockState)
   - `onContentChange: (content: string) => void`
   - `isSelected: boolean`

Implementation pattern:
```typescript
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalEditor } from '@lexical/react/LexicalComposer';

export default function LexicalEditor({ blockId, blockType, content, onContentChange, isSelected }) {
  const editor = useLexicalEditor();

  useEffect(() => {
    if (editor) {
      // Register update listener
      const listener = createLexicalUpdateListener(
        (ed) => setLexicalEditor(ed),
        (state) => syncFromLexical(state)
      );
      return listener();
    }
  }, [editor]);

  return (
    <LexicalComposer initialConfig={lexicalConfig}>
      {/* Editor content */}
    </LexicalComposer>
  );
}
```

</action>
<verify>
grep -l "LexicalComposer\|useLexicalEditor\|lexicalConfig" frontend/src/components/Editor/LexicalEditor.tsx
</verify>
<done>LexicalEditor.tsx uses LexicalComposer, stores editor reference, and sets up update listener</done>

---

### Task 5: Extend Zustand store with Lexical sync methods
<files>
  frontend/src/stores/editorStore.ts
</files>
<action>
Extend the EditorState interface and store implementation:

1. Add to EditorState interface:
   - `lexicalEditor: LexicalEditor | null` - Reference to Lexical editor instance
   - `setLexicalEditor: (editor: LexicalEditor) => void`
   - `syncFromLexical: (editorState: EditorState) => void` - Syncs blocks from Lexical back to Zustand

2. Import Lexical types (use type-only import to avoid bundle issues):
   ```typescript
   import type { LexicalEditor } from '@lexical/core';
   ```

3. Implement `setLexicalEditor`:
   ```typescript
   setLexicalEditor: (editor) => set({ lexicalEditor: editor }),
   ```

4. Implement `syncFromLexical`:
   - Accepts an EditorState-like object
   - Updates Zustand blocks array with the new state
   - Sets `isDirty: true` to trigger auto-save

</action>
<verify>
grep -l "lexicalEditor\|setLexicalEditor\|syncFromLexical" frontend/src/stores/editorStore.ts
</verify>
<done>editorStore.ts exports lexicalEditor state and sync methods</done>

---

### Task 6: Update useAutoSave to use Zustand's Lexical editor reference
<files>
  frontend/src/components/Editor/useAutoSave.ts
</files>
<action>
Update useAutoSave.ts to leverage Zustand's Lexical editor reference:

1. Import `useEditorStore` and extract `lexicalEditor` from store
2. Modify save function to:
   - If `lexicalEditor` exists, get the current editor state from Lexical
   - Serialize the Lexical state to JSON
   - Compare with last saved JSON to detect changes
   - If changes exist, call `updateBlogBlocks` with serialized blocks
3. Keep existing `500ms` debounce via `useDebouncedCallback`
4. Keep existing `beforeunload` handler for backup save
5. Ensure existing API call pattern `updateBlogBlocks(blogId, blocks)` remains compatible

The save logic should prioritize Lexical state when available:
```typescript
const save = useDebouncedCallback(async () => {
  if (!blogId || !isDirty) return;

  let blocksToSave = blocks;
  if (lexicalEditor) {
    const lexicalState = lexicalEditor.getEditorState();
    blocksToSave = lexicalStateToBlocks(lexicalState); // Transform function
  }

  const blocksJson = JSON.stringify(blocksToSave);
  if (blocksJson === lastSavedBlocksRef.current) return;
  // ... rest of save logic
}, 500, { maxWait: 2000 });
```

</action>
<verify>
grep -l "lexicalEditor\|lexicalState" frontend/src/components/Editor/useAutoSave.ts
</verify>
<done>useAutoSave.ts uses Lexical editor reference from Zustand for state-aware saving</done>

---

### Task 7: Update Editor.tsx to initialize Lexical
<files>
  frontend/src/components/Editor/Editor.tsx
</files>
<action>
Update Editor.tsx to initialize Lexical context:

1. Import LexicalEditor component
2. Ensure the editor hierarchy wraps SortableBlock components with Lexical context
3. Add LexicalProvider or ensure LexicalComposer is available at top level
4. Verify that the DndContext from EditorCanvas.tsx still works with Lexical state

The key change is ensuring Lexical context is available when SortableBlock renders its content editor. If LexicalEditor is rendered per-block, it should work within the existing DndContext hierarchy.

</action>
<verify>
grep -l "LexicalEditor\|LexicalComposer" frontend/src/components/Editor/Editor.tsx
</verify>
<done>Editor.tsx initializes Lexical and renders LexicalEditor within the editor hierarchy</done>

---

### Task 8: Integration verification
<action>
After all packages installed and files created:

1. Run `npm run dev` to start dev server
2. Verify Lexical packages are loaded without errors
3. Check browser console for Lexical initialization messages
4. Create or open a blog with text blocks
5. Click on a text block and verify:
   - contentEditable is stable (no cursor jumps)
   - Text input works normally
6. Drag a block using drag handle:
   - Verify @dnd-kit handles the drag
   - Verify block reordering persists
7. Edit content and wait 500ms:
   - Verify auto-save triggers
   - Verify backend receives update

</action>
<verify>
npm run build 2>&1 | grep -i "lexical\|error" | head -20
</verify>
<done>Build succeeds with Lexical packages included, manual verification confirms functionality</done>

---

## Verification

### Phase-level checks
1. All @lexical/* packages installed and importable
2. LexicalBlockNode.ts exports required classes and functions
3. LexicalConfig.ts exports configuration and listener factory
4. LexicalEditor.tsx wraps LexicalComposer correctly
5. editorStore.ts has Lexical sync methods added
6. useAutoSave.ts uses Lexical state when available
7. Editor.tsx renders with Lexical context
8. `npm run build` succeeds without Lexical-related errors

### Requirements mapped
- LEXICAL-01 (TextNode inline editing): Task 2, Task 4
- LEXICAL-02 (@dnd-kit drag with Lexical commands): Task 4, Task 7
- LEXICAL-03 (Zustand sync via listener): Task 3, Task 4, Task 5
- LEXICAL-04 (500ms debounce auto-save): Task 6

## Success Criteria

1. Lexical packages installed (@lexical/react, @lexical/core) with no version conflicts
2. LexicalComposer wraps editor with initial config containing BlockNode
3. Custom BlockNode enables inline editing without contentEditable bugs
4. @dnd-kit drag handle triggers work within Lexical context
5. Lexical update listener syncs state to Zustand on every change
6. Auto-save debounced at 500ms writes to backend API
7. Build succeeds without errors

## Output

After completion, create `.planning/phases/24-lexical-core-setup/24-lexical-core-setup-SUMMARY.md` with:
- Files created/modified
- Key implementation decisions
- Any issues encountered
- Next steps for subsequent phases
