import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generatePollinationsText } from '@/lib/pollinations';
import { Player, Room } from '@/types/game';

export async function POST(req: NextRequest) {
  try {
    const { roomId, botUserId, phase } = await req.json();

    if (!roomId || !botUserId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch Room & Players
    const { data: room } = await supabase.from('bunker_rooms').select('*').eq('id', roomId).single();
    const { data: players } = await supabase.from('bunker_players').select('*').eq('room_id', roomId);

    if (!room || !players) {
      return NextResponse.json({ error: 'Room or players not found' }, { status: 404 });
    }

    const botPlayer = players.find((p: Player) => p.user_id === botUserId && p.is_bot);
    if (!botPlayer || botPlayer.is_eliminated) {
      return NextResponse.json({ status: 'ignored' });
    }

    const activePlayers = players.filter((p: Player) => !p.is_eliminated);
    const personality = botPlayer.bot_personality || 'strategist';

    if (phase === 'debate' || phase === 'reveal_round') {
      // Build prompt for bot chat statement
      const prompt = `Ты выживший в бункере по имени ${botPlayer.nickname}.
Твоя карточка: Профессия: ${botPlayer.profession}, Здоровье: ${botPlayer.health}, Багаж: ${botPlayer.luggage}, Хобби: ${botPlayer.hobby}.
Катастрофа: ${room.catastrophe_title} (${room.catastrophe_desc}).
В бункере всего ${room.bunker_size} мест для ${activePlayers.length} участников.
Напиши 1-2 кратких убедительных предложения в общий чат, почему тебя нельзя выгонять из бункера.`;

      const systemPrompt = `Ты ИИ-бот с характером ${personality}. Отыгрывай роль выжившего в игре Бункер 2077.`;

      const replyText = await generatePollinationsText(prompt, systemPrompt);

      // Insert message into DB
      await supabase.from('bunker_messages').insert({
        room_id: roomId,
        sender_id: botPlayer.user_id,
        sender_name: botPlayer.nickname,
        is_bot: true,
        bot_personality: personality,
        message: replyText
      });

      return NextResponse.json({ success: true, message: replyText });
    }

    if (phase === 'voting') {
      // Bot chooses a suspect to vote against (anyone except themselves and not eliminated)
      const validSuspects = activePlayers.filter((p: Player) => p.user_id !== botPlayer.user_id);
      if (validSuspects.length > 0) {
        const suspect = validSuspects[Math.floor(Math.random() * validSuspects.length)];
        
        await supabase.from('bunker_votes').upsert({
          room_id: roomId,
          voter_id: botPlayer.user_id,
          suspect_id: suspect.user_id
        }, { onConflict: 'room_id,voter_id' });

        return NextResponse.json({ success: true, votedFor: suspect.nickname });
      }
    }

    return NextResponse.json({ status: 'no_action' });
  } catch (err: any) {
    console.error('Bot turn API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
