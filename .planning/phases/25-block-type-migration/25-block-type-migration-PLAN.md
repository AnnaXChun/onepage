---
phase: 25-block-type-migration
plan: 01
type: execute
wave: 1
depends_on: [24]
requirements_addressed: [BLOCK-01, BLOCK-02, BLOCK-03, BLOCK-04, BLOCK-05, CONFIG-01, CONFIG-02, CONFIG-03, CONFIG-04]
files_modified:
  - frontend/src/components/Editor/LexicalBlockNode.ts
  - frontend/src/components/Editor/blocks/TextBlock.tsx
  - frontend/src/components/Editor/blocks/ImageBlock.tsx
  - frontend/src/components/Editor/blocks/SocialLinksBlock.tsx
  - frontend/src/components/Editor/blocks/DividerBlock.tsx
  - frontend/src/components/Editor/BlockConfigPanel.tsx
  - frontend/src/types/block.ts
autonomous: true

must_haves:
  truths:
    - "User can add/edit Text blocks (H1, H2, Paragraph, List) with Lexical nodes"
    - "User can add/edit Image blocks with aspect ratio and corner style"
    - "User can add/edit Social Links blocks"
    - "User can add/edit Divider blocks"
    - "User can configure text alignment, colors, and visibility per block"
    - "Config changes persist to backend via updateBlogBlocks API"
  artifacts:
    - path: "frontend/src/components/Editor/blocks/TextBlock.tsx"
      provides: "Text block using Lexical nodes for inline editing"
    - path: "frontend/src/components/Editor/blocks/ImageBlock.tsx"
      provides: "Image block with Lexical node storage"
    - path: "frontend/src/components/Editor/blocks/DividerBlock.tsx"
      provides: "Divider block with Lexical node"
    - path: "frontend/src/components/Editor/BlockConfigPanel.tsx"
      provides: "Config panel synced with Lexical node properties"
---

# Phase 25: Block Type Migration - Implementation Plan

## Objective
Migrate all 5 block types (Text, Image, Social Links, Contact Form, Divider) to Lexical nodes with full config panel support.

## Context
- Phase 24 created Lexical core infrastructure
- This phase creates the actual block components using Lexical
- Block types: text-h1, text-h2, text-paragraph, text-list, image-single, image-gallery, social-links, contact-form, divider
- Config options: align (left/center/right), textColor, backgroundColor, visible, aspectRatio, rounded

## Tasks

### Task 1: Create Lexical TextBlock component
<files>
  frontend/src/components/Editor/blocks/TextBlock.tsx
</files>
<action>
Rewrite TextBlock.tsx to use Lexical RichTextPlugin for inline editing:

1. Import from @lexical/react:
   - RichTextPlugin
   - ContentEditable
   - Placeholder

2. Use $createParagraphNode() for paragraph content

3. Support block types:
   - text-h1 → HeadingNode with tag "h1"
   - text-h2 → HeadingNode with tag "h2"
   - text-paragraph → ParagraphNode
   - text-list → ListNode with listType "ul"

4. Apply config via CSS:
   - alignment: text-align style
   - textColor: color style
   - backgroundColor: background-color style

5. Connect to editorStore:
   - On mount, register with Lexical editor
   - On change, update Zustand blocks

</action>
<verify>
grep -l "LexicalComposer\|RichTextPlugin\|ContentEditable" frontend/src/components/Editor/blocks/TextBlock.tsx
</verify>
<done>TextBlock uses Lexical for inline editing with proper config styling</done>

---

### Task 2: Create Lexical ImageBlock component
<files>
  frontend/src/components/Editor/blocks/ImageBlock.tsx
</files>
<action>
Create ImageBlock.tsx using Lexical node:

1. Create custom ImageNode extending ElementNode:
   - Store: url, aspectRatio, rounded, alt

2. Create DOM element with:
   - <img> tag with URL from node
   - aspect-ratio from node config
   - rounded corners class if configured

3. Support:
   - image-single: single image
   - image-gallery: grid of images (store array)

4. Click to edit URL in config panel

</action>
<verify>
grep -l "ImageNode\|image-single\|aspectRatio" frontend/src/components/Editor/blocks/ImageBlock.tsx
</verify>
<done>ImageBlock stores image URL and config in Lexical node</done>

---

### Task 3: Create Lexical SocialLinksBlock component
<files>
  frontend/src/components/Editor/blocks/SocialLinksBlock.tsx
</files>
<action>
Create SocialLinksBlock.tsx:

1. Create SocialLinksNode extending ElementNode:
   - Store array of {platform, url} objects as JSON string

2. Render as flexbox list of social icons

3. Supported platforms: twitter, github, linkedin, instagram, facebook, website

4. Click platform to edit URL

</action>
<verify>
grep -l "SocialLinksNode\|platform\|url" frontend/src/components/Editor/blocks/SocialLinksBlock.tsx
</verify>
<done>SocialLinksBlock stores platform/URL array in Lexical node</done>

---

### Task 4: Create Lexical DividerBlock component
<files>
  frontend/src/components/Editor/blocks/DividerBlock.tsx
</files>
<action>
Create DividerBlock.tsx:

1. Create DividerNode extending ElementNode:
   - Store style: solid/dashed/dotted

2. Render as <hr> with styled border

</action>
<verify>
grep -l "DividerNode\|solid\|dashed" frontend/src/components/Editor/blocks/DividerBlock.tsx
</verify>
<done>DividerBlock stores style in Lexical node</done>

---

### Task 5: Update BlockConfigPanel for Lexical
<files>
  frontend/src/components/Editor/BlockConfigPanel.tsx
</files>
<action>
Update BlockConfigPanel.tsx:

1. Get selected node from Lexical editor:
   ```
   const selectedNode = editor.getEditorState().read(() => $getSelectedNode());
   ```

2. Read properties from node:
   - node.__blockType
   - node.__blockConfig (JSON parsed)
   - node.__format (alignment)

3. Write changes back:
   - editor.update(() => { node.__format = newFormat; })

4. Keep existing config UI:
   - text alignment dropdown
   - text color picker
   - background color picker
   - visibility toggle

5. Persist on change via updateBlogBlocks API

</action>
<verify>
grep -l "\$getSelectedNode\|node.__format\|editor.update" frontend/src/components/Editor/BlockConfigPanel.tsx
</verify>
<done>BlockConfigPanel syncs with Lexical node properties</done>

---

### Task 6: Create ContactFormBlock (stub)
<files>
  frontend/src/components/Editor/blocks/ContactFormBlock.tsx
</files>
<action>
Create ContactFormBlock.tsx:

1. Create ContactFormNode extending ElementNode:
   - Store fields array [{type, label, required}]

2. Render form with inputs

3. For now, create stub - full form handling in future phase

</action>
<verify>
grep -l "ContactFormNode\|form" frontend/src/components/Editor/blocks/ContactFormBlock.tsx
</verify>
<done>ContactFormBlock stub created</done>

---

### Task 7: Update BlockRenderer for new blocks
<files>
  frontend/src/components/Editor/BlockRenderer.tsx
</files>
<action>
Update BlockRenderer.tsx to use new Lexical-based blocks:

1. Import new block components

2. Render based on blockType using new components

3. Pass Lexical editor context to blocks

</action>
<verify>
grep -l "LexicalEditor\|TextBlock\|ImageBlock" frontend/src/components/Editor/BlockRenderer.tsx
</verify>
<done>BlockRenderer updated to use Lexical block components</done>

---

### Task 8: Build verification
<action>
Run npm run build to verify:
1. No TypeScript errors
2. All imports resolve
3. Lexical nodes serialize correctly

</action>
<verify>
npm run build 2>&1 | grep -i "error\|failed" | head -10
</verify>
<done>Build passes with all block types migrated</done>

---

## Verification

### Phase-level checks
1. TextBlock uses Lexical RichTextPlugin
2. ImageBlock stores URL/config in node
3. SocialLinksBlock stores platform/URL array
4. DividerBlock stores style
5. ContactFormBlock created (stub)
6. BlockConfigPanel syncs with node properties
7. BlockRenderer uses new components
8. Build passes

### Requirements mapped
- BLOCK-01 (Text blocks): Task 1
- BLOCK-02 (Image blocks): Task 2
- BLOCK-03 (Social links): Task 3
- BLOCK-04 (Contact form): Task 6
- BLOCK-05 (Divider): Task 4
- CONFIG-01 (Text alignment): Task 1, Task 5
- CONFIG-02 (Colors): Task 1, Task 5
- CONFIG-03 (Visibility): Task 5
- CONFIG-04 (Persist config): Task 5

## Success Criteria

1. All 5 block types use Lexical nodes
2. Config panel reads/writes Lexical node properties
3. Config changes persist to backend
4. Build passes without errors
