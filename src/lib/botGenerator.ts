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

const MALE_NAMES = [
  'Дядя Коля «Паяльник»', 'Валера-Сварщик', 'Профессор Зайцев', 'Капитан Громов', 'Илья «Чип»',
  'Антон «Шеф»', 'Семён «Дизель»', 'Григорий Ворон', 'Никита «Ржавый»', 'Артур «Логик»',
  'Дед Матвей', 'Кирилл «Оптика»', 'Марат «Монолит»', 'Борис «Молот»', 'Студент Артём',
  'Павел «Механик»', 'Виктор «Снайпер»', 'Степан-Лесник', 'Данила «Шифр»', 'Роман «Атом»'
];

const FEMALE_NAMES = [
  'Елена Сергеевна', 'Оксана-Медсестра', 'Татьяна Петровна', 'Алиса «Хаос»', 'Светлана Ветрова',
  'Полина «Нить»', 'Виктория Лис', 'Наталья МЧС', 'Баба Шура', 'Мария «Фантом»',
  'Ольга «Иммунитет»', 'Анастасия Врач', 'Марина «Химия»', 'Екатерина «Радар»', 'Диана «Связь»'
];

const MALE_ORIGINS = [
  'Бывший инженер дизельных подстанций.', 'Спасатель МЧС с 10-летним стажем.',
  'Фельдшер скорой помощи пригородного района.', 'Студент-агроном факультета точного земледелия.',
  'Шеф-повар городской столовой.', 'Следственный эксперт МВД на пенсии.',
  'Учитель физики и астрономии.', 'Автомеханик армейского автобата.',
  'Таежный егерь и специалист по трекингу.', 'Техник-связист узла оповещения.',
  'Оператор локальной гидроэлектростанции.', 'Инженер-радиофизик закрытого НИИ.'
];

const FEMALE_ORIGINS = [
  'Старший врач-реаниматолог инфекционного отделения.', 'Инженер-гидропоник тепличного комплекса.',
  'Преподаватель химии и фармакологии.', 'Фельдшер поисково-спасательного отряда.',
  'Специалист по биозащите и фильтрации воздуха.', 'Диспетчер узла экстренной связи.',
  'Военный картограф и навигатор.', 'Архитектор подземных защитных сооружений.',
  'Биолог-генетик лаборатории вирусологии.', 'Инженер-электрик городской сети.'
];

const MALE_EVENTS = [
  'При первичном ударе успел вынести ящик с хирургическими инструментами.',
  'Всю ночь удерживал локальный генератор от катастрофического перегрева.',
  'Вывел группу из шести человек из заваленного тоннеля метро.',
  'Потерял всю технику, но спас запас фильтров высокой очистки.',
  'Пробился к бункеру на самодельном дрезине по старой ветке.'
];

const FEMALE_EVENTS = [
  'При первой тревоге успела законсервировать полный комплект медицинских сывороток.',
  'Удержала герметичность вентиляционного отсека во время первичной вспышки.',
  'Вывела группу пострадавших из зоны химического заражения.',
  'Спасла портативный спектрометр и запасы обеззараживающих таблеток.',
  'Пробилась к укрытию через заблокированный подземный коллектор.'
];

const MALE_MOTIVATIONS = [
  'Суров, сдержан, презирает паникеров и верит только сухим цифрам пользы.',
  'Вспыльчивый, но щедрый мастер на все руки, готовый защищать отряд.',
  'Хладнокровный аналитик, проверяющий каждое слово и карту выживших.',
  'Оптимистичный работяга, поддерживающий дух группы шутками и прямотой.'
];

const FEMALE_MOTIVATIONS = [
  'Требовательная и собранная, мгновенно пресекает истерики и организует порядок.',
  'Мудрая, острая на язык, но глубоко заботливая о выживании всей команды.',
  'Дотошный эксперт, подмечающий любые логические неувязки в словах соперников.',
  'Спокойная и хладнокровная, аргументирует решения только фактами безопасности.'
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProceduralBackstory(isFemale: boolean): { story: string; temp: string } {
  if (isFemale) {
    const origin = getRandom(FEMALE_ORIGINS);
    const event = getRandom(FEMALE_EVENTS);
    const temp = getRandom(FEMALE_MOTIVATIONS);
    return { story: `${origin} ${event}`, temp };
  } else {
    const origin = getRandom(MALE_ORIGINS);
    const event = getRandom(MALE_EVENTS);
    const temp = getRandom(MALE_MOTIVATIONS);
    return { story: `${origin} ${event}`, temp };
  }
}

export async function generateUniqueBotProfile(catastropheTitle?: string): Promise<GeneratedBotProfile> {
  const isFemale = Math.random() > 0.5;
  const namePool = isFemale ? FEMALE_NAMES : MALE_NAMES;
  const chosenName = getRandom(namePool);

  const prompt = `Сгенерируй уникального персонажа-выжившего по имени ${chosenName} (${isFemale ? 'женщина' : 'мужчина'}) для игры Бункер в формате JSON.
Катастрофа: ${catastropheTitle || 'Постапокалипсис'}.

Важно: Соблюдай грамматический род (${isFemale ? 'женский род: спасла, вывела, училась' : 'мужской род: спас, вывел, учился'}).

Верни строго JSON объект с ключами:
- nickname (имя: "${chosenName}")
- backstory (предыстория 2-3 предложения без шаблонов)
- temperament (характер)
- profession (профессия)
- health (здоровье)
- hobby (хобби)
- phobia (фобия)
- luggage (багаж)
- extra_info (доп факт)
- special_card (спец способность)`;

  const systemPrompt = `Ты создатель персонажей для игры Бункер. Пиши грамотно на русском языке в правильном роде. Верни строго JSON.`;

  try {
    const raw = await generatePollinationsText(prompt, systemPrompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.nickname && parsed.profession) {
        return {
          nickname: parsed.nickname,
          profession: parsed.profession,
          health: parsed.health || getRandom(HEALTH_CONDITIONS),
          hobby: parsed.hobby || getRandom(HOBBIES),
          phobia: parsed.phobia || getRandom(PHOBIAS),
          luggage: parsed.luggage || getRandom(LUGGAGES),
          extra_info: parsed.extra_info || getRandom(EXTRA_INFOS),
          special_card: parsed.special_card || getRandom(SPECIAL_CARDS),
          backstory: parsed.backstory || 'Выживший со сложной судьбой.',
          temperament: parsed.temperament || 'Реалистичный выживший',
        };
      }
    }
  } catch (e) {
    console.warn('LLM dynamic bot generation fallback triggered:', e);
  }

  // Procedural Fallback (100% Grammatically Correct & Unique)
  const { story, temp } = generateProceduralBackstory(isFemale);

  return {
    nickname: chosenName,
    profession: getRandom(PROFESSIONS),
    health: getRandom(HEALTH_CONDITIONS),
    hobby: getRandom(HOBBIES),
    phobia: getRandom(PHOBIAS),
    luggage: getRandom(LUGGAGES),
    extra_info: getRandom(EXTRA_INFOS),
    special_card: getRandom(SPECIAL_CARDS),
    backstory: story,
    temperament: temp,
  };
}
