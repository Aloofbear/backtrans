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

function setCors(req: ApiRequest, res: ApiResponse) {
  const requestOrigin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  const allowedOrigin = process.env.APP_ORIGIN || requestOrigin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function buildPrompt() {
  return `You are a senior bilingual English writing coach for Chinese-native learners.
Return JSON only. Do not use Markdown.

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

Scoring should be strict and useful. Focus on accuracy, phrasing, collocation, sentence structure, and native naturalness.`;
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

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'AI backend is not configured. Set DEEPSEEK_API_KEY on the server.' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildPrompt() },
          {
            role: 'user',
            content: JSON.stringify({
              chinese,
              originalEnglish: english,
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
