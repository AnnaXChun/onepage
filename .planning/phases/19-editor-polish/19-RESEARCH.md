# Phase 19: Editor Polish - Research

**Researched:** 2026-03-22
**Domain:** React drag-and-drop editor UX, Recharts chart theming, white theme consistency
**Confidence:** HIGH

## Summary

Phase 19 refines the editor experience and ensures analytics dashboard matches the white theme established in Phase 18. The key areas needing work are: (1) block handles visibility and drag animations using dnd-kit, (2) config panel styling to match the white theme with blue-black accents, (3) editor toolbar consistency, and (4) analytics chart colors to harmonize with the white theme instead of the current purple-toned chart styling.

**Primary recommendation:** Apply consistent blue-black (#2563eb primary, #1e3a5f accent) across all editor UI elements, implement proper dnd-kit drag overlays with smooth easing transitions, and update Recharts colors to use the project's blue accent palette.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UIP-03 | Editor UX improvements (handles, config panel, animations) | dnd-kit overlay patterns, CSS transition refinements |
| UIP-06 | Analytics dashboard matches new white theme | Recharts color customization, chart styling updates |

## Standard Stack

### Core (No Changes)
| Library | Version | Purpose |
|---------|---------|---------|
| @dnd-kit/core | existing | Drag-and-drop core |
| @dnd-kit/sortable | existing | Sortable block list |
| @dnd-kit/utilities | existing | CSS transform utilities |
| recharts | ^3.8.0 | Charting library |

### No New Dependencies Required
All improvements use existing libraries with configuration changes.

## Architecture Patterns

### Project Structure
```
frontend/src/
├── components/
│   ├── Editor/
│   │   ├── DragHandle.tsx        # Needs visibility/animation polish
│   │   ├── SortableBlock.tsx     # Needs smooth drag transitions
│   │   ├── BlockConfigPanel.tsx  # Needs white theme styling
│   │   └── EditorToolbar.tsx     # Needs blue-black accent consistency
│   └── charts/
│       ├── ChartCard.tsx         # Needs border/styling consistency
│       ├── LineChart.tsx         # Needs color palette update
│       └── PieChart.tsx          # Needs color palette update
├── pages/
│   └── Analytics/
│       └── AnalyticsDashboard.tsx # Needs white theme chart integration
└── styles/
    └── global.css                # Add drag-related utility classes
```

### Pattern 1: dnd-kit Drag Overlay for Smooth Animations
**Current Issue:** Dragging uses opacity fade (0.5) with no smooth transition on drag start/end.

**Recommendation:** Use dnd-kit's `DragOverlay` component with proper transform animations:

```tsx
// Using DragOverlay pattern from @dnd-kit/core
// DragOverlay renders a clone of the dragging item with smooth transitions
// The dragging item itself has isDragging=true with reduced opacity
// The overlay has full opacity with transform animations
```

### Pattern 2: White Theme Chart Colors
**Current Issue:** LineChart uses `oklch(70% 0.14 50)` which is a purple tone. PieChart uses coral, purple, green, cool blue, neutral - none matching the blue-black theme.

**Recommendation:** Update chart colors to use primary blue and accent navy:
- Primary: `#2563eb` (blue)
- Accent: `#1e3a5f` (navy)
- Secondary: `#3b82f6` (light blue)
- Muted: `#64748b` (slate)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag animations | Custom drag implementation | dnd-kit DragOverlay + CSS transitions | dnd-kit handles touch-action, keyboard nav, and accessibility |
| Chart tooltips | Custom tooltip divs | Recharts CustomTooltip component | Built-in positioning, mouse tracking, content propagation |
| Color palette | Scattered hex values | CSS variables from global.css | Consistency, easy theming, single source of truth |

## Common Pitfalls

### Pitfall 1: Drag Handle Visibility
**What goes wrong:** Block handles are only visible on hover (`opacity-0 group-hover:opacity-100`), making it unclear to users that blocks are draggable.

**Why it happens:** The group-hover pattern hides handles by default.

**How to avoid:** Show handles more prominently when block is selected, or always show a subtle indicator. Use primary color highlight when selected.

**Warning signs:** Users don't realize blocks can be dragged; dragging feels discoverable only by accident.

### Pitfall 2: dnd-kit Transition Duration
**What goes wrong:** Dragging feels abrupt with no smooth animation when items reorder.

**Why it happens:** The `transition` from useSortable only handles the transform during drag, not the item that swaps places.

**How to avoid:** Apply proper CSS transitions to the sortable container. Use `transition: transform 200ms var(--ease-out-quart)` in the style prop.

### Pitfall 3: Chart Colors Clash with White Theme
**What goes wrong:** Charts use purple/coral/green that don't feel premium with the clean white theme.

**Why it happens:** Colors were chosen for dark-mode contrast; light theme needs different palette.

**How to avoid:** Use primary blue and accent navy for charts; create a dedicated `chartColors` palette in global.css.

## Code Examples

### Recommended: DragHandle with Selection State
```tsx
// DragHandle.tsx - enhanced with selection state
export default function DragHandle({ isSelected }: { isSelected?: boolean }) {
  return (
    <div
      className={`
        cursor-grab active:cursor-grabbing p-1 transition-all duration-200
        ${isSelected
          ? 'text-primary bg-primary/10 rounded'
          : 'text-text-muted hover:text-primary hover:bg-primary/5 rounded'
        }
      `}
      style={{ touchAction: 'none' } as CSSProperties}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="15" cy="18" r="1.5" />
      </svg>
    </div>
  );
}
```

### Recommended: SortableBlock with Smooth Transitions
```tsx
// SortableBlock.tsx - smooth drag transitions
const style = {
  transform: CSS.Transform.toString(transform),
  transition: isDragging ? 'transform 200ms var(--ease-out-quart)' : 'transform 200ms var(--ease-out-quart)',
  opacity: isDragging ? 0.4 : 1,
  zIndex: isDragging ? 50 : 1,
};

// Add to container div
className={`relative group mb-4 transition-shadow duration-200
  ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
  ${isDragging ? 'shadow-xl scale-[1.02]' : 'hover:shadow-md'}
`}
```

### Recommended: Chart Color Constants
```tsx
// global.css additions
:root {
  /* Chart colors - blue-black palette */
  --chart-primary: #2563eb;
  --chart-accent: #1e3a5f;
  --chart-secondary: #3b82f6;
  --chart-muted: #64748b;
  --chart-grid: oklch(30% 0.01 260);  /* dark for contrast on white */
}

// PieChart.tsx - update COLORS
const COLORS = {
  Direct: '#1e3a5f',           // accent navy
  'Search Engine': '#2563eb',  // primary blue
  Social: '#3b82f6',           // light blue
  Referral: '#64748b',         // slate
  Other: '#94a3b8',            // muted
};
```

### Recommended: BlockConfigPanel Styling
```tsx
// BlockConfigPanel.tsx - white theme styling
// Current: w-72 border-l border-border p-4 bg-surface
// Recommended: Add subtle shadow, refine border color
<div className="w-80 border-l border-border-l bg-surface-elevated shadow-sm overflow-y-auto">
```

### Recommended: EditorToolbar Blue-Black Accents
```tsx
// EditorToolbar.tsx - current has oklch(55%_0_0) which is gray
// SEO button should use primary blue instead
<button
  onClick={onSeoClick}
  className="p-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
  title="SEO Settings"
>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Purple-toned charts | Blue-black chart palette | Phase 19 | Better white theme integration |
| Hover-only drag handles | Handles visible when selected | Phase 19 | Improved discoverability |
| Abrupt drag transitions | Smooth ease-out-quart transitions | Phase 19 | Premium feel |

**Deprecated/outdated:**
- `oklch(70% 0.14 50)` chart accent color: Purple tone clashes with white theme

## Open Questions

1. **DragOverlay implementation scope**
   - What we know: dnd-kit provides DragOverlay for smooth drag visuals
   - What's unclear: Whether full DragOverlay implementation is needed or just CSS improvements
   - Recommendation: Start with CSS transitions; implement DragOverlay if smoothness isn't sufficient

2. **Block selection UX**
   - What we know: Clicking selects, shows ring, reveals delete button
   - What's unclear: Should selection also expand the config panel automatically?
   - Recommendation: Keep manual config panel open/close; don't auto-expand on selection

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (manual verification) |
| Config file | N/A |
| Quick run command | `cd frontend && npm run dev` |
| Full suite command | N/A |

### Phase Requirements Map
| Req ID | Behavior | Test Type | Verification |
|--------|----------|-----------|-------------|
| UIP-03 | Block handles visible when selected | Manual | Visual check: drag handles appear with primary color highlight |
| UIP-03 | Config panel styled for white theme | Manual | Visual check: panel uses bg-surface-elevated, subtle borders |
| UIP-03 | Drag animations smooth | Manual | Drag blocks to reorder - should animate with ease-out-quart |
| UIP-06 | Charts use blue-black palette | Manual | Visual check: LineChart and PieChart use primary/accent colors |
| UIP-06 | Analytics dashboard matches white theme | Manual | Visual check: StatCards, ChartCard borders use theme colors |

### Wave 0 Gaps
None - all improvements are CSS/configuration changes to existing components.

## Sources

### Primary (HIGH confidence)
- @dnd-kit/core documentation - DragOverlay patterns
- Recharts customization guide - color and tooltip configuration
- Project global.css - existing CSS variable definitions

### Secondary (MEDIUM confidence)
- Frontend design skill interaction-design.md - focus states, hover patterns
- Frontend design skill motion-design.md - easing curves, animation principles

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using existing libraries, no new dependencies
- Architecture: HIGH - straightforward CSS/styling changes
- Pitfalls: HIGH - well-understood dnd-kit patterns

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days for stable styling patterns)
