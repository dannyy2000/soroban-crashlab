'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Artifact — mirrors the shape in add-artifact-explorer.tsx (redeclared locally to avoid modifying existing files)
export interface Artifact {
  id: string;
  name: string;
  type: 'seed' | 'log' | 'trace' | 'coverage' | 'bundle';
  size: number;       // bytes
  updatedAt: string;  // ISO 8601
  runId?: string;
  content_hash?: string;
}

export interface ArtifactPreviewModalProps {
  artifact: Artifact;
  onClose: () => void;
}

/**
 * formatSize — converts a byte count to a human-readable string.
 * Examples: 512 → "512 B", 2048 → "2.0 KB", 1572864 → "1.5 MB"
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * formatDate — formats an ISO 8601 timestamp using Intl.DateTimeFormat.
 * Falls back to the raw string if parsing fails.
 */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ─── Task 2.1 — generatePreviewContent ───────────────────────────────────────

/**
 * generatePreviewContent — deterministically generates a simulated content
 * preview string for an artifact, derived from the artifact's id.
 */
export function generatePreviewContent(artifact: Artifact): string {
  const idBytes = Array.from(artifact.id).map((c) => c.charCodeAt(0));

  if (artifact.type === 'seed' || artifact.type === 'bundle') {
    // Hex-dump: rows of 16 bytes, address + hex + ascii
    const rows: string[] = [];
    const totalRows = Math.max(4, Math.min(16, idBytes.length));
    for (let row = 0; row < totalRows; row++) {
      const offset = (row * 16).toString(16).padStart(8, '0');
      const hexCols: string[] = [];
      const asciiCols: string[] = [];
      for (let col = 0; col < 16; col++) {
        const byte = idBytes[(row * 16 + col) % idBytes.length];
        hexCols.push(byte.toString(16).padStart(2, '0'));
        asciiCols.push(byte >= 32 && byte < 127 ? String.fromCharCode(byte) : '.');
      }
      rows.push(`${offset}  ${hexCols.slice(0, 8).join(' ')}  ${hexCols.slice(8).join(' ')}  |${asciiCols.join('')}|`);
    }
    return rows.join('\n');
  }

  if (artifact.type === 'log') {
    const lines: string[] = [];
    const levels = ['INFO', 'DEBUG', 'WARN', 'ERROR'];
    const messages = [
      'Fuzzer started',
      'Corpus loaded',
      'Mutation applied',
      'New coverage edge found',
      'Crash detected',
      'Seed saved',
      'Run complete',
      'Artifact written',
    ];
    const baseTs = 1700000000000 + (idBytes[0] ?? 0) * 1000000;
    for (let i = 0; i < 12; i++) {
      const ts = new Date(baseTs + i * 1234 * (idBytes[i % idBytes.length] + 1)).toISOString();
      const level = levels[(idBytes[i % idBytes.length] ?? 0) % levels.length];
      const msg = messages[(idBytes[(i + 1) % idBytes.length] ?? 0) % messages.length];
      lines.push(`${ts} [${level}] ${msg}`);
    }
    return lines.join('\n');
  }

  if (artifact.type === 'trace') {
    const steps = Array.from({ length: 6 }, (_, i) => ({
      step: i + 1,
      fn: `fn_${idBytes[i % idBytes.length].toString(16)}`,
      args: [idBytes[(i + 1) % idBytes.length], idBytes[(i + 2) % idBytes.length]],
      ret: idBytes[(i + 3) % idBytes.length],
      duration_us: (idBytes[(i + 4) % idBytes.length] * 13 + 7),
    }));
    return JSON.stringify({ artifact_id: artifact.id, execution_steps: steps }, null, 2);
  }

  if (artifact.type === 'coverage') {
    const base = idBytes[0] ?? 50;
    const linePct = ((base % 50) + 50).toFixed(1);
    const branchPct = (((idBytes[1] ?? 40) % 40) + 40).toFixed(1);
    const fnPct = (((idBytes[2] ?? 60) % 35) + 60).toFixed(1);
    const totalLines = 200 + (idBytes[3] ?? 0) * 3;
    const coveredLines = Math.floor(totalLines * parseFloat(linePct) / 100);
    return [
      `Coverage Report — ${artifact.name}`,
      `${'─'.repeat(40)}`,
      `Lines     : ${linePct}%  (${coveredLines}/${totalLines})`,
      `Branches  : ${branchPct}%`,
      `Functions : ${fnPct}%`,
      `${'─'.repeat(40)}`,
      `Generated from artifact id: ${artifact.id}`,
    ].join('\n');
  }

  return '';
}

// ─── Task 2.2 — Preview sub-components ───────────────────────────────────────

function SeedPreview({ artifact }: { artifact: Artifact }) {
  return (
    <pre className="font-mono text-xs bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-64">
      {generatePreviewContent(artifact)}
    </pre>
  );
}

function BundlePreview({ artifact }: { artifact: Artifact }) {
  return (
    <pre className="font-mono text-xs bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-64">
      {generatePreviewContent(artifact)}
    </pre>
  );
}

function LogPreview({ artifact }: { artifact: Artifact }) {
  return (
    <pre className="font-mono text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-64">
      {generatePreviewContent(artifact)}
    </pre>
  );
}

function TracePreview({ artifact }: { artifact: Artifact }) {
  return (
    <pre className="font-mono text-xs bg-gray-900 text-yellow-300 p-3 rounded overflow-auto max-h-64">
      {generatePreviewContent(artifact)}
    </pre>
  );
}

function CoveragePreview({ artifact }: { artifact: Artifact }) {
  const lines = generatePreviewContent(artifact).split('\n');
  return (
    <div className="text-sm text-gray-200 space-y-1 bg-gray-800 p-3 rounded">
      {lines.map((line, i) => (
        <div key={i} className="font-mono text-xs whitespace-pre">{line}</div>
      ))}
    </div>
  );
}

// ─── Task 2.3 — ArtifactContentPreview ───────────────────────────────────────

function ArtifactContentPreview({ artifact }: { artifact: Artifact }) {
  switch (artifact.type) {
    case 'seed':
      return <SeedPreview artifact={artifact} />;
    case 'bundle':
      return <BundlePreview artifact={artifact} />;
    case 'log':
      return <LogPreview artifact={artifact} />;
    case 'trace':
      return <TracePreview artifact={artifact} />;
    case 'coverage':
      return <CoveragePreview artifact={artifact} />;
    default:
      return (
        <p className="text-gray-400 text-sm">
          Unsupported artifact type: {(artifact as Artifact).type}
        </p>
      );
  }
}

// ─── Task 3 — ArtifactPreviewModal ───────────────────────────────────────────

/**
 * ArtifactPreviewModal — renders a full-screen overlay with artifact metadata
 * and a type-specific content preview.
 *
 * Usage note for the parent component:
 * The Preview_Trigger button that opens this modal should include an aria-label
 * that identifies the artifact, e.g.:
 *   aria-label={`Preview artifact ${artifact.name}`}
 * This satisfies Requirement 5.4 (accessible trigger button).
 */
function ArtifactPreviewModal({ artifact, onClose }: ArtifactPreviewModalProps) {
  // SSR safety: only mount the portal on the client
  const [mounted, setMounted] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // We store the trigger element as a ref so we can restore focus on close
  const triggerRef = useRef<Element | null>(null);

  // Task 3.1 — Scroll lock
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Task 3.2 — Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Task 3.3 — Focus management
  useEffect(() => {
    triggerRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable: HTMLElement[] = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first: HTMLElement = focusable[0]!;
      const last: HTMLElement = focusable[focusable.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleFocusTrap);
    return () => {
      document.removeEventListener('keydown', handleFocusTrap);
      if (triggerRef.current && 'focus' in triggerRef.current) {
        (triggerRef.current as HTMLElement).focus();
      }
    };
  }, []);

  // SSR mount guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard: null/undefined artifact
  if (!artifact) return null;
  if (!mounted) return null;

  const typeBadgeColors: Record<Artifact['type'], string> = {
    seed: 'bg-blue-700 text-blue-100',
    log: 'bg-gray-600 text-gray-100',
    trace: 'bg-yellow-700 text-yellow-100',
    coverage: 'bg-green-700 text-green-100',
    bundle: 'bg-purple-700 text-purple-100',
  };
  const badgeClass = typeBadgeColors[artifact.type] ?? 'bg-gray-600 text-gray-100';

  const modal = (
    /* Task 3.4 — Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      data-testid="modal-backdrop"
    >
      {/* Task 3.4 — Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="artifact-modal-title"
        className="relative w-full max-w-2xl mx-4 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        data-testid="modal-panel"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close artifact preview"
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="p-5">
          {/* Task 3.5 — Metadata section */}
          <div className="mb-4 pr-8">
            <h2
              id="artifact-modal-title"
              className="text-lg font-semibold text-white truncate mb-2"
            >
              {artifact.name}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs mb-3">
              <span className={`px-2 py-0.5 rounded font-medium ${badgeClass}`}>
                {artifact.type}
              </span>
              <span className="text-gray-400">{formatSize(artifact.size)}</span>
              <span className="text-gray-400">{formatDate(artifact.updatedAt)}</span>
            </div>
            <div className="space-y-1 text-xs text-gray-300">
              {artifact.content_hash && (
                <div>
                  <span className="text-gray-500">Hash: </span>
                  <span className="font-mono">{artifact.content_hash}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Run: </span>
                {artifact.runId ? (
                  <span className="font-mono">{artifact.runId}</span>
                ) : (
                  <span className="text-gray-500 italic">No associated run</span>
                )}
              </div>
            </div>
          </div>

          {/* Content preview */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Preview</p>
            <ArtifactContentPreview artifact={artifact} />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// Task 3.7 — Default export
export default ArtifactPreviewModal;
