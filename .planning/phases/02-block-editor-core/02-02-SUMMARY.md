---
phase: 02-block-editor-core
plan: '02'
subsystem: editor
tags:
  - drag-and-drop
  - dnd-kit
  - block-editor
  - inline-edit
dependency_graph:
  requires:
    - 02-01
  provides:
    - EDIT-01
    - EDIT-03
    - EDIT-04
    - EDIT-05
tech_stack:
  added:
    - '@dnd-kit/core'
    - '@dnd-kit/sortable'
    - '@dnd-kit/utilities'
  patterns:
    - DndContext + SortableContext for block reordering
    - activationConstraint distance: 8 to prevent drag during click
    - contentEditable for inline text editing
    - FileReader for image upload
key_files:
  created:
    - frontend/src/components/Editor/DragHandle.tsx
    - frontend/src/components/Editor/SortableBlock.tsx
    - frontend/src/components/Editor/EditorCanvas.tsx
    - frontend/src/components/Editor/InlineEdit.tsx
    - frontend/src/components/Editor/BlockLibrary.tsx
  modified: []
decisions:
  - "Used dnd-kit for drag-and-drop (not react-dnd) per stack decision"
  - "activationConstraint distance: 8 prevents accidental drag during click-to-edit"
  - "TextBlock/ImageBlock already had inline editing - kept existing implementation"
metrics:
  duration: 5 minutes
  completed: 2026-03-21
---

# Phase 2 Plan 2: Block Editor Core - Editor Canvas

## One-liner
Interactive editor canvas with dnd-kit drag-and-drop reordering, click-to-edit text/images, and block library palette.

## What was built

### DragHandle component
A 6-dot grip icon using inline SVG. Positioned on left side of block, visible on hover via `opacity-0 group-hover:opacity-100`. Cursor changes to grab/grabbing during drag.

### SortableBlock wrapper
Wraps each block with dnd-kit `useSortable` hook. Renders DragHandle on left (visible on hover) and delete button on top-right (visible on hover). Selection state shown via `ring-2 ring-primary`. Drag opacity reduced to 0.5 during drag.

### EditorCanvas with DndContext
Main canvas component that wraps blocks in `DndContext` and `SortableContext`. Uses:
- `PointerSensor` with `activationConstraint: { distance: 8 }` to prevent drag during click-to-edit
- `KeyboardSensor` with `sortableKeyboardCoordinates` for accessibility
- `closestCenter` collision detection
- `verticalListSortingStrategy` for block list

`onDragEnd` calls `editorStore.reorderBlocks(oldIndex, newIndex)`.

### InlineEdit contenteditable wrapper
Reusable contenteditable component for inline text editing:
- Single click activates editing mode
- Escape reverts changes
- Blur saves changes
- Paste strips HTML (plain text only)
- H1/H2 are single-line (Enter prevented)

### BlockLibrary palette
Floating palette for adding new blocks. Toggle button opens grid of block types (H1, H2, Paragraph, List, Image, Gallery, Social Links, Contact Form, Divider). Each button creates a new block via `editorStore.addBlock`.

### Existing click-to-edit functionality
TextBlock and ImageBlock (from Wave 1) already had comprehensive click-to-edit:
- **TextBlock**: contenteditable with Escape/blur handling, paste stripping, single-line headings
- **ImageBlock**: click triggers file input, FileReader reads image as data URL

## Deviations from Plan

### Task 6: TextBlock/ImageBlock already implemented
The plan asked to update TextBlock and ImageBlock to integrate InlineEdit. However, both components already had sophisticated inline editing implementations that exceeded what a simple InlineEdit wrapper would provide (TextBlock handles lists specially, has proper placeholder behavior). Kept existing implementations.

## Verification

- Drag handle visible on block hover
- Drag works to reorder blocks (8px movement threshold)
- Click on text activates editing mode
- Click on image opens file picker
- Delete button removes block
- BlockLibrary add buttons create new blocks

## Commits

- `0d9e8c1`: feat(02-02): create DragHandle component for block reordering
- `58deb5b`: feat(02-02): create SortableBlock wrapper with dnd-kit integration
- `98cfa6a`: feat(02-02): create EditorCanvas with dnd-kit DndContext
- `20c339a`: feat(02-02): create InlineEdit contenteditable wrapper component
- `d16ff5d`: feat(02-02): create BlockLibrary palette for adding new blocks

## Requirements Met

| ID | Requirement | Status |
|----|-------------|--------|
| EDIT-01 | Block-level drag-and-drop using dnd-kit | DONE |
| EDIT-03 | Drag handle on each block for reordering | DONE |
| EDIT-04 | Click-to-Edit: click any text element to edit inline | DONE (TextBlock) |
| EDIT-05 | Click-to-Edit: click image to replace with uploaded image | DONE (ImageBlock) |
