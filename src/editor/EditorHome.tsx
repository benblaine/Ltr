import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentGate } from '../screens/ParentGate.js';
import { getAllPacks, createPack, deletePack } from '../db/packs.js';
import { savePack } from '../db/packs.js';
import { exportPack, importPack } from './ImportExport.js';
import type { ContentPack } from '../types/content.js';

export function EditorHome() {
  const navigate = useNavigate();
  const [gateOpen, setGateOpen] = useState(false);
  const [packs, setPacks] = useState<ContentPack[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gateOpen) {
      getAllPacks().then(setPacks);
    }
  }, [gateOpen]);

  if (!gateOpen) {
    return <ParentGate onPass={() => setGateOpen(true)} onBack={() => navigate('/')} />;
  }

  const handleCreate = async () => {
    const name = prompt('Pack name:');
    if (!name?.trim()) return;
    const author = prompt('Author:') ?? '';
    const pack = await createPack(name.trim(), author.trim());
    setPacks([...packs, pack]);
    navigate(`/editor/${pack.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pack?')) return;
    await deletePack(id);
    setPacks(packs.filter(p => p.id !== id));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { pack, issues } = await importPack(file);
      await savePack(pack);
      setPacks([...packs, pack]);
      if (issues.length > 0) {
        setError(`Imported with ${issues.length} warning(s)`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center px-6 py-8 gap-6 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)]"
        >
          ← Back
        </button>
        <h1 className="text-[var(--text-ui-large)] font-bold m-0" style={{ fontFamily: 'var(--font-ui)' }}>
          Content Editor
        </h1>
        <div className="w-16" />
      </div>

      {error && (
        <div className="w-full p-3 rounded-[var(--radius-md)] bg-red-50 text-[var(--danger)] text-[var(--text-ui-small)]">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline border-none bg-transparent cursor-pointer text-[var(--danger)]">
            dismiss
          </button>
        </div>
      )}

      <div className="flex gap-3 w-full">
        <button
          onClick={handleCreate}
          className="flex-1 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--interactive)] text-white font-bold border-none cursor-pointer text-[var(--text-ui-small)]"
          style={{ minHeight: 'var(--tap-target-min)' }}
        >
          + New Pack
        </button>
        <label
          className="flex-1 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold border-none cursor-pointer text-[var(--text-ui-small)] text-center flex items-center justify-center"
          style={{ minHeight: 'var(--tap-target-min)' }}
        >
          Import
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      <div className="w-full flex flex-col gap-3">
        {packs.map(pack => (
          <div
            key={pack.id}
            className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]"
          >
            <div className="flex-1 cursor-pointer" onClick={() => navigate(`/editor/${pack.id}`)}>
              <h3 className="text-[var(--text-ui)] font-bold m-0" style={{ fontFamily: 'var(--font-ui)' }}>
                {pack.name}
              </h3>
              <p className="text-[var(--text-ui-small)] text-[var(--text-secondary)] m-0">
                {pack.words.length} words · v{pack.version}
              </p>
            </div>
            <button
              onClick={() => exportPack(pack)}
              className="px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-ui-small)]"
            >
              Export
            </button>
            <button
              onClick={() => handleDelete(pack.id)}
              className="px-3 py-1 rounded-[var(--radius-sm)] bg-transparent border-none cursor-pointer text-[var(--danger)] text-[var(--text-ui-small)]"
            >
              Delete
            </button>
          </div>
        ))}

        {packs.length === 0 && (
          <p className="text-center text-[var(--text-secondary)] text-[var(--text-ui-small)] py-8">
            No packs yet. Create one or import a JSON file.
          </p>
        )}
      </div>
    </div>
  );
}
