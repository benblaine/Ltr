import { speak } from '../audio/speaker.js';

interface AudioButtonProps {
  text: string;
  lang?: string;
  size?: 'sm' | 'md';
}

export function AudioButton({ text, lang, size = 'md' }: AudioButtonProps) {
  const handleClick = () => {
    speak(text, { lang, rate: 0.8 });
  };

  const sizeClass = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';

  return (
    <button
      onClick={handleClick}
      className={`${sizeClass} rounded-full bg-[var(--accent-highlight)] text-white border-none cursor-pointer flex items-center justify-center transition-transform active:scale-90`}
      aria-label={`Hear "${text}"`}
    >
      <svg width={size === 'sm' ? 18 : 24} height={size === 'sm' ? 18 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    </button>
  );
}
