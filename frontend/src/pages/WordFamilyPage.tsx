// frontend/src/pages/WordFamilyPage.tsx
//
// Drop-in replacement for the standalone WordFamilyValidator artifact.
// The "Save all valid blocks" button now calls POST /word-families/batch
// via the vocabulary-service Lambda.
//
import { useState, useCallback } from 'react';

import { BatchSaveFamiliesInput } from '@vocmap/shared';

import { useBatchSaveFamilies } from '@/services/word-family.service';

// ─── (All your existing types, constants, helpers, TypeBadge, BlockCard,
//      UnknownTypesPanel stay exactly as they are — no changes needed there.)
//
//     Only the section below is new: the batch-save bar that appears after
//     analysis and the hook wiring in the main component.
// ─────────────────────────────────────────────────────────────────────────────

// Paste your existing WordEntry / JSONBlock / VALID_TYPES / etc. here.
// The snippet below shows only the parts that change.

// ─── BatchSaveBar ─────────────────────────────────────────────────────────────

interface BatchSaveBarProps {
  validBlocks: JSONBlock[];           // all valid blocks from the current analysis
  onSaved: (savedIds: Set<number>) => void;
}

function BatchSaveBar({ validBlocks, onSaved }: BatchSaveBarProps) {
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const saveBatch = useBatchSaveFamilies();

  if (validBlocks.length === 0) return null;

  async function handleSave() {
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

    const payload: BatchSaveFamiliesInput = {
      families: validBlocks
        .filter(b => b.parsed)
        .map(b => ({
          title: b.label,
          words: b.parsed!.map(w => ({
            word: w.word,
            type: w.type,
            typeCode: typeof w.typeCode === 'number' ? w.typeCode : undefined,
            mean: w.mean,
          })),
          tags: tagList,
          notes,
        })),
    };

    try {
      const result = await saveBatch.mutateAsync(payload);
      // Mark every valid block as saved so their individual badges update
      onSaved(new Set(validBlocks.map(b => b.index)));
      setShowForm(false);
    } catch (err) {
      // Error is surfaced via saveBatch.isError below
    }
  }

  const borderColor = saveBatch.isSuccess ? '#9FE1CB'
    : saveBatch.isError ? '#F5C4B3'
    : '#B5D4F4';

  const bgColor = saveBatch.isSuccess ? '#F4FCF8'
    : saveBatch.isError ? '#FDF5F3'
    : '#EEF5FD';

  return (
    <div
      style={{
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10,
        padding: '12px 16px',
        background: bgColor,
        marginTop: 16,
      }}
    >
      {/* Summary row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
              color: '#185FA5',
            }}
          >
            {validBlocks.length} valid block{validBlocks.length > 1 ? 's' : ''} ready
          </span>
          <span style={{ fontSize: 11, color: '#888' }}>
            {validBlocks.reduce((n, b) => n + (b.parsed?.length ?? 0), 0)} total word forms
          </span>
        </div>

        {saveBatch.isSuccess ? (
          <span
            style={{
              fontSize: 12,
              padding: '4px 14px',
              borderRadius: 999,
              background: '#E1F5EE',
              color: '#0F6E56',
              fontWeight: 700,
            }}
          >
            ✓ Saved to DynamoDB
          </span>
        ) : (
          <button
            onClick={() => setShowForm(v => !v)}
            disabled={saveBatch.isPending}
            style={{
              fontSize: 12,
              padding: '6px 18px',
              borderRadius: 8,
              background: saveBatch.isPending ? '#ccc' : '#185FA5',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: saveBatch.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {saveBatch.isPending
              ? 'Saving…'
              : showForm
              ? '✕ Cancel'
              : '→ Save all to DynamoDB'}
          </button>
        )}
      </div>

      {/* Error banner */}
      {saveBatch.isError && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: '#993C1D',
            background: '#FAECE7',
            padding: '6px 12px',
            borderRadius: 6,
            fontFamily: 'monospace',
          }}
        >
          ✗ {(saveBatch.error as Error)?.message ?? 'Save failed'}
        </div>
      )}

      {/* Optional metadata form */}
      {showForm && !saveBatch.isSuccess && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            borderTop: '1px solid #d5e8f8',
            paddingTop: 14,
          }}
        >
          <p style={{ fontSize: 11, color: '#5a7a9c', margin: 0 }}>
            These tags and notes will be applied to <strong>all {validBlocks.length} families</strong> in this batch.
            You can edit individual entries later.
          </p>

          <div>
            <label
              style={{
                fontSize: 11,
                color: '#5a7a9c',
                display: 'block',
                marginBottom: 4,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Tags{' '}
              <span style={{ color: '#aaa', textTransform: 'none', fontWeight: 400 }}>
                comma-separated, optional
              </span>
            </label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="B2, irregular, phrasal, chapter-5, …"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '7px 10px',
                border: '1.5px solid #c9dff5',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                outline: 'none',
                background: '#fff',
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 11,
                color: '#5a7a9c',
                display: 'block',
                marginBottom: 4,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Notes{' '}
              <span style={{ color: '#aaa', textTransform: 'none', fontWeight: 400 }}>
                optional
              </span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Source, context, curriculum chapter…"
              rows={2}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '7px 10px',
                border: '1.5px solid #c9dff5',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                outline: 'none',
                resize: 'vertical',
                background: '#fff',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSave}
              disabled={saveBatch.isPending}
              style={{
                fontSize: 13,
                padding: '8px 24px',
                borderRadius: 8,
                background: saveBatch.isPending ? '#ccc' : '#185FA5',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                cursor: saveBatch.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {saveBatch.isPending
                ? `Saving ${validBlocks.length} famil${validBlocks.length > 1 ? 'ies' : 'y'}…`
                : `Save ${validBlocks.length} famil${validBlocks.length > 1 ? 'ies' : 'y'} to DynamoDB`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component — only the changed parts shown ────────────────────────────
//
// In your existing WordFamilyValidator, make two small changes:
//
// 1. Add savedBlockIndices state:
//
//    const [savedBlockIndices, setSavedBlockIndices] = useState<Set<number>>(new Set());
//
//    Reset it whenever the user clicks Analyze or Clear:
//    setSavedBlockIndices(new Set());
//
// 2. After the filter bar and block list, render <BatchSaveBar>:
//
//    <BatchSaveBar
//      validBlocks={blocks.filter(b => b.isValid)}
//      onSaved={setSavedBlockIndices}
//    />
//
// 3. Pass isSaved to each BlockCard:
//
//    <BlockCard
//      key={block.index}
//      block={block}
//      isSaved={savedBlockIndices.has(block.index)}
//    />
//
// That's it — the rest of your component is unchanged.
export { BatchSaveBar };
