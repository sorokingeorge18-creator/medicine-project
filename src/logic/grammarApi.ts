// ============================================================
// Клиент API проверки грамматики (/api/grammar → Claude)
// ============================================================

export async function fixGrammarText(text: string): Promise<string> {
  const res = await fetch('/api/grammar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: 'Ошибка сервера' }));
    throw new Error(error ?? 'Ошибка сервера');
  }
  const { corrected } = await res.json();
  return corrected as string;
}
