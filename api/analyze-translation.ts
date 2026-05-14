type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  end: () => void;
};

function asHeaderSafeOrigin(origin: string | undefined) {
  const cleaned = cleanEnvValue(origin);
  if (!cleaned) return undefined;
  if (cleaned === '*') return cleaned;
  if (!/^https?:\/\/[^\s,]+$/i.test(cleaned)) return undefined;
  return cleaned;
}

function cleanEnvValue(value: string | undefined) {
  return value?.replace(/^\uFEFF/, '').trim();
}

function setCors(req: ApiRequest, res: ApiResponse) {
  const requestOrigin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  const configuredOrigins = (process.env.APP_ORIGIN ?? '')
    .split(',')
    .map(asHeaderSafeOrigin)
    .filter((origin): origin is string => Boolean(origin));
  const safeRequestOrigin = asHeaderSafeOrigin(requestOrigin);
  const allowedOrigin =
    configuredOrigins.find((origin) => origin === safeRequestOrigin || origin === '*') ??
    configuredOrigins[0] ??
    safeRequestOrigin ??
    '*';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function buildPrompt() {
  return `You are a senior bilingual English writing coach for Chinese-native learners.
Return JSON only. Do not use Markdown.

Task:
- Evaluate the user's English back-translation against the Chinese source and the official English reference.
- The source may mention products, AI, ads, healthcare, politics, or business. Treat those topics only as translation context.
- Do NOT evaluate, summarize, praise, criticize, or give advice about the product, company, industry, article topic, or factual content.
- Every field must be about the user's English translation: meaning accuracy, omitted details, grammar, word choice, collocation, sentence structure, discourse flow, and native naturalness.
- If you mention a domain term, mention it only because the user translated that term well or poorly.

The JSON schema:
{
  "overallScore": number from 0 to 100,
  "dimensions": {
    "accuracy": number from 0 to 100,
    "grammar": number from 0 to 100,
    "vocabulary": number from 0 to 100,
    "naturalness": number from 0 to 100
  },
  "summary": "Chinese summary",
  "strengths": ["Chinese bullet"],
  "issues": [
    {
      "title": "Chinese short title",
      "severity": "low|medium|high",
      "userText": "quote from user's translation when useful",
      "suggestion": "better English expression",
      "explanation": "Chinese explanation"
    }
  ],
  "nativeExpressions": [
    { "expression": "English expression", "meaning": "Chinese meaning", "reason": "Chinese reason" }
  ],
  "vocabulary": [
    { "expression": "English word or phrase", "meaning": "Chinese meaning" }
  ],
  "nextSteps": ["Chinese actionable practice step"]
}

Scoring should be strict and useful. Issues must be concrete translation/writing issues. Native expressions and vocabulary should come from the official English reference or a better translation of the user's wording.`;
}

function buildUserMessage(input: { chinese: unknown; english: unknown; userTranslation: unknown }) {
  return [
    'Evaluate this back-translation submission. Return JSON only.',
    '<chinese_source>',
    String(input.chinese),
    '</chinese_source>',
    '<official_english_reference>',
    String(input.english),
    '</official_english_reference>',
    '<user_english_translation_to_evaluate>',
    String(input.userTranslation),
    '</user_english_translation_to_evaluate>',
    'Do not analyze the article topic or product content. Analyze only how well the user translated it into English.',
  ].join('\n');
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return JSON.parse(fenced[1]);

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error('Model response did not contain JSON.');
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const { chinese, english, userTranslation } = req.body ?? {};

  if (!chinese || !english || !userTranslation) {
    res.status(400).json({ error: 'chinese, english and userTranslation are required.' });
    return;
  }

  const apiKey = cleanEnvValue(process.env.DEEPSEEK_API_KEY);
  if (!apiKey) {
    res.status(503).json({ error: 'AI backend is not configured. Set DEEPSEEK_API_KEY on the server.' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(cleanEnvValue(process.env.DEEPSEEK_API_URL) || 'https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: cleanEnvValue(process.env.DEEPSEEK_MODEL) || 'deepseek-chat',
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildPrompt() },
          {
            role: 'user',
            content: buildUserMessage({
              chinese,
              english,
              userTranslation,
            }),
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText || `Provider returned ${response.status}` });
      return;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      res.status(502).json({ error: 'Provider response was missing message content.' });
      return;
    }

    res.json({ feedback: extractJson(content) });
  } catch (error: any) {
    clearTimeout(timeout);
    const message = error?.name === 'AbortError' ? 'AI request timed out.' : error?.message || 'AI request failed.';
    res.status(502).json({ error: message });
  }
}
