import type { ContentPack } from '../types/content.js';
import { validatePack } from './PackValidator.js';

export function exportPack(pack: ContentPack): void {
  const json = JSON.stringify(pack, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pack.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importPack(
  file: File,
): Promise<{
  pack: ContentPack;
  issues: ReturnType<typeof validatePack>;
}> {
  const text = await file.text();
  const parsed: ContentPack = JSON.parse(text);
  parsed.id = crypto.randomUUID();
  parsed.createdAt = Date.now();
  parsed.updatedAt = Date.now();
  parsed.version = 1;
  for (const w of parsed.words || []) if (!w.id) w.id = crypto.randomUUID();

  const issues = validatePack(parsed);
  if (issues.some((i) => i.severity === 'error'))
    throw new Error(
      'Validation errors:\n' +
        issues
          .filter((i) => i.severity === 'error')
          .map((i) => `• ${i.message}`)
          .join('\n'),
    );

  return { pack: parsed, issues };
}
