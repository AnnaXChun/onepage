---
phase: 28-floating-toolbar
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/Editor/FloatingToolbar.tsx
  - frontend/src/components/Editor/blocks/TextBlock.tsx
autonomous: true
requirements:
  - UI-01
  - UI-02
  - UI-03

must_haves:
  truths:
    - "Selecting text in a text block triggers floating toolbar to appear"
    - "Toolbar displays Bold, Italic, Underline, and Link buttons"
    - "Toolbar visually indicates which formats are currently active on selection"
    - "Clicking outside selection dismisses toolbar"
  artifacts:
    - path: "frontend/src/components/Editor/FloatingToolbar.tsx"
      provides: "Floating toolbar component with selection detection"
      min_lines: 100
    - path: "frontend/src/components/Editor/blocks/TextBlock.tsx"
      provides: "TextBlock with floating toolbar integration"
  key_links:
    - from: "TextBlock.tsx"
      to: "FloatingToolbar.tsx"
      via: "TextBlock passes containerRef; FloatingToolbar uses containerRef for mouseup listener"
      pattern: "containerRef.*mouseup"
    - from: "FloatingToolbar.tsx"
      to: "window.getSelection()"
      via: "Selection detection"
      pattern: "getSelection.*rangeCount"
---

<objective>
Create a floating toolbar that appears when text is selected in a text block, with Bold, Italic, Underline, and Link buttons. The toolbar should visually indicate active formats and dismiss when clicking outside.

Purpose: Provide text formatting access via modern floating toolbar UX pattern
Output: FloatingToolbar.tsx component integrated into TextBlock
</objective>

<context>
@frontend/src/components/Editor/blocks/TextBlock.tsx
@frontend/src/styles/global.css
@frontend/src/components/Editor/LexicalConfig.ts

From LexicalConfig.ts - theme already defines text format classes:
```typescript
theme: {
  text: {
    bold: 'vibe-text-bold',
    italic: 'vibe-text-italic',
    underline: 'vibe-text-underline',
  },
  link: 'vibe-text-link',
},
```

Interface that FloatingToolbar receives:
```typescript
interface FloatingToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onFormat: (format: 'bold' | 'italic' | 'underline' | 'link') => void;
  activeFormats: Set<string>;
  onLinkClick: () => void;
  position: { x: number; y: number } | null;
}
```

Note: The editorRef passed to FloatingToolbar is the containerRef created in TextBlock.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create FloatingToolbar component</name>
  <files>frontend/src/components/Editor/FloatingToolbar.tsx</files>
  <read_first>
    - frontend/src/components/Editor/blocks/TextBlock.tsx
    - frontend/src/styles/global.css
  </read_first>
  <action>
    Create FloatingToolbar.tsx with the following features:

    1. Selection detection via mouseup event listener on editorRef (the container ref passed from TextBlock)
    2. Use window.getSelection() to detect text selection
    3. Calculate toolbar position from selection range.getBoundingClientRect()
    4. Render toolbar only when selection exists (rangeCount > 0)
    5. Show four buttons: Bold (B), Italic (I), Underline (U), Link (chain icon)
    6. Each button has onClick that calls onFormat with the format type
    7. Visual active state for buttons when format is in activeFormats Set
    8. Position toolbar above selection with slight offset

    Styling requirements per frontend design skill:
    - Use CSS variables from global.css (--color-primary, --color-surface, etc.)
    - OKLCH colors or use existing color tokens
    - Use Plus Jakarta Sans font family
    - Smooth transitions with var(--ease-out-quart)
    - No bounce/elastic easing
    - Button active state: darker background or border indicator

    Implementation pattern:
    ```typescript
    // Selection detection via mouseup on editorRef container
    const handleMouseUp = useCallback(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
        setSelectionText(selection.toString());
        // Detect active formats from selection
      }
    }, [editorRef]);

    // Toolbar renders at position if selection exists
    ```
  </action>
  <verify>
    <automated>grep -l "getSelection\|rangeCount" frontend/src/components/Editor/FloatingToolbar.tsx</automated>
  </verify>
  <done>FloatingToolbar.tsx exists with selection detection, positioning, and format buttons</done>
</task>

<task type="auto">
  <name>Task 2: Integrate toolbar into TextBlock</name>
  <files>frontend/src/components/Editor/blocks/TextBlock.tsx</files>
  <read_first>
    - frontend/src/components/Editor/blocks/TextBlock.tsx
    - frontend/src/components/Editor/FloatingToolbar.tsx
  </read_first>
  <action>
    Modify TextBlock.tsx to integrate the floating toolbar:

    1. Import FloatingToolbar component
    2. Create a ref named containerRef for the editable content container
    3. Pass containerRef to FloatingToolbar as the editorRef prop (per FloatingToolbarProps interface)
    4. Add useCallback for handleFormat that will be wired to Lexical later (for now, just logs)
    5. Add useCallback for handleLinkClick (opens link modal placeholder - Phase 30)
    6. Track activeFormats using Set<string> state
    7. Track toolbarPosition state (position or null)

    Selection detection in TextBlock - TextBlock adds mouseup listener on document:
    ```typescript
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleMouseUp = () => {
        // Let FloatingToolbar handle selection detection via containerRef
      };
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);
    ```

    Note: The mouseup listener is on document, not on containerRef. The FloatingToolbar uses containerRef to check if selection is within its bounds.

    Detect active formats by checking if selection is within format tags:
    ```typescript
    const checkActiveFormats = () => {
      const selection = window.getSelection();
      if (!selection) return new Set<string>();
      const formats = new Set<string>();
      // Check if selection or parent has bold/italic/underline/link
      return formats;
    };
    ```
  </action>
  <verify>
    <automated>grep -l "FloatingToolbar" frontend/src/components/Editor/blocks/TextBlock.tsx && grep -l "containerRef" frontend/src/components/Editor/blocks/TextBlock.tsx</automated>
  </verify>
  <done>TextBlock renders FloatingToolbar when text is selected</done>
</task>

<task type="auto">
  <name>Task 3: Add click-outside dismiss logic</name>
  <files>frontend/src/components/Editor/blocks/TextBlock.tsx</files>
  <read_first>
    - frontend/src/components/Editor/blocks/TextBlock.tsx
  </read_first>
  <action>
    Add click-outside dismissal to TextBlock:

    1. Add useEffect that listens for mousedown on document
    2. Check if click target is outside toolbar AND outside selection
    3. Clear selection/position state to dismiss toolbar

    Implementation:
    ```typescript
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (toolbarPosition && containerRef.current) {
          const target = e.target as Node;
          const isInsideToolbar = containerRef.current?.querySelector('.floating-toolbar')?.contains(target);
          const isInsideSelection = window.getSelection()?.toString().length > 0;
          if (!isInsideToolbar && !isInsideSelection) {
            setToolbarPosition(null);
          }
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [toolbarPosition]);
    ```

    Also clear selection when clicking elsewhere:
    ```typescript
    const handleBlur = () => {
      setTimeout(() => {
        if (!window.getSelection()?.toString()) {
          setToolbarPosition(null);
        }
      }, 100);
    };
    ```
  </action>
  <verify>
    <automated>grep -l "handleClickOutside\|mousedown.*outside" frontend/src/components/Editor/blocks/TextBlock.tsx</automated>
  </verify>
  <done>Toolbar dismisses when clicking outside selection</done>
</task>

</tasks>

<verification>
1. Select text in a text block - toolbar should appear above selection
2. Toolbar shows 4 buttons: Bold, Italic, Underline, Link
3. If selected text has bold formatting, Bold button shows active state
4. Click outside selection - toolbar should disappear
5. No console errors on selection or toolbar interaction
</verification>

<success_criteria>
- FloatingToolbar.tsx created with selection detection via window.getSelection()
- Toolbar appears within 100ms of text selection
- Toolbar positioned above selection center
- Four buttons visible with working hover/active states
- Click outside selection clears toolbar within 100ms
- No console errors during toolbar lifecycle
</success_criteria>

<output>
After completion, create `.planning/phases/28-floating-toolbar/28-floating-toolbar-SUMMARY.md`
</output>
