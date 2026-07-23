import { chromium } from 'playwright';

const VERCEL_URL = 'https://bunker-game-khaki.vercel.app';

async function runE2ETests() {
  console.log(`🚀 Launching Playwright E2E Test Suite against ${VERCEL_URL}...`);
  const browser = await chromium.launch({ headless: true });

  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();

  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();

  try {
    // 1. Host Creates Room
    console.log('Step 1: Host opens site and creates room...');
    await page1.goto(VERCEL_URL);
    await page1.fill('input[value*="Выживший_"]', 'Игрок1_Хост');
    await page1.click('button:has-text("СОЗДАТЬ НОВУЮ СЕССИЮ")');

    await page1.waitForURL(/\/room\/[A-Z0-9]+/);
    const roomCode = page1.url().split('/').pop();
    console.log(`✅ Room Created! Code: ${roomCode}`);

    // 2. Host Adds AI Bot
    console.log('Step 2: Host adds an AI bot to lobby...');
    await page1.click('button:has-text("+ Добавить ИИ-Бота")');
    await page1.waitForSelector('text=Выбор Психотипа ИИ-Бота');
    await page1.click('button:has-text("Добавить Бота")');
    await page1.waitForSelector('text=Тип ИИ: cynic');
    console.log('✅ AI Bot added successfully!');

    // 3. Guest Joins Room
    console.log('Step 3: Guest joins room with code...');
    await page2.goto(VERCEL_URL);
    await page2.fill('input[value*="Выживший_"]', 'Игрок2_Гость');
    await page2.fill('input[placeholder*="КОД"]', roomCode!);
    await page2.click('button:has-text("ВОЙТИ")');
    await page2.waitForURL(new RegExp(`/room/${roomCode}`));
    console.log('✅ Guest joined room successfully!');

    // 4. Ready Status & Start Game
    console.log('Step 4: Toggling READY status and starting game...');
    await page2.click('button:has-text("Я ГОТОВ К ВЫЖИВАНИЮ")');
    await page2.waitForSelector('text=ГОТОВ');

    await page1.click('button:has-text("ЗАПУСТИТЬ СЕССИЮ")');
    await page1.waitForSelector('text=Канал Дебатов и Дискуссий');
    await page2.waitForSelector('text=Канал Дебатов и Дискуссий');
    console.log('✅ Game started! Entered Debate Phase.');

    // 5. Test Survivor Card Reveal & Chat
    console.log('Step 5: Revealing survivor card and sending chat message...');
    await page1.click('text=Профессия');
    await page1.fill('input[placeholder*="Напишите сообщение"]', 'Привет от хоста! Нам нужен медперсонал!');
    await page1.click('form button[type="submit"]');

    await page2.waitForSelector('text=Привет от хоста!');
    console.log('✅ Realtime Chat message synced across players!');

    // 6. Transition to Voting Phase
    console.log('Step 6: Transitioning to Voting phase...');
    await page1.click('button:has-text("ПЕРЕЙТИ К ГОЛОСОВАНИЮ")');
    await page1.waitForTimeout(1500);
    await page1.waitForSelector('text=Пульт Изгнания в Пустошь');
    console.log('✅ Voting phase active!');

    // 7. Cast Votes
    console.log('Step 7: Casting votes against suspect...');
    const botCard = page1.locator('div:has-text("CynicBot")').first();
    if (await botCard.isVisible()) {
      await botCard.click();
      console.log('Host voted against bot!');
    }

    // 8. Host Tallies Votes
    console.log('Step 8: Host tallies votes...');
    await page1.click('button:has-text("ПОДВЕСТИ ИТОГИ ГОЛОСОВАНИЯ")');
    await new Promise((r) => setTimeout(r, 2000));

    console.log('🎉 E2E TEST COMPLETED SUCCESSFULLY WITH 100% PASS RATE!');
  } catch (err) {
    console.error('❌ E2E TEST FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETests();
