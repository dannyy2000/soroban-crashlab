# Implementation Plan: Artifact Preview Modal

## Overview

Implement a self-contained `ArtifactPreviewModal` React component in a single new file using React 19 and Tailwind CSS v4. The component renders a full-screen overlay with artifact metadata and type-specific content previews. Property-based tests use fast-check with Jest.

## Tasks

- [x] 1. Scaffold the component file with types and utilities
  - Create `apps/web/src/app/implement-artifact-preview-modal-component.tsx`
  - Declare the local `Artifact` interface (mirrors `add-artifact-explorer.tsx` shape: id, name, type, size, updatedAt, runId?, content_hash?)
  - Declare `ArtifactPreviewModalProps` interface (artifact, onClose)
  - Implement `formatSize(bytes: number): string` utility (B / KB / MB)
  - Implement `formatDate(iso: string): string` utility using `Intl.DateTimeFormat`
  - _Requirements: 6.1, 6.2, 6.3, 2.1_

- [x] 2. Implement content preview generators and sub-components
  - [x] 2.1 Implement `generatePreviewContent(artifact: Artifact): string` — deterministic, switches on type
    - `seed` / `bundle`: hex-dump rows derived from artifact id bytes
    - `log`: multi-line log text with timestamps
    - `trace`: JSON object with execution steps (formatted with `JSON.stringify(..., null, 2)`)
    - `coverage`: text block with line/branch/function coverage percentages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.2 Implement the five preview sub-components inline
    - `SeedPreview` / `BundlePreview`: `<pre>` monospace block with hex content
    - `LogPreview`: scrollable `<pre>` monospace code block
    - `TracePreview`: scrollable `<pre>` monospace code block with formatted JSON
    - `CoveragePreview`: summary text/table block
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.3 Implement `ArtifactContentPreview` internal component
    - Switch on `artifact.type`, render the matching sub-component
    - Render a generic "unsupported type" message for unknown types
    - _Requirements: 3.1_

- [x] 3. Implement the main `ArtifactPreviewModal` component
  - [x] 3.1 Implement scroll lock via `useEffect`
    - On mount: set `document.body.style.overflow = 'hidden'`
    - On unmount (cleanup): restore original overflow value
    - _Requirements: 1.3, 4.4_

  - [x] 3.2 Implement Escape key listener via `useEffect`
    - Add `keydown` listener on `document`; call `onClose` when `key === 'Escape'`
    - Remove listener on unmount
    - _Requirements: 4.2_

  - [x] 3.3 Implement focus management via `useEffect` and panel ref
    - On mount: move focus to the close button (or panel)
    - Trap Tab / Shift+Tab within focusable elements inside the panel
    - On unmount: return focus to the element that triggered the modal
    - _Requirements: 5.1, 5.2_

  - [x] 3.4 Render backdrop and panel via React Portal into `document.body`
    - Backdrop: fixed full-screen `div`; click → `onClose`
    - Panel: centered with flexbox; click propagation stopped so backdrop click doesn't fire
    - Guard: only mount portal client-side (SSR safety)
    - _Requirements: 1.2, 4.1, 4.3_

  - [x] 3.5 Render metadata section inside the panel
    - Display name, type badge, human-readable size, formatted timestamp
    - Display `content_hash` when present; omit section when absent
    - Display `runId` when present; show "No associated run" placeholder when absent
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.6 Wire accessibility attributes
    - Panel: `aria-modal="true"`, `aria-labelledby` referencing the artifact name heading id
    - Close button: descriptive `aria-label`
    - Preview_Trigger button (in parent): `aria-label` identifying the artifact — document the expected prop contract in a JSDoc comment
    - _Requirements: 5.3, 5.4_

  - [x] 3.7 Export `ArtifactPreviewModal` as the default export
    - _Requirements: 6.2_

- [x] 4. Checkpoint — verify the component compiles cleanly
  - Ensure all TypeScript types resolve, no missing imports, no lint errors.
  - Ask the user if any questions arise before proceeding to tests.

- [x] 5. Write property-based tests using fast-check
  - Create `apps/web/src/app/implement-artifact-preview-modal-component.test.tsx`
  - Install fast-check as a dev dependency: `npm install --save-dev fast-check` (in `apps/web`)
  - Each `fc.assert` run must use at least 100 iterations (`{ numRuns: 100 }`)
  - Tag format per test: `// Feature: artifact-preview-modal, Property <N>: <property_text>`

  - [x]* 5.1 Property 1 — Metadata completeness
    - Generate random artifacts; render modal; assert name, type label, human-readable size, and formatted date are present in the panel
    - **Property 1: Metadata completeness**
    - **Validates: Requirements 2.1**

  - [x]* 5.2 Property 2 — Content hash conditional display
    - Generate artifacts with and without `content_hash`; assert hash shown when present, absent when not
    - **Property 2: Content hash conditional display**
    - **Validates: Requirements 2.2**

  - [x]* 5.3 Property 3 — Run ID conditional display
    - Generate artifacts with and without `runId`; assert runId shown or placeholder shown
    - **Property 3: Run ID conditional display**
    - **Validates: Requirements 2.3**

  - [x]* 5.4 Property 4 — Content preview present for all types
    - Generate artifacts of each valid type; assert preview section is non-empty
    - **Property 4: Content preview present for all types**
    - **Validates: Requirements 3.1**

  - [x]* 5.5 Property 5 — Log and trace use monospace code block
    - Generate `log` and `trace` artifacts; assert rendered preview element is `<pre>` or `<code>`
    - **Property 5: Log and trace use monospace code block**
    - **Validates: Requirements 3.2, 3.3**

  - [x]* 5.6 Property 6 — Seed and bundle use hex-dump preview
    - Generate `seed` and `bundle` artifacts; assert preview content contains hex characters `[0-9a-f]` in groups
    - **Property 6: Seed and bundle use hex-dump preview**
    - **Validates: Requirements 3.4**

  - [x]* 5.7 Property 7 — Scroll lock round-trip
    - Render modal; assert `document.body.style.overflow === 'hidden'`; unmount; assert overflow restored
    - **Property 7: Scroll lock round-trip**
    - **Validates: Requirements 1.3, 4.4**

  - [x]* 5.8 Property 8 — Escape key closes modal
    - Render modal; dispatch `keydown` with `key === 'Escape'`; assert `onClose` called exactly once
    - **Property 8: Escape key closes modal**
    - **Validates: Requirements 4.2**

  - [x]* 5.9 Property 9 — Backdrop click closes modal
    - Render modal; click backdrop element (not panel); assert `onClose` called exactly once
    - **Property 9: Backdrop click closes modal**
    - **Validates: Requirements 4.3**

  - [x]* 5.10 Property 10 — aria-modal and aria-labelledby present
    - Generate random artifacts; render modal; assert `aria-modal="true"` and `aria-labelledby` reference an element containing the artifact name
    - **Property 10: aria-modal and aria-labelledby present**
    - **Validates: Requirements 5.3**

  - [x]* 5.11 Property 11 — formatSize unit correctness
    - Generate random non-negative integers; assert `formatSize` returns a non-empty string containing a numeric value and one of `B`, `KB`, `MB`
    - **Property 11: formatSize unit correctness**
    - **Validates: Requirements 2.1**

- [x] 6. Final checkpoint — ensure all tests pass
  - Run `npx jest --testPathPattern=implement-artifact-preview-modal --run` from `apps/web`
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All implementation lives in one new file; no existing files are modified (Requirement 6.4)
- fast-check must be added as a dev dependency before running property tests
- The `Artifact` type is redeclared locally — do not import from `add-artifact-explorer.tsx`
- Property tests reference the design document property numbers for traceability
