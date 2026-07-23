import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generatePollinationsText } from '@/lib/pollinations';
import { Player, ChatMessage } from '@/types/game';

export async function POST(req: NextRequest) {
  try {
    const { roomId, botUserId, phase, humanPrompt } = await req.json();

    if (!roomId || !botUserId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Fetch Room & Players
    const { data: room } = await supabase.from('bunker_rooms').select('*').eq('id', roomId).single();
    const { data: players } = await supabase.from('bunker_players').select('*').eq('room_id', roomId);

    if (!room || !players) {
      return NextResponse.json({ error: 'Room or players not found' }, { status: 404 });
    }

    const botPlayer = players.find((p: Player) => p.user_id === botUserId && p.is_bot);
    if (!botPlayer || botPlayer.is_eliminated) {
      return NextResponse.json({ status: 'ignored' });
    }

    // 2. Fetch Up to 50 Recent Chat Messages (Memory Context)
    const { data: recentMessages } = await supabase
      .from('bunker_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(50);

    const chatHistoryLog = (recentMessages || [])
      .reverse()
      .map((m: ChatMessage) => `${m.sender_name}: "${m.message}"`)
      .join('\n');

    const activePlayers = players.filter((p: Player) => !p.is_eliminated);

    // Build Public Player Cards Summary
    const survivorsSummary = activePlayers
      .map((p: Player) => {
        const revealed = p.revealed_fields || [];
        const traits: string[] = [];
        if (revealed.includes('profession')) traits.push(`Профессия: ${p.profession}`);
        if (revealed.includes('health')) traits.push(`Здоровье: ${p.health}`);
        if (revealed.includes('luggage')) traits.push(`Багаж: ${p.luggage}`);
        if (revealed.includes('hobby')) traits.push(`Хобби: ${p.hobby}`);
        if (revealed.includes('phobia')) traits.push(`Фобия: ${p.phobia}`);
        if (revealed.includes('extra_info')) traits.push(`Доп: ${p.extra_info}`);
        return `- ${p.nickname} (${p.user_id === botPlayer.user_id ? 'ВЫ' : 'Участник'}): [${traits.join(', ') || 'Карты не раскрыты'}]`;
      })
      .join('\n');

    const unrevealedFields = ['health', 'hobby', 'phobia', 'luggage', 'extra_info', 'special_card'].filter(
      (f) => !(botPlayer.revealed_fields || []).includes(f)
    );

    if (phase === 'debate' || phase === 'reveal_round') {
      const prompt = `Ты — ${botPlayer.nickname}, реальный выживший у бункера.

КАТАСТРОФА: ${room.catastrophe_title} (${room.catastrophe_desc}).
Мест в бункере: ${room.bunker_size}, а претендентов: ${activePlayers.length}.

ТВОЯ ЛИЧНОСТЬ:
- Имя: ${botPlayer.nickname}
- Профессия: ${botPlayer.profession}
- Здоровье: ${botPlayer.health}
- Багаж: ${botPlayer.luggage}
- Хобби: ${botPlayer.hobby}
- Предыстория: ${botPlayer.backstory || 'Выживший со сложной судьбой'}
- Твой характер: ${botPlayer.temperament || 'Реалистичный упрямый выживший'}

СПИСОК УЧАСТНИКОВ И ИХ ОТКРЫТЫЕ КАРТЫ:
${survivorsSummary}

ПОСЛЕДНИЕ РЕПЛИКИ В ЧАТЕ:
${chatHistoryLog || '(Гермозатвор открылся, никто пока не говорил)'}

${humanPrompt ? `Участник (человек) только что сказал: "${humanPrompt}". Ответь прямо ему в лицо!` : 'Выскажись в чате. Ответь на предыдущие реплики или наедь на кого-то из участников по имени!'}

ЖЕСТКИЕ ПРАВИЛА РЕЧИ (НАРУШЕНИЕ = БРАК):
1. НИКАКИХ КЛИШЕ И ОДНОТИПНЫХ ФРАЗ! Запрещены формулы: "Послушайте внимательно", "Моя профессия (X) — это...", "Как X я считаю...", "Ресурс ограничен...".
2. Разговаривай как НАСТОЯЩИЙ живой человек на русском языке! Используй эмоции, подколки, сомневайся в чужом багаже, обращаясь ПО ИМЕНИ к конкретным участникам.
3. Напиши 1-2 ОСТРЫХ, ЕСТЕСТВЕННЫХ предложения.

Если хочешь ДОБРОВОЛЬНО ПОКАЗАТЬ одну из своих нераскрытых карт всем, в самом конце добавь на новой строке:
[REVEAL: название_поля] (например: [REVEAL: luggage]).`;

      const systemPrompt = `Ты — ${botPlayer.nickname}. Живой человек у бункера. Пиши остро, эмоционально и реалистично на русском языке. Запрещены формулы и клише.`;

      const rawReply = await generatePollinationsText(prompt, systemPrompt, {
        nickname: botPlayer.nickname,
        profession: botPlayer.profession,
        backstory: botPlayer.backstory || undefined,
      });

      // Check if bot decided to reveal a card
      let cleanText = rawReply.trim();
      const revealMatch = cleanText.match(/\[REVEAL:\s*([a-z_]+)\]/i);

      if (revealMatch && revealMatch[1]) {
        const fieldToReveal = revealMatch[1].toLowerCase().trim();
        cleanText = cleanText.replace(/\[REVEAL:\s*([a-z_]+)\]/gi, '').trim();

        if (unrevealedFields.includes(fieldToReveal)) {
          const updatedRevealed = [...(botPlayer.revealed_fields || []), fieldToReveal];
          await supabase.from('bunker_players').update({ revealed_fields: updatedRevealed }).eq('id', botPlayer.id);
        }
      }

      // Insert message into DB
      if (cleanText) {
        await supabase.from('bunker_messages').insert({
          room_id: roomId,
          sender_id: botPlayer.user_id,
          sender_name: botPlayer.nickname,
          is_bot: true,
          bot_personality: 'unique',
          message: cleanText,
        });
      }

      return NextResponse.json({ success: true, message: cleanText });
    }

    if (phase === 'voting') {
      const validSuspects = activePlayers.filter((p: Player) => p.user_id !== botPlayer.user_id);
      if (validSuspects.length > 0) {
        const suspectNames = validSuspects.map((s) => s.nickname).join(', ');

        const votePrompt = `Ты — ${botPlayer.nickname}. Настало время голосования за изгнание из бункера.
Катастрофа: ${room.catastrophe_title}. Мест: ${room.bunker_size}.
Доступные кандидаты для изгнания: ${suspectNames}.

Участники:
${survivorsSummary}

Чат:
${chatHistoryLog.slice(-1500)}

Выбери ИМЯ одного кандидата для изгнания и напиши 1 короткую причину.
Формат ответа строго: ИМЯ: Причина`;

        const voteRaw = await generatePollinationsText(votePrompt, `Ты — ${botPlayer.nickname}. Сделай тяжелый выбор.`);
        let chosenSuspect = validSuspects[Math.floor(Math.random() * validSuspects.length)];

        for (const s of validSuspects) {
          if (voteRaw.toLowerCase().includes(s.nickname.toLowerCase())) {
            chosenSuspect = s;
            break;
          }
        }

        // Vote in DB
        await supabase.from('bunker_votes').upsert(
          {
            room_id: roomId,
            voter_id: botPlayer.user_id,
            suspect_id: chosenSuspect.user_id,
          },
          { onConflict: 'room_id,voter_id' }
        );

        // Also post vote explanation to chat
        await supabase.from('bunker_messages').insert({
          room_id: roomId,
          sender_id: botPlayer.user_id,
          sender_name: botPlayer.nickname,
          is_bot: true,
          bot_personality: 'unique',
          message: `☠️ Голосую против ${chosenSuspect.nickname}. ${voteRaw.includes(':') ? voteRaw.split(':')[1].trim() : 'Он менее полезен для выживания отряда.'}`,
        });

        return NextResponse.json({ success: true, votedFor: chosenSuspect.nickname });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Bot turn error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
