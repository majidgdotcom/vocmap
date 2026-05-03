import React, { useState, useCallback } from 'react';

import { TopBar } from '@/components/layout/TopBar';
import {
  useBatchSaveFamilies,
  useInfiniteWordFamilies,
  useDeleteWordFamily,
  useSaveFamilyToVocab,
  WordFamilyEntity,
  SaveWordFamilyInput,
} from '@/services/word-family.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WordEntry {
  word: string;
  type: string;
  typeCode?: number | string;
  mean: string;
}

interface JSONBlock {
  index: number;
  raw: string;
  charPos: number;
  parsed: WordEntry[] | null;
  errors: string[];
  warnings: string[];
  isValid: boolean;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_TYPES: string[] = [
  'noun', 'verb', 'adjective', 'adverb', 'conjunction', 'preposition', 'pronoun', 'interjection',
  'Noun', 'Verb', 'Adjective', 'Adverb', 'Conjunction', 'Preposition', 'Pronoun',
  'noun (plural)', 'noun (plural, informal use)', 'noun (plural, rare)', 'noun (plural, informal)',
  'noun (plural form)', 'noun (linguistics)', 'noun (law, rare)', 'noun (person)', 'noun (informal)',
  'noun (slang)', 'noun (US)', 'noun (British English)', 'noun phrase', 'Noun Phrase',
  'noun/verb', 'Noun/Verb', 'noun/adjective', 'noun / adjective', 'noun / present participle',
  'noun (plural) / verb (third person singular)', 'noun / verb (gerund)', 'Noun (plural)', 'Noun (Plural)',
  'verb (present participle)', 'Verb (Present Participle)', 'Verb (present participle)',
  'verb (past participle)', 'verb (past tense)', 'Verb (Past)', 'Verb (Past Tense)',
  'verb (past tense / past participle)', 'verb (past tense / past participle / adjective)',
  'verb (past participle / past tense)', 'verb (past participle / past tense / adjective)',
  'verb (past participle / adjective)', 'verb (past participle) / adjective',
  'verb (third person singular)', 'Verb (third person singular)',
  'verb (present participle / gerund)', 'Verb (Gerund)', 'Verb (Present Continuous)',
  'verb (present participle) / noun', 'verb (present participle) / preposition',
  'verb (present participle) / adjective', 'verb (past tense / past participle of stick)',
  'verb (related by root)', 'verb / noun', 'verb phrase', 'Verb (Continuous)', 'verb/adjective',
  'verb (past tense)', 'verb (Gerund)',
  'adjective (comparative)', 'adjective (superlative)', 'adjective (archaic)',
  'adjective (related by root)', 'adjective (British English)', 'adjective (informal)',
  'adjective / noun', 'Adjective/Noun', 'adjective / verb (present participle)',
  'adjective/verb (past participle)', 'adjective / present participle', 'adjective phrase',
  'Adjective/Adverb', 'adjective/verb', 'Adjective (past participle)',
  'adverb (archaic)', 'adverb (rare)', 'adverb (rare / nonstandard)', 'adverb (music)',
  'adverb (informal / poetic)', 'adverb (informal / technical)', 'adverbial phrase',
  'phrasal verb', 'Phrasal Verb', 'phrasal verb (past tense)', 'phrasal verb (present participle)',
  'phrasal verb (third person singular)', 'phrasal verb (past tense / past participle)',
  'phrasal verb (past participle)', 'phrasal verb (present participle / gerund)',
  'prepositional phrase', 'preposition (British English)', 'noun / adjective',
  'proper noun / software', 'noun/verb (plural / third person)',
  'verb (third person singular / noun plural)', 'Verb (past tense)',
  'combining form', 'prefix', 'Prefix', 'idiom', 'phrase', 'Phrase',
  'Noun/Verb', 'Adjective/Noun', 'Verb (Gerund)', 'undefined',
];

const TYPE_CODE_MAP: Record<string, number> = {
  noun: 1, verb: 2, adjective: 3, adverb: 4,
  conjunction: 5, preposition: 6, pronoun: 7, interjection: 8,
  Noun: 1, Verb: 2, Adjective: 3, Adverb: 4, Conjunction: 5, Preposition: 6, Pronoun: 7,
};

const CAT_COLOR: Record<string, string> = {
  noun: '#3B6D11', verb: '#185FA5', adjective: '#993C1D', adverb: '#854F0B',
  conjunction: '#534AB7', preposition: '#0F6E56', pronoun: '#993556',
  phrasal: '#0F6E56', phrase: '#888780', other: '#5F5E5A',
};
const CAT_BG: Record<string, string> = {
  noun: '#EAF3DE', verb: '#E6F1FB', adjective: '#FAECE7', adverb: '#FAEEDA',
  conjunction: '#EEEDFE', preposition: '#E1F5EE', pronoun: '#FBEAF0',
  phrasal: '#E1F5EE', phrase: '#F1EFE8', other: '#F1EFE8',
};

function getCategory(type: string): string {
  const t = type.toLowerCase();
  if (t.startsWith('noun')) return 'noun';
  if (t.startsWith('verb') || t.includes('gerund') || t.includes('participle') || t.includes('past tense') || t.includes('present continuous')) return 'verb';
  if (t.startsWith('adjective') || t.startsWith('adj')) return 'adjective';
  if (t.startsWith('adverb') || t.startsWith('adverbial')) return 'adverb';
  if (t.startsWith('conjunction')) return 'conjunction';
  if (t.startsWith('preposition') || t.startsWith('prepositional')) return 'preposition';
  if (t.startsWith('pronoun')) return 'pronoun';
  if (t.startsWith('phrasal')) return 'phrasal';
  if (t.includes('phrase') || t === 'idiom') return 'phrase';
  return 'other';
}

function getTypeColor(type: string) { return CAT_COLOR[getCategory(type)] ?? CAT_COLOR.other; }
function getTypeBg(type: string)    { return CAT_BG[getCategory(type)]    ?? CAT_BG.other;    }

// ─── JSON extraction + validation ─────────────────────────────────────────────

function extractJSONBlocks(text: string): { raw: string; pos: number }[] {
  const blocks: { raw: string; pos: number }[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '[') {
      let depth = 0, inStr = false, esc = false;
      const start = i;
      for (let j = i; j < text.length; j++) {
        const c = text[j];
        if (esc) { esc = false; continue; }
        if (c === '\\' && inStr) { esc = true; continue; }
        if (c === '"') inStr = !inStr;
        if (!inStr) {
          if (c === '[') depth++;
          else if (c === ']') { depth--; if (depth === 0) { blocks.push({ raw: text.slice(start, j + 1), pos: start }); i = j + 1; break; } }
        }
      }
      if (depth !== 0) i++;
    } else { i++; }
  }
  return blocks;
}

function validateBlock(parsed: unknown): { errors: string[]; warnings: string[] } {
  const errors: string[] = [], warnings: string[] = [];
  if (!Array.isArray(parsed)) { errors.push('Root is not an array'); return { errors, warnings }; }
  if (parsed.length === 0)    { errors.push('Array is empty');       return { errors, warnings }; }
  (parsed as unknown[]).forEach((entry, idx) => {
    const p = `Entry[${idx}]`;
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) { errors.push(`${p}: not an object`); return; }
    const e = entry as Record<string, unknown>;
    if (!('word' in e))                                                    errors.push(`${p}: missing "word"`);
    else if (typeof e.word !== 'string' || !e.word.trim())                 errors.push(`${p}: "word" must be a non-empty string`);
    if (!('type' in e))                                                    errors.push(`${p}: missing "type"`);
    else if (!VALID_TYPES.includes(e.type as string))                      errors.push(`${p}: unknown type "${e.type}"`);
    if ('typeCode' in e && e.typeCode !== null && e.typeCode !== undefined) {
      const raw = e.typeCode, asNum = typeof raw === 'number' ? raw : Number(raw);
      const isStringNum = typeof raw === 'string' && raw.trim() !== '' && !isNaN(asNum);
      if (typeof raw !== 'number' && !isStringNum) {
        errors.push(`${p}: "typeCode" must be a number (got ${JSON.stringify(raw)})`);
      } else {
        if (typeof raw === 'string' && isStringNum) warnings.push(`${p}: "typeCode" is a string "${raw}" — should be number ${asNum}`);
        const expected = TYPE_CODE_MAP[e.type as string];
        if (expected !== undefined && expected !== asNum) warnings.push(`${p}: typeCode ${asNum} doesn't match type "${e.type}" (expected ${expected})`);
      }
    }
    if (!('mean' in e))                                                    errors.push(`${p}: missing "mean"`);
    else if (typeof e.mean !== 'string' || !e.mean.trim())                 errors.push(`${p}: "mean" must be a non-empty string`);
  });
  return { errors, warnings };
}

function processText(text: string): JSONBlock[] {
  return extractJSONBlocks(text).map((b, i) => {
    let parsed: WordEntry[] | null = null, parseErr: string | null = null;
    try { parsed = JSON.parse(b.raw) as WordEntry[]; } catch (e) { parseErr = (e as Error).message; }
    const { errors, warnings } = parsed ? validateBlock(parsed) : { errors: [parseErr ?? 'Invalid JSON'], warnings: [] };
    const label = parsed && parsed[0]?.word ? `"${parsed[0].word}" family` : `Block ${i + 1}`;
    return { index: i, raw: b.raw, charPos: b.pos, parsed, errors, warnings, isValid: !parseErr && errors.length === 0, label };
  });
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: getTypeBg(type), color: getTypeColor(type), fontWeight: 500 }}>
      {type}
    </span>
  );
}

// ─── BlockCard ────────────────────────────────────────────────────────────────

function BlockCard({ block, isSaved }: { block: JSONBlock; isSaved: boolean }) {
  const [open, setOpen]       = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${block.isValid ? '#9FE1CB' : '#F5C4B3'}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', userSelect: 'none', background: block.isValid ? '#F4FCF8' : '#FDF5F3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', fontFamily: 'monospace' }}>{block.label}</span>
          {block.parsed && <span style={{ fontSize: 11, color: '#bbb' }}>{block.parsed.length} words</span>}
          {isSaved && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: '#E6F1FB', color: '#185FA5', fontWeight: 600 }}>● saved</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {block.warnings.length > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#FAEEDA', color: '#854F0B', fontWeight: 500 }}>{block.warnings.length} warn</span>}
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: block.isValid ? '#E1F5EE' : '#FAECE7', color: block.isValid ? '#0F6E56' : '#993C1D', fontWeight: 600 }}>
            {block.isValid ? '✓ valid' : `✗ ${block.errors.length} error${block.errors.length > 1 ? 's' : ''}`}
          </span>
          <span style={{ fontSize: 12, color: '#bbb' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0' }}>
          {block.parsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {block.parsed.map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '6px 10px', borderRadius: 6, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, minWidth: 120, fontFamily: 'monospace' }}>{entry.word}</span>
                  <TypeBadge type={entry.type} />
                  <span style={{ fontSize: 11, color: '#ccc', fontFamily: 'monospace' }}>code:{entry.typeCode}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: '#f3f4f6', color: '#6b7280', fontFamily: 'monospace' }}>{entry.lang ?? 'per'}</span>
                  <span style={{ fontSize: 12, color: '#666', flex: 1 }}>{entry.mean}</span>
                </div>
              ))}
            </div>
          )}
          {block.errors.map((err, i) => <div key={i} style={{ fontSize: 12, color: '#993C1D', background: '#FAECE7', padding: '4px 10px', borderRadius: 6, marginBottom: 4, fontFamily: 'monospace' }}>✗ {err}</div>)}
          {block.warnings.map((w, i)  => <div key={i} style={{ fontSize: 12, color: '#854F0B', background: '#FAEEDA', padding: '4px 10px', borderRadius: 6, marginBottom: 4, fontFamily: 'monospace' }}>⚠ {w}</div>)}
          <button onClick={() => setRawOpen(o => !o)} style={{ fontSize: 11, color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }}>
            {rawOpen ? '▲ hide raw' : '▼ show raw JSON'}
          </button>
          {rawOpen && (
            <pre style={{ marginTop: 8, fontSize: 11, fontFamily: 'monospace', background: '#f6f6f6', padding: '10px 12px', borderRadius: 6, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#555', maxHeight: 200, overflowY: 'auto' }}>
              {block.raw.length > 800 ? block.raw.slice(0, 800) + '\n…' : block.raw}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BatchSaveBar ─────────────────────────────────────────────────────────────

const CHUNK_SIZE = 50;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

interface SaveProgress {
  current: number;   // chunks done
  total: number;     // total chunks
  saved: number;     // families saved so far
  failed: string[];  // error messages per failed chunk
}

function BatchSaveBar({ validBlocks, onSaved }: { validBlocks: JSONBlock[]; onSaved: (indices: Set<number>) => void }) {
  const [tags, setTags]         = useState('');
  const [notes, setNotes]       = useState('');
  const [showForm, setShowForm] = useState(false);
  const [progress, setProgress] = useState<SaveProgress | null>(null);
  const [phase, setPhase]       = useState<'families' | 'vocabulary'>('families');
  const [done, setDone]         = useState(false);
  const saveBatch   = useBatchSaveFamilies();
  const saveToVocab = useSaveFamilyToVocab();

  if (validBlocks.length === 0) return null;

  const totalChunks = Math.ceil(validBlocks.length / CHUNK_SIZE);
  const isPending   = progress !== null && !done;

  async function handleSave() {
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

    const allFamilies: SaveWordFamilyInput[] = validBlocks
      .filter(b => b.parsed)
      .map(b => ({
        title: b.label,
        words: b.parsed!.map(w => ({
          word: w.word,
          type: w.type,
          typeCode: typeof w.typeCode === 'number' ? w.typeCode : undefined,
          lang: w.lang ?? 'per',
          mean: w.mean,
        })),
        tags: tagList,
        notes,
      }));

    const chunks = chunkArray(allFamilies, CHUNK_SIZE);
    const failed: string[] = [];
    let saved = 0;

    setDone(false);
    setPhase('families');
    setProgress({ current: 0, total: chunks.length, saved: 0, failed: [] });

    for (let i = 0; i < chunks.length; i++) {
      try {
        // 1. Save chunk to word-families table
        const savedFamilies = await saveBatch.mutateAsync({ families: chunks[i] });
        saved += chunks[i].length;

        // 2. Immediately save each family in this chunk to vocabulary (parallel)
        setPhase('vocabulary');
        if (Array.isArray(savedFamilies) && savedFamilies.length > 0) {
          await Promise.allSettled(
            savedFamilies.map((f: { familyId: string }) =>
              saveToVocab.mutateAsync(f.familyId)
            )
          );
        }
        setPhase('families');
      } catch (err) {
        failed.push(`Chunk ${i + 1}/${chunks.length}: ${(err as Error).message ?? 'failed'}`);
      }
      setProgress({ current: i + 1, total: chunks.length, saved, failed: [...failed] });
    }

    setDone(true);
    if (failed.length === 0) {
      onSaved(new Set(validBlocks.map(b => b.index)));
      setShowForm(false);
      setTags('');
      setNotes('');
    }
  }

  function handleReset() {
    setProgress(null);
    setDone(false);
  }

  const pct          = progress ? Math.round((progress.current / progress.total) * 100) : 0;
  const allFailed    = done && progress && progress.failed.length === progress.total;
  const partialFail  = done && progress && progress.failed.length > 0 && !allFailed;
  const allSuccess   = done && progress && progress.failed.length === 0;

  const borderColor = allSuccess ? '#9FE1CB' : (allFailed ? '#F5C4B3' : '#B5D4F4');
  const bgColor     = allSuccess ? '#F4FCF8'  : (allFailed ? '#FDF5F3' : '#EEF5FD');

  const fieldStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '7px 10px', border: '1.5px solid #c9dff5', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', background: '#fff', outline: 'none' };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: '#5a7a9c', display: 'block', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' };

  return (
    <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: 10, padding: '12px 16px', background: bgColor, marginTop: 16 }}>

      {/* ── Header row ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#185FA5' }}>
            {validBlocks.length} valid block{validBlocks.length > 1 ? 's' : ''} ready
          </span>
          <span style={{ fontSize: 11, color: '#888' }}>
            {validBlocks.reduce((n, b) => n + (b.parsed?.length ?? 0), 0)} word forms
            {totalChunks > 1 && <> · <strong>{totalChunks} batches</strong> of {CHUNK_SIZE}</>}
          </span>
        </div>

        {allSuccess ? (
          <span style={{ fontSize: 12, padding: '4px 14px', borderRadius: 999, background: '#E1F5EE', color: '#0F6E56', fontWeight: 700 }}>
            ✓ All {progress!.saved} families saved
          </span>
        ) : isPending ? (
          <span style={{ fontSize: 12, color: '#185FA5', fontWeight: 600 }}>
            Batch {progress!.current} / {progress!.total}…
          </span>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {done && <button onClick={handleReset} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'transparent', color: '#888', border: '1.5px solid #e0e0e0', cursor: 'pointer' }}>Reset</button>}
            {!done && (
              <button
                onClick={() => setShowForm(v => !v)}
                style={{ fontSize: 12, padding: '6px 18px', borderRadius: 8, background: '#185FA5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                {showForm ? '✕ Cancel' : '→ Save all to DynamoDB'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      {progress && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: '#5a7a9c' }}>
              {isPending ? (phase === 'vocabulary' ? `Saving to Vocabulary (batch ${progress.current + 1}/${progress.total})…` : `Saving families batch ${progress.current + 1} of ${progress.total}…`) : done ? (allSuccess ? '✓ Saved to families + vocabulary' : `Done — ${progress.failed.length} batch${progress.failed.length > 1 ? 'es' : ''} failed`) : ''}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#185FA5', fontFamily: 'monospace' }}>
              {progress.saved} / {validBlocks.length} saved · {pct}%
            </span>
          </div>
          {/* Track */}
          <div style={{ height: 6, borderRadius: 999, background: '#dde8f5', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              width: `${pct}%`,
              background: allFailed ? '#993C1D' : partialFail ? '#854F0B' : '#185FA5',
              transition: 'width 0.3s ease',
            }} />
          </div>
          {/* Chunk indicators */}
          {progress.total <= 30 && (
            <div style={{ display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
              {Array.from({ length: progress.total }, (_, i) => {
                const isDone    = i < progress.current;
                const isFailed  = progress.failed.some(f => f.startsWith(`Chunk ${i + 1}/`));
                const isActive  = i === progress.current && isPending;
                return (
                  <div key={i} title={`Batch ${i + 1} (${Math.min((i + 1) * CHUNK_SIZE, validBlocks.length) - i * CHUNK_SIZE} families)`} style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    background: isFailed ? '#993C1D' : isDone ? '#0F6E56' : isActive ? '#185FA5' : '#dde8f5',
                    opacity: isActive ? 1 : isDone || isFailed ? 1 : 0.5,
                    outline: isActive ? '2px solid #185FA5' : 'none',
                    outlineOffset: 1,
                  }} />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Failed chunk errors ───────────────────────────────────────────── */}
      {done && progress && progress.failed.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {progress.failed.map((msg, i) => (
            <div key={i} style={{ fontSize: 11, color: '#993C1D', background: '#FAECE7', padding: '4px 10px', borderRadius: 6, marginBottom: 4, fontFamily: 'monospace' }}>
              ✗ {msg}
            </div>
          ))}
          {partialFail && (
            <div style={{ fontSize: 11, color: '#854F0B', background: '#FAEEDA', padding: '4px 10px', borderRadius: 6, marginTop: 4 }}>
              ⚠ {progress.saved} of {validBlocks.length} families were saved. You can retry by clicking Reset and saving again.
            </div>
          )}
        </div>
      )}

      {/* ── Optional tags/notes form ──────────────────────────────────────── */}
      {showForm && !progress && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #d5e8f8', paddingTop: 14 }}>
          <p style={{ fontSize: 11, color: '#5a7a9c', margin: 0 }}>
            Applied to all <strong>{validBlocks.length} families</strong> across <strong>{totalChunks} batches</strong> of {CHUNK_SIZE}.
          </p>
          <div>
            <label style={labelStyle}>Tags <span style={{ color: '#aaa', textTransform: 'none', fontWeight: 400 }}>comma-separated, optional</span></label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="B2, irregular, phrasal, chapter-5, …" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Notes <span style={{ color: '#aaa', textTransform: 'none', fontWeight: 400 }}>optional</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Source, context, curriculum chapter…" rows={2} style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSave}
              style={{ fontSize: 13, padding: '8px 24px', borderRadius: 8, background: '#185FA5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              Save {validBlocks.length} families + vocabulary in {totalChunks} batches →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SavedFamiliesPanel ───────────────────────────────────────────────────────

type VocabFilter = 'all' | 'inVocab' | 'notInVocab';

// ── BatchVocabBar ─────────────────────────────────────────────────────────────
// Sends POST /vocabulary/from-family/{familyId} for each family not yet saved,
// one at a time, with a live progress bar.

interface BatchVocabProgress {
  current: number;
  total: number;
  failed: string[];
}

function BatchVocabBar({
  pendingFamilies,
  onDone,
}: {
  pendingFamilies: WordFamilyEntity[];
  onDone: () => void;
}) {
  const [progress,  setProgress]  = useState<BatchVocabProgress | null>(null);
  const [done,      setDone]      = useState(false);
  const [showBar,   setShowBar]   = useState(false);
  const saveToVocab = useSaveFamilyToVocab();

  if (pendingFamilies.length === 0) return null;

  async function handleRun() {
    setShowBar(true);
    setDone(false);
    const failed: string[] = [];
    setProgress({ current: 0, total: pendingFamilies.length, failed: [] });

    for (let i = 0; i < pendingFamilies.length; i++) {
      try {
        await saveToVocab.mutateAsync(pendingFamilies[i].familyId);
      } catch (err) {
        failed.push(pendingFamilies[i].title);
      }
      setProgress({ current: i + 1, total: pendingFamilies.length, failed: [...failed] });
    }

    setDone(true);
    if (failed.length === 0) onDone();
  }

  function handleReset() { setProgress(null); setDone(false); setShowBar(false); }

  const pct        = progress ? Math.round((progress.current / progress.total) * 100) : 0;
  const isPending  = progress !== null && !done;
  const allSuccess = done && progress && progress.failed.length === 0;
  const hasFailed  = done && progress && progress.failed.length > 0;

  return (
    <div style={{
      border: `1.5px solid ${allSuccess ? '#9FE1CB' : hasFailed ? '#F5C4B3' : '#c7d2fe'}`,
      borderRadius: 10, padding: '12px 16px', marginBottom: 12,
      background: allSuccess ? '#F4FCF8' : hasFailed ? '#FDF5F3' : '#f5f3ff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>
            {pendingFamilies.length} famil{pendingFamilies.length > 1 ? 'ies' : 'y'} not in vocabulary
          </span>
          {isPending && (
            <span style={{ fontSize: 11, color: '#6366f1' }}>
              {progress!.current} / {progress!.total} done
            </span>
          )}
        </div>

        {allSuccess ? (
          <span style={{ fontSize: 12, padding: '4px 14px', borderRadius: 999, background: '#E1F5EE', color: '#0F6E56', fontWeight: 700 }}>
            ✓ All saved to Vocabulary
          </span>
        ) : isPending ? (
          <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>Saving…</span>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {showBar && hasFailed && (
              <button onClick={handleReset} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'transparent', color: '#888', border: '1.5px solid #e0e0e0', cursor: 'pointer' }}>
                Reset
              </button>
            )}
            {!showBar && (
              <button
                onClick={handleRun}
                style={{ fontSize: 12, padding: '6px 18px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                🔤 Save all {pendingFamilies.length} to Vocabulary
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {showBar && progress && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 6, borderRadius: 999, background: '#e0e7ff', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              width: `${pct}%`,
              background: hasFailed ? '#854F0B' : '#6366f1',
              transition: 'width 0.2s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 11, color: '#818cf8' }}>
              {isPending
                ? `Saving "${pendingFamilies[progress.current]?.title ?? '…'}"…`
                : done ? (allSuccess ? 'Complete' : `${progress.failed.length} failed`) : ''}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', fontFamily: 'monospace' }}>
              {pct}%
            </span>
          </div>
        </div>
      )}

      {/* Failed list */}
      {hasFailed && progress && (
        <div style={{ marginTop: 8 }}>
          {progress.failed.map((title, i) => (
            <div key={i} style={{ fontSize: 11, color: '#993C1D', background: '#FAECE7', padding: '4px 10px', borderRadius: 6, marginBottom: 4, fontFamily: 'monospace' }}>
              ✗ Failed: {title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FamilyCard ────────────────────────────────────────────────────────────────

function FamilyCard({
  entry, isExpanded, isConfirming,
  onToggle, onConfirm, onCancelConfirm, onDelete,
}: {
  entry: WordFamilyEntity;
  isExpanded: boolean; isConfirming: boolean;
  onToggle: () => void; onConfirm: () => void;
  onCancelConfirm: () => void; onDelete: () => void;
}) {
  const saveToVocab = useSaveFamilyToVocab();
  const date = new Date(entry.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const cats = entry.words.reduce<Record<string, number>>((acc, w) => {
    const c = getCategory(w.type); acc[c] = (acc[c] ?? 0) + 1; return acc;
  }, {});

  return (
    <div style={{ border: '1px solid #d5e8d4', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: '#F4FCF8', gap: 10, flexWrap: 'wrap' }}>
        <span onClick={onToggle} style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', fontFamily: 'monospace', cursor: 'pointer', flex: '0 0 auto' }}>
          {entry.title}
        </span>
        {Object.entries(cats).map(([cat, count]) => (
          <span key={cat} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: CAT_BG[cat] ?? '#f5f5f5', color: CAT_COLOR[cat] ?? '#555', fontWeight: 600 }}>
            {cat} ×{count}
          </span>
        ))}
        {entry.tags.map(tag => (
          <span key={tag} style={{ fontSize: 10, padding: '2px 9px', borderRadius: 999, background: '#EEEDFE', color: '#534AB7', fontWeight: 500 }}>
            {tag}
          </span>
        ))}
        {entry.savedToVocabulary && (
          <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 999, background: '#EAF3DE', color: '#3B6D11', fontWeight: 600 }}>
            🔤 in vocabulary
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#bbb' }}>{date}</span>

          {/* Individual save-to-vocab button */}
          {!entry.savedToVocabulary && (
            <button
              onClick={() => saveToVocab.mutate(entry.familyId)}
              disabled={saveToVocab.isPending}
              title="Save to Vocabulary"
              style={{
                fontSize: 11, padding: '3px 9px', borderRadius: 6, fontWeight: 600,
                background: saveToVocab.isPending ? '#f5f5f5' : '#eef2ff',
                color: saveToVocab.isPending ? '#aaa' : '#6366f1',
                border: '1px solid #c7d2fe',
                cursor: saveToVocab.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {saveToVocab.isPending ? '…' : '🔤'}
            </button>
          )}

          {/* Delete */}
          {!isConfirming ? (
            <button onClick={onConfirm} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'transparent', color: '#ccc', border: '1px solid #e8e8e8', cursor: 'pointer' }}>✕</button>
          ) : (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#993C1D' }}>Delete?</span>
              <button onClick={onDelete} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: '#993C1D', color: '#fff', border: 'none', cursor: 'pointer' }}>Yes</button>
              <button onClick={onCancelConfirm} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'transparent', color: '#888', border: '1px solid #e0e0e0', cursor: 'pointer' }}>No</button>
            </div>
          )}
          <button onClick={onToggle} style={{ fontSize: 12, color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #e8f5e8' }}>
          {entry.notes && (
            <div style={{ fontSize: 12, color: '#555', background: '#f7fbf7', padding: '8px 12px', borderRadius: 6, marginBottom: 10, borderLeft: '3px solid #9FE1CB', lineHeight: 1.5 }}>
              {entry.notes}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entry.words.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '6px 10px', borderRadius: 6, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                <span style={{ fontWeight: 700, fontSize: 13, minWidth: 120, fontFamily: 'monospace' }}>{w.word}</span>
                <TypeBadge type={w.type} />
                <span style={{ fontSize: 11, color: '#ccc', fontFamily: 'monospace' }}>code:{w.typeCode}</span>
                <span style={{ fontSize: 12, color: '#666', flex: 1 }}>{w.mean}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SavedFamiliesPanel ────────────────────────────────────────────────────────

function SavedFamiliesPanel() {
  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteWordFamilies();
  const deleteFamily  = useDeleteWordFamily();
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [confirmId,    setConfirmId]    = useState<string | null>(null);
  const [vocabFilter,  setVocabFilter]  = useState<VocabFilter>('all');

  if (isLoading) return (
    <div style={{ fontSize: 13, color: '#aaa', padding: '20px 0', textAlign: 'center' }}>Loading saved families…</div>
  );
  if (isError) return (
    <div style={{ fontSize: 13, color: '#993C1D', padding: '20px 0' }}>Failed to load saved families.</div>
  );

  const allItems: WordFamilyEntity[] = data?.pages.flatMap(p => p.data) ?? [];
  const inVocab    = allItems.filter(e =>  e.savedToVocabulary);
  const notInVocab = allItems.filter(e => !e.savedToVocabulary);
  const displayed  = vocabFilter === 'all' ? allItems
    : vocabFilter === 'inVocab'    ? inVocab
    : notInVocab;

  if (allItems.length === 0) return (
    <div style={{ textAlign: 'center', padding: '28px', border: '2px dashed #eee', borderRadius: 10, color: '#aaa', fontSize: 13 }}>
      No word families saved yet. Analyze text above and save valid blocks.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Batch-to-vocab bar — shown when families not yet in vocabulary exist */}
      {notInVocab.length > 0 && (
        <BatchVocabBar
          pendingFamilies={notInVocab}
          onDone={() => setVocabFilter('inVocab')}
        />
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {([
          { key: 'all',        label: `All (${allItems.length})` },
          { key: 'inVocab',    label: `🔤 In Vocabulary (${inVocab.length})` },
          { key: 'notInVocab', label: `Not saved (${notInVocab.length})` },
        ] as { key: VocabFilter; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setVocabFilter(f.key)}
            style={{
              fontSize: 12, padding: '5px 13px', borderRadius: 999,
              border: '1.5px solid',
              borderColor: vocabFilter === f.key ? '#1a1a1a' : '#e0e0e0',
              background:  vocabFilter === f.key ? '#1a1a1a' : 'transparent',
              color:       vocabFilter === f.key ? '#fff'    : '#888',
              cursor: 'pointer', fontWeight: vocabFilter === f.key ? 600 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {displayed.length === 0 && (
        <div style={{ fontSize: 13, color: '#aaa', padding: '16px 0', textAlign: 'center' }}>
          No families match this filter.
        </div>
      )}

      {/* Cards */}
      {displayed.map(entry => (
        <FamilyCard
          key={entry.familyId}
          entry={entry}
          isExpanded={expandedId === entry.familyId}
          isConfirming={confirmId === entry.familyId}
          onToggle={() => setExpandedId(id => id === entry.familyId ? null : entry.familyId)}
          onConfirm={() => setConfirmId(entry.familyId)}
          onCancelConfirm={() => setConfirmId(null)}
          onDelete={() => { deleteFamily.mutate(entry.familyId); setConfirmId(null); }}
        />
      ))}

      {/* Load more */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          style={{
            marginTop: 8, padding: '10px 0', width: '100%', borderRadius: 10,
            border: '1.5px dashed #c7d2fe', background: isFetchingNextPage ? '#f5f5f5' : '#fff',
            color: isFetchingNextPage ? '#aaa' : '#6366f1',
            fontSize: 13, fontWeight: 600, cursor: isFetchingNextPage ? 'not-allowed' : 'pointer',
          }}
        >
          {isFetchingNextPage ? 'Loading…' : 'Load next 50 →'}
        </button>
      )}

      {!hasNextPage && allItems.length > 50 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#bbb', padding: '10px 0' }}>
          All {allItems.length} families loaded
        </div>
      )}
    </div>
  );
}

// ─── WordFamilyPage ───────────────────────────────────────────────────────────

type TabFilter = 'all' | 'valid' | 'invalid';

export const WordFamilyPage: React.FC = () => {
  const [inputText, setInputText]   = useState('');
  const [blocks, setBlocks]         = useState<JSONBlock[]>([]);
  const [filter, setFilter]         = useState<TabFilter>('all');
  const [hasRun, setHasRun]         = useState(false);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab]   = useState<'analyzer' | 'saved'>('analyzer');

  const handleAnalyze = useCallback(() => {
    setBlocks(processText(inputText));
    setHasRun(true);
    setFilter('all');
    setSavedIndices(new Set());
  }, [inputText]);

  const handleClear = () => { setInputText(''); setBlocks([]); setHasRun(false); setSavedIndices(new Set()); };

  const total        = blocks.length;
  const validCount   = blocks.filter(b => b.isValid).length;
  const invalidCount = total - validCount;
  const filtered     = filter === 'all' ? blocks : filter === 'valid' ? blocks.filter(b => b.isValid) : blocks.filter(b => !b.isValid);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb' }}>
      <TopBar onNewTodo={() => {}} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 820, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Page header + tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'monospace', letterSpacing: '-0.03em' }}>
              📚 Word Family Validator
            </h1>
            <p style={{ fontSize: 12, color: '#888', margin: '3px 0 0' }}>
              Paste text · validate JSON blocks · save to DynamoDB
            </p>
          </div>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #e0e0e0' }}>
            {(['analyzer', 'saved'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ fontSize: 12, padding: '7px 16px', cursor: 'pointer', fontWeight: activeTab === tab ? 700 : 400, border: 'none', background: activeTab === tab ? '#1a1a1a' : 'transparent', color: activeTab === tab ? '#fff' : '#888', borderRight: tab === 'analyzer' ? '1px solid #e0e0e0' : 'none' }}
              >
                {tab === 'analyzer' ? 'Analyzer' : 'Saved Families'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Analyzer tab ───────────────────────────────────────────────── */}
        {activeTab === 'analyzer' && (
          <>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Paste any text that contains JSON word-family blocks.\n\nExample:\n  [\n    { "word": "provide",  "type": "verb", "typeCode": 2, "mean": "فراهم کردن" },\n    { "word": "provider", "type": "noun", "typeCode": 1, "mean": "ارائه‌دهنده" }\n  ]`}
              rows={10}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace', fontSize: 12, padding: '12px 14px', border: '1.5px solid #e0e0e0', borderRadius: 10, outline: 'none', lineHeight: 1.6, color: '#333', background: '#fafafa' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={handleAnalyze} disabled={!inputText.trim()} style={{ padding: '9px 22px', borderRadius: 8, background: inputText.trim() ? '#1a1a1a' : '#ccc', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: inputText.trim() ? 'pointer' : 'not-allowed' }}>
                Analyze
              </button>
              {hasRun && (
                <button onClick={handleClear} style={{ padding: '9px 18px', borderRadius: 8, background: 'transparent', color: '#888', border: '1.5px solid #e0e0e0', fontSize: 13, cursor: 'pointer' }}>
                  Clear
                </button>
              )}
            </div>

            {hasRun && (
              <div style={{ marginTop: 24 }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
                  {[{ label: 'Blocks found', value: total, color: '#1a1a1a' }, { label: 'Valid', value: validCount, color: '#0F6E56' }, { label: 'Invalid', value: invalidCount, color: invalidCount > 0 ? '#993C1D' : '#bbb' }].map(s => (
                    <div key={s.label} style={{ background: '#f8f8f8', borderRadius: 8, padding: '12px 16px', border: '1px solid #eee' }}>
                      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {total === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#aaa', fontSize: 13, border: '1.5px dashed #eee', borderRadius: 10 }}>
                    No JSON array blocks found in this text.
                  </div>
                ) : (
                  <>
                    {/* Filter bar */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
                      {(['all', 'valid', 'invalid'] as TabFilter[]).map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 999, border: '1.5px solid', borderColor: filter === f ? '#1a1a1a' : '#e0e0e0', background: filter === f ? '#1a1a1a' : 'transparent', color: filter === f ? '#fff' : '#888', cursor: 'pointer', fontWeight: filter === f ? 600 : 400 }}>
                          {f === 'all' ? `All (${total})` : f === 'valid' ? `Valid (${validCount})` : `Invalid (${invalidCount})`}
                        </button>
                      ))}
                    </div>

                    {/* Block list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {filtered.map(block => (
                        <BlockCard key={block.index} block={block} isSaved={savedIndices.has(block.index)} />
                      ))}
                    </div>

                    {/* Batch save bar */}
                    <BatchSaveBar
                      validBlocks={blocks.filter(b => b.isValid)}
                      onSaved={setSavedIndices}
                    />
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Saved tab ──────────────────────────────────────────────────── */}
        {activeTab === 'saved' && <SavedFamiliesPanel />}
      </div>
    </div>
  );
};
