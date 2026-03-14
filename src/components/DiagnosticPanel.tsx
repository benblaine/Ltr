import { useState, useCallback } from 'react';
import type { SpeechEvaluator } from '../audio/evaluator.js';

interface Props {
  evaluator: SpeechEvaluator | null;
  phase: string;
  onClose: () => void;
}

export function DiagnosticPanel({ evaluator, phase, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const buildReport = useCallback(() => {
    const lines: string[] = [];
    lines.push('=== Ltr Diagnostic Report ===');
    lines.push(`Time: ${new Date().toISOString()}`);
    lines.push(`Phase: ${phase}`);
    lines.push(`UserAgent: ${navigator.userAgent}`);
    lines.push(`Online: ${navigator.onLine}`);
    lines.push(`SpeechRecognition: ${!!(window.SpeechRecognition ?? window.webkitSpeechRecognition)}`);
    lines.push(`ASR supported: ${evaluator?.isSupported ?? 'no evaluator'}`);
    lines.push(`canDoASR: ${evaluator?.canDoASR ?? 'no evaluator'}`);

    lines.push('');
    lines.push('--- Evaluator Log ---');
    if (evaluator) {
      for (const entry of evaluator.diagnosticLog) {
        const t = new Date(entry.timestamp).toISOString().slice(11, 23);
        lines.push(`[${t}] ${entry.event}${entry.detail ? ': ' + entry.detail : ''}`);
      }
    } else {
      lines.push('(no evaluator)');
    }

    return lines.join('\n');
  }, [evaluator, phase]);

  const handleCopy = useCallback(async () => {
    const report = buildReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text in a textarea
      const el = document.querySelector('#diag-output') as HTMLTextAreaElement | null;
      if (el) {
        el.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [buildReport]);

  const report = buildReport();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[70vh] rounded-t-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
            Diagnostics
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1 rounded-full bg-[var(--interactive)] text-white text-xs font-bold border-none cursor-pointer"
              style={{ fontFamily: 'var(--font-ui)' }}
            >
              {copied ? 'Copied!' : 'Copy Report'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 border-none cursor-pointer text-gray-500"
            >
              ✕
            </button>
          </div>
        </div>
        <textarea
          id="diag-output"
          readOnly
          value={report}
          className="flex-1 p-4 text-xs font-mono bg-gray-50 border-none resize-none outline-none"
          style={{ minHeight: '200px' }}
        />
      </div>
    </div>
  );
}
