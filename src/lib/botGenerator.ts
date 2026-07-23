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

const BACKSTORY_TEMPLATES = [
  {
    story: 'Бывший шеф-повар вокзальной столовой. В рюкзаке несет любимого попугая и чугунную сковородку. Ужасно боится высоты и астматик, но поклялся накормить всех выживших.',
    temp: 'Вспыльчивый, но отходчивый щедрый добряк, обожает еду'
  },
  {
    story: 'Бывший спасатель МЧС. Потерял семью при первичном ударе. Суров, немногословен, готовит отряд к жесткому выживанию и не терпит паникеров.',
    temp: 'Суровый молчаливый прагматик, ценит дисциплину и действие'
  },
  {
    story: '20-летний стример-гидропоник. Уверен, что апокалипсис — это просто жесткий ивент. Притащил с собой фитолампу и надеется развернуть ферму.',
    temp: 'Гиперактивный оптимист с гиковским сленгом'
  },
  {
    story: 'Бывший инженер дизельных подстанций. До последнего чинил локальный генератор. Контужен на правое ухо, верит только цифрам и фактам.',
    temp: 'Осторожный скептик, презирает болтунов и гуманитариев'
  },
  {
    story: 'Пенсионерка-травница. Всю жизнь прожила в тайге. Знает 200 видов съедобных кореньев и ядов. Считает молодежь неженками.',
    temp: 'Ворчливая мудрая бабушка, остра на язык'
  },
  {
    story: 'Следственный эксперт МВД. Всюду ищет подвох и скрытые мотивы. Постоянно записывает реплики выживших в блокнот.',
    temp: 'Хладнокровный дотошный аналитик, склонный к паранойе'
  },
  {
    story: 'Автомеханик-самоучка. Из любого мусора может собрать водяную помпу. Регулярно сыплет техническими поговорками и шутками.',
    temp: 'Простой юморной работяга, ценит прямоту'
  },
  {
    story: 'Учительница физики старших классов. Сохраняет педагогический тон даже во время апокалипсиса и требует от всех вежливости.',
    temp: 'Строгая, требовательная, но глубоко заботливая'
  }
];

export async function generateUniqueBotProfile(catastropheTitle?: string): Promise<GeneratedBotProfile> {
  const prompt = `Сгенерируй уникального персонажа-выжившего для игры Бункер в формате JSON.
Контекст катастрофы: ${catastropheTitle || 'Постапокалипсис'}.

Верни строго JSON объект с ключами:
- nickname (имя/позывной, например: "Дядя Коля «Паяльник»")
- backstory (интересная предыстория 2-3 предложения, драма или юмор)
- temperament (характер и стиль общения)
- profession (профессия)
- health (состояние здоровья)
- hobby (увлечение)
- phobia (страх/фобия)
- luggage (багаж/вещь)
- extra_info (дополнительный факт)
- special_card (спец-способность)`;

  const systemPrompt = `Ты генератор персонажей для драматической игры про выживание в бункере. Верни строго JSON.`;

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

  // Robust Fallback Generator
  const name = NICKNAMES_POOL[Math.floor(Math.random() * NICKNAMES_POOL.length)];
  const backstoryData = BACKSTORY_TEMPLATES[Math.floor(Math.random() * BACKSTORY_TEMPLATES.length)];

  return {
    nickname: name,
    profession: PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)],
    health: HEALTH_CONDITIONS[Math.floor(Math.random() * HEALTH_CONDITIONS.length)],
    hobby: HOBBIES[Math.floor(Math.random() * HOBBIES.length)],
    phobia: PHOBIAS[Math.floor(Math.random() * PHOBIAS.length)],
    luggage: LUGGAGES[Math.floor(Math.random() * LUGGAGES.length)],
    extra_info: EXTRA_INFOS[Math.floor(Math.random() * EXTRA_INFOS.length)],
    special_card: SPECIAL_CARDS[Math.floor(Math.random() * SPECIAL_CARDS.length)],
    backstory: backstoryData.story,
    temperament: backstoryData.temp,
  };
}
