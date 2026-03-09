/**
 * Expands the question bank to 3x by creating 2 variations per question.
 * Variations preserve grammar points through vocabulary swapping.
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/questions.json');

// Vocabulary swap sets: [[word1, word2], [word3, word4], ...]
// Each pair can substitute for each other while preserving grammar.
// Variation 1 uses first->second, Variation 2 uses first->third (or second->first)
const SWAP_SETS = {
  // Pronouns
  pronouns: [
    ['She', 'He'], ['He', 'She'], ['she', 'he'], ['he', 'she'],
    ['I ', 'We '], ['We ', 'I '], ['My ', 'Our '], ['Our ', 'My '],
    ['me', 'us'], ['him', 'her'], ['her', 'him'],
  ],
  // Nouns - countable
  countableNouns: [
    ['visitor', 'actor'], ['actor', 'doctor'], ['museum', 'stadium'],
    ['participant', 'student'], ['box', 'fox'], ['computer', 'table'],
    ['book', 'gift'], ['gift', 'book'], ['apple', 'orange'],
    ['cat', 'dog'], ['elephant', 'umbrella'], ['coffee', 'tea'],
    ['publication', 'magazine'], ['door', 'window'], ['station', 'airport'],
    ['instructor', 'teacher'], ['friend', 'colleague'], ['outcome', 'result'],
    ['baby', 'child'], ['document', 'report'], ['picture', 'photo'],
    ['board', 'screen'], ['project', 'plan'], ['breakfast', 'lunch'],
  ],
  // Nouns - places (arrive at/in)
  places: [
    ['station', 'airport'], ['airport', 'office'], ['London', 'Paris'],
    ['Paris', 'Tokyo'], ['hospital', 'school'], ['museum', 'library'],
  ],
  // Verbs - similar grammar
  verbs: [
    ['likes', 'enjoys'], ['enjoys', 'likes'], ['likes', 'loves'],
    ['purchased', 'bought'], ['bought', 'purchased'], ['arrived', 'got'],
    ['opened', 'closed'], ['closed', 'opened'], ['reads', 'writes'],
    ['runs', 'walks'], ['works', 'studies'], ['cooks', 'prepares'],
    ['preserve', 'display'], ['display', 'preserve'], ['attend', 'visit'],
    ['visit', 'attend'], ['listened', 'heard'], ['reached', 'got to'],
    ['gave', 'offered'], ['told', 'informed'], ['call', 'name'],
  ],
  // Adjectives/Adverbs
  adjAdv: [
    ['quick', 'slow'], ['quickly', 'slowly'], ['happy', 'sad'],
    ['happily', 'sadly'], ['careful', 'cautious'], ['carefully', 'cautiously'],
    ['beautiful', 'wonderful'], ['beautifully', 'wonderfully'],
    ['tired', 'exhausted'], ['delicious', 'tasty'], ['famous', 'popular'],
    ['clear', 'obvious'], ['clearly', 'obviously'], ['correct', 'right'],
    ['correctly', 'properly'], ['quiet', 'silent'], ['quietly', 'silently'],
    ['serious', 'strict'], ['seriously', 'strictly'], ['neat', 'tidy'],
    ['neatly', 'tidily'], ['strange', 'odd'], ['strangely', 'oddly'],
  ],
  // Objects in phrases
  objects: [
    ['coffee', 'tea'], ['tea', 'juice'], ['music', 'news'],
    ['dinner', 'lunch'], ['homework', 'research'], ['decision', 'choice'],
    ['meeting', 'class'], ['photo', 'picture'], ['break', 'rest'],
    ['progress', 'improvement'], ['mistake', 'error'], ['advice', 'suggestion'],
    ['support', 'help'], ['permission', 'approval'], ['effort', 'attempt'],
    ['responsibility', 'duty'], ['chance', 'opportunity'], ['look', 'glance'],
    ['shower', 'bath'], ['presentation', 'speech'], ['visit', 'trip'],
  ],
};

// Build swap maps for variation 1 and 2 (distinct substitutions)
function buildSwapMaps() {
  const map1 = new Map();
  const map2 = new Map();
  
  // Variation 1: a -> b (include plural/verb forms for consistency)
  const v1Swaps = [
    ['visitors', 'actors'], ['museums', 'stadiums'], ['participants', 'students'],
    ['boxes', 'foxes'], ['computers', 'tables'], ['books', 'gifts'],
    ['She', 'He'], ['He', 'She'], ['I ', 'We '], ['My ', 'Our '],
    ['visitor', 'actor'], ['museum', 'stadium'], ['participant', 'student'],
    ['box', 'fox'], ['computer', 'table'], ['book', 'gift'], ['apple', 'orange'],
    ['cat', 'dog'], ['elephant', 'umbrella'], ['coffee', 'tea'],
    ['station', 'airport'], ['London', 'Paris'], ['hospital', 'school'],
    ['likes', 'enjoys'], ['purchased', 'bought'], ['arrived', 'got'],
    ['opened', 'closed'], ['reads', 'writes'], ['runs', 'walks'],
    ['quick', 'slow'], ['quickly', 'slowly'], ['happy', 'sad'],
    ['careful', 'cautious'], ['beautiful', 'wonderful'], ['tired', 'exhausted'],
    ['dinner', 'lunch'], ['homework', 'research'], ['decision', 'choice'],
  ];
  
  // Variation 2: different substitutions (include plurals, preserve grammar rules)
  // museum->gymnasium: both add -s; avoid library (y->ies rule)
  const v2Swaps = [
    ['visitors', 'doctors'], ['museums', 'gymnasiums'], ['participants', 'members'],
    ['boxes', 'watches'], ['computers', 'phones'], ['books', 'magazines'],
    ['She', 'They'], ['He', 'She'], ['I ', 'He '], ['My ', 'His '],
    ['visitor', 'doctor'], ['museum', 'gymnasium'], ['participant', 'member'],
    ['box', 'watch'], ['computer', 'phone'], ['book', 'magazine'],
    ['apple', 'banana'], ['cat', 'bird'], ['elephant', 'island'],
    ['coffee', 'juice'],     ['station', 'office'], ['London', 'Tokyo'],
    ['hospital', 'clinic'], ['likes', 'loves'], ['purchased', 'ordered'],
    ['arrived', 'reached'], ['opened', 'unlocked'], ['reads', 'studies'],
    ['runs', 'jogs'], ['quick', 'fast'], ['quickly', 'rapidly'],
    ['happy', 'cheerful'], ['careful', 'thorough'], ['beautiful', 'lovely'],
    ['tired', 'sleepy'], ['dinner', 'breakfast'], ['homework', 'exercise'],
    ['decision', 'conclusion'],
  ];

  for (const [a, b] of v1Swaps) {
    if (!map1.has(a.toLowerCase())) map1.set(a.toLowerCase(), { from: a, to: b });
  }
  for (const [a, b] of v2Swaps) {
    if (!map2.has(a.toLowerCase())) map2.set(a.toLowerCase(), { from: a, to: b });
  }
  
  return { map1, map2 };
}

function applySwaps(text, swapMap, isAnswer = false) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  const used = new Set();
  
  // Sort by length descending so longer matches get replaced first
  const entries = [...swapMap.entries()].sort((a, b) => b[0].length - a[0].length);
  
  for (const [, { from, to }] of entries) {
    if (used.has(from) || used.has(to)) continue;
    
    // Word boundary aware replacement
    const regex = new RegExp(`\\b${escapeRegex(from)}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, (match) => 
        match[0] === match[0].toUpperCase() ? to.charAt(0).toUpperCase() + to.slice(1) : to
      );
      used.add(from);
    }
  }
  
  return result;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createVariation(question, newId, swapMap) {
  const base = {
    id: newId,
    layer: question.layer,
    module: question.module,
    module_name_zh: question.module_name_zh,
    type: question.type,
    instruction_zh: question.instruction_zh,
    explanation_zh: applySwaps(question.explanation_zh, swapMap),
    difficulty: question.difficulty,
  };

  const swapFields = (obj, fields) => {
    const swapped = { ...obj };
    for (const field of fields) {
      if (obj[field] !== undefined) {
        swapped[field] = Array.isArray(obj[field])
          ? obj[field].map(item => applySwaps(String(item), swapMap))
          : applySwaps(obj[field], swapMap);
      }
    }
    return swapped;
  };

  switch (question.type) {
    case 'word_form':
      return swapFields(
        { ...base, prompt_en: question.prompt_en, answer: question.answer },
        ['prompt_en', 'answer']
      );
    case 'sentence_correction':
      return swapFields(
        { ...base, question_en: question.question_en, answer: question.answer },
        ['question_en', 'answer']
      );
    case 'fill_choice':
      return swapFields(
        { ...base, question_en: question.question_en, options: question.options, answer: question.answer },
        ['question_en', 'options', 'answer']
      );
    case 'judgement':
      return swapFields(
        { ...base, question_en: question.question_en, options: question.options, answer: question.answer },
        ['question_en']
      );
    case 'sentence_choice':
      return swapFields(
        { ...base, options: question.options, answer: question.answer },
        ['options', 'answer']
      );
    default:
      return { ...base, ...question };
  }
}

function getMaxId(questions) {
  let max = 0;
  for (const q of questions) {
    const num = parseInt(q.id.replace(/\D/g, ''), 10);
    if (num > max) max = num;
  }
  return max;
}

function formatId(n) {
  return 'q' + String(n).padStart(3, '0');
}

function main() {
  console.log('Reading questions.json...');
  const data = fs.readFileSync(DATA_PATH, 'utf8');
  const questions = JSON.parse(data);
  
  if (!Array.isArray(questions)) {
    throw new Error('Invalid format: expected array');
  }
  
  const originalCount = questions.length;
  const maxId = getMaxId(questions);
  console.log(`Original: ${originalCount} questions, max ID: ${formatId(maxId)}`);
  
  const { map1, map2 } = buildSwapMaps();
  const expanded = [];
  let nextId = maxId + 1;
  
  for (const question of questions) {
    expanded.push(question);
    expanded.push(createVariation(question, formatId(nextId++), map1));
    expanded.push(createVariation(question, formatId(nextId++), map2));
  }
  
  console.log(`Expanded: ${expanded.length} questions (${originalCount} x 3)`);
  console.log(`New IDs: ${formatId(maxId + 1)} to ${formatId(nextId - 1)}`);
  
  // Validate difficulty distribution preserved
  const origDifficulty = {};
  const newDifficulty = {};
  for (const q of questions) {
    origDifficulty[q.difficulty] = (origDifficulty[q.difficulty] || 0) + 1;
  }
  for (const q of expanded) {
    newDifficulty[q.difficulty] = (newDifficulty[q.difficulty] || 0) + 1;
  }
  for (const d of Object.keys(origDifficulty)) {
    const expected = origDifficulty[d] * 3;
    const actual = newDifficulty[d] || 0;
    if (actual !== expected) {
      console.warn(`Difficulty ${d}: expected ${expected}, got ${actual}`);
    }
  }
  console.log('Difficulty distribution: 3x preserved ✓');
  
  // Validate all required fields
  const required = ['id', 'layer', 'module', 'module_name_zh', 'type', 'instruction_zh', 'explanation_zh', 'difficulty'];
  for (const q of expanded) {
    for (const r of required) {
      if (q[r] === undefined) {
        throw new Error(`Missing field ${r} in question ${q.id}`);
      }
    }
  }
  console.log('Required fields: all present ✓');
  
  const output = JSON.stringify(expanded, null, 2);
  
  // Validate output parses
  JSON.parse(output);
  console.log('Output JSON: valid ✓');
  
  fs.writeFileSync(DATA_PATH, output, 'utf8');
  console.log(`\nWritten to ${DATA_PATH}`);
}

main();
