# Visual Pattern Summary - DentalTracker Redesign

Extracted from Dashboard.tsx and ToothChart.tsx (approved porcelain visual system)

## Theme Tokens (CSS Variables)

### Colors
```css
--color-porcelain: #f3f5f7;      /* App background */
--color-background: #f3f5f7;
--color-card: #ffffff;           /* Card/surface background */
--color-ink: #1a2330;            /* Primary text */
--color-slate: #5c6b7a;          /* Secondary/muted text */
--color-muted: #5c6b7a;
--color-border: #dce3ea;         /* Borders */
--color-outline-variant: #dce3ea;
--color-primary: #1f8a7a;        /* Primary brand color */
--color-on-primary: #ffffff;
--color-primary-soft: #e4f4f1;   /* Primary tint */
--color-destructive: #c23b3b;    /* Error/warning */
--color-on-destructive: #ffffff;
--color-ring: #1f8a7a;           /* Focus ring */
--color-surface: #f3f5f7;
--color-surface-container-low: #e8eef2; /* Hover state */
--color-on-surface-variant: #5c6b7a;

/* Condition-specific colors */
--color-allergy: #c45c4a; --color-allergy-soft: #f8e6e2;
--color-medication: #c4842a; --color-medication-soft: #f8edd8;
--color-chart-cat: #1f8a7a; --color-chart-soft: #e4f4f1;
--color-document: #5a6e82; --color-document-soft: #e6ebf0;
--color-healthy: #2f8a62; --color-healthy-soft: #e3f4ec;
--color-warning: #c45c4a; --color-warning-soft: #f8e6e2;
--color-filling: #3d7a9a; --color-filling-soft: #dceaf2;
--color-crown: #6b5b95; --color-crown-soft: #ece7f5;
```

### Fonts
```css
--font-heading: "Outfit", ui-sans-serif, system-ui, sans-serif;
--font-body: "Outfit", ui-sans-serif, system-ui, sans-serif;
--font-mono: "IBM Plex Mono", ui-monospace, monospace;
--font-sans: "Outfit", ui-sans-serif, system-ui, sans-serif;
```

### Radii
```css
--radius-sm: 0.5rem;
--radius-default: 0.75rem;
--radius-md: 0.75rem;
--radius-lg: 1rem;
--radius-xl: 1.5rem;
--radius-full: 9999px;
```

### Shadows
```css
--shadow-card: 0 8px 24px rgba(26, 35, 48, 0.06);
```

## Component Patterns

### Card Styling (surface-card)
```css
.surface-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;          /* --radius-lg */
  box-shadow: var(--shadow-card);
}
```

### Typography System

**Headings**
- Main section: `font-heading text-xl font-semibold`
- Subsection: `font-heading text-lg font-semibold`
- Card titles: `text-sm font-semibold`
- ToothChart arch view headers: `text-center text-xs font-medium text-slate`

**Body Text**
- Standard: `text-sm`
- Mono-spaced (dates, codes): `font-mono text-sm`
- Small text: `text-xs` or `font-mono text-xs`

**Secondary/Muted Text**
- `text-slate` (--color-slate: #5c6b7a)
- `text-on-background/60` (60% opacity)
- `text-gray-500` / `text-gray-600` (legacy, to be migrated)

### AppShell Navigation Structure
Used in both screens:
```tsx
<AppShell 
  title="Page Title" 
  subtitle="Optional subtitle" 
  active="current-tab"
>
  {/* Page content */}
</AppShell>
```

Provides:
- Sticky header with title/subtitle
- Bottom navigation tab bar (Home, Chart, Records, Care, You)
- Content area with proper padding (`mx-auto max-w-3xl px-4 pb-28 pt-5`)

### Button Patterns

**Primary Action (Brand Color)**
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  border-radius: 0.75rem;           /* --radius-md */
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-weight: 600;
  padding: 0.85rem 1.25rem;
  border: none;
  cursor: pointer;
  transition: transform 120ms ease, background 120ms ease;
}

/* Hover state */
.btn-primary:hover:not(:disabled) {
  background: #18786a;              /* Darker primary */
}

/* Active state */
.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

/* Disabled state */
.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
```

**Secondary Action (Outline)**
```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;           /* --radius-md */
  background: var(--color-card);
  color: var(--color-ink);
  font-weight: 600;
  padding: 0.85rem 1.25rem;
  border: 1px solid var(--color-border);
  cursor: pointer;
}

/* Hover state */
.btn-secondary:hover {
  background: var(--color-surface-container-low);
}
```

**Icon Buttons (Card-style)**
```css
.surface-card.flex.w-full.items-center.gap-4.p-4.text-left
```
Structure:
- Icon container: `rounded-2xl p-2 [condition]-soft [condition]-text`
  - Size: `h-12 w-12` or `h-5 w-5` (for smaller)
  - Icon: `h-5 w-5`
- Text content:
  - Heading: `block font-heading text-lg font-semibold` or `text-sm font-semibold`
  - Body: `text-sm text-slate`

### Layout & Spacing Conventions

**Container Width**
- `mx-auto max-w-3xl px-4` (AppShell content area)
- `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` (full-width sections)

**Vertical Spacing**
- `space-y-4` (standard)
- `space-y-5` (Dashboard main)
- `space-y-6` (ToothChart detail view)

**Grid Layouts**
- 2-column: `grid grid-cols-2 gap-3` (Dashboard tiles)
- 8-column: `grid grid-cols-8 gap-1.5` (ToothChart arch view)
- Tiles: `flex min-h-[140px] flex-col items-start justify-between p-4 text-left`

**Padding**
- Cards: `p-4` (standard), `p-6` (larger cards)
- Sections: `px-4 py-3`, `px-6 py-3`
- Internal spacing: `space-x-3`, `space-x-4`, `space-y-2`, `space-y-4`

**Gap Utilities**
- `gap-4` (standard)
- `gap-3` (compact)
- `gap-1.5` (tight, for tooth grids)
- `gap-6` (sections)

### Interactive States

**Focus Rings**
- `focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2`
- Uses `--color-ring: #1f8a7a`

**Hover States**
- Cards/buttons: `hover:bg-opacity-80` or `hover:bg-[color]/[percentage]`
- Secondary buttons: `hover:bg-[color]-soft`

**Disabled States**
- `opacity-50 cursor-not-allowed` pattern
- Or explicit `:disabled` styling in CSS

### Special Components

**Field Input (from ../components/ui)**
```css
.field-input {
  display: block;
  width: 100%;
  border-radius: 0.75rem;              /* --radius-md */
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-ink);
  padding: 0.75rem 0.875rem;
  font-size: 1rem;
}

/* Placeholder */
.field-input::placeholder {
  color: #7a8a99;
}
```

**Error Banner (from ../components/ui)**
- Used as `<ErrorBanner>{error}</ErrorBanner>`
- Inherits styling from toast/error implementations

**Spinner (from ../components/ui)**
- Used as `<Spinner />` for loading states