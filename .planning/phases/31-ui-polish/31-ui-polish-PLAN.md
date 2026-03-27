---
phase: 31-ui-polish
plan: "01"
type: execute
wave: 1
depends_on: ["30-link-support-01"]
files_modified:
  - frontend/src/components/Editor/blocks/TextBlock.tsx
  - frontend/src/stores/editorStore.ts
  - backend/src/main/resources/templates/static-site/blocks/text-block.html
autonomous: false
requirements:
  - UI-03

must_haves:
  truths:
    - "Active formatting states correctly reflect current selection when text is selected"
    - "Mixed formatting within paragraphs works correctly (bold within italic)"
    - "Undo/redo preserves formatting"
    - "Links with new tab setting render correctly on published site"
  artifacts:
    - path: "frontend/src/components/Editor/blocks/TextBlock.tsx"
      provides: "Fixed active format detection using Lexical selection API"
      min_lines: 20
    - path: "frontend/src/stores/editorStore.ts"
      provides: "Content sync preserves Lexical JSON (not just plain text)"
      min_lines: 15
    - path: "backend/src/main/resources/templates/static-site/blocks/text-block.html"
      provides: "Rich text HTML rendering on published site with link target support"
      min_lines: 10
  key_links:
    - from: "TextBlock.tsx"
      to: "lexicalEditor"
      via: "useEditorStore().lexicalEditor selection API"
      pattern: "$getSelection\\(\\)"
    - from: "editorStore.ts syncFromLexical"
      to: "backend blocks field"
      via: "full Lexical JSON serialization"
      pattern: "toJSON\\(\\)"
    - from: "text-block.html"
      to: "block.content"
      via: "th:utext with sanitization"
      pattern: "th:utext"
---

<objective>
Fix active formatting state detection, ensure rich text content syncs correctly, and enable proper link rendering on published site.
</objective>

<context>
@.planning/phases/27-linknode-foundation/27-linknode-foundation-SUMMARY.md
@.planning/phases/28-floating-toolbar/28-floating-toolbar-SUMMARY.md
@.planning/phases/29-text-formatting/29-text-formatting-SUMMARY.md
@.planning/phases/30-link-support/30-link-support-SUMMARY.md

## Current Issues Found

### Issue 1: Active Format Detection Uses Deprecated API
TextBlock.tsx lines 68-71 use `document.queryCommandState()` which is deprecated and inaccurate for Lexical's contentEditable model:
```typescript
if (document.queryCommandState('bold')) formats.add('bold');
if (document.queryCommandState('italic')) formats.add('italic');
if (document.queryCommandState('underline')) formats.add('underline');
```
Should use Lexical's `$getSelection()` API instead.

### Issue 2: Content Sync Loses Formatting
editorStore.ts `syncFromLexical` function (lines 80-99) only extracts `lexicalBlock.text`, losing all format flags:
```typescript
if (lexicalBlock && lexicalBlock.text !== undefined) {
  return { ...block, content: lexicalBlock.text };
}
```
The entire Lexical JSON must be preserved for rich text to work.

### Issue 3: Published Site Renders Plain Text
text-block.html uses `th:text="${block.content}"` which renders plain text, not HTML. Links and formatting are not rendered on published site. Must use `th:utext` with sanitization.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix active format detection using Lexical selection API</name>
  <files>frontend/src/components/Editor/blocks/TextBlock.tsx</files>
  <read_first>
    frontend/src/components/Editor/blocks/TextBlock.tsx (lines 54-80 for current detection logic)
    frontend/node_modules/@lexical/yjs/index.d.ts (for $getSelection types if available)
  </read_first>
  <action>
    Replace the deprecated `document.queryCommandState()` approach with Lexical's native selection API:

    1. In the mouseup handler within the selection detection useEffect, after detecting selection within containerRef:
    ```typescript
    // Get Lexical selection for accurate format detection
    if (lexicalEditor) {
      const selection = lexicalEditor.getSelection();
      if (selection) {
        const formats = new Set<string>();
        const format = selection.format;
        if (format & 1) formats.add('bold');        // Lexical format flags: 1=bold, 2=italic, 4=underline
        if (format & 2) formats.add('italic');
        if (format & 4) formats.add('underline');

        // Check if selection contains a link using $getType
        const node = selection.anchor.getNode();
        const parent = node.getParent();
        if (parent && parent.getType() === 'link') {
          formats.add('link');
        }

        setActiveFormats(formats);
      }
    }
    ```

    2. Remove the deprecated queryCommandState checks entirely.

    3. Keep the toolbar position detection using window.getSelection() since that's for UI positioning, not format detection.
  </action>
  <verify>
    <automated>grep -n "queryCommandState" frontend/src/components/Editor/blocks/TextBlock.tsx</automated>
  </verify>
  <done>Active format detection uses Lexical's selection.format API, not deprecated document.queryCommandState</done>
</task>

<task type="auto">
  <name>Task 2: Fix content sync to preserve rich text JSON</name>
  <files>frontend/src/stores/editorStore.ts</files>
  <read_first>
    frontend/src/stores/editorStore.ts (lines 80-99 for syncFromLexical)
  </read_first>
  <action>
    Modify syncFromLexical to preserve full Lexical JSON instead of extracting only plain text:

    1. Change the `content` field in BlockState to store full Lexical JSON:
    ```typescript
    syncFromLexical: (editorState) => {
      const json = editorState.toJSON();
      const lexicalBlocks = json.root?.children || [];

      set((state) => {
        const updatedBlocks = state.blocks.map((block) => {
          const lexicalBlock = lexicalBlocks.find(
            (lb: { blockId?: string }) => lb.blockId === block.id
          );
          if (lexicalBlock) {
            // Store full Lexical JSON for rich text persistence
            // The content field now contains JSON, not plain text
            return { ...block, content: JSON.stringify(lexicalBlock) };
          }
          return block;
        });

        return { blocks: updatedBlocks, isDirty: true };
      });
    },
    ```

    2. Also update the type comment for BlockState content field to indicate it may contain Lexical JSON for text blocks.

    3. The auto-save function that sends blocks to backend should now send the JSON string directly - verify it works with JSON.stringify'd content.
  </action>
  <verify>
    <automated>grep -n "JSON.stringify(lexicalBlock)" frontend/src/stores/editorStore.ts</automated>
  </verify>
  <done>Content sync preserves full Lexical JSON, not just plain text</done>
</task>

<task type="auto">
  <name>Task 3: Enable rich text rendering on published site</name>
  <files>backend/src/main/resources/templates/static-site/blocks/text-block.html</files>
  <read_first>
    backend/src/main/resources/templates/static-site/blocks/text-block.html (full file)
    backend/src/main/java/com/onepage/service/StaticSiteService.java (lines 99-113 for parseBlocks)
  </read_first>
  <action>
    Update text-block.html to render rich text HTML instead of plain text:

    1. Change from `th:text` to `th:utext` for content rendering. However, since block.content is now Lexical JSON (not HTML), we need to either:

    OPTION A (Recommended): Parse the Lexical JSON server-side and generate HTML:
    - In StaticSiteService.parseBlocks, detect text blocks and convert Lexical JSON to HTML
    - Apply CSS classes for bold/italic/underline based on format flags
    - Convert LinkNodes to anchor tags with target="_blank" when specified

    OPTION B: Quick fix - use th:utext with HTML sanitization but this won't work since content is JSON not HTML

    Implement OPTION A:

    1. In StaticSiteService.java, add a method to convert Lexical JSON to HTML:
    ```java
    private String lexicaJsonToHtml(String content) {
      if (content == null || content.isBlank()) return "";
      try {
        // Parse Lexical JSON and generate HTML
        // TextNode format flags: 1=bold, 2=italic, 4=underline
        // LinkNode: convert to <a href="..." target="_blank">...</a>
        // Returns HTML string
      } catch (Exception e) {
        log.error("Failed to convert Lexical JSON to HTML", e);
        return escapeHtml(content); // Fallback to plain text
      }
    }

    private String escapeHtml(String text) {
      if (text == null) return "";
      return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
    ```

    2. In parseBlocks method, transform text block content:
    ```java
    if ("text".equals(type) || type.startsWith("text-")) {
      block.put("content", lexicaJsonToHtml(block.get("content")));
    }
    ```

    3. In text-block.html, change `th:text` to `th:utext`:
    ```html
    <p th:case="'text-paragraph'" th:utext="${block.content}" class="text-paragraph">Paragraph</p>
    ```

    4. Add CSS styles for text formatting in the template:
    ```html
    <style>
      .text-paragraph a { color: #8b5cf6; text-decoration: underline; }
      .text-paragraph a:hover { color: #7c3aed; }
    </style>
    ```
  </action>
  <verify>
    <automated>grep -n "th:utext" backend/src/main/resources/templates/static-site/blocks/text-block.html</automated>
  </verify>
  <done>Published site renders bold/italic/underline and links with target="_blank" correctly</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Verify rich text integration end-to-end</name>
  <files>N/A - verification only</files>
  <action>Human verifies all rich text integration works correctly end-to-end: editor formatting, content persistence, and published site rendering.</action>
  <verify>
    <automated>grep -n "queryCommandState" frontend/src/components/Editor/blocks/TextBlock.tsx && echo "FAIL: deprecated API still present" || echo "PASS: no queryCommandState"</automated>
    <human>
      **Step 1: Active Format Detection**
      1. Open editor with text block
      2. Type "Hello World"
      3. Select "World" and press Ctrl+B
      4. Verify toolbar shows Bold button as active (filled primary background)
      5. Select "Hello" (plain text) - verify Bold is NOT active
      6. Select "World" again - verify Bold IS active

      **Step 2: Mixed Formatting**
      1. Type "Hello World"
      2. Select "World", press Ctrl+I
      3. Select entire "Hello World"
      4. Verify toolbar shows Italic active (but not Bold, since only "World" is italic)
      5. With "World" selected, press Ctrl+B
      6. Verify toolbar shows both Bold AND Italic active

      **Step 3: Undo/Redo with Formatting**
      1. Type some text
      2. Apply bold formatting
      3. Apply italic to another portion
      4. Press Ctrl+Z - verify formatting is undone
      5. Press Ctrl+Shift+Z - verify formatting is redone

      **Step 4: Links on Published Site**
      1. Open editor with text block
      2. Type "Click here"
      3. Select "here", press Ctrl+K
      4. Enter "https://example.com", check "Open in new tab", submit
      5. Publish the blog
      6. Visit the published site URL
      7. Right-click the link, verify "Open in new tab" option works
    </human>
  </verify>
  <done>All 4 verification steps pass: active states correct, mixed formatting works, undo/redo preserves formats, links render with target="_blank"</done>
  <resume-signal>Type "approved" or describe issues found</resume-signal>
</task>

</tasks>

<verification>
1. `grep -n "queryCommandState" frontend/src/components/Editor/blocks/TextBlock.tsx` returns nothing
2. `grep -n "JSON.stringify(lexicalBlock)" frontend/src/stores/editorStore.ts` finds the sync fix
3. `grep -n "th:utext" backend/src/main/resources/templates/static-site/blocks/text-block.html` finds the rendering fix
4. Backend compiles without errors: `cd backend && mvn compile -q`
5. Frontend builds without errors: `cd frontend && npm run build 2>&1 | tail -20`
</verification>

<success_criteria>
1. Active formatting states correctly reflect current selection (not using deprecated API)
2. Mixed formatting within paragraphs works correctly (bold within italic)
3. Undo/redo preserves formatting (verified via Ctrl+Z)
4. Links with new tab setting render correctly on published site (target="_blank")
</success_criteria>

<output>
After completion, create `.planning/phases/31-ui-polish/31-ui-polish-SUMMARY.md`
</output>
