---
phase: 30-link-support
plan: "01"
type: execute
wave: 1
depends_on: ["29-text-formatting-01"]
files_modified:
  - frontend/src/components/Editor/blocks/TextBlock.tsx
autonomous: false
requirements:
  - LINK-01
  - LINK-02
  - LINK-03
  - LINK-05
must_haves:
  truths:
    - "User can insert a link on selected text via Ctrl+K or toolbar button"
    - "User can edit an existing link URL"
    - "User can remove a link from text (converts to plain text)"
    - "User can set link to open in new tab via toggle"
  artifacts:
    - path: "frontend/src/components/Editor/LinkEditorModal.tsx"
      provides: "Modal for URL input, validation, and new tab toggle"
      min_lines: 80
    - path: "frontend/src/components/Editor/blocks/TextBlock.tsx"
      provides: "handleLinkClick wired to TOGGLE_LINK_COMMAND, Ctrl+K shortcut, link detection"
      exports: ["handleLinkClick", "handleFormat"]
  key_links:
    - from: "FloatingToolbar"
      to: "TextBlock.handleLinkClick"
      via: "onLinkClick prop"
    - from: "TextBlock"
      to: "TOGGLE_LINK_COMMAND"
      via: "lexicalEditor.dispatchCommand"
    - from: "LinkEditorModal"
      to: "validateUrl"
      via: "import from linkUtils"
---

<objective>
Implement link insertion, editing, and removal with URL validation and new tab option.

Purpose: Complete the link feature by wiring the Link button to Lexical's TOGGLE_LINK_COMMAND and creating a modal for URL input with validation.
Output: LinkEditorModal.tsx, updated TextBlock.tsx with handleLinkClick and Ctrl+K
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@frontend/src/components/Editor/utils/linkUtils.ts
@frontend/src/components/Editor/FloatingToolbar.tsx
@frontend/src/components/Editor/blocks/TextBlock.tsx
@frontend/src/components/Editor/LexicalConfig.ts
</context>

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from codebase. -->

From linkUtils.ts:
```typescript
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
export function validateUrl(url: string): ValidationResult;
```

From FloatingToolbar.tsx:
```typescript
export interface FloatingToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onFormat: (format: 'bold' | 'italic' | 'underline' | 'link') => void;
  activeFormats: Set<string>;
  onLinkClick: () => void;
  position: { x: number; y: number } | null;
}
```

From TextBlock.tsx:
```typescript
// Existing state and handlers
const { lexicalEditor } = useEditorStore();
const handleFormat = useCallback((format: 'bold' | 'italic' | 'underline' | 'link') => {
  lexicalEditor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
}, [lexicalEditor]);
const handleLinkClick = useCallback(() => {
  console.log('[TextBlock] link click');
}, []);
// TOGGLE_LINK_COMMAND imported from lexical/LexicalCommands
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Create LinkEditorModal component</name>
  <files>frontend/src/components/Editor/LinkEditorModal.tsx</files>
  <action>
Create LinkEditorModal.tsx with:
- Props: { isOpen, url, onSubmit, onClose, onRemove }
- URL input with placeholder "https://example.com"
- Validation using validateUrl() from linkUtils.ts
- "Open in new tab" checkbox toggle
- Submit button disabled until valid URL entered
- "Remove link" button (shown when editing existing link)
- Error message display below input
- Modal overlay with backdrop blur
- Focus trap within modal
- Escape key closes modal

Styling: Use existing CSS variables, match FloatingToolbar aesthetic.
</action>
  <verify>
<automated>grep -l "LinkEditorModal" frontend/src/components/Editor/LinkEditorModal.tsx && wc -l frontend/src/components/Editor/LinkEditorModal.tsx | awk '{print $1}'</automated>
<manual>Modal opens when clicking Link button, URL validation shows errors for javascript: URLs</manual>
</verify>
<done>LinkEditorModal.tsx exists with URL input, validation, new tab toggle, and remove link button</done>
</task>

<task type="auto">
  <name>Task 2: Wire handleLinkClick to TOGGLE_LINK_COMMAND</name>
  <files>frontend/src/components/Editor/blocks/TextBlock.tsx</files>
  <action>
In TextBlock.tsx:

1. Import TOGGLE_LINK_COMMAND from '@lexical/link':
```typescript
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
```

2. Import useState and useCallback (already imported):
```typescript
import { useState, useCallback } from 'react';
```

3. Add state for modal:
```typescript
const [showLinkModal, setShowLinkModal] = useState(false);
```

4. Add state for existing URL when editing:
```typescript
const [existingLinkUrl, setExistingLinkUrl] = useState<string | null>(null);
```

5. Update handleLinkClick to show modal and detect existing link:
```typescript
const handleLinkClick = useCallback(() => {
  if (!lexicalEditor) {
    console.warn('[TextBlock] No lexicalEditor available');
    return;
  }

  // TODO: Detect if selection is inside an existing link
  // For now, just open the modal
  setExistingLinkUrl(null);
  setShowLinkModal(true);
}, [lexicalEditor]);
```

6. Add handleLinkSubmit:
```typescript
const handleLinkSubmit = useCallback((url: string, openInNewTab: boolean) => {
  if (!lexicalEditor) return;

  // Validate URL before inserting
  const validation = validateUrl(url);
  if (!validation.valid) {
    console.warn('[TextBlock] Invalid URL:', validation.error);
    return;
  }

  // Insert/edit link using TOGGLE_LINK_COMMAND
  // Note: TOGGLE_LINK_COMMAND takes a URL string to insert, or null to remove
  lexicalEditor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  setShowLinkModal(false);
}, [lexicalEditor]);
```

7. Add handleLinkRemove:
```typescript
const handleLinkRemove = useCallback(() => {
  if (!lexicalEditor) return;
  lexicalEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  setShowLinkModal(false);
}, [lexicalEditor]);
```

8. Add LinkEditorModal to render:
```typescript
{showLinkModal && (
  <LinkEditorModal
    isOpen={showLinkModal}
    url={existingLinkUrl}
    onSubmit={handleLinkSubmit}
    onClose={() => setShowLinkModal(false)}
    onRemove={existingLinkUrl ? handleLinkRemove : undefined}
  />
)}
```

9. Add Ctrl+K keyboard shortcut in the existing keydown handler:
```typescript
switch (e.key.toLowerCase()) {
  // ... existing B, I, U cases
  case 'k':
    e.preventDefault();
    handleLinkClick();
    break;
}
```
</action>
  <verify>
<automated>grep -c "TOGGLE_LINK_COMMAND" frontend/src/components/Editor/blocks/TextBlock.tsx</automated>
<manual>Select text, press Ctrl+K, modal appears, enter URL, link is inserted</manual>
</verify>
<done>handleLinkClick opens modal and TOGGLE_LINK_COMMAND is dispatched with validated URL</done>
</task>

<task type="checkpoint:human-verify">
  <name>Task 3: Verify link insertion, editing, and removal</name>
  <what-built>Link feature: insert via toolbar button, insert via Ctrl+K, edit existing link, remove link</what-built>
  <how-to-verify>
    1. Open editor with a text block
    2. Select text, click Link button in floating toolbar - modal should appear
    3. Enter a valid URL like "https://example.com", check "Open in new tab", click Submit
    4. Text should now be a clickable link
    5. Select the link, click Link button - modal should appear with existing URL
    6. Change URL, click Submit - link should be updated
    7. Click "Remove link" - link should be removed, text should be plain
    8. Select text, press Ctrl+K - modal should appear
    9. Try entering "javascript:alert(1)" - should show validation error
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- LinkEditorModal.tsx exists with 80+ lines
- TextBlock.tsx imports TOGGLE_LINK_COMMAND from @lexical/link
- TextBlock.tsx has showLinkModal state and handleLinkSubmit/handleLinkRemove callbacks
- TextBlock.tsx renders LinkEditorModal conditionally
- Ctrl+K case added to keyboard shortcut handler
- validateUrl is called before dispatching TOGGLE_LINK_COMMAND
</verification>

<success_criteria>
1. Link button in floating toolbar opens LinkEditorModal
2. Entering valid URL and submitting inserts a link
3. Entering invalid URL shows validation error
4. Clicking existing link and submitting edits the URL
5. Clicking "Remove link" removes the link
6. Ctrl+K opens modal even when toolbar is not visible
7. "Open in new tab" checkbox is present and functional
</success_criteria>

<output>
After completion, create `.planning/phases/30-link-support/30-link-support-SUMMARY.md`
</output>
