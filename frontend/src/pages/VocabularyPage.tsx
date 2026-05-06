import React, { useState, useCallback, useMemo } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import {
  useInfiniteVocabulary,
  useEnrichVocabEntry,
  getAudioUrl,
  VocabEntry,
} from '@/services/vocabulary.service';
import {
  toVocabularyViewModel,
  VocabularyViewModel,
  getMeansSummary,
  getUniqueCategoryBadges,
} from '@/viewmodels/vocabulary.viewmodel';

// ─── Style constants (view concern — not in ViewModel) ────────────────────────

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

// ─── AudioButton ──────────────────────────────────────────────────────────────

function AudioButton({ s3Key, label }: { s3Key?: string; label: string }) {
  const url = getAudioUrl(s3Key);
  if (!url) return null;
  return (
    <button
      onClick={() => new Audio(url).play().catch(() => {})}
      title={`Play ${label} pronunciation`}
      style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      🔊 {label}
    </button>
  );
}

// ─── CambridgePanel — receives VocabularyViewModel ────────────────────────────

function CambridgePanel({ vm }: { vm: VocabularyViewModel }) {
  const enrich = useEnrichVocabEntry();
  const c = vm.cambridge;

  if (!c) {
    return (
      <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: '#f9fafb', border: '1px dashed #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>No Cambridge data yet</span>
          <button
            onClick={() => enrich.mutate(vm.wordKey)}
            disabled={enrich.isPending}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 8, fontWeight: 600, background: enrich.isPending ? '#f5f5f5' : '#1a1a1a', color: enrich.isPending ? '#aaa' : '#fff', border: 'none', cursor: enrich.isPending ? 'not-allowed' : 'pointer' }}
          >
            {enrich.isPending ? 'Fetching…' : '🌐 Enrich from Cambridge'}
          </button>
        </div>
        {enrich.isError && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#993C1D', fontFamily: 'monospace' }}>
            ✗ {(enrich.error as Error)?.message ?? 'Enrichment failed'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
      {/* Header — phonetics + audio from ViewModel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Cambridge
        </span>
        {c.ukPhonetic && (
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>UK /{c.ukPhonetic}/</span>
        )}
        {c.usPhonetic && (
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>US /{c.usPhonetic}/</span>
        )}

        {/* Audio keys from ViewModel → URL resolved in view layer via getAudioUrl */}
        <AudioButton s3Key={c.ukAudioKey} label="UK" />
        <AudioButton s3Key={c.usAudioKey} label="US" />

        <button
          onClick={() => enrich.mutate(vm.wordKey)}
          disabled={enrich.isPending}
          title="Re-fetch from Cambridge"
          style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'transparent', color: '#9ca3af', border: '1px solid #e5e7eb', cursor: enrich.isPending ? 'not-allowed' : 'pointer' }}
        >
          {enrich.isPending ? '…' : '↺ refresh'}
        </button>
      </div>

      {/* Definitions — category already computed by ViewModel */}
      {c.definitions.map((def, di) => (
        <div key={di} style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: CAT_BG[def.category] ?? '#f5f5f5', color: CAT_COLOR[def.category] ?? '#555', fontWeight: 600, display: 'inline-block', marginBottom: 6 }}>
            {def.wordType}
          </span>
          {def.means.map((m, mi) => (
            <div key={mi} style={{ marginBottom: 8, paddingLeft: 12 }}>
              <div style={{ fontSize: 13, color: '#1f2937', marginBottom: 4, lineHeight: 1.5 }}>{m.mean}</div>
              {m.sentences.map((s, si) => (
                <div key={si} style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', paddingLeft: 10, borderLeft: '2px solid #e5e7eb', marginBottom: 3, lineHeight: 1.5 }}>
                  {s}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* fetchedDate already formatted by ViewModel */}
      <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 6 }}>Fetched {c.fetchedDate}</div>
    </div>
  );
}

// ─── VocabCard — receives VocabularyViewModel ─────────────────────────────────

function VocabCard({
  vm, highlighted, onRelationClick,
}: {
  vm: VocabularyViewModel;
  highlighted: boolean;
  onRelationClick: (word: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // Badge deduplication from ViewModel helper
  const headerBadges = useMemo(() => getUniqueCategoryBadges(vm.means), [vm.means]);

  // Collapsed-header means preview from ViewModel helper
  const meansSummary = useMemo(() => getMeansSummary(vm.means), [vm.means]);

  return (
    <div
      id={`vocab-${vm.wordKey}`}
      style={{
        border: `1.5px solid ${highlighted ? '#6366f1' : vm.isEnriched ? '#d1fae5' : '#e5e7eb'}`,
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
            {/* ukPhonetic preview — from ViewModel */}
            {vm.cambridge?.ukPhonetic && (
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af' }}>/{vm.cambridge.ukPhonetic}/</span>
            )}
            {/* isEnriched — from ViewModel */}
            {vm.isEnriched && (
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 999, background: '#d1fae5', color: '#065f46', fontWeight: 600 }}>🌐 enriched</span>
            )}
          </div>
          {/* Deduplicated type badges from ViewModel helper */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {headerBadges.map((b, i) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: CAT_BG[b.category] ?? '#f5f5f5', color: CAT_COLOR[b.category] ?? '#555', fontWeight: 500 }}>
                {b.type}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* meansSummary — pre-computed by ViewModel */}
          <span style={{ fontSize: 12, color: '#6b7280', direction: 'rtl', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meansSummary}
          </span>
          <span style={{ fontSize: 12, color: '#bbb' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f3f4f6' }}>

          {/* Meanings — category from ViewModel */}
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

          {/* Cambridge panel — receives the full ViewModel */}
          <CambridgePanel vm={vm} />

          {/* Relations */}
          {vm.relations.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 600 }}>
                Related forms
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {vm.relations.map((rel, i) => (
                  <button
                    key={i}
                    onClick={() => onRelationClick(rel)}
                    style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 500 }}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meta — savedDate + familyCount from ViewModel */}
          <div style={{ marginTop: 10, fontSize: 10, color: '#d1d5db' }}>
            {vm.familyCount} famil{vm.familyCount === 1 ? 'y' : 'ies'} · saved {vm.savedDate}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VocabularyPage ───────────────────────────────────────────────────────────

export const VocabularyPage: React.FC = () => {
  const [search, setSearch]       = useState('');
  const [debouncedSearch, setDeb] = useState('');
  const [highlightedKey, setHL]   = useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteVocabulary(debouncedSearch || undefined);

  const rawItems: VocabEntry[] = data?.pages.flatMap(p => p.data) ?? [];

  // ViewModel transformation — all presentation logic delegated
  const items: VocabularyViewModel[] = useMemo(
    () => rawItems.map(toVocabularyViewModel),
    [rawItems],
  );

  const enrichedCount = items.filter(vm => vm.isEnriched).length;

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb' }}>
      <TopBar />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 820, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', fontFamily: 'monospace', letterSpacing: '-0.03em' }}>
            🔤 Vocabulary
          </h1>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
            Alphabetical · Cambridge enrichment per word · audio playback
          </p>
        </div>

        {/* Stats */}
        {!isLoading && items.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{items.length} words loaded</span>
            {enrichedCount > 0 && (
              <span style={{ fontSize: 12, color: '#065f46' }}>🌐 {enrichedCount} enriched from Cambridge</span>
            )}
            {enrichedCount < items.length && (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {items.length - enrichedCount} not yet enriched — open a card and click "Enrich from Cambridge"
              </span>
            )}
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search words… (prefix match)"
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 36px 9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'monospace', outline: 'none', background: '#fff' }}
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

        {isLoading && <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa', fontSize: 13 }}>Loading vocabulary…</div>}
        {isError   && <div style={{ fontSize: 13, color: '#993C1D', padding: '20px 0' }}>Failed to load vocabulary.</div>}

        {!isLoading && !isError && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed #e5e7eb', borderRadius: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🔤</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6, fontFamily: 'monospace' }}>
              {debouncedSearch ? `No words matching "${debouncedSearch}"` : 'Vocabulary is empty'}
            </div>
            <div style={{ fontSize: 12, color: '#aaa' }}>
              Go to Saved Families and click <strong>"→ Save to Vocabulary"</strong>.
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(vm => (
              <VocabCard
                key={vm.vocabId}
                vm={vm}
                highlighted={highlightedKey === vm.wordKey}
                onRelationClick={handleRelationClick}
              />
            ))}
          </div>
        )}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            style={{ marginTop: 12, padding: '10px 0', width: '100%', borderRadius: 10, border: '1.5px dashed #c7d2fe', background: isFetchingNextPage ? '#f5f5f5' : '#fff', color: isFetchingNextPage ? '#aaa' : '#6366f1', fontSize: 13, fontWeight: 600, cursor: isFetchingNextPage ? 'not-allowed' : 'pointer' }}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load next 50 →'}
          </button>
        )}
        {!hasNextPage && items.length > 50 && (
          <div style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', padding: '12px 0' }}>
            All {items.length} words loaded
          </div>
        )}
      </div>
    </div>
  );
};
