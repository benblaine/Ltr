import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext.js';
import { ParentGate } from './ParentGate.js';

export function Settings() {
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [gateOpen, setGateOpen] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');

  if (!gateOpen) {
    return <ParentGate onPass={() => setGateOpen(true)} onBack={() => navigate('/')} />;
  }

  if (!profile) {
    navigate('/');
    return null;
  }

  const avatars = ['🦊', '🐱', '🐶', '🦁', '🐸', '🐰', '🐼', '🦄'];

  const handleSave = async () => {
    await updateProfile({ name: name.trim() || profile.name });
    navigate('/');
  };

  const handleResetPlacement = async () => {
    await updateProfile({
      placementComplete: false,
      placementBand: 1,
      currentDifficulty: 1,
    });
    navigate('/placement');
  };

  return (
    <div className="flex flex-col items-center px-6 py-8 gap-6 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)]"
        >
          ← Back
        </button>
        <h1 className="text-[var(--text-ui-large)] font-bold m-0" style={{ fontFamily: 'var(--font-ui)' }}>
          Settings
        </h1>
        <div className="w-16" />
      </div>

      <div className="w-full bg-[var(--bg-surface)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)]">
        <h2 className="text-[var(--text-ui)] font-semibold mb-3 m-0" style={{ fontFamily: 'var(--font-ui)' }}>
          Reader Profile
        </h2>

        <label className="block text-[var(--text-ui-small)] text-[var(--text-secondary)] mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded-[var(--radius-sm)] border border-[var(--bg-secondary)] bg-[var(--bg-primary)] text-[var(--text-ui)] mb-3"
          style={{ fontFamily: 'var(--font-ui)' }}
        />

        <label className="block text-[var(--text-ui-small)] text-[var(--text-secondary)] mb-1">Avatar</label>
        <div className="flex gap-2 flex-wrap mb-3">
          {avatars.map((a) => (
            <button
              key={a}
              onClick={() => updateProfile({ avatarEmoji: a })}
              className={`text-2xl p-1 rounded-[var(--radius-sm)] border-2 cursor-pointer ${
                profile.avatarEmoji === a ? 'border-[var(--interactive)] bg-[var(--bg-primary)]' : 'border-transparent'
              }`}
              style={{ minWidth: 'var(--tap-target-min)', minHeight: 'var(--tap-target-min)' }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full bg-[var(--bg-surface)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)]">
        <h2 className="text-[var(--text-ui)] font-semibold mb-3 m-0" style={{ fontFamily: 'var(--font-ui)' }}>
          Reading Level
        </h2>
        <p className="text-[var(--text-ui-small)] text-[var(--text-secondary)] mb-2">
          Current difficulty: {profile.currentDifficulty} | Band: {profile.placementBand}
        </p>
        <button
          onClick={handleResetPlacement}
          className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent-encourage)] text-white border-none cursor-pointer text-[var(--text-ui-small)] font-semibold"
          style={{ minHeight: 'var(--tap-target-min)' }}
        >
          Retake Placement Test
        </button>
      </div>

      <button
        onClick={handleSave}
        className="px-8 py-3 rounded-[var(--radius-full)] bg-[var(--interactive)] text-white font-bold text-[var(--text-ui)] border-none cursor-pointer transition-transform active:scale-95"
        style={{ fontFamily: 'var(--font-ui)', minHeight: 'var(--tap-target-child)' }}
      >
        Save
      </button>
    </div>
  );
}
