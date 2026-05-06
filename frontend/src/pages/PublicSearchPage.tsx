import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteVocabulary, VocabEntry } from '@/services/vocabulary.service';
import {
  toVocabularyViewModel,
  VocabularyViewModel,
  getMeansSummary,
  getUniqueCategoryBadges,
} from '@/viewmodels/vocabulary.viewmodel';

// ── Style constants ───────────────────────────────────────────────────────────

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

// ── PublicVocabCard ───────────────────────────────────────────────────────────

function PublicVocabCard({
  vm, highlighted, onRelationClick,
}: {
  vm: VocabularyViewModel;
  highlighted: boolean;
  onRelationClick: (word: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const headerBadges  = useMemo(() => getUniqueCategoryBadges(vm.means), [vm.means]);
  const meansSummary  = useMemo(() => getMeansSummary(vm.means), [vm.means]);

  return (
    <div
      id={`vocab-${vm.wordKey}`}
      style={{
        border: `1.5px solid ${highlighted ? '#6366f1' : '#e5e7eb'}`,
        borderRadius: 10, overflow: 'hidden', background: '#fff',
        transition: 'border-color 0.2s', scrollMarginTop: 80,
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', gap: 12, flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: '#1a1a1a' }}>
              {vm.word}
            </span>
            {/* UK phonetic if enriched */}
            {vm.cambridge?.ukPhonetic && (
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af' }}>/{vm.cambridge.ukPhonetic}/</span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {headerBadges.map((b, i) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: CAT_BG[b.category] ?? '#f5f5f5', color: CAT_COLOR[b.category] ?? '#555', fontWeight: 500 }}>
                {b.type}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#6b7280', direction: 'rtl', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meansSummary}
          </span>
          <span style={{ fontSize: 12, color: '#bbb' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f3f4f6' }}>

          {/* Meanings */}
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {vm.means.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: CAT_BG[m.category] ?? '#f5f5f5', color: CAT_COLOR[m.category] ?? '#555', fontWeight: 500, flexShrink: 0 }}>
                  {m.type}
                </span>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: '#f3f4f6', color: '#6b7280', fontFamily: 'monospace', flexShrink: 0 }}>
                  {m.lang}
                </span>
                <span style={{ fontSize: 13, color: '#374151', direction: 'rtl', flex: 1 }}>{m.mean}</span>
              </div>
            ))}
          </div>

          {/* Cambridge definitions (read-only, no enrich button) */}
          {vm.cambridge && !vm.cambridge.notAvailable && vm.cambridge.definitions.length > 0 && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cambridge</span>
                {vm.cambridge.ukPhonetic && <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>UK /{vm.cambridge.ukPhonetic}/</span>}
                {vm.cambridge.usPhonetic && <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>US /{vm.cambridge.usPhonetic}/</span>}
              </div>
              {vm.cambridge.definitions.map((def, di) => (
                <div key={di} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: CAT_BG[def.category] ?? '#f5f5f5', color: CAT_COLOR[def.category] ?? '#555', fontWeight: 600, display: 'inline-block', marginBottom: 4 }}>
                    {def.wordType}
                  </span>
                  {def.means.map((m, mi) => (
                    <div key={mi} style={{ paddingLeft: 12, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, color: '#1f2937', lineHeight: 1.5 }}>{m.mean}</div>
                      {m.sentences.map((s, si) => (
                        <div key={si} style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', paddingLeft: 10, borderLeft: '2px solid #e5e7eb', marginTop: 3, lineHeight: 1.5 }}>{s}</div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Related forms */}
          {vm.relations.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 600 }}>Related forms</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {vm.relations.map((rel, i) => (
                  <button key={i} onClick={() => onRelationClick(rel)} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 500 }}>
                    {rel}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PublicSearchPage ──────────────────────────────────────────────────────────

export const PublicSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch]       = useState('');
  const [debouncedSearch, setDeb] = useState('');
  const [highlightedKey, setHL]   = useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteVocabulary(debouncedSearch || undefined);

  const rawItems: VocabEntry[] = data?.pages.flatMap(p => p.data) ?? [];
  const items: VocabularyViewModel[] = useMemo(
    () => rawItems.map(toVocabularyViewModel),
    [rawItems],
  );

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDeb(val.trim()), 350);
  }, []);

  function handleRelationClick(displayWord: string) {
    const wordKey = displayWord.trim().toLowerCase().replace(/\s+/g, '-');
    const found   = items.find(vm => vm.wordKey === wordKey);
    if (found) {
      setHL(wordKey);
      document.getElementById(`vocab-${wordKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHL(null), 2500);
    } else {
      handleSearchChange(displayWord);
      setTimeout(() => {
        setHL(wordKey);
        document.getElementById(`vocab-${wordKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => setHL(null), 2500);
      }, 600);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f9fafb' }}>

      {/* Public header */}
      <header style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#6366f1', letterSpacing: '-0.5px' }}>📚 VocMap</span>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '5px 16px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#374151', fontWeight: 500 }}
        >
          Admin sign in →
        </button>
      </header>

      <div style={{ flex: 1, padding: '32px 20px', maxWidth: 820, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px', fontFamily: 'monospace', letterSpacing: '-0.04em' }}>
            Vocabulary
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Search words, explore meanings and related forms
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search a word…"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 40px 12px 16px',
              border: '1.5px solid #e5e7eb', borderRadius: 12,
              fontSize: 15, fontFamily: 'monospace',
              outline: 'none', background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setDeb(''); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#aaa' }}>
              ✕
            </button>
          )}
        </div>

        {/* States */}
        {isLoading && <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa', fontSize: 13 }}>Searching…</div>}
        {isError   && <div style={{ fontSize: 13, color: '#993C1D', padding: '20px 0', textAlign: 'center' }}>Failed to load vocabulary.</div>}

        {!isLoading && !isError && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#555', marginBottom: 6, fontFamily: 'monospace' }}>
              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Start typing to search'}
            </div>
            {debouncedSearch && (
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                Try a different spelling or a related word.
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {items.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
              {items.length} word{items.length !== 1 ? 's' : ''}{hasNextPage ? ' — more below' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(vm => (
                <PublicVocabCard
                  key={vm.vocabId}
                  vm={vm}
                  highlighted={highlightedKey === vm.wordKey}
                  onRelationClick={handleRelationClick}
                />
              ))}
            </div>
          </>
        )}

        {hasNextPage && (
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} style={{ marginTop: 12, padding: '10px 0', width: '100%', borderRadius: 10, border: '1.5px dashed #c7d2fe', background: isFetchingNextPage ? '#f5f5f5' : '#fff', color: isFetchingNextPage ? '#aaa' : '#6366f1', fontSize: 13, fontWeight: 600, cursor: isFetchingNextPage ? 'not-allowed' : 'pointer' }}>
            {isFetchingNextPage ? 'Loading…' : 'Load more →'}
          </button>
        )}
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '16px', fontSize: 11, color: '#d1d5db', borderTop: '1px solid #f3f4f6' }}>
        VocMap — personal vocabulary builder
      </footer>
    </div>
  );
};
