export function getPollinationsImageUrl(prompt: string, seed: number = 42): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=450&nologo=true&seed=${seed}`;
}

export async function generatePollinationsText(prompt: string, systemPrompt?: string): Promise<string> {
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
    console.warn('Pollinations Text fetch failed, using internal tactical fallback', err);
  }

  // Fallback response generator if network or API has issues
  return generateFallbackBotReply(prompt, systemPrompt);
}

function generateFallbackBotReply(prompt: string, systemPrompt?: string): string {
  if (systemPrompt?.includes('panic')) {
    return 'ТРЕВОГА! У нас заканчивается кислород и ресурсы! Посмотрите на наши карты — мы выгоняем самых нужных людей, остановитесь!';
  } else if (systemPrompt?.includes('cynic')) {
    return 'Давайте смотреть на вещи трезво. Бункеру нужны профессионалы с прикладными навыками. Эмоциям здесь не место.';
  } else if (systemPrompt?.includes('strategist')) {
    return 'Проанализировав состав группы и ресурсы убежища, я предлагаю сохранить баланс между медиками и техническими специалистами.';
  }
  return 'Я считаю, что мы должны оценить полезность каждого участника на дистанции в 5 лет выживания в бункере.';
}

export const CATASTROPHE_PRESETS = [
  {
    title: 'Ядерный Супершторм 2077',
    desc: 'Атмосфера выжжена радиоактивными осадками. На поверхности температура ниже -40°C, выживание возможно только в полностью герметичном бункере на глубине 200 метров.',
    imagePrompt: 'Post apocalyptic nuclear winter underground bunker, tactical control room, cinematic atmospheric render'
  },
  {
    title: 'Биологическая Чума "Вектор-9"',
    desc: 'Вырвавшийся из лаборатории мутировавший штамм уничтожает органоиды за считанные часы. Бункер оборудован замкнутой системой фильтрации воздуха.',
    imagePrompt: 'Biohazard underground quarantine vault, hazard green indicators, post apocalyptic shelter'
  },
  {
    title: 'Солнечная Вспышка Класса X',
    desc: 'Мощнейший импульс сжег всю электронику на планете. В бункере работает локальный гидро-генератор и свинцовый экран защиты от излучения.',
    imagePrompt: 'Cyberpunk solar apocalypse underground bunker, tactical monitors, emergency orange lighting'
  }
];
