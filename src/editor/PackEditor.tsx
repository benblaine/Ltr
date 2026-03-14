import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPack, savePack } from '../db/packs.js';
import { validatePack, type ValidationIssue } from './PackValidator.js';
import type { ContentPack, Word, WordGroup, WordCategory } from '../types/content.js';

export function PackEditor() {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editingGroup, setEditingGroup] = useState<WordGroup | null>(null);
  const [tab, setTab] = useState<'words' | 'groups' | 'settings'>('words');

  useEffect(() => {
    if (packId) {
      getPack(packId).then(p => {
        if (p) setPack(p);
        else navigate('/editor');
      });
    }
  }, [packId, navigate]);

  const save = useCallback(async (updated: ContentPack) => {
    setPack(updated);
    setIssues(validatePack(updated));
    await savePack(updated);
  }, []);

  if (!pack) return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;

  const handleAddWord = () => {
    const newWord: Word = {
      id: crypto.randomUUID(),
      text: '',
      phonemes: [],
      displayPhonemes: [],
      category: 'cvc',
      difficulty: 1,
      imageEmoji: '',
      tags: [],
      sightWord: false,
    };
    setEditingWord(newWord);
  };

  const handleSaveWord = (word: Word) => {
    const existing = pack.words.findIndex(w => w.id === word.id);
    const words = [...pack.words];
    if (existing >= 0) words[existing] = word;
    else words.push(word);
    save({ ...pack, words });
    setEditingWord(null);
  };

  const handleDeleteWord = (wordId: string) => {
    save({ ...pack, words: pack.words.filter(w => w.id !== wordId) });
  };

  const handleAddGroup = () => {
    const newGroup: WordGroup = {
      id: crypto.randomUUID(),
      name: '',
      wordIds: [],
      order: pack.wordGroups.length,
    };
    setEditingGroup(newGroup);
  };

  const handleSaveGroup = (group: WordGroup) => {
    const existing = pack.wordGroups.findIndex(g => g.id === group.id);
    const groups = [...pack.wordGroups];
    if (existing >= 0) groups[existing] = group;
    else groups.push(group);
    save({ ...pack, wordGroups: groups });
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    save({ ...pack, wordGroups: pack.wordGroups.filter(g => g.id !== groupId) });
  };

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  return (
    <div className="flex flex-col px-4 py-6 gap-4 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/editor')} className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)]">
          ← Back
        </button>
        <h1 className="text-[var(--text-ui)] font-bold m-0 truncate max-w-48" style={{ fontFamily: 'var(--font-ui)' }}>
          {pack.name || 'Untitled Pack'}
        </h1>
        <button onClick={() => { setIssues(validatePack(pack)); }} className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent-highlight)] text-white border-none cursor-pointer text-[var(--text-ui-small)]">
          Validate
        </button>
      </div>

      {errors.length > 0 && (
        <div className="p-3 rounded-[var(--radius-md)] bg-red-50 text-[var(--text-ui-small)]">
          {errors.map((e, i) => <p key={i} className="text-[var(--danger)] m-0">{e.message}</p>)}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="p-3 rounded-[var(--radius-md)] bg-amber-50 text-[var(--text-ui-small)]">
          {warnings.map((w, i) => <p key={i} className="text-[var(--accent-encourage)] m-0">{w.message}</p>)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-1">
        {(['words', 'groups', 'settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-[var(--radius-sm)] border-none cursor-pointer text-[var(--text-ui-small)] font-semibold capitalize ${
              tab === t ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]' : 'bg-transparent text-[var(--text-secondary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Words Tab */}
      {tab === 'words' && !editingWord && (
        <div className="flex flex-col gap-2">
          <button onClick={handleAddWord} className="w-full py-3 rounded-[var(--radius-md)] bg-[var(--interactive)] text-white font-bold border-none cursor-pointer text-[var(--text-ui-small)]" style={{ minHeight: 'var(--tap-target-min)' }}>
            + Add Word
          </button>
          {pack.words.map(word => (
            <div key={word.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
              <span className="text-xl">{word.imageEmoji || '❓'}</span>
              <div className="flex-1 cursor-pointer" onClick={() => setEditingWord(word)}>
                <span className="font-bold" style={{ fontFamily: 'var(--font-learning)' }}>{word.text}</span>
                <span className="text-[var(--text-secondary)] text-[var(--text-ui-small)] ml-2">
                  d{word.difficulty} · {word.category}
                </span>
              </div>
              <button onClick={() => handleDeleteWord(word.id)} className="text-[var(--danger)] border-none bg-transparent cursor-pointer text-sm">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Word Editor Inline */}
      {tab === 'words' && editingWord && (
        <WordEditorForm word={editingWord} onSave={handleSaveWord} onCancel={() => setEditingWord(null)} />
      )}

      {/* Groups Tab */}
      {tab === 'groups' && !editingGroup && (
        <div className="flex flex-col gap-2">
          <button onClick={handleAddGroup} className="w-full py-3 rounded-[var(--radius-md)] bg-[var(--interactive)] text-white font-bold border-none cursor-pointer text-[var(--text-ui-small)]" style={{ minHeight: 'var(--tap-target-min)' }}>
            + Add Group
          </button>
          {pack.wordGroups.map(group => (
            <div key={group.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
              <div className="flex-1 cursor-pointer" onClick={() => setEditingGroup(group)}>
                <span className="font-bold">{group.name || 'Untitled Group'}</span>
                <span className="text-[var(--text-secondary)] text-[var(--text-ui-small)] ml-2">
                  {group.wordIds.length} words
                </span>
              </div>
              <button onClick={() => handleDeleteGroup(group.id)} className="text-[var(--danger)] border-none bg-transparent cursor-pointer text-sm">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Group Editor Inline */}
      {tab === 'groups' && editingGroup && (
        <GroupEditorForm group={editingGroup} words={pack.words} onSave={handleSaveGroup} onCancel={() => setEditingGroup(null)} />
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="flex flex-col gap-3">
          <Field label="Pack Name" value={pack.name} onChange={v => save({ ...pack, name: v })} />
          <Field label="Description" value={pack.description} onChange={v => save({ ...pack, description: v })} />
          <Field label="Author" value={pack.author} onChange={v => save({ ...pack, author: v })} />
          <Field label="Language" value={pack.language} onChange={v => save({ ...pack, language: v })} />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[var(--text-ui-small)] text-[var(--text-secondary)] mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full p-2 rounded-[var(--radius-sm)] border border-[var(--bg-secondary)] bg-[var(--bg-surface)] text-[var(--text-ui)]"
        style={{ fontFamily: 'var(--font-ui)' }}
      />
    </div>
  );
}

const CATEGORIES: WordCategory[] = ['letter', 'cvc', 'ccvc', 'cvcc', 'digraph', 'blend', 'long-vowel', 'vowel-team', 'r-controlled', 'sight-word', 'multisyllable'];

function WordEditorForm({ word, onSave, onCancel }: { word: Word; onSave: (w: Word) => void; onCancel: () => void }) {
  const [w, setW] = useState<Word>({ ...word });

  const update = (field: keyof Word, value: unknown) => setW({ ...w, [field]: value });

  return (
    <div className="flex flex-col gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]">
      <h3 className="text-[var(--text-ui)] font-bold m-0">{word.text ? `Edit: ${word.text}` : 'New Word'}</h3>

      <Field label="Word Text" value={w.text} onChange={v => update('text', v)} />
      <Field label="Display Phonemes (comma-separated)" value={w.displayPhonemes.join(',')} onChange={v => update('displayPhonemes', v.split(',').map(s => s.trim()).filter(Boolean))} />
      <Field label="Phonemes IPA (comma-separated)" value={w.phonemes.join(',')} onChange={v => update('phonemes', v.split(',').map(s => s.trim()).filter(Boolean))} />

      <div>
        <label className="block text-[var(--text-ui-small)] text-[var(--text-secondary)] mb-1">Category</label>
        <select
          value={w.category}
          onChange={e => update('category', e.target.value)}
          className="w-full p-2 rounded-[var(--radius-sm)] border border-[var(--bg-secondary)] bg-[var(--bg-surface)]"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[var(--text-ui-small)] text-[var(--text-secondary)] mb-1">Difficulty (1-10)</label>
        <input type="number" min={1} max={10} value={w.difficulty} onChange={e => update('difficulty', parseInt(e.target.value) || 1)}
          className="w-full p-2 rounded-[var(--radius-sm)] border border-[var(--bg-secondary)] bg-[var(--bg-surface)]"
        />
      </div>

      <Field label="Emoji" value={w.imageEmoji} onChange={v => update('imageEmoji', v)} />
      <Field label="Tags (comma-separated)" value={w.tags.join(', ')} onChange={v => update('tags', v.split(',').map(s => s.trim()).filter(Boolean))} />

      <label className="flex items-center gap-2 text-[var(--text-ui-small)]">
        <input type="checkbox" checked={w.sightWord} onChange={e => update('sightWord', e.target.checked)} />
        Sight word (teach by recognition)
      </label>

      <Field label="Notes (teacher only)" value={w.notes ?? ''} onChange={v => update('notes', v)} />

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)]">Cancel</button>
        <button onClick={() => onSave(w)} className="flex-1 py-2 rounded-[var(--radius-md)] bg-[var(--interactive)] text-white font-bold border-none cursor-pointer">Save</button>
      </div>
    </div>
  );
}

function GroupEditorForm({ group, words, onSave, onCancel }: { group: WordGroup; words: Word[]; onSave: (g: WordGroup) => void; onCancel: () => void }) {
  const [g, setG] = useState<WordGroup>({ ...group });
  const selectedSet = new Set(g.wordIds);

  const toggleWord = (wordId: string) => {
    const ids = selectedSet.has(wordId) ? g.wordIds.filter(id => id !== wordId) : [...g.wordIds, wordId];
    setG({ ...g, wordIds: ids });
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]">
      <h3 className="text-[var(--text-ui)] font-bold m-0">{group.name ? `Edit: ${group.name}` : 'New Group'}</h3>

      <Field label="Group Name" value={g.name} onChange={v => setG({ ...g, name: v })} />
      <Field label="Description" value={g.description ?? ''} onChange={v => setG({ ...g, description: v })} />

      <div>
        <label className="block text-[var(--text-ui-small)] text-[var(--text-secondary)] mb-1">Words</label>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {words.map(word => (
            <label key={word.id} className="flex items-center gap-2 p-1 text-[var(--text-ui-small)] cursor-pointer">
              <input type="checkbox" checked={selectedSet.has(word.id)} onChange={() => toggleWord(word.id)} />
              <span>{word.imageEmoji}</span> {word.text}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)]">Cancel</button>
        <button onClick={() => onSave(g)} className="flex-1 py-2 rounded-[var(--radius-md)] bg-[var(--interactive)] text-white font-bold border-none cursor-pointer">Save</button>
      </div>
    </div>
  );
}
