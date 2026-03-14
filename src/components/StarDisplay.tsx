interface StarDisplayProps {
  earned: number;
  total?: number;
}

export function StarDisplay({ earned, total = 3 }: StarDisplayProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`text-2xl ${i < earned ? '' : 'opacity-30'}`}>
          ⭐
        </span>
      ))}
    </div>
  );
}
