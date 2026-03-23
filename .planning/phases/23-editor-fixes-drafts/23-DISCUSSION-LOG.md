# Phase 23: Editor Fixes & Drafts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 23-editor-fixes-drafts
**Areas discussed:** New Session Behavior, Draft Storage Model, Draft UI Location, Auto-save Strategy

---

## New Session Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Resume saved edits | Load the blog's last saved blocks — user continues from where they left off | ✓ |
| Start fresh from template | Load template defaults — discard previous edits |  |
| Ask user each time | Show a prompt: 'Resume editing or start fresh?' |  |

**User's choice:** Resume saved edits
**Notes:** When opening an existing blog, load from saved blocks, not localStorage or template

---

## Draft Storage Model

| Option | Description | Selected |
|--------|-------------|----------|
| Status field on blogs table | Add status='draft'/'published' column — simple, keeps all blog data together | ✓ |
| Separate drafts table | Create a separate drafts table — more complex but cleaner separation |  |
| Use html_content as indicator | If html_content is null it's a draft — minimal schema change but implicit/dangerous |  |

**User's choice:** Status field on blogs table
**Notes:** Simple approach, add status column to blogs table

---

## Draft UI Location

| Option | Description | Selected |
|--------|-------------|----------|
| Separate Drafts section | Distinct section with header 'My Drafts' — clearly separated from published sites | ✓ |
| Badge on cards | Show 'Draft' badge on blog cards — mixed with published, compact view |  |
| Tabs | Published/Drafts tabs — user switches between views |  |

**User's choice:** Separate Drafts section
**Notes:** Clear visual separation on profile page

---

## Auto-save Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Continuous | Save to backend on changes with debounce (500ms) — always have latest | ✓ |
| On navigate away | Only save when user clicks Done or closes tab — simpler but risk of lost work |  |
| Manual save button | No auto-save — explicit 'Save Draft' button |  |

**User's choice:** Continuous
**Notes:** Keep current auto-save behavior but fix connection to correct blog data

---

## Done Button Behavior

**Added during discussion:** Done button must ensure blocks are saved to backend before navigating away.

**User's choice:** Continuous auto-save handles this, but Done button should wait for pending save

---

*Phase: 23-editor-fixes-drafts*
*Discussion completed: 2026-03-23*
