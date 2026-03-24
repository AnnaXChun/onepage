---
phase: 26-ai-integration
plan: 01
type: execute
wave: 1
depends_on: [24, 25]
requirements_addressed: [AI-01, AI-02, MIGRATE-01, MIGRATE-02, MIGRATE-03]
files_modified:
  - frontend/src/components/Editor/AIWriteModal.tsx
  - frontend/src/components/Editor/EditorToolbar.tsx
  - frontend/src/components/Editor/EditorCanvas.tsx
  - frontend/src/components/BlogPreview/BlogPreviewRenderer.tsx
autonomous: true
---

# Phase 26: AI Integration & Migration

## Objective
Connect AI Write Assist to Lexical selection, ensure existing blogs load and render correctly.

## Tasks

### Task 1: Update AIWriteModal for Lexical
<action>
Update AIWriteModal.tsx to:
- Get selected text from Lexical via editor.getSelection().getText()
- Trigger AI suggest on selected text
- Apply Replace/Append modes via editor.update()
</action>
<verify>grep -l "editor.getSelection\|getText" frontend/src/components/Editor/AIWriteModal.tsx</verify>

### Task 2: Update EditorToolbar with AI button
<action>
Update EditorToolbar.tsx to show AI Assist button when text selected
</action>
<verify>grep -l "AI\|aiWrite" frontend/src/components/Editor/EditorToolbar.tsx</verify>

### Task 3: Update EditorCanvas for block loading
<action>
Update EditorCanvas.tsx to load blocks from backend into Lexical on mount
</action>
<verify>grep -l "getBlogById\|blocks" frontend/src/components/Editor/EditorCanvas.tsx</verify>

### Task 4: Verify BlogPreviewRenderer
<action>
Verify BlogPreviewRenderer.tsx renders blocks from Zustand store correctly
</action>
<verify>grep -l "BlockState\|blocks" frontend/src/components/BlogPreview/BlogPreviewRenderer.tsx</verify>

### Task 5: Build verification
<action>npm run build</action>
<verify>npm run build 2>&1 | tail -5</verify>
