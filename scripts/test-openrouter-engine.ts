import { generatePollinationsText } from '../src/lib/pollinations';

async function testEngine() {
  console.log('Testing OpenRouter Live Engine in Bunker 2077...\n');

  const reply1 = await generatePollinationsText(
    'Участник написал: "Нина ты пизда иди домой". Что ответить?',
    'Ты — Нина Денисова, реальный упрямый выживший у бункера. Пиши 1 живую реплику на русском.'
  );
  console.log('💬 Нина Денисова:', reply1, '\n');

  const reply2 = await generatePollinationsText(
    'Выскажись в чате дебатов против человека.',
    'Ты — Вячеслав Степанов, спасатель МЧС. Пиши 1 живую реплику на русском.'
  );
  console.log('💬 Вячеслав Степанов:', reply2, '\n');
}

testEngine();
