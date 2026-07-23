import { generateRandomSurvivorCard, PROFESSIONS, HEALTH_CONDITIONS, BOT_NAMES } from '../src/lib/cardBank';
import { CATASTROPHE_PRESETS, getPollinationsImageUrl } from '../src/lib/pollinations';

async function runIntegrationTests() {
  console.log('🧪 Starting Integration Test Suite for Bunker 2077...');

  // Test 1: Card Generator Output
  const card = generateRandomSurvivorCard();
  console.log('Test 1 - Generated Survivor Card:', card);

  if (!PROFESSIONS.includes(card.profession)) {
    throw new Error('Invalid profession generated');
  }
  if (!HEALTH_CONDITIONS.includes(card.health)) {
    throw new Error('Invalid health condition generated');
  }
  console.log('✅ Test 1 PASSED: Card generator produces valid data structure.');

  // Test 2: Catastrophe presets
  if (CATASTROPHE_PRESETS.length < 3) {
    throw new Error('Catastrophe presets list is incomplete');
  }
  const imgUrl = getPollinationsImageUrl(CATASTROPHE_PRESETS[0].imagePrompt, 123);
  if (!imgUrl.startsWith('https://image.pollinations.ai/prompt/')) {
    throw new Error('Pollinations image URL builder failed');
  }
  console.log('✅ Test 2 PASSED: Pollinations image URL builder works:', imgUrl);

  // Test 3: Bot names pool integrity
  if (!BOT_NAMES.panic || !BOT_NAMES.cynic || !BOT_NAMES.strategist) {
    throw new Error('Bot names pool missing personalities');
  }
  console.log('✅ Test 3 PASSED: Bot personalities name bank is valid.');

  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

runIntegrationTests().catch((err) => {
  console.error('❌ Integration Test Failed:', err);
  process.exit(1);
});
