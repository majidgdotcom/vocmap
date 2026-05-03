/**
 * cambridge.scraper.ts
 *
 * Fetches word details from dictionary.cambridge.org.
 * Mirrors the C# HtmlParserService but fixes the issues:
 *  - Exact class matching instead of contains()
 *  - Null-safe phonetic access
 *  - Rate-limit header (User-Agent + Accept-Language)
 *  - Audio returned as Buffer (caller uploads to S3)
 *  - Retries on transient network errors
 */

import * as cheerio from 'cheerio';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapedMeaning {
  mean: string;
  sentences: string[];
}

export interface ScrapedDefinition {
  wordType: string;
  means: ScrapedMeaning[];
}

export interface ScrapedWord {
  word:        string;
  usPhonetic?: string;        // /prəˈvaɪd/
  ukPhonetic?: string;        // /prəˈvaɪd/
  usAudio?:    Buffer;        // raw MP3 — caller uploads to S3
  ukAudio?:    Buffer;
  definitions: ScrapedDefinition[];
}

// ── CSS classes (Cambridge as of 2025) ───────────────────────────────────────
// Stored as constants so a single update fixes every selector.

const CLS = {
  headword:   'headword',
  phonetic:   'ipa dipa lpr-2 lpl-1',
  wordType:   'pos dpos',
  meaning:    'def ddef_d db',
  sentence1:  'eg deg',
  sentence2:  'eg dexamp hax',
  audioUsId:  'audio2',
  audioUkId:  'audio1',
} as const;

const BASE_URL = 'https://dictionary.cambridge.org';

// ── Helpers ───────────────────────────────────────────────────────────────────

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) return res;
      if (res.status === 404) throw new WordNotFoundError(url);
      if (res.status === 429 || res.status >= 500) {
        // Back off and retry on rate-limit or server errors
        await sleep(attempt * 1500);
        continue;
      }
      throw new Error(`HTTP ${res.status} for ${url}`);
    } catch (err) {
      if (err instanceof WordNotFoundError) throw err;
      if (attempt === retries) throw err;
      await sleep(attempt * 1500);
    }
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadAudio(path: string): Promise<Buffer | undefined> {
  try {
    const res = await fetchWithRetry(`${BASE_URL}${path}`);
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return undefined;   // audio is optional — don't fail the whole scrape
  }
}

// ── Main scraper ──────────────────────────────────────────────────────────────

export async function scrapeCambridgeWord(word: string): Promise<ScrapedWord> {
  const slug = encodeURIComponent(word.trim().toLowerCase().replace(/\s+/g, '-'));
  const url  = `${BASE_URL}/dictionary/english/${slug}`;

  const res  = await fetchWithRetry(url);
  const html = await res.text();
  const $    = cheerio.load(html);

  // ── Word title ──────────────────────────────────────────────────────────────
  const wordTitle = $(`.${CLS.headword}`).first().text().trim() || word;

  // ── Phonetics (UK = index 0, US = index 1, same as C# code) ───────────────
  // Uses exact class match — Cambridge has many `.ipa` variants we don't want.
  const phoneticNodes = $(`[class="${CLS.phonetic}"]`);
  const ukPhonetic    = phoneticNodes.eq(0).text().trim() || undefined;
  const usPhonetic    = phoneticNodes.eq(1).text().trim() || undefined;

  // ── Audio ──────────────────────────────────────────────────────────────────
  const usAudioSrc = $(`#${CLS.audioUsId}`)
    .find('source[type="audio/mpeg"]').attr('src');
  const ukAudioSrc = $(`#${CLS.audioUkId}`)
    .find('source[type="audio/mpeg"]').attr('src');

  const [usAudio, ukAudio] = await Promise.all([
    usAudioSrc ? downloadAudio(usAudioSrc) : Promise.resolve(undefined),
    ukAudioSrc ? downloadAudio(ukAudioSrc) : Promise.resolve(undefined),
  ]);

  // ── Definitions (word types → meanings → sentences) ────────────────────────
  // Iterate all matching nodes in DOM order — same state-machine as C# version.
  const definitions: ScrapedDefinition[] = [];
  let currentType: string | null = null;
  let currentMean: string | null = null;

  const selector = [
    `[class="${CLS.wordType}"]`,
    `[class="${CLS.meaning}"]`,
    `[class="${CLS.sentence1}"]`,
    `[class="${CLS.sentence2}"]`,
  ].join(', ');

  $(selector).each((_, el) => {
    const cls  = $(el).attr('class') ?? '';
    const text = $(el).text().trim();
    if (!text) return;

    if (cls === CLS.wordType) {
      currentType = text;
      currentMean = null;
      if (!definitions.find(d => d.wordType === currentType)) {
        definitions.push({ wordType: currentType, means: [] });
      }

    } else if (cls === CLS.meaning) {
      currentMean = text;
      const def = definitions.find(d => d.wordType === currentType);
      if (def && !def.means.find(m => m.mean === currentMean)) {
        def.means.push({ mean: currentMean, sentences: [] });
      }

    } else {
      // sentence1 or sentence2
      const def  = definitions.find(d => d.wordType === currentType);
      const mean = def?.means.find(m => m.mean === currentMean);
      if (mean && !mean.sentences.includes(text)) {
        mean.sentences.push(text);
      }
    }
  });

  return { word: wordTitle, usPhonetic, ukPhonetic, usAudio, ukAudio, definitions };
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class WordNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(url: string) {
    super(`Cambridge: word not found at ${url}`);
    this.name = 'WordNotFoundError';
  }
}
