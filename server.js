import express from 'express';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const MAX_TEXT_LENGTH = 20000;

// Railway/прокси: доверяем первому прокси, чтобы req.ip был реальным IP клиента
app.set('trust proxy', 1);

app.use(express.json({ limit: '100kb' }));
app.use(express.static(join(__dirname, 'dist')));

const grammarLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Слишком много запросов — попробуйте через минуту' },
});

app.post('/api/grammar', grammarLimiter, async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Текст не передан' });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(413).json({ error: `Текст слишком длинный (максимум ${MAX_TEXT_LENGTH} символов)` });
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

    const textBlock = message.content.find((block) => block.type === 'text');
    const corrected = textBlock?.text ?? text;
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
