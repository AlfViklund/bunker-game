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
  'Аномальное падение астероида «Орион-9»', 'Тектонический разлом Тихоокеанской плиты', 'Криогенный взрыв стратосферы 2084',
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

  const systemPrompt = `Ты создатель атмосферной катастрофы про постапокалипсис. Верни строго JSON.`;

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

export async function generatePollinationsText(
  prompt: string,
  systemPrompt?: string,
  botContext?: { nickname?: string; profession?: string; backstory?: string }
): Promise<string> {
  const compactPrompt = prompt.slice(0, 450);
  const fullPromptText = systemPrompt ? `${systemPrompt}\n${compactPrompt}` : compactPrompt;

  // 1. Try Free Pollinations Endpoint with Referral Headers
  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://pollinations.ai/',
        'Origin': 'https://pollinations.ai'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: fullPromptText }
        ]
      })
    });

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 5 && !text.includes('402 Payment Required')) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn('Free Pollinations text fetch failed:', err);
  }

  // 2. Try local OmniRoute (for local development on Mac)
  try {
    const oRes = await fetch('http://localhost:20128/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer sk-af6',
      },
      body: JSON.stringify({
        model: 'gem36h',
        messages: [
          { role: 'system', content: systemPrompt || 'Ты выживший у бункера.' },
          { role: 'user', content: compactPrompt }
        ],
      }),
    });

    if (oRes.ok) {
      const rawText = await oRes.text();
      const lines = rawText.split('\n');
      let fullContent = '';
      for (const line of lines) {
        if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.substring(6));
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) fullContent += delta;
          } catch (e) {}
        }
      }
      if (fullContent.trim().length > 3) {
        return fullContent.trim();
      }
    }
  } catch (e) {}

  // 3. Fallback: Multi-dimensional Combinatorial Engine (100% Free & Dynamic)
  return generateProceduralBotReply(botContext);
}

function generateProceduralBotReply(botContext?: { nickname?: string; profession?: string; backstory?: string }): string {
  const nick = botContext?.nickname || 'Выживший';
  const prof = botContext?.profession || 'специалист';

  const INTROS = [
    `Слышьте, вы долго тут язык чесать будете?!`,
    `Так, народ, хватит зубы заговаривать!`,
    `Я повторить могу для особо сообразительных:`,
    `Пока вы тут спорите, гермозатвор от мороза поведет!`,
    `Вы хоть соображаете, что на улице происходит?!`,
    `Завязывайте демагогию устраивать!`,
    `Эй, чудики, опомнитесь!`,
    `Слушайте сюды и не перебивайте!`,
    `У меня терпение уже на исходе!`
  ];

  const CLAIMS = [
    `У меня профессия ${prof}, и без моих навыков вы в первый же месяц загнетесь!`,
    `Я как ${prof} на себе всю техническую часть бункера вытащу!`,
    `Кто из вас вообще разбирается в системах так, как я (${prof})?!`,
    `Мои знания (${prof}) — это прямое выживание всего отряда, а не сопливые обещания!`,
    `Я пробился к убежищу не для того, чтобы от бестолковых попутчиков загнуться!`,
    `Моя подготовка (${prof}) позволит нам продержаться хоть 5 лет на глубине!`
  ];

  const OUTROS = [
    `Живо карты на стол выкатывайте, а не юлите!`,
    `Открывайте свои сумки, не тяните время!`,
    `Давайте по делу решать, кто пользу принесет!`,
    `Если не верите — проверяйте мои карты прямо сейчас!`,
    `Выкатывайте хабар, или я сам за двери вас вытолкаю!`,
    `У нас за бортом минус пятьдесят, решайте быстрее!`
  ];

  const i = INTROS[Math.floor(Math.random() * INTROS.length)];
  const c = CLAIMS[Math.floor(Math.random() * CLAIMS.length)];
  const o = OUTROS[Math.floor(Math.random() * OUTROS.length)];

  return `${i} ${c} ${o}`;
}
