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

    // 2. Fetch Up to 3 Recent Chat Messages (Compact Short Context)
    const { data: recentMessages } = await supabase
      .from('bunker_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(3);

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
      const prompt = `Ты — ${botPlayer.nickname}, выживший у бункера. Профессия: ${botPlayer.profession}, Багаж: ${botPlayer.luggage}.
Катастрофа: ${room.catastrophe_title}. Мест: ${room.bunker_size}.
Чат:
${chatHistoryLog || '(Гермозатвор открыт)'}

${humanPrompt ? `Игрок пишет: "${humanPrompt}". Ответь ему!` : 'Выскажись в чате!'}
Правила: Ответь 1 короткой острой живой фразой на русском без клише. Назови оппонента по имени.`;

      const systemPrompt = `Ты — ${botPlayer.nickname}, выживший у бункера. Запрещен канцелярит. Пиши 1 живую реплику на русском.`;

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
