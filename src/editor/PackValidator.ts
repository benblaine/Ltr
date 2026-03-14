import type { ContentPack } from '../types/content.js';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  field: string;
  wordId?: string;
  message: string;
}

export function validatePack(pack: ContentPack): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!pack.name?.trim())
    issues.push({
      severity: 'error',
      field: 'name',
      message: 'Pack name is required',
    });
  if (!pack.words?.length)
    issues.push({
      severity: 'error',
      field: 'words',
      message: 'Pack must have at least one word',
    });

  const seen = new Set<string>();
  for (const w of pack.words) {
    if (!w.text?.trim())
      issues.push({
        severity: 'error',
        field: 'text',
        wordId: w.id,
        message: 'Word text required',
      });
    if (seen.has(w.text.toLowerCase()))
      issues.push({
        severity: 'warning',
        field: 'text',
        wordId: w.id,
        message: `Duplicate: "${w.text}"`,
      });
    seen.add(w.text.toLowerCase());

    if (!w.displayPhonemes?.length)
      issues.push({
        severity: 'error',
        field: 'displayPhonemes',
        wordId: w.id,
        message: `"${w.text}" needs letter-level phoneme breakdown`,
      });

    if (w.displayPhonemes?.join('') !== w.text.toLowerCase())
      issues.push({
        severity: 'warning',
        field: 'displayPhonemes',
        wordId: w.id,
        message: `Phonemes "${w.displayPhonemes?.join('')}" don't match "${w.text}"`,
      });

    if (w.difficulty < 1 || w.difficulty > 10)
      issues.push({
        severity: 'error',
        field: 'difficulty',
        wordId: w.id,
        message: `"${w.text}" difficulty must be 1–10`,
      });

    if (!w.imageEmoji)
      issues.push({
        severity: 'warning',
        field: 'imageEmoji',
        wordId: w.id,
        message: `"${w.text}" has no emoji hint`,
      });
  }

  const diffs = pack.words.map((w) => w.difficulty);
  if (diffs.length > 0 && Math.min(...diffs) > 3)
    issues.push({
      severity: 'warning',
      field: 'difficulty',
      message: 'No easy words (1–3). Add some for warm-up.',
    });

  const wordIds = new Set(pack.words.map((w) => w.id));
  for (const g of pack.wordGroups || [])
    for (const wid of g.wordIds)
      if (!wordIds.has(wid))
        issues.push({
          severity: 'error',
          field: 'wordGroups',
          message: `Group "${g.name}" references unknown word: ${wid}`,
        });

  return issues;
}
