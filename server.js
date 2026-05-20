import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '100kb' }));
app.use(express.static(join(__dirname, 'dist')));

app.post('/api/grammar', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Текст не передан' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY не задан на сервере' });
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Исправь грамматические, орфографические и пунктуационные ошибки в следующем медицинском тексте на русском языке.

Правила:
- Верни ТОЛЬКО исправленный текст без каких-либо комментариев, пояснений и предисловий
- Сохраняй оригинальное форматирование: переносы строк, отступы, пробелы
- Не изменяй медицинские термины, аббревиатуры (АД, ЧДД, Ps) и числа
- Не добавляй и не убирай содержательные слова — только исправляй ошибки
- Если ошибок нет, верни текст без изменений

Текст:
${text}`,
        },
      ],
    });

    const corrected = message.content[0]?.text ?? text;
    res.json({ corrected });
  } catch (err) {
    console.error('Claude API error:', err);
    res.status(500).json({ error: 'Ошибка обращения к Claude API' });
  }
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
