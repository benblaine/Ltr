import { useEffect, useState } from 'react';

interface CelebrationProps {
  stars: number;
  onComplete: () => void;
}

export function Celebration({ stars, onComplete }: CelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#42A5F5', '#FF9800', '#7C4DFF'];
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[i % colors.length],
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);

    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/20" onClick={onComplete}>
      {/* Confetti particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            animation: `confetti-fall 2s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}

      <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-lg)] text-center z-10" style={{ animation: 'bounce-in 0.5s ease-out' }}>
        <div className="text-5xl mb-4">
          {'⭐'.repeat(stars)}
        </div>
        <h2 className="text-[var(--text-ui-large)] font-bold mb-2" style={{ fontFamily: 'var(--font-ui)' }}>
          {stars >= 3 ? 'Amazing!' : stars >= 2 ? 'Great job!' : stars >= 1 ? 'Good work!' : 'Keep trying!'}
        </h2>
        <p className="text-[var(--text-secondary)] text-[var(--text-ui-small)]" style={{ fontFamily: 'var(--font-ui)' }}>
          Tap to continue
        </p>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
