# Requirements Document

## Introduction

This feature adds an Artifact Preview Modal to the SorobanCrashLab dashboard. When a user clicks the "preview" action on an artifact in the Artifact Explorer, a modal overlay opens and displays the artifact's metadata and a content preview inline — without navigating away from the dashboard. The modal improves UX by letting users inspect artifacts quickly without downloading them first.

## Glossary

- **Artifact**: A file produced by a fuzzing run, with a type of `seed`, `log`, `trace`, `coverage`, or `bundle`, along with metadata such as name, size, type, run ID, and content hash.
- **ArtifactPreviewModal**: The modal overlay component that renders artifact metadata and a simulated content preview.
- **Dashboard**: The main page of the SorobanCrashLab web application where the Artifact Explorer is displayed.
- **Artifact_Explorer**: The existing table-based component (`add-artifact-explorer.tsx`) that lists artifacts and exposes per-row actions.
- **Preview_Trigger**: The eye-icon button in the Artifact Explorer row actions that opens the modal for a specific artifact.

---

## Requirements

### Requirement 1: Open Artifact Preview Modal

**User Story:** As a dashboard user, I want to click a preview button on an artifact row, so that I can inspect the artifact's details without leaving the dashboard.

#### Acceptance Criteria

1. WHEN the user clicks the Preview_Trigger for an artifact, THE ArtifactPreviewModal SHALL open and display that artifact's details.
2. THE ArtifactPreviewModal SHALL render as a full-screen overlay above all other dashboard content.
3. WHILE the ArtifactPreviewModal is open, THE Dashboard SHALL prevent background content from scrolling.

---

### Requirement 2: Display Artifact Metadata

**User Story:** As a dashboard user, I want to see an artifact's metadata in the modal, so that I can understand what the artifact is without downloading it.

#### Acceptance Criteria

1. THE ArtifactPreviewModal SHALL display the artifact's name, type, size (human-readable), last-updated timestamp, and run ID (when present).
2. WHEN the artifact has a `content_hash` value, THE ArtifactPreviewModal SHALL display the content hash.
3. WHEN the artifact has no `runId`, THE ArtifactPreviewModal SHALL display a placeholder indicating no associated run.

---

### Requirement 3: Display Artifact Content Preview

**User Story:** As a dashboard user, I want to see a simulated content preview of the artifact, so that I can assess its contents at a glance.

#### Acceptance Criteria

1. THE ArtifactPreviewModal SHALL display a content preview section for every artifact type (`seed`, `log`, `trace`, `coverage`, `bundle`).
2. WHEN the artifact type is `log`, THE ArtifactPreviewModal SHALL render the preview in a monospace, scrollable code block.
3. WHEN the artifact type is `trace`, THE ArtifactPreviewModal SHALL render the preview as formatted JSON in a monospace, scrollable code block.
4. WHEN the artifact type is `seed` or `bundle`, THE ArtifactPreviewModal SHALL render a hex-dump style preview in a monospace block.
5. WHEN the artifact type is `coverage`, THE ArtifactPreviewModal SHALL render a summary table or text block describing coverage data.

---

### Requirement 4: Close the Modal

**User Story:** As a dashboard user, I want multiple ways to close the modal, so that I can return to the artifact list efficiently.

#### Acceptance Criteria

1. WHEN the user clicks the close button inside the ArtifactPreviewModal, THE ArtifactPreviewModal SHALL close.
2. WHEN the user presses the Escape key while the ArtifactPreviewModal is open, THE ArtifactPreviewModal SHALL close.
3. WHEN the user clicks the backdrop area outside the modal panel, THE ArtifactPreviewModal SHALL close.
4. WHEN the ArtifactPreviewModal closes, THE Dashboard SHALL restore background scroll behavior.

---

### Requirement 5: Accessibility

**User Story:** As a keyboard or screen-reader user, I want the modal to be accessible, so that I can use it without a mouse.

#### Acceptance Criteria

1. WHEN the ArtifactPreviewModal opens, THE ArtifactPreviewModal SHALL move focus to the modal panel or its close button.
2. WHILE the ArtifactPreviewModal is open, THE ArtifactPreviewModal SHALL trap keyboard focus within the modal panel.
3. THE ArtifactPreviewModal SHALL include an `aria-modal="true"` attribute and a descriptive `aria-label` or `aria-labelledby` referencing the artifact name.
4. THE Preview_Trigger button SHALL include an `aria-label` that identifies the artifact it previews.

---

### Requirement 6: Self-Contained Component File

**User Story:** As a developer, I want the modal implemented in its own file following existing conventions, so that it integrates cleanly with the codebase.

#### Acceptance Criteria

1. THE ArtifactPreviewModal SHALL be implemented in `apps/web/src/app/implement-artifact-preview-modal-component.tsx`.
2. THE ArtifactPreviewModal SHALL export a default React component that accepts an `artifact` prop (of the existing `Artifact` type) and an `onClose` callback prop.
3. THE ArtifactPreviewModal SHALL use only dependencies already present in `apps/web/package.json` (React, Tailwind CSS).
4. THE ArtifactPreviewModal SHALL NOT modify any existing source files.
