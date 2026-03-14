export function speak(
  text: string,
  options: { rate?: number; pitch?: number; lang?: string } = {},
): Promise<void> {
  const { rate = 0.85, pitch = 1.1, lang = 'en-US' } = options;
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    u.lang = lang;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    setTimeout(() => window.speechSynthesis.speak(u), 50);
  });
}

export async function speakPhonemes(
  displayPhonemes: string[],
  fullWord: string,
  options: { lang?: string } = {},
): Promise<void> {
  for (const p of displayPhonemes) {
    await speak(p, { rate: 0.7, ...options });
    await new Promise((r) => setTimeout(r, 300));
  }
  await new Promise((r) => setTimeout(r, 500));
  await speak(fullWord, { rate: 0.8, ...options });
}
