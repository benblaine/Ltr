import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext.js';
import { useEffect, useState } from 'react';
import type { SessionRecord } from '../types/progress.js';
import { getRecentSessions } from '../db/progress.js';

export function Hub() {
  const { profile, activePack, loading, createProfile } = useProfile();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    getRecentSessions(5).then(setSessions);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--text-secondary)] text-[var(--text-ui-large)]" style={{ fontFamily: 'var(--font-ui)' }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!profile) {
    return <WelcomeScreen onCreate={createProfile} />;
  }

  if (!profile.placementComplete) {
    navigate('/placement');
    return null;
  }

  const activities = [
    { type: 'sound-tap' as const, name: 'Sound Tap', emoji: '👂', description: 'Tap the right letter sound', color: 'var(--accent-highlight)' },
    { type: 'word-flash' as const, name: 'Word Flash', emoji: '📖', description: 'Read the word aloud', color: 'var(--interactive)' },
    { type: 'blend-builder' as const, name: 'Blend Builder', emoji: '🧩', description: 'Build words from letters', color: 'var(--accent-correct)' },
  ];

  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6 max-w-lg mx-auto w-full">
      <header className="text-center">
        <p className="text-4xl mb-2">{profile.avatarEmoji}</p>
        <h1 className="text-[var(--text-ui-large)] font-bold" style={{ fontFamily: 'var(--font-ui)' }}>
          Hi, {profile.name}!
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-xl">⭐</span>
          <span className="text-[var(--text-secondary)] font-semibold">{profile.totalStars} stars</span>
        </div>
      </header>

      {activePack && (
        <p className="text-[var(--text-secondary)] text-[var(--text-ui-small)]">
          Pack: {activePack.name}
        </p>
      )}

      <div className="grid gap-4 w-full">
        {activities.map((act) => (
          <button
            key={act.type}
            onClick={() => navigate(`/activity/${act.type}`)}
            className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)] border-none cursor-pointer text-left transition-transform active:scale-95"
            style={{ minHeight: 'var(--tap-target-child)' }}
          >
            <span className="text-3xl">{act.emoji}</span>
            <div>
              <h2 className="text-[var(--text-ui)] font-bold m-0" style={{ fontFamily: 'var(--font-ui)' }}>
                {act.name}
              </h2>
              <p className="text-[var(--text-secondary)] text-[var(--text-ui-small)] m-0">
                {act.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {sessions.length > 0 && (
        <div className="w-full mt-2">
          <h3 className="text-[var(--text-ui-small)] text-[var(--text-secondary)] font-semibold mb-2" style={{ fontFamily: 'var(--font-ui)' }}>
            Recent Sessions
          </h3>
          {sessions.slice(0, 3).map((s) => (
            <div key={s.id} className="flex justify-between items-center py-2 border-b border-[var(--bg-secondary)]">
              <span className="text-[var(--text-ui-small)]">{s.activityType}</span>
              <span className="text-[var(--text-ui-small)]">
                {s.wordsCorrect}/{s.wordsAttempted} {'⭐'.repeat(s.starsEarned)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => navigate('/editor')}
          className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)] text-[var(--text-ui-small)] font-semibold"
          style={{ minHeight: 'var(--tap-target-min)' }}
        >
          Content Editor
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)] text-[var(--text-ui-small)] font-semibold"
          style={{ minHeight: 'var(--tap-target-min)' }}
        >
          Settings
        </button>
      </div>
    </div>
  );
}

function WelcomeScreen({ onCreate }: { onCreate: (name: string, emoji: string) => Promise<unknown> }) {
  const [name, setName] = useState('');
  const avatars = ['🦊', '🐱', '🐶', '🦁', '🐸', '🐰', '🐼', '🦄'];
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await onCreate(name.trim(), selectedAvatar);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <h1 className="text-[var(--text-learning)] font-bold" style={{ fontFamily: 'var(--font-learning)' }}>
        ReadVoice
      </h1>
      <p className="text-[var(--text-ui)] text-[var(--text-secondary)]">
        Let's set up your reader!
      </p>

      <input
        type="text"
        placeholder="Reader's name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-center text-[var(--text-ui-large)] p-3 rounded-[var(--radius-md)] border-2 border-[var(--bg-secondary)] bg-[var(--bg-surface)] w-64 outline-none focus:border-[var(--interactive)]"
        style={{ fontFamily: 'var(--font-ui)' }}
      />

      <div className="flex gap-3 flex-wrap justify-center">
        {avatars.map((a) => (
          <button
            key={a}
            onClick={() => setSelectedAvatar(a)}
            className={`text-3xl p-2 rounded-[var(--radius-md)] border-2 cursor-pointer transition-transform ${
              selectedAvatar === a ? 'border-[var(--interactive)] scale-110 bg-[var(--bg-surface)]' : 'border-transparent bg-transparent'
            }`}
            style={{ minWidth: 'var(--tap-target-child)', minHeight: 'var(--tap-target-child)' }}
          >
            {a}
          </button>
        ))}
      </div>

      <button
        onClick={handleCreate}
        disabled={!name.trim()}
        className="px-8 py-3 rounded-[var(--radius-full)] bg-[var(--interactive)] text-white font-bold text-[var(--text-ui)] border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
        style={{ fontFamily: 'var(--font-ui)', minHeight: 'var(--tap-target-child)' }}
      >
        Let's Go!
      </button>
    </div>
  );
}
