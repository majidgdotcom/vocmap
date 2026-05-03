import React, { useState, useCallback } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { useInfiniteVocabulary, VocabEntry } from '@/services/vocabulary.service';

// ── Type colour helpers (reused from WordFamilyPage) ─────────────────────────

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

// ── VocabCard ─────────────────────────────────────────────────────────────────

function VocabCard({
  entry,
  highlighted,
  onRelationClick,
}: {
  entry: VocabEntry;
  highlighted: boolean;
  onRelationClick: (word: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      id={`vocab-${entry.wordKey}`}
      style={{
        border: `1.5px solid ${highlighted ? '#6366f1' : '#e5e7eb'}`,
        borderRadius: 10,
        overflow: 'hidden',
        background: highlighted ? '#f5f3ff' : '#fff',
        transition: 'border-color 0.2s, background 0.2s',
        scrollMarginTop: 80,
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '12px 16px', cursor: 'pointer', gap: 12, flexWrap: 'wrap',
        }}
      >
        {/* Word + quick means */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: '#1a1a1a', display: 'block', marginBottom: 4 }}>
            {entry.word}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {entry.means.map((m, i) => {
              const cat = getCategory(m.type);
              return (
                <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: CAT_BG[cat] ?? '#f5f5f5', color: CAT_COLOR[cat] ?? '#555', fontWeight: 500 }}>
                  {m.type}
                </span>
              );
            })}
          </div>
        </div>

        {/* Persian means preview + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#6b7280', direction: 'rtl', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.means.map(m => m.mean).join(' · ')}
          </span>
          <span style={{ fontSize: 12, color: '#bbb' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f3f4f6' }}>

          {/* Meanings table */}
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entry.means.map((m, i) => {
              const cat = getCategory(m.type);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: CAT_BG[cat] ?? '#f5f5f5', color: CAT_COLOR[cat] ?? '#555', fontWeight: 500, flexShrink: 0 }}>
                    {m.type}
                  </span>
                  <span style={{ fontSize: 13, color: '#374151', direction: 'rtl', flex: 1 }}>
                    {m.mean}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Relations */}
          {entry.relations.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 600 }}>
                Related forms
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {entry.relations.map((rel, i) => (
                  <button
                    key={i}
                    onClick={() => onRelationClick(rel)}
                    style={{
                      fontSize: 12, padding: '3px 10px', borderRadius: 999,
                      background: '#eef2ff', color: '#6366f1',
                      border: '1px solid #c7d2fe', cursor: 'pointer',
                      fontFamily: 'monospace', fontWeight: 500,
                    }}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div style={{ marginTop: 10, fontSize: 10, color: '#d1d5db' }}>
            {entry.familyIds.length} famil{entry.familyIds.length === 1 ? 'y' : 'ies'} · saved {new Date(entry.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── VocabularyPage ─────────────────────────────────────────────────────────────

export const VocabularyPage: React.FC = () => {
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDeb]   = useState('');
  const [highlightedKey, setHL]     = useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteVocabulary(debouncedSearch || undefined);

  const items: VocabEntry[] = data?.pages.flatMap(p => p.data) ?? [];
  const totalLoaded = items.length;

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDeb(val.trim()), 350);
  }, []);

  function handleRelationClick(displayWord: string) {
    // Normalise word to key (spaces → hyphens, lowercase)
    const wordKey = displayWord.trim().toLowerCase().replace(/\s+/g, '-');

    // Is it already loaded?
    const found = items.find(e => e.wordKey === wordKey);
    if (found) {
      setHL(wordKey);
      document.getElementById(`vocab-${wordKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHL(null), 2500);
    } else {
      // Search for it
      handleSearchChange(displayWord);
      setTimeout(() => {
        setHL(wordKey);
        document.getElementById(`vocab-${wordKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => setHL(null), 2500);
      }, 600);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb' }}>
      <TopBar onNewTodo={() => {}} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 820, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', fontFamily: 'monospace', letterSpacing: '-0.03em' }}>
            🔤 Vocabulary
          </h1>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
            Alphabetical · word forms grouped · relations linked
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search words… (prefix match)"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '9px 36px 9px 14px',
              border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13,
              fontFamily: 'monospace', outline: 'none', background: '#fff',
            }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setDeb(''); }}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#aaa' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Stats */}
        {!isLoading && items.length > 0 && (
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
            {totalLoaded} word{totalLoaded !== 1 ? 's' : ''} loaded
            {hasNextPage && ' — more below'}
            {!hasNextPage && totalLoaded > 50 && ' — all loaded'}
          </div>
        )}

        {/* States */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa', fontSize: 13 }}>Loading vocabulary…</div>
        )}
        {isError && (
          <div style={{ fontSize: 13, color: '#993C1D', padding: '20px 0' }}>Failed to load vocabulary.</div>
        )}
        {!isLoading && !isError && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed #e5e7eb', borderRadius: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🔤</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6, fontFamily: 'monospace' }}>
              {debouncedSearch ? `No words matching "${debouncedSearch}"` : 'Vocabulary is empty'}
            </div>
            <div style={{ fontSize: 12, color: '#aaa' }}>
              Go to Saved Families and click <strong>"→ Save to Vocabulary"</strong> on any family.
            </div>
          </div>
        )}

        {/* Word list */}
        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(entry => (
              <VocabCard
                key={entry.vocabId}
                entry={entry}
                highlighted={highlightedKey === entry.wordKey}
                onRelationClick={handleRelationClick}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            style={{
              marginTop: 12, padding: '10px 0', width: '100%', borderRadius: 10,
              border: '1.5px dashed #c7d2fe', background: isFetchingNextPage ? '#f5f5f5' : '#fff',
              color: isFetchingNextPage ? '#aaa' : '#6366f1',
              fontSize: 13, fontWeight: 600, cursor: isFetchingNextPage ? 'not-allowed' : 'pointer',
            }}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load next 50 →'}
          </button>
        )}

        {!hasNextPage && totalLoaded > 50 && (
          <div style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', padding: '12px 0' }}>
            All {totalLoaded} words loaded
          </div>
        )}
      </div>
    </div>
  );
};
