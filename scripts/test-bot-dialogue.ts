interface Survivor {
  name: string;
  profession: string;
  health: string;
  luggage: string;
  hobby: string;
  backstory: string;
  temperament: string;
  revealed: string[];
}

const survivorsBatch2: Survivor[] = [
  {
    name: 'Капитан Громов',
    profession: 'Спасатель МЧС',
    health: 'Шрам на бедре',
    luggage: 'Гидравлические кусачки и дозиметр',
    hobby: 'Армейский рукопашный бой',
    backstory: 'Бывший спасатель МЧС. Пробился сквозь заваленный коллектор.',
    temperament: 'Суровый молчаливый прагматик, ценит дисциплину и действие.',
    revealed: ['profession', 'luggage'],
  },
  {
    name: 'Елена Сергеевна',
    profession: 'Преподаватель химии',
    health: 'Аллергия на пыль',
    luggage: 'Набор химических реактивов и фильтров',
    hobby: 'Фармакология',
    backstory: 'Учительница химии. Успела спасти фильтры и реагенты для воды.',
    temperament: 'Строгая, требовательная, но заботливая, наводит порядок.',
    revealed: ['profession', 'luggage'],
  },
  {
    name: 'Валера-Сварщик',
    profession: 'Автомеханик-сварщик',
    health: 'Контузия правого уха',
    luggage: 'Газовый резак и сварочные маски',
    hobby: 'Пайка металлов',
    backstory: 'Автомеханик армейского автобата. Удержал генератор от взрыва.',
    temperament: 'Простой юморной работяга, ценит прямоту и железо.',
    revealed: ['profession'],
  },
  {
    name: 'Мария «Фантом»',
    profession: 'Военный картограф',
    health: 'Отличное здоровье',
    luggage: 'Спутникатор и защитный КПК',
    hobby: 'Картография',
    backstory: 'Диспетчер узла экстренной связи. Знает расположение подсетей.',
    temperament: 'Хладнокровный дотошный аналитик, склонный к паранойе.',
    revealed: ['profession', 'health'],
  },
];

const catastrophe = {
  title: 'Криогенный Туман 2084',
  desc: 'На поверхности -50°C и ядовитый туман. Бункер рассчитан строго на 3 человек.',
  bunker_size: 3,
};

async function queryLLM(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const res = await fetch('http://localhost:20128/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer sk-af6',
      },
      body: JSON.stringify({
        model: 'gem36h',
        messages,
      }),
    });

    if (res.ok) {
      const rawText = await res.text();
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
  } catch (err) {}

  return 'Народ, не тяните время! На улице туман подбирается, надо решать!';
}

async function generateBotDialogue(bot: Survivor, chatHistory: string[], humanInput?: string): Promise<string> {
  const activeCount = survivorsBatch2.length + 1;

  const survivorsSummary = survivorsBatch2
    .map((s) => {
      const revInfo = s.revealed.map((f) => `${f}: ${(s as any)[f]}`).join(', ');
      return `- ${s.name}: [${revInfo || 'Данные скрыты'}]`;
    })
    .join('\n');

  const historyText = chatHistory.length > 0 ? chatHistory.slice(-15).join('\n') : '(Гермозатвор открылся)';

  const systemPrompt = `Ты — ${bot.name}, выживший у бункера.

КАТАСТРОФА: ${catastrophe.title} (${catastrophe.desc}).
Мест в бункере: ${catastrophe.bunker_size}, а претендентов: ${activeCount}.

ТВОЯ ЛИЧНОСТЬ:
- Имя: ${bot.name}
- Профессия: ${bot.profession}
- Здоровье: ${bot.health}
- Багаж: ${bot.luggage}
- Хобби: ${bot.hobby}
- Предыстория: ${bot.backstory}
- Твой характер: ${bot.temperament}

СПИСОК ВСЕХ ВЫЖИВШИХ И ИХ ОТКРЫТЫЕ КАРТЫ:
${survivorsSummary}
- Игрок (человек): [Карты не раскрыты]

ПОСЛЕДНИЕ РЕПЛИКИ В ЧАТЕ:
${historyText}

ЖЕСТКИЕ ПРАВИЛА РЕЧИ (НАРУШЕНИЕ = БРАК):
1. НИКАКИХ КЛИШЕ И ОДНОТИПНЫХ ФРАЗ! Запрещены формулы: "Послушайте внимательно", "Моя профессия (X) — это...", "Как X я считаю...", "Ресурс ограничен...".
2. Разговаривай как НАСТОЯЩИЙ живой человек на русском языке! Используй подколки, эмоции, сомневайся в чужом багаже, обращаясь ПО ИМЕНИ к конкретным участникам.
3. Напиши 1-2 ОСТРЫХ, ЕСТЕСТВЕННЫХ предложения.`;

  const userPrompt = humanInput
    ? `Человек (Игрок) только что сказал: "${humanInput}". Ответь прямо ему в лицо!`
    : `Выскажись в чате. Ответь на предыдущие реплики или наедь на кого-то из участников по имени!`;

  return await queryLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);
}

async function runSimulatedSessionBatch2() {
  console.log('====================================================');
  console.log('🤖 ВТОРАЯ СИМУЛЯЦИЯ (ДРУГОЙ СОСТАВ БОТОВ)');
  console.log('====================================================\n');

  const chatLog: string[] = [];

  // Round 1
  console.log('--- ФАЗА 1: Вступление нового состава ---');
  for (const bot of survivorsBatch2) {
    const reply = await generateBotDialogue(bot, chatLog);
    const line = `${bot.name}: ${reply}`;
    chatLog.push(line);
    console.log(line);
    console.log('');
  }

  // Round 2: Human player enters chat
  console.log('\n--- ФАЗА 2: Человек (Игрок) пишет в чат ---');
  const humanMsg = 'Громов, ты со своими кусачками только швы драть будешь! А у Валены газовый резак — он нам затвор заварит!';
  const humanLine = `Игрок (Человек): ${humanMsg}`;
  chatLog.push(humanLine);
  console.log(humanLine);
  console.log('');

  // Round 3: Reactions
  console.log('--- ФАЗА 3: Реакция Громова, Валеры и Елены ---');
  for (const bot of [survivorsBatch2[0], survivorsBatch2[2], survivorsBatch2[1]]) {
    const reply = await generateBotDialogue(bot, chatLog, humanMsg);
    const line = `${bot.name}: ${reply}`;
    chatLog.push(line);
    console.log(line);
    console.log('');
  }

  console.log('====================================================');
  console.log('🎉 СИМУЛЯЦИЯ 2 ЗАВЕРШЕНА');
  console.log('====================================================');
}

runSimulatedSessionBatch2();
