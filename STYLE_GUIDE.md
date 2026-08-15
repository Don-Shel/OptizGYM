# OptizGYM UI Style Guide

## Modal Centering Standard

All modal dialogs in this project **MUST** be centered both horizontally and vertically on the viewport using the following CSS pattern:

### Required Centering Pattern

```css
/* Overlay (backdrop) - full viewport coverage */
.fixed.inset-0.z-40.bg-black/60

/* Modal container - exact centering */
.fixed.left-1/2.top-1/2.-translate-x-1/2.-translate-y-1/2.z-50
```

### Equivalent Tailwind Classes

```html
<!-- Backdrop overlay -->
<div className="fixed inset-0 z-40 bg-black/60" />

<!-- Centered modal panel - NO w-full! -->
<div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 ...">
```

### Key Centering Principles

1. **Always use `position: fixed`** — Modals must remain centered even when the page scrolls
2. **`left: 50%` + `translateX(-50%)`** — Precise horizontal centering
3. **`top: 50%` + `translateY(-50%)`** — Precise vertical centering
4. **Use `-translate-x-1/2 -translate-y-1/2`** — Tailwind's half-unit translation for sub-pixel accuracy
5. **Z-index layering**:
   - Backdrop: `z-40`
   - Modal: `z-50`
   - Ensure modal z-index is ALWAYS higher than backdrop

### Size Variants

```css
/* Small modal */
.max-w-sm  /* 384px */

/* Medium modal (default) */
.max-w-md  /* 448px */

/* Large modal */
.max-w-lg  /* 512px */

/* Extra large */
.max-w-xl  /* 576px */
```

### Height & Overflow

```css
/* Constrain height to viewport */
max-h-[90vh]

/* Enable scrolling when content overflows */
overflow-y-auto
```

### Example Structure

```tsx
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60"
      />

      {/* Centered Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                   w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto
                   rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute right-4 top-4">
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Anti-Patterns (AVOID)

```tsx
// ❌ WRONG - w-full on the centered element causes full-width centering
// The element fills the viewport width BEFORE centering, making it off-center
className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full"

// ❌ WRONG - absolute positioning
className="absolute left-1/2 top-1/2"

// ❌ WRONG - margin auto without translate
className="fixed left-0 right-0 mx-auto"

// ❌ WRONG - flexbox centering on outer element (causes layout issues)
className="flex items-center justify-center"

// ❌ WRONG - incorrect z-index ordering
className="... z-30"  // backdrop below modal
```

## Correct Pattern

```tsx
// ✅ CORRECT - Centered element naturally sizes to content
className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-md"

// ✅ CORRECT - Inner card div handles viewport margins
className="... rounded-2xl border border-border bg-card p-6 mr-4 ml-4"
```

## Reusable Modal Component

A reusable `Modal` component is available at `@/components/ui/modal`:

```tsx
import { Modal } from "@/components/ui/modal";

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  size="md"
>
  <h2>Modal Title</h2>
  <p>Modal content here</p>
</Modal>
```

### Modal Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | required | Controls modal visibility |
| `onClose` | `() => void` | required | Callback to close modal |
| `children` | `ReactNode` | required | Modal content |
| `className` | `string` | — | Additional CSS classes |
| `showCloseButton` | `boolean` | `true` | Show X close button |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `"md"` | Modal width variant |

## ConfirmModal Component

For confirmation dialogs, use `ConfirmModal`:

```tsx
import { ConfirmModal } from "@/components/ui/modal";

<ConfirmModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  title="Delete item?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
/>
```

## Drawer vs Modal

- **Centered Modal**: Use for forms, confirmations, focused interactions
- **Side Drawer**: Use for detail panels, member profiles, editing large datasets
  - Example: `fixed right-0 top-0 h-full w-80` (right slide-out panel)

## Browser Compatibility

The centering pattern (`left-1/2 top-1/2 translate-x-1/2 -translate-y-1/2`) is supported in:
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

The `backdrop-blur` class requires:
- Chrome/Edge 99+
- Firefox 103+
- Safari 15.4+

For older browser support, consider using a solid background color instead of `backdrop-blur-sm`.
