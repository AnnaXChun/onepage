---
phase: 29-text-formatting
plan: 01
type: execute
wave: 1
depends_on: ["28"]
files_modified:
  - frontend/src/components/Editor/blocks/TextBlock.tsx
autonomous: true
requirements:
  - RICH-01
  - RICH-02
  - RICH-03

must_haves:
  truths:
    - "User can make text bold via toolbar button or Ctrl+B"
    - "User can make text italic via toolbar button or Ctrl+I"
    - "User can underline text via toolbar button or Ctrl+U"
  artifacts:
    - path: "frontend/src/components/Editor/blocks/TextBlock.tsx"
      provides: "Text formatting with keyboard shortcuts and toolbar integration"
      min_lines: 50
    - path: "frontend/src/stores/editorStore.ts"
      provides: "lexicalEditor reference for command dispatch"
      exports: ["lexicalEditor", "setLexicalEditor"]
  key_links:
    - from: "TextBlock.tsx"
      to: "stores/editorStore.ts"
      via: "useEditorStore().lexicalEditor"
      pattern: "lexicalEditor.*dispatch"
    - from: "FloatingToolbar.tsx"
      to: "TextBlock.tsx"
      via: "onFormat callback"
      pattern: "handleFormat.*bold|italic|underline"
---

<objective>
Implement bold, italic, and underline text formatting with keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U) in the TextBlock component. Wire the FloatingToolbar buttons to dispatch Lexical FORMAT_TEXT_COMMAND via the stored lexicalEditor, and add keyboard event listeners for the shortcuts.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@frontend/src/components/Editor/FloatingToolbar.tsx
@frontend/src/components/Editor/blocks/TextBlock.tsx
@frontend/src/stores/editorStore.ts
@frontend/src/components/Editor/LexicalConfig.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire toolbar buttons to Lexical FORMAT_TEXT_COMMAND</name>
  <files>frontend/src/components/Editor/blocks/TextBlock.tsx</files>
  <read_first>
    - frontend/src/components/Editor/blocks/TextBlock.tsx
    - frontend/src/stores/editorStore.ts
  </read_first>
  <action>
    In TextBlock.tsx, update the handleFormat function to:

    1. Import FORMAT_TEXT_COMMAND from 'lexical/LexicalCommands' and $getSelection, $isRangeSelection from 'lexical'
    2. Get lexicalEditor from the Zustand store via useEditorStore()
    3. Update handleFormat to dispatch FORMAT_TEXT_COMMAND using editor.dispatchCommand(FORMAT_TEXT_COMMAND, format) where format is 'bold', 'italic', or 'underline'

    The lexicalEditor is stored in Zustand at state.lexicalEditor (set by LexicalEditorInner in LexicalEditor.tsx).
  </action>
  <verify>
    <automated>grep -n "dispatchCommand.*FORMAT_TEXT_COMMAND" frontend/src/components/Editor/blocks/TextBlock.tsx</automated>
  </verify>
  <done>Toolbar buttons dispatch Lexical commands when clicked</done>
</task>

<task type="auto">
  <name>Task 2: Add keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)</name>
  <files>frontend/src/components/Editor/blocks/TextBlock.tsx</files>
  <read_first>
    - frontend/src/components/Editor/blocks/TextBlock.tsx
  </read_first>
  <action>
    Add a useEffect in TextBlock.tsx that registers keyboard event listeners for text formatting shortcuts:

    1. Add a new useEffect after the existing selection detection useEffect (around line 48)
    2. Listen for 'keydown' events on the document
    3. Check for Ctrl (or Cmd on Mac) + B/I/U keys
    4. When triggered, call editor.dispatchCommand(FORMAT_TEXT_COMMAND, format) where format is 'bold', 'italic', or 'underline'
    5. Prevent default browser behavior with e.preventDefault()
    6. Only fire when editor isEditing (user is actively typing)

    Key combinations:
    - Ctrl/Cmd+B -> bold
    - Ctrl/Cmd+I -> italic
    - Ctrl/Cmd+U -> underline

    Use e.ctrlKey || e.metaKey to support both Windows/Linux and Mac.
  </action>
  <verify>
    <automated>grep -n "Ctrl.*B\|Ctrl.*I\|Ctrl.*U" frontend/src/components/Editor/blocks/TextBlock.tsx</automated>
  </verify>
  <done>Keyboard shortcuts trigger formatting commands</done>
</task>

<task type="auto">
  <name>Task 3: Update active format detection</name>
  <files>frontend/src/components/Editor/blocks/TextBlock.tsx</files>
  <read_first>
    - frontend/src/components/Editor/blocks/TextBlock.tsx
  </read_first>
  <action>
    Update the activeFormats detection in the mouseup handler to properly detect formatting from the DOM selection state. The current implementation checks for CSS classes that may not exist:

    1. Modify the format detection logic in the handleMouseUp (around line 62-67)
    2. Check the computed style of the selection using window.getSelection() to detect actual formatting:
       - For bold: document.queryCommandState('bold')
       - For italic: document.queryCommandState('italic')
       - For underline: document.queryCommandState('underline')
    3. Update activeFormats Set based on these states

    This ensures the toolbar buttons show correct active states when text with existing formatting is selected.
  </action>
  <verify>
    <automated>grep -n "queryCommandState" frontend/src/components/Editor/blocks/TextBlock.tsx</automated>
  </verify>
  <done>Toolbar shows correct active states for formatted text</done>
</task>

</tasks>

<verification>
- Ctrl+B makes selected text bold
- Ctrl+I makes selected text italic
- Ctrl+U makes selected text underlined
- Toolbar Bold button toggles bold formatting
- Toolbar Italic button toggles italic formatting
- Toolbar Underline button toggles underline formatting
- Formatting persists in content (stored in block content string)
</verification>

<success_criteria>
1. User can make text bold via toolbar button or Ctrl+B
2. User can make text italic via toolbar button or Ctrl+I
3. User can underline text via toolbar button or Ctrl+U
4. Formatting persists when saving and reopening the editor
</success_criteria>

<output>
After completion, create `.planning/phases/29-text-formatting/29-text-formatting-SUMMARY.md`
</output>
