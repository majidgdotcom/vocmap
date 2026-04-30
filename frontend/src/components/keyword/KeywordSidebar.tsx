import React from 'react';

import { KeywordEntity } from '@vocmap/shared';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setKeywordFilter,
  clearKeywordFilter,
  selectActiveKeywordId,
} from '@/store/slices/keyword-filter.slice';

interface KeywordSidebarProps {
  /** All unique keywords aggregated across the user's todos */
  keywords: KeywordEntity[];
  isLoading: boolean;
}

export const KeywordSidebar: React.FC<KeywordSidebarProps> = ({ keywords, isLoading }) => {
  const dispatch = useAppDispatch();
  const activeKeywordId = useAppSelector(selectActiveKeywordId);

  const handleSelect = (kw: KeywordEntity) => {
    if (activeKeywordId === kw.keywordId) {
      dispatch(clearKeywordFilter());
    } else {
      dispatch(setKeywordFilter({ keywordId: kw.keywordId, label: kw.label }));
    }
  };

  if (isLoading) {
    return (
      <aside style={sidebarStyle}>
        <p style={headingStyle}>Keywords</p>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={skeletonStyle} />
        ))}
      </aside>
    );
  }

  return (
    <aside style={sidebarStyle}>
      <p style={headingStyle}>Keywords</p>

      {keywords.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#9ca3af', padding: '0 12px' }}>
          No keywords yet
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {/* "All" option */}
          <li>
            <button
              style={pillStyle(!activeKeywordId, '#6b7280')}
              onClick={() => dispatch(clearKeywordFilter())}
            >
              All todos
            </button>
          </li>

          {keywords.map((kw) => (
            <li key={kw.keywordId}>
              <button
                style={pillStyle(activeKeywordId === kw.keywordId, kw.color ?? '#6366f1')}
                onClick={() => handleSelect(kw)}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: kw.color ?? '#6366f1',
                    marginRight: 6,
                    flexShrink: 0,
                  }}
                />
                {kw.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const sidebarStyle: React.CSSProperties = {
  width: 200,
  flexShrink: 0,
  borderRight: '1px solid #e5e7eb',
  paddingTop: 16,
  overflowY: 'auto',
};

const headingStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#9ca3af',
  margin: '0 0 8px 12px',
};

const skeletonStyle: React.CSSProperties = {
  height: 28,
  margin: '4px 12px',
  borderRadius: 6,
  background: '#f3f4f6',
  animation: 'pulse 1.5s ease-in-out infinite',
};

const pillStyle = (active: boolean, color: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '6px 12px',
  border: 'none',
  borderRadius: 0,
  background: active ? `${color}18` : 'transparent',
  color: active ? color : '#374151',
  fontWeight: active ? 700 : 400,
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'left',
  borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
  transition: 'all 0.1s ease',
});
