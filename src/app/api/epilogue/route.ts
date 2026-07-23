import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generatePollinationsText } from '@/lib/pollinations';
import { Player, Room } from '@/types/game';

export async function POST(req: NextRequest) {
  try {
    const { roomId } = await req.json();
    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    const { data: room } = await supabase.from('bunker_rooms').select('*').eq('id', roomId).single();
    const { data: players } = await supabase.from('bunker_players').select('*').eq('room_id', roomId);

    if (!room || !players) {
      return NextResponse.json({ error: 'Room or players not found' }, { status: 404 });
    }

    const survivors = players.filter((p: Player) => !p.is_eliminated);
    const survivorList = survivors.map((s: Player) => `${s.nickname} (${s.profession}, багаж: ${s.luggage})`).join(', ');

    const prompt = `Катастрофа: ${room.catastrophe_title}.
Оставшиеся в бункере выжившие: ${survivorList}.
Напиши краткий эпилог (3-4 абзаца) бортового журнала убежища про то, как эти люди выживали в бункере в течение следующих 5 лет. Удалось ли им наладить быт, спастись и выйти на поверхность?`;

    const systemPrompt = 'Ты бортовой компьютер убежища Бункер 2077. Напиши эпический и атмосферный отчет выживания.';

    const epilogueText = await generatePollinationsText(prompt, systemPrompt);

    // Update room with epilogue log
    await supabase.from('bunker_rooms').update({
      epilogue_log: epilogueText,
      status: 'epilogue'
    }).eq('id', roomId);

    return NextResponse.json({ success: true, epilogue: epilogueText });
  } catch (err: any) {
    console.error('Epilogue API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
