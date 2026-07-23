export function getPollinationsImageUrl(prompt: string, seed: number = Math.floor(Math.random() * 10000)): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=450&nologo=true&seed=${seed}`;
}

export interface CatastropheScenario {
  title: string;
  desc: string;
  imagePrompt: string;
  imageUrl: string;
}

const DYNAMIC_DISASTER_ORIGINS = [
  'Аномальный падение астероида «Орион-9»', 'Тектонический разлом Тихоокеанской плиты', 'Криогенный взрыв стратосферы 2084',
  'Нейротоксичный туман «Вектор-7»', 'Солнечный сверхвыброс Класса X9', 'Инферно-шторм расплавленного ядра',
  'Магнитный коллапс атмосферной сетки', 'Генетический споровый ливень', 'Техногенная катастрофа реактора Сингулярности',
  'Пылевой ураган радиоактивного урана', 'Бактериологическая чума «Анубис-X»', 'Ледниковый импульс послеядерного типа'
];

const DYNAMIC_SURVIVAL_CONDITIONS = [
  'Атмосфера выжжена радиоактивными осадками. На поверхности температура ниже -45°C, выживание возможно только в изолированном бункере.',
  'Воздух отравлен нейротоксичным туманом. Поверхность кишит мутировавшей фауной, укрытие герметизировано свинцовыми затворами.',
  'Мощный электромагнитный импульс уничтожил всю электронику Земли. Бункер питается от замкнутого гидро-генератора.',
  'Кислотные дожди растворяют любые открытые конструкции. Укрытие на глубине 300 метров надежно изолировано.',
  'Бактериологическое заражение 4-го уровня опасности. Системы бункера обеспечивают многоуровневую фильтрацию воздуха и воды.'
];

export async function generateDynamicCatastrophe(): Promise<CatastropheScenario> {
  const prompt = `Сгенерируй уникальный сценарий глобального постапокалипсиса для игры Бункер в формате JSON.
Верни строго JSON объект с полями:
- title (название катастрофы, 2-4 слова, например: "Магнитный конус 2088")
- desc (подробное описание выживания 2-3 предложения)
- imagePrompt (описание сцены на английском языке для генератора картинок, например: "post apocalyptic frozen underground bunker, tactical control room, cinematic render")`;

  const systemPrompt = `Ты создатель атмосферой катастрофы про постапокалипсис. Верни строго JSON.`;

  try {
    const raw = await generatePollinationsText(prompt, systemPrompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title && parsed.desc) {
        const seed = Math.floor(Math.random() * 100000);
        return {
          title: parsed.title,
          desc: parsed.desc,
          imagePrompt: parsed.imagePrompt || 'post apocalyptic underground bunker shelter cinematic render',
          imageUrl: getPollinationsImageUrl(parsed.imagePrompt || 'post apocalyptic underground bunker shelter cinematic render', seed)
        };
      }
    }
  } catch (err) {
    console.warn('Dynamic catastrophe generation fallback triggered:', err);
  }

  // Procedural Fallback
  const title = DYNAMIC_DISASTER_ORIGINS[Math.floor(Math.random() * DYNAMIC_DISASTER_ORIGINS.length)];
  const desc = DYNAMIC_SURVIVAL_CONDITIONS[Math.floor(Math.random() * DYNAMIC_SURVIVAL_CONDITIONS.length)];
  const seed = Math.floor(Math.random() * 100000);
  const imagePrompt = `post apocalyptic ${encodeURIComponent(title)} underground bunker tactical shelter cinematic`;

  return {
    title,
    desc,
    imagePrompt,
    imageUrl: getPollinationsImageUrl(imagePrompt, seed)
  };
}

export async function generatePollinationsText(prompt: string, systemPrompt?: string, botContext?: { nickname?: string; profession?: string; backstory?: string }): Promise<string> {
  try {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      next: { revalidate: 0 }
    });

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 5) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn('Pollinations Text fetch failed, using persona fallback', err);
  }

  // Fallback response generator if network or API has issues
  return generateFallbackBotReply(prompt, systemPrompt, botContext);
}

function generateFallbackBotReply(prompt: string, systemPrompt?: string, botContext?: { nickname?: string; profession?: string; backstory?: string }): string {
  const nick = botContext?.nickname || 'Выживший';
  const prof = botContext?.profession || 'специалист';

  const VARIATION_FALLBACKS = [
    `Как ${prof}, я уверен: в бункере важен калькулируемый учет каждого человека и навыка. Не стоит поддаваться панике.`,
    `У меня есть опыт и реальные навыки (${prof}). Если мы выгоним меня, кто будет решать технические проблемы укрытия?`,
    `Послушайте внимательно: ресурс бункера ограничен. Мы должны оставлять только тех, чьи знания спасут отряд от гибели!`,
    `Я знаю, о чем говорю. Моя профессия (${prof}) — это прямое выживание в первые же месяцы после удара.`,
    `Давайте без эмоций. Каждая кандидатура должна быть обоснована конкретной пользой для коллектива.`
  ];

  return VARIATION_FALLBACKS[Math.floor(Math.random() * VARIATION_FALLBACKS.length)];
}
