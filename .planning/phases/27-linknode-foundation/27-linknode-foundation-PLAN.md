---
phase: 27-linknode-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/package.json
  - frontend/src/components/Editor/LexicalConfig.ts
  - frontend/src/components/Editor/utils/linkUtils.ts
autonomous: true
requirements:
  - LINK-04

must_haves:
  truths:
    - "@lexical/link package is installed in package.json"
    - "LinkNode is registered in LexicalConfig"
    - "URL validation utility exists at linkUtils.ts"
    - "validateUrl() rejects javascript:, data:, and invalid URLs"
    - "validateUrl() accepts valid http/https URLs"
  artifacts:
    - path: "frontend/src/components/Editor/utils/linkUtils.ts"
      provides: "URL validation for link insertion"
      exports: ["validateUrl", "ValidationResult"]
    - path: "frontend/src/components/Editor/LexicalConfig.ts"
      provides: "LinkNode registered in Lexical composer"
      contains: "LinkNode"
  key_links:
    - from: "LexicalConfig.ts"
      to: "@lexical/link"
      via: "import LinkNode"
    - from: "linkUtils.ts"
      to: "LexicalLinkNode"
      via: "used before TOGGLE_LINK_COMMAND dispatch"
---

<objective>
Install @lexical/link package and implement URL validation utility to establish link infrastructure for Phase 27.

Purpose: Establish foundation for clickable links with URL validation to prevent XSS attacks on published sites.
Output: @lexical/link installed, LinkNode registered, linkUtils.ts with validateUrl function.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/package.json
@frontend/src/components/Editor/LexicalConfig.ts
@frontend/src/components/Editor/LexicalBlockNode.ts

# Lexical LinkNode API reference (lexical.dev):
# LinkNode is a core Lexical node type for hyperlinks
# TOGGLE_LINK_COMMAND dispatches link insertion/editing
# LinkNode attributes: url, target, rel, title
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install @lexical/link package</name>
  <files>frontend/package.json</files>
  <read_first>frontend/package.json</read_first>
  <action>
    Add @lexical/link@^0.42.0 to package.json dependencies.
    Use npm install --save @lexical/link@^0.42.0 in frontend directory.
    Ensure version aligns with existing lexical packages (^0.42.0).
  </action>
  <verify>
    <automated>grep -q '"@lexical/link": "\^0\.42\.0"' frontend/package.json && echo "PASS: @lexical/link installed"</automated>
  </verify>
  <done>@lexical/link@^0.42.0 added to package.json dependencies</done>
</task>

<task type="auto">
  <name>Task 2: Create URL validation utility</name>
  <files>frontend/src/components/Editor/utils/linkUtils.ts</files>
  <read_first>frontend/package.json</read_first>
  <action>
    Create frontend/src/components/Editor/utils/linkUtils.ts with validateUrl function.

    Function signature:
    ```typescript
    interface ValidationResult {
      valid: boolean;
      error?: string;
    }
    function validateUrl(url: string): ValidationResult
    ```

    Validation rules:
    - Reject URLs without protocol (must start with http:// or https://)
    - Reject javascript: URLs (case-insensitive check)
    - Reject data: URLs
    - Reject URLs with leading/trailing whitespace
    - Reject empty strings
    - Accept valid http/https URLs
    - Trim whitespace before validation

    Export both the function and ValidationResult interface.
  </action>
  <verify>
    <automated>grep -q "export function validateUrl" frontend/src/components/Editor/utils/linkUtils.ts && grep -q "ValidationResult" frontend/src/components/Editor/utils/linkUtils.ts && echo "PASS: validateUrl exported"</automated>
  </verify>
  <done>validateUrl function created at linkUtils.ts with proper validation logic</done>
</task>

<task type="auto">
  <name>Task 3: Register LinkNode in LexicalConfig</name>
  <files>frontend/src/components/Editor/LexicalConfig.ts</files>
  <read_first>frontend/src/components/Editor/LexicalConfig.ts</read_first>
  <action>
    Update LexicalConfig.ts to import LinkNode from @lexical/link and add it to the nodes array.

    Change:
    ```typescript
    import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
    import { BlockNode } from './LexicalBlockNode';
    ```

    To:
    ```typescript
    import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
    import { BlockNode } from './LexicalBlockNode';
    import { LinkNode } from '@lexical/link';
    ```

    Change nodes array from [BlockNode] to [BlockNode, LinkNode].

    Also add link theme styling to the theme object:
    ```typescript
    link: 'vibe-text-link',
    ```
  </action>
  <verify>
    <automated>grep -q "LinkNode" frontend/src/components/Editor/LexicalConfig.ts && echo "PASS: LinkNode imported and registered"</automated>
  </verify>
  <done>LinkNode imported and registered in LexicalConfig nodes array</done>
</task>

</tasks>

<verification>
1. Run `npm install` in frontend directory to install @lexical/link
2. Verify package.json contains @lexical/link at correct version
3. Verify linkUtils.ts exists with validateUrl function
4. Verify LexicalConfig.ts imports and registers LinkNode
5. Verify build completes without errors: `npm run build` in frontend
</verification>

<success_criteria>
1. @lexical/link@^0.42.0 is in frontend/package.json dependencies
2. frontend/src/components/Editor/utils/linkUtils.ts exists with validateUrl function
3. LinkNode is imported and registered in LexicalConfig.ts
4. Frontend build succeeds
5. Requirement LINK-04 (URL validation) is addressed - validation utility ready for use in link insertion
</success_criteria>

<output>
After completion, create `.planning/phases/27-linknode-foundation/27-linknode-foundation-SUMMARY.md`
</output>
