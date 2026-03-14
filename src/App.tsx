import { Routes, Route, Navigate } from 'react-router-dom';
import { ProfileProvider } from './contexts/ProfileContext.js';
import { Hub } from './screens/Hub.js';
import { Placement } from './screens/Placement.js';
import { Settings } from './screens/Settings.js';
import { EditorHome } from './editor/EditorHome.js';
import { PackEditor } from './editor/PackEditor.js';
import { SoundTap } from './activities/SoundTap.js';
import { WordFlash } from './activities/WordFlash.js';
import { BlendBuilder } from './activities/BlendBuilder.js';
import { ReadFeed } from './activities/ReadFeed.js';

export function App() {
  return (
    <ProfileProvider>
      <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/placement" element={<Placement />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/editor" element={<EditorHome />} />
          <Route path="/editor/:packId" element={<PackEditor />} />
          <Route path="/activity/sound-tap" element={<SoundTap />} />
          <Route path="/activity/word-flash" element={<WordFlash />} />
          <Route path="/activity/blend-builder" element={<BlendBuilder />} />
          <Route path="/activity/read-feed" element={<ReadFeed />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ProfileProvider>
  );
}
