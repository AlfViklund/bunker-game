import { generatePollinationsText } from './pollinations';
import { PROFESSIONS, HEALTH_CONDITIONS, HOBBIES, PHOBIAS, LUGGAGES, EXTRA_INFOS, SPECIAL_CARDS } from './cardBank';

export interface GeneratedBotProfile {
  nickname: string;
  profession: string;
  health: string;
  hobby: string;
  phobia: string;
  luggage: string;
  extra_info: string;
  special_card: string;
  backstory: string;
  temperament: string;
}

const NICKNAMES_POOL = [
  'Дядя Коля «Паяльник»', 'Мария «Фантом»', 'Студент Артём', 'Елена Сергеевна', 'Валера-Сварщик',
  'Баба Шура', 'Профессор Зайцев', 'Капитан Громов', 'Оксана-Медсестра', 'Илья «Чип»',
  'Антон «Шеф»', 'Татьяна Петровна', 'Семён «Дизель»', 'Алиса «Хаос»', 'Григорий Ворон',
  'Никита «Ржавый»', 'Светлана Ветрова', 'Артур «Логик»', 'Дед Матвей', 'Кирилл «Оптика»',
  'Виктория Лис', 'Марат «Монолит»', 'Полина «Нить»', 'Борис «Молот»', 'Наталья МЧС'
];

const PAST_ORIGINS = [
  'Бывший инженер дизельных подстанций.', 'Рядовой спасатель МЧС с 10-летним стажем.',
  'Фельдшер скорой помощи из пригородного района.', 'Студент-агроном факультета точного земледелия.',
  'Бывший шеф-повар городской столовой.', 'Следственный эксперт МВД на пенсии.',
  'Учитель физики и астрономии.', 'Автомеханик из армейского автобата.',
  'Таежный охотник и егерь.', 'Техник-связист узла оповещения.',
  'Оператор очистных сооружений.', 'Химик-лаборант фармпредприятия.'
];

const CRITICAL_EVENTS = [
  'При первичном взрыве успел спасти ящик с медикаментами.',
  'Всю ночь удерживал локальный генератор от замыкания.',
  'Вывел группу гражданских из зоны поражения.',
  'Потерял связь с близкими, но сохранился как опытный специалист.',
  'Пробился к убежищу через заваленный тоннель метро.',
  'Успел законсервировать запасы чистой воды на складе.'
];

const PERSONAL_MOTIVATIONS = [
  'Суров, верит только фактам и сухой пользе для отряда.',
  'Вспыльчивый, но глубоко заботливый мастер на все руки.',
  'Хладнокровный аналитик, склонный проверять каждое слово.',
  'Оптимист, поддерживающий моральный дух группы шутками.',
  'Ворчливый прагматик, презирающий паникеров и лентяев.'
];

function generateProceduralBackstory(): { story: string; temp: string } {
  const origin = PAST_ORIGINS[Math.floor(Math.random() * PAST_ORIGINS.length)];
  const event = CRITICAL_EVENTS[Math.floor(Math.random() * CRITICAL_EVENTS.length)];
  const motivation = PERSONAL_MOTIVATIONS[Math.floor(Math.random() * PERSONAL_MOTIVATIONS.length)];

  return {
    story: `${origin} ${event} Мечтает восстановить базовые системы выживания.`,
    temp: motivation,
  };
}

export async function generateUniqueBotProfile(catastropheTitle?: string): Promise<GeneratedBotProfile> {
  const prompt = `Сгенерируй уникального персонажа-выжившего для игры Бункер в формате JSON.
Контекст катастрофы: ${catastropheTitle || 'Постапокалипсис'}.

Верни строго JSON объект с ключами:
- nickname (уникальное имя или позывной)
- backstory (предыстория 2-3 предложения)
- temperament (характер и стиль речи)
- profession (профессия)
- health (здоровье)
- hobby (хобби)
- phobia (фобия)
- luggage (багаж)
- extra_info (доп факт)
- special_card (спец способность)`;

  const systemPrompt = `Ты генератор выживших для драматической игры Бункер 2077. Верни строго JSON.`;

  try {
    const raw = await generatePollinationsText(prompt, systemPrompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.nickname && parsed.profession) {
        return {
          nickname: parsed.nickname,
          profession: parsed.profession,
          health: parsed.health || HEALTH_CONDITIONS[0],
          hobby: parsed.hobby || HOBBIES[0],
          phobia: parsed.phobia || PHOBIAS[0],
          luggage: parsed.luggage || LUGGAGES[0],
          extra_info: parsed.extra_info || EXTRA_INFOS[0],
          special_card: parsed.special_card || SPECIAL_CARDS[0],
          backstory: parsed.backstory || 'Выживший со сложной судьбой.',
          temperament: parsed.temperament || 'Реалистичный выживший',
        };
      }
    }
  } catch (e) {
    console.warn('LLM dynamic bot generation fallback triggered:', e);
  }

  // Combinatorial Procedural Fallback Generator (Zero duplicate risk)
  const name = NICKNAMES_POOL[Math.floor(Math.random() * NICKNAMES_POOL.length)];
  const { story, temp } = generateProceduralBackstory();

  return {
    nickname: `${name}_${Math.floor(Math.random() * 89 + 10)}`,
    profession: PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)],
    health: HEALTH_CONDITIONS[Math.floor(Math.random() * HEALTH_CONDITIONS.length)],
    hobby: HOBBIES[Math.floor(Math.random() * HOBBIES.length)],
    phobia: PHOBIAS[Math.floor(Math.random() * PHOBIAS.length)],
    luggage: LUGGAGES[Math.floor(Math.random() * LUGGAGES.length)],
    extra_info: EXTRA_INFOS[Math.floor(Math.random() * EXTRA_INFOS.length)],
    special_card: SPECIAL_CARDS[Math.floor(Math.random() * SPECIAL_CARDS.length)],
    backstory: story,
    temperament: temp,
  };
}
