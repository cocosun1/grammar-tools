#!/usr/bin/env node
/**
 * expand-modules-to-75.js
 * Expands questions per module to 75 by generating new questions.
 * Uses module_name_zh from LAYERS/modules (moduleGuides.json).
 */

const fs = require("fs");
const path = require("path");

const TARGET = 75;
const QUESTIONS_PATH = path.join(__dirname, "../data/questions.json");
const MODULE_GUIDES_PATH = path.join(__dirname, "../data/moduleGuides.json");

// Layer mapping: modules 1-12 = layer 1, modules 13-18 & 23 = layer 2
function getLayer(moduleId) {
  return moduleId <= 12 ? 1 : 2;
}

// Build module name map from moduleGuides (LAYERS/modules curriculum)
function buildModuleNameMap(guides) {
  const map = {};
  for (const g of guides) {
    if (g.id != null && g.name_zh) map[g.id] = g.name_zh;
  }
  return map;
}

// Build set of existing content keys for deduplication
function buildExistingContent(questions) {
  const set = new Set();
  for (const q of questions) {
    const key = (q.prompt_en || q.question_en || "").toLowerCase().trim();
    if (key) set.add(key);
    if (q.options && Array.isArray(q.options)) {
      const optKey = q.options.join("|").toLowerCase();
      set.add("opt:" + optKey);
    }
  }
  return set;
}

// Content banks for module 2 (名词复数 - noun plurals)
const MOD2_WORD_FORM = [
  { s: "editor", p: "editors", exp: "以 -or 结尾的名词变复数时直接加 -s。" },
  { s: "director", p: "directors", exp: "以 -or 结尾的名词变复数时直接加 -s。" },
  { s: "professor", p: "professors", exp: "以 -or 结尾的名词变复数时直接加 -s。" },
  { s: "constructor", p: "constructors", exp: "以 -or 结尾的名词变复数时直接加 -s。" },
  { s: "inventor", p: "inventors", exp: "以 -or 结尾的名词变复数时直接加 -s。" },
  { s: "coordinator", p: "coordinators", exp: "以 -or 结尾的名词变复数时直接加 -s。" },
  { s: "calculator", p: "calculators", exp: "以 -or 结尾的名词变复数时直接加 -s。" },
  { s: "generator", p: "generators", exp: "以 -or 结尾的名词变复数时直接加 -s。" },
  { s: "operator", p: "operators", exp: "以 -or 结尾的名词变复数时直接加 -s。" },
  { s: "refrigerator", p: "refrigerators", exp: "以 -or 结尾的名词变复数时直接加 -s。" },
  { s: "laboratory", p: "laboratories", exp: "辅音 + y 结尾，变 y 为 i 再加 -es。" },
  { s: "category", p: "categories", exp: "辅音 + y 结尾，变 y 为 i 再加 -es。" },
  { s: "library", p: "libraries", exp: "辅音 + y 结尾，变 y 为 i 再加 -es。" },
  { s: "discovery", p: "discoveries", exp: "辅音 + y 结尾，变 y 为 i 再加 -es。" },
  { s: "factory", p: "factories", exp: "辅音 + y 结尾，变 y 为 i 再加 -es。" },
];
const MOD2_SENTENCE_CORRECTION = [
  { wrong: "Numerous editor attend the meeting.", right: "Numerous editors attend the meeting.", exp: "Numerous 后接可数名词复数，editor 应改为 editors；且主语为复数，谓语用原形 attend。" },
  { wrong: "Numerous director attend the conference.", right: "Numerous directors attend the conference.", exp: "Numerous 后接可数名词复数，director 应改为 directors；且主语为复数，谓语用原形 attend。" },
  { wrong: "I have two sister.", right: "I have two sisters.", exp: "Two 后接复数。" },
  { wrong: "She has three cousin.", right: "She has three cousins.", exp: "Three 后接复数。" },
  { wrong: "They bought five chair.", right: "They bought five chairs.", exp: "Five 后接复数。" },
  { wrong: "We need several desk.", right: "We need several desks.", exp: "Several 后接复数。" },
  { wrong: "Many student participate in the event.", right: "Many students participate in the event.", exp: "Many 后接复数，student 应改为 students。" },
];
const MOD2_SENTENCE_CHOICE = [
  { correct: "Two editors reviewed the document.", wrong: ["Two editor reviewed the document.", "Two editors reviews the document."] },
  { correct: "Three directors attended the meeting.", wrong: ["Three director attended the meeting.", "Three directors attends the meeting."] },
  { correct: "She bought two watches.", wrong: ["She bought two watch.", "She bought two watchs."] },
  { correct: "He has three radios.", wrong: ["He has three radio.", "He has three radios."] },
  { correct: "Many professors teach here.", wrong: ["Many professor teach here.", "Many professors teaches here."] },
];
const MOD2_FILL_CHOICE = [
  { stem: "She hired two ____ last month.", opts: ["editor", "editors"], ans: "editors", exp: "Two 后接可数名词复数。" },
  { stem: "We invited several ____ to the event.", opts: ["director", "directors"], ans: "directors", exp: "Several 后接复数。" },
  { stem: "He owns three ____.", opts: ["radio", "radios"], ans: "radios", exp: "Three 后接复数。" },
  { stem: "They need five ____.", opts: ["desk", "desks"], ans: "desks", exp: "Five 后接复数。" },
  { stem: "I have two ____.", opts: ["key", "keys"], ans: "keys", exp: "Two 后接复数。" },
];

// Module 6: 一般过去时 (simple past)
const MOD6_FILL = [
  { q: "Mary ____ to Berlin last year.", opts: ["go", "went"], ans: "went", exp: "last year 表示过去，用过去式 went。" },
  { q: "Tom ____ his homework two hours ago.", opts: ["finish", "finished"], ans: "finished", exp: "ago 表示过去，用过去式。" },
  { q: "The team ____ the match yesterday.", opts: ["win", "won"], ans: "won", exp: "yesterday 表示过去，用过去式 won。" },
  { q: "She ____ a letter last night.", opts: ["write", "wrote"], ans: "wrote", exp: "last night 表示过去，用过去式 wrote。" },
  { q: "They ____ the movie last weekend.", opts: ["see", "saw"], ans: "saw", exp: "last weekend 表示过去，用过去式 saw。" },
  { q: "He ____ his keys at home this morning.", opts: ["leave", "left"], ans: "left", exp: "this morning 表示过去时，用 left。" },
  { q: "We ____ pizza for dinner last night.", opts: ["have", "had"], ans: "had", exp: "last night 表示过去，用 had。" },
  { q: "The meeting ____ at 3 pm.", opts: ["start", "started"], ans: "started", exp: "过去发生的事用过去式 started。" },
  { q: "I ____ my friend at the station yesterday.", opts: ["meet", "met"], ans: "met", exp: "yesterday 表示过去，meet 的过去式是 met。" },
  { q: "She ____ English when she was young.", opts: ["study", "studied"], ans: "studied", exp: "was 表示过去，动词用 studied。" },
  { q: "They ____ the house last month.", opts: ["sell", "sold"], ans: "sold", exp: "last month 表示过去，sell 的过去式是 sold。" },
  { q: "He ____ the door and left.", opts: ["close", "closed"], ans: "closed", exp: "过去发生的动作用 closed。" },
  { q: "I ____ a new car last year.", opts: ["buy", "bought"], ans: "bought", exp: "last year 表示过去，buy 的过去式是 bought。" },
  { q: "She ____ to the party alone.", opts: ["come", "came"], ans: "came", exp: "过去发生的动作用 came。" },
  { q: "We ____ the problem together.", opts: ["solve", "solved"], ans: "solved", exp: "过去完成的动作用 solved。" },
];
const MOD6_SENTENCE = [
  { wrong: "She go to school yesterday.", right: "She went to school yesterday.", exp: "yesterday 表示过去，动词用过去式 went。" },
  { wrong: "He finish his work last week.", right: "He finished his work last week.", exp: "last week 表示过去，用过去式 finished。" },
  { wrong: "They see the film two days ago.", right: "They saw the film two days ago.", exp: "ago 表示过去，see 的过去式是 saw。" },
  { wrong: "I leave early yesterday.", right: "I left early yesterday.", exp: "yesterday 表示过去，leave 的过去式是 left。" },
  { wrong: "She make a cake last night.", right: "She made a cake last night.", exp: "make 的过去式是 made。" },
  { wrong: "We take the bus last Monday.", right: "We took the bus last Monday.", exp: "take 的过去式是 took。" },
  { wrong: "He break the window.", right: "He broke the window.", exp: "break 的过去式是 broke。" },
  { wrong: "They give me a gift.", right: "They gave me a gift.", exp: "give 的过去式是 gave。" },
  { wrong: "She speak to him yesterday.", right: "She spoke to him yesterday.", exp: "speak 的过去式是 spoke。" },
  { wrong: "I think about it last week.", right: "I thought about it last week.", exp: "think 的过去式是 thought。" },
];

// Module 7: 现在进行时 (present continuous)
const MOD7_FILL = [
  { q: "She ____ a book right now.", opts: ["read", "is reading"], ans: "is reading", exp: "right now 表示此刻，用现在进行时 is + -ing。" },
  { q: "They ____ football at the moment.", opts: ["play", "are playing"], ans: "are playing", exp: "at the moment 表示此刻，用 are + -ing。" },
  { q: "I ____ dinner now.", opts: ["cook", "am cooking"], ans: "am cooking", exp: "now 表示此刻，用 am + -ing。" },
  { q: "He ____ a letter.", opts: ["write", "is writing"], ans: "is writing", exp: "此刻正在进行的动作用 is + -ing。" },
  { q: "The children ____ in the garden.", opts: ["run", "are running"], ans: "are running", exp: "此刻正在进行的动作用 are + -ing。" },
  { q: "Mom ____ in the kitchen.", opts: ["cook", "is cooking"], ans: "is cooking", exp: "正在进行的动作用 is cooking。" },
  { q: "The students ____ their tests.", opts: ["take", "are taking"], ans: "are taking", exp: "此刻进行的动作用 are taking。" },
  { q: "I ____ for the bus.", opts: ["wait", "am waiting"], ans: "am waiting", exp: "此刻进行的动作用 am waiting。" },
  { q: "She ____ to music right now.", opts: ["listen", "is listening"], ans: "is listening", exp: "right now 用现在进行时 is listening。" },
  { q: "They ____ a new house.", opts: ["build", "are building"], ans: "are building", exp: "正在进行的动作用 are building。" },
  { q: "He ____ his car in the garage.", opts: ["fix", "is fixing"], ans: "is fixing", exp: "此刻进行的动作用 is fixing。" },
  { q: "We ____ for the exam.", opts: ["study", "are studying"], ans: "are studying", exp: "此刻进行的动作用 are studying。" },
  { q: "The baby ____.", opts: ["sleep", "is sleeping"], ans: "is sleeping", exp: "此刻进行的动作用 is sleeping。" },
  { q: "She ____ her hair.", opts: ["wash", "is washing"], ans: "is washing", exp: "此刻进行的动作用 is washing。" },
  { q: "They ____ lunch in the cafeteria.", opts: ["have", "are having"], ans: "are having", exp: "此刻进行的动作用 are having。" },
  { q: "I ____ a picture.", opts: ["draw", "am drawing"], ans: "am drawing", exp: "此刻进行的动作用 am drawing。" },
  { q: "He ____ a shower at the moment.", opts: ["take", "is taking"], ans: "is taking", exp: "at the moment 用现在进行时 is taking。" },
  { q: "The dog ____ in the yard.", opts: ["run", "is running"], ans: "is running", exp: "此刻进行的动作用 is running。" },
  { q: "She ____ on the phone.", opts: ["talk", "is talking"], ans: "is talking", exp: "此刻进行的动作用 is talking。" },
  { q: "We ____ a movie at home.", opts: ["watch", "are watching"], ans: "are watching", exp: "此刻进行的动作用 are watching。" },
  { q: "Tom ____ his homework.", opts: ["do", "is doing"], ans: "is doing", exp: "此刻进行的动作用 is doing。" },
  { q: "The birds ____ in the sky.", opts: ["fly", "are flying"], ans: "are flying", exp: "此刻进行的动作用 are flying。" },
  { q: "I ____ my bag.", opts: ["pack", "am packing"], ans: "am packing", exp: "此刻进行的动作用 am packing。" },
  { q: "She ____ a sweater.", opts: ["knit", "is knitting"], ans: "is knitting", exp: "此刻进行的动作用 is knitting。" },
  { q: "They ____ to the airport.", opts: ["drive", "are driving"], ans: "are driving", exp: "此刻进行的动作用 are driving。" },
];
const MOD7_SENTENCE = [
  { wrong: "She read a book now.", right: "She is reading a book now.", exp: "now 表示此刻，用现在进行时 is reading。" },
  { wrong: "They play games at the moment.", right: "They are playing games at the moment.", exp: "at the moment 用现在进行时 are playing。" },
  { wrong: "I cook dinner right now.", right: "I am cooking dinner right now.", exp: "right now 用现在进行时 am cooking。" },
  { wrong: "He write a report now.", right: "He is writing a report now.", exp: "now 用现在进行时 is writing。" },
  { wrong: "The children run in the park.", right: "The children are running in the park.", exp: "正在进行的动作用 are running。" },
  { wrong: "She talk on the phone at the moment.", right: "She is talking on the phone at the moment.", exp: "at the moment 用现在进行时 is talking。" },
  { wrong: "We watch TV right now.", right: "We are watching TV right now.", exp: "right now 用现在进行时 are watching。" },
  { wrong: "He fix his bike now.", right: "He is fixing his bike now.", exp: "now 用现在进行时 is fixing。" },
  { wrong: "They wait for the bus.", right: "They are waiting for the bus.", exp: "正在进行的动作用 are waiting。" },
  { wrong: "I listen to music at the moment.", right: "I am listening to music at the moment.", exp: "at the moment 用现在进行时 am listening。" },
  { wrong: "She sleep in her room.", right: "She is sleeping in her room.", exp: "正在进行的动作用 is sleeping。" },
];

// Module 8: 过去进行时 (past continuous)
const MOD8_FILL = [
  { q: "I ____ when the phone rang.", opts: ["was sleeping", "am sleeping"], ans: "was sleeping", exp: "过去某时正在进行的动作用 was + -ing。" },
  { q: "They ____ TV at 8 pm yesterday.", opts: ["were watching", "are watching"], ans: "were watching", exp: "过去某时正在进行的动作用 were + -ing。" },
  { q: "She ____ dinner when I arrived.", opts: ["was cooking", "is cooking"], ans: "was cooking", exp: "when 从句表示过去某时，主句用过去进行时。" },
  { q: "He ____ when the doorbell rang.", opts: ["was reading", "is reading"], ans: "was reading", exp: "过去某时正在进行的动作用 was + -ing。" },
  { q: "We ____ in the garden when it rained.", opts: ["were sitting", "are sitting"], ans: "were sitting", exp: "过去某时正在进行的动作用 were + -ing。" },
  { q: "The children ____ when mom called.", opts: ["were playing", "are playing"], ans: "were playing", exp: "过去某时正在进行的动作用 were + -ing。" },
  { q: "I ____ my homework when the power went out.", opts: ["was doing", "am doing"], ans: "was doing", exp: "过去某时正在进行的动作用 was doing。" },
  { q: "She ____ to music when I knocked.", opts: ["was listening", "is listening"], ans: "was listening", exp: "过去某时正在进行的动作用 was listening。" },
  { q: "They ____ dinner at 7 pm last night.", opts: ["were having", "are having"], ans: "were having", exp: "过去某时正在进行的动作用 were having。" },
  { q: "Tom ____ his car when I saw him.", opts: ["was washing", "is washing"], ans: "was washing", exp: "过去某时正在进行的动作用 was washing。" },
  { q: "We ____ for the bus when it started to snow.", opts: ["were waiting", "are waiting"], ans: "were waiting", exp: "过去某时正在进行的动作用 were waiting。" },
  { q: "She ____ a book when the lights went out.", opts: ["was reading", "is reading"], ans: "was reading", exp: "过去某时正在进行的动作用 was reading。" },
  { q: "He ____ a shower when you called.", opts: ["was taking", "is taking"], ans: "was taking", exp: "过去某时正在进行的动作用 was taking。" },
  { q: "The students ____ when the bell rang.", opts: ["were writing", "are writing"], ans: "were writing", exp: "过去某时正在进行的动作用 were writing。" },
  { q: "I ____ a letter when she arrived.", opts: ["was writing", "am writing"], ans: "was writing", exp: "过去某时正在进行的动作用 was writing。" },
];
const MOD8_SENTENCE = [
  { wrong: "I am sleeping when the phone rang.", right: "I was sleeping when the phone rang.", exp: "when 从句表示过去，主句用过去进行时 was sleeping。" },
  { wrong: "They are watching TV at 8 pm yesterday.", right: "They were watching TV at 8 pm yesterday.", exp: "yesterday 表示过去，用 were watching。" },
  { wrong: "She is cooking when I arrived.", right: "She was cooking when I arrived.", exp: "arrived 表示过去，主句用 was cooking。" },
  { wrong: "He is reading when the doorbell rang.", right: "He was reading when the doorbell rang.", exp: "rang 表示过去，主句用 was reading。" },
  { wrong: "We are waiting when it started to rain.", right: "We were waiting when it started to rain.", exp: "started 表示过去，主句用 were waiting。" },
];

// Module 9: 现在完成时 (present perfect)
const MOD9_FILL = [
  { q: "She ____ her homework already.", opts: ["finished", "has finished"], ans: "has finished", exp: "already 常与现在完成时连用，用 has + 过去分词。" },
  { q: "I ____ that film before.", opts: ["saw", "have seen"], ans: "have seen", exp: "before 表示经历，用 have + 过去分词。" },
  { q: "They ____ to Paris.", opts: ["went", "have been"], ans: "have been", exp: "表示去过某地用 have been。" },
  { q: "He ____ the report yet.", opts: ["hasn't finished", "didn't finish"], ans: "hasn't finished", exp: "yet 常与现在完成时连用。" },
  { q: "We ____ each other since 2015.", opts: ["have known", "knew"], ans: "have known", exp: "since 表示从过去到现在，用 have + 过去分词。" },
  { q: "She ____ here for three years.", opts: ["has lived", "lived"], ans: "has lived", exp: "for + 时间段 与现在完成时连用。" },
  { q: "They ____ the project.", opts: ["have completed", "completed"], ans: "have completed", exp: "强调对现在的影响用现在完成时。" },
  { q: "I ____ my keys. I can't find them.", opts: ["have lost", "lost"], ans: "have lost", exp: "对现在有影响，用 have lost。" },
  { q: "He has never ____ sushi.", opts: ["eaten", "ate"], ans: "eaten", exp: "现在完成时用 have/has + 过去分词，eat 的过去分词是 eaten。" },
  { q: "We have just ____ lunch.", opts: ["had", "have"], ans: "had", exp: "just 与现在完成时连用，have 的过去分词是 had。" },
  { q: "She ____ to London twice.", opts: ["has been", "went"], ans: "has been", exp: "表示经历用 has been。" },
  { q: "The train ____ yet.", opts: ["hasn't arrived", "didn't arrive"], ans: "hasn't arrived", exp: "yet 与现在完成时连用。" },
  { q: "I ____ this book before.", opts: ["have read", "read"], ans: "have read", exp: "before 表示经历，用 have read。" },
  { q: "They ____ married for ten years.", opts: ["have been", "were"], ans: "have been", exp: "for + 时间段 与现在完成时连用。" },
  { q: "He ____ his passport.", opts: ["has lost", "lost"], ans: "has lost", exp: "强调对现在的影响用 has lost。" },
  { q: "We ____ the news yet.", opts: ["haven't heard", "didn't hear"], ans: "haven't heard", exp: "yet 与现在完成时连用。" },
  { q: "She ____ here since Monday.", opts: ["has been", "was"], ans: "has been", exp: "since 表示从过去到现在。" },
  { q: "I have already ____ the email.", opts: ["sent", "send"], ans: "sent", exp: "already 与现在完成时连用，send 的过去分词是 sent。" },
  { q: "They have just ____.", opts: ["left", "leave"], ans: "left", exp: "just 与现在完成时连用，leave 的过去分词是 left。" },
  { q: "He has never ____ to Japan.", opts: ["been", "went"], ans: "been", exp: "表示经历用 have/has been。" },
  { q: "She ____ never late to class.", opts: ["has been", "was"], ans: "has been", exp: "表示从过去到现在的状态用 have/has been。" },
  { q: "I have already ____ my breakfast.", opts: ["eaten", "ate"], ans: "eaten", exp: "already 与现在完成时连用，eat 的过去分词是 eaten。" },
  { q: "They ____ the assignment yet.", opts: ["haven't completed", "didn't complete"], ans: "haven't completed", exp: "yet 与现在完成时连用。" },
  { q: "He ____ here since last year.", opts: ["has worked", "worked"], ans: "has worked", exp: "since 表示从过去到现在。" },
  { q: "We ____ that song before.", opts: ["have heard", "heard"], ans: "have heard", exp: "before 表示经历。" },
  { q: "She ____ her phone.", opts: ["has broken", "broke"], ans: "has broken", exp: "强调对现在的影响用 has broken。" },
  { q: "I ____ this movie before.", opts: ["have seen", "saw"], ans: "have seen", exp: "before 表示经历。" },
  { q: "The rain ____ stopped.", opts: ["has", "had"], ans: "has", exp: "现在完成时用 has + 过去分词。" },
  { q: "She has ____ finished the report.", opts: ["just", "just now"], ans: "just", exp: "just 与现在完成时连用。" },
  { q: "They ____ to China three times.", opts: ["have been", "went"], ans: "have been", exp: "表示经历用 have been。" },
  { q: "He ____ his wallet.", opts: ["has found", "found"], ans: "has found", exp: "强调对现在的影响用 has found。" },
  { q: "I have never ____ such a beautiful place.", opts: ["seen", "saw"], ans: "seen", exp: "never 与现在完成时连用，see 的过去分词是 seen。" },
];
const MOD9_SENTENCE = [
  { wrong: "She finish her homework already.", right: "She has finished her homework already.", exp: "already 与现在完成时连用，用 has finished。" },
  { wrong: "I see that film before.", right: "I have seen that film before.", exp: "before 表示经历，用 have seen。" },
  { wrong: "They go to Paris.", right: "They have been to Paris.", exp: "表示去过某地用 have been。" },
  { wrong: "He didn't finish the report yet.", right: "He hasn't finished the report yet.", exp: "yet 与现在完成时连用。" },
  { wrong: "We know each other since 2015.", right: "We have known each other since 2015.", exp: "since 用 have known。" },
  { wrong: "She live here for three years.", right: "She has lived here for three years.", exp: "for + 时间段 用 has lived。" },
  { wrong: "I lose my keys. I can't find them.", right: "I have lost my keys. I can't find them.", exp: "强调对现在的影响用 have lost。" },
  { wrong: "She break her phone.", right: "She has broken her phone.", exp: "强调对现在的影响用 has broken。" },
  { wrong: "They complete the project yet.", right: "They have completed the project already.", exp: "already/yet 与现在完成时连用。" },
  { wrong: "He work here since 2020.", right: "He has worked here since 2020.", exp: "since 用 has worked。" },
  { wrong: "We see that movie before.", right: "We have seen that movie before.", exp: "before 表示经历，用 have seen。" },
  { wrong: "The train arrive yet.", right: "The train has not arrived yet.", exp: "yet 与现在完成时连用。" },
];

// Module 10: 将来时 (future)
const MOD10_FILL = [
  { q: "She ____ her grandmother tomorrow.", opts: ["visits", "will visit"], ans: "will visit", exp: "tomorrow 表示将来，用 will + 动词原形。" },
  { q: "We ____ a test next week.", opts: ["have", "will have"], ans: "will have", exp: "next week 表示将来，用 will + 动词原形。" },
  { q: "They ____ to the party.", opts: ["come", "will come"], ans: "will come", exp: "将来时用 will + 动词原形。" },
  { q: "I ____ you later.", opts: ["call", "will call"], ans: "will call", exp: "later 表示将来，用 will call。" },
  { q: "He ____ the meeting next Monday.", opts: ["attend", "will attend"], ans: "will attend", exp: "next Monday 表示将来。" },
  { q: "We ____ dinner at 7 pm.", opts: ["have", "will have"], ans: "will have", exp: "将来时用 will have。" },
  { q: "She ____ a doctor when she grows up.", opts: ["become", "will become"], ans: "will become", exp: "将来时用 will become。" },
  { q: "They ____ the project by Friday.", opts: ["finish", "will finish"], ans: "will finish", exp: "by Friday 表示将来完成。" },
  { q: "I ____ to the store tomorrow.", opts: ["go", "will go"], ans: "will go", exp: "tomorrow 表示将来。" },
  { q: "He ____ his car next month.", opts: ["sell", "will sell"], ans: "will sell", exp: "next month 表示将来。" },
  { q: "We ____ a new house next year.", opts: ["buy", "will buy"], ans: "will buy", exp: "next year 表示将来。" },
  { q: "She ____ the exam next week.", opts: ["take", "will take"], ans: "will take", exp: "next week 表示将来。" },
  { q: "They ____ us soon.", opts: ["join", "will join"], ans: "will join", exp: "soon 表示将来。" },
  { q: "I ____ you at the airport.", opts: ["meet", "will meet"], ans: "will meet", exp: "将来时用 will meet。" },
  { q: "He ____ back in an hour.", opts: ["come", "will come"], ans: "will come", exp: "in an hour 表示将来。" },
  { q: "We ____ the results tomorrow.", opts: ["get", "will get"], ans: "will get", exp: "tomorrow 表示将来。" },
  { q: "She ____ a party next Saturday.", opts: ["have", "will have"], ans: "will have", exp: "next Saturday 表示将来。" },
  { q: "They ____ the train at 5 pm.", opts: ["catch", "will catch"], ans: "will catch", exp: "将来时用 will catch。" },
  { q: "I ____ for you.", opts: ["wait", "will wait"], ans: "will wait", exp: "将来时用 will wait。" },
  { q: "He ____ you the answer soon.", opts: ["tell", "will tell"], ans: "will tell", exp: "soon 表示将来。" },
  { q: "We ____ the report by next Monday.", opts: ["submit", "will submit"], ans: "will submit", exp: "by next Monday 表示将来。" },
  { q: "She ____ back next Monday.", opts: ["return", "will return"], ans: "will return", exp: "next Monday 表示将来。" },
  { q: "He ____ the job next month.", opts: ["start", "will start"], ans: "will start", exp: "next month 表示将来。" },
  { q: "They ____ the conference next week.", opts: ["attend", "will attend"], ans: "will attend", exp: "next week 表示将来。" },
  { q: "I ____ the package tomorrow.", opts: ["send", "will send"], ans: "will send", exp: "tomorrow 表示将来。" },
  { q: "We ____ you when we arrive.", opts: ["contact", "will contact"], ans: "will contact", exp: "将来时用 will contact。" },
  { q: "She ____ her exam next Tuesday.", opts: ["take", "will take"], ans: "will take", exp: "next Tuesday 表示将来。" },
  { q: "He ____ the letter tonight.", opts: ["write", "will write"], ans: "will write", exp: "tonight 表示将来。" },
  { q: "They ____ the house next year.", opts: ["move", "will move"], ans: "will move", exp: "next year 表示将来。" },
  { q: "I ____ the meeting in an hour.", opts: ["join", "will join"], ans: "will join", exp: "in an hour 表示将来。" },
  { q: "We ____ dinner together tomorrow.", opts: ["have", "will have"], ans: "will have", exp: "tomorrow 表示将来。" },
  { q: "She ____ the presentation next Friday.", opts: ["give", "will give"], ans: "will give", exp: "next Friday 表示将来。" },
  { q: "He ____ you a call later.", opts: ["give", "will give"], ans: "will give", exp: "later 表示将来。" },
  { q: "They ____ the contract by tomorrow.", opts: ["sign", "will sign"], ans: "will sign", exp: "by tomorrow 表示将来。" },
  { q: "I ____ the report by next Friday.", opts: ["complete", "will complete"], ans: "will complete", exp: "by next Friday 表示将来。" },
  { q: "We ____ the tickets online.", opts: ["book", "will book"], ans: "will book", exp: "将来时用 will book。" },
  { q: "She ____ the office at 5 pm.", opts: ["leave", "will leave"], ans: "will leave", exp: "将来时用 will leave。" },
  { q: "He ____ the project next month.", opts: ["complete", "will complete"], ans: "will complete", exp: "next month 表示将来。" },
];
const MOD10_SENTENCE = [
  { wrong: "She visit her grandmother tomorrow.", right: "She will visit her grandmother tomorrow.", exp: "tomorrow 用将来时 will visit。" },
  { wrong: "We have a test next week.", right: "We will have a test next week.", exp: "next week 用将来时 will have。" },
  { wrong: "I call you later.", right: "I will call you later.", exp: "later 用将来时 will call。" },
  { wrong: "He attend the meeting next Monday.", right: "He will attend the meeting next Monday.", exp: "next Monday 用 will attend。" },
  { wrong: "They finish the project by Friday.", right: "They will finish the project by Friday.", exp: "by Friday 用 will finish。" },
  { wrong: "She return next Monday.", right: "She will return next Monday.", exp: "next Monday 用 will return。" },
  { wrong: "He start the job next month.", right: "He will start the job next month.", exp: "next month 用 will start。" },
  { wrong: "I send the package tomorrow.", right: "I will send the package tomorrow.", exp: "tomorrow 用 will send。" },
  { wrong: "They attend the conference next week.", right: "They will attend the conference next week.", exp: "next week 用 will attend。" },
  { wrong: "We have dinner together tomorrow.", right: "We will have dinner together tomorrow.", exp: "tomorrow 用 will have。" },
  { wrong: "She give the presentation next Friday.", right: "She will give the presentation next Friday.", exp: "next Friday 用 will give。" },
  { wrong: "He write the letter tonight.", right: "He will write the letter tonight.", exp: "tonight 用 will write。" },
];

// Module 11: 主谓一致 (subject-verb agreement)
const MOD11_FILL = [
  { q: "Everyone ____ a ticket.", opts: ["has", "have"], ans: "has", exp: "Everyone 作主语时谓语用单数。" },
  { q: "The group of students ____ waiting.", opts: ["is", "are"], ans: "is", exp: "The group 作主语时谓语用单数。" },
  { q: "Nobody ____ the answer.", opts: ["knows", "know"], ans: "knows", exp: "Nobody 作主语时谓语用单数。" },
  { q: "Each of the books ____ interesting.", opts: ["is", "are"], ans: "is", exp: "Each of 作主语时谓语用单数。" },
  { q: "Somebody ____ at the door.", opts: ["is knocking", "are knocking"], ans: "is knocking", exp: "Somebody 作主语时谓语用单数。" },
  { q: "Either Tom or Mary ____ coming.", opts: ["is", "are"], ans: "is", exp: "either...or 就近原则，Mary 是单数。" },
  { q: "Neither of the options ____ good.", opts: ["is", "are"], ans: "is", exp: "Neither of 作主语时谓语用单数。" },
  { q: "One of the students ____ absent.", opts: ["was", "were"], ans: "was", exp: "One of 作主语时谓语用单数。" },
  { q: "Everybody ____ ready.", opts: ["is", "are"], ans: "is", exp: "Everybody 作主语时谓语用单数。" },
  { q: "The news ____ surprising.", opts: ["is", "are"], ans: "is", exp: "news 是不可数名词，谓语用单数。" },
  { q: "Mathematics ____ difficult for some students.", opts: ["is", "are"], ans: "is", exp: "Mathematics 作学科名时谓语用单数。" },
  { q: "A lot of time ____ been wasted.", opts: ["has", "have"], ans: "has", exp: "time 是不可数，谓语用单数。" },
  { q: "None of the milk ____ left.", opts: ["is", "are"], ans: "is", exp: "milk 是不可数，谓语用单数。" },
  { q: "The number of students ____ increasing.", opts: ["is", "are"], ans: "is", exp: "The number of 作主语时谓语用单数。" },
  { q: "A number of students ____ absent.", opts: ["were", "was"], ans: "were", exp: "A number of 表示许多，谓语用复数。" },
  { q: "Someone ____ waiting for you.", opts: ["is", "are"], ans: "is", exp: "Someone 作主语时谓语用单数。" },
  { q: "Five dollars ____ enough for lunch.", opts: ["is", "are"], ans: "is", exp: "金额作为整体时谓语用单数。" },
  { q: "Five years ____ a long time.", opts: ["is", "are"], ans: "is", exp: "时间段作为整体时谓语用单数。" },
  { q: "Bread and butter ____ his usual breakfast.", opts: ["is", "are"], ans: "is", exp: "bread and butter 作为一种食物时谓语用单数。" },
  { q: "The police ____ looking for the suspect.", opts: ["are", "is"], ans: "are", exp: "police 作主语时谓语用复数。" },
  { q: "Neither John nor his friends ____ there.", opts: ["were", "was"], ans: "were", exp: "neither...nor 就近原则，friends 是复数。" },
  { q: "Not only Tom but also his parents ____ coming.", opts: ["are", "is"], ans: "are", exp: "not only...but also 就近原则，parents 是复数。" },
  { q: "Each student ____ a book.", opts: ["has", "have"], ans: "has", exp: "Each 作主语时谓语用单数。" },
  { q: "Every man and woman ____ invited.", opts: ["was", "were"], ans: "was", exp: "Every...and... 作主语时谓语用单数。" },
  { q: "There ____ a book and two pens on the desk.", opts: ["is", "are"], ans: "is", exp: "there be 就近原则，a book 是单数。" },
  { q: "There ____ two pens and a book on the desk.", opts: ["are", "is"], ans: "are", exp: "there be 就近原则，two pens 是复数。" },
  { q: "Everybody ____ invited to the party.", opts: ["was", "were"], ans: "was", exp: "Everybody 作主语时谓语用单数。" },
  { q: "Anyone ____ welcome to join.", opts: ["is", "are"], ans: "is", exp: "Anyone 作主语时谓语用单数。" },
  { q: "Everybody ____ their best.", opts: ["does", "do"], ans: "does", exp: "Everybody 作主语时谓语用单数。" },
  { q: "Ten miles ____ a long way to walk.", opts: ["is", "are"], ans: "is", exp: "距离作为整体时谓语用单数。" },
  { q: "The committee ____ divided on the issue.", opts: ["is", "are"], ans: "is", exp: "committee 作整体时谓语用单数。" },
  { q: "Two thirds of the cake ____ gone.", opts: ["is", "are"], ans: "is", exp: "分数修饰不可数名词时谓语用单数。" },
  { q: "Two thirds of the students ____ absent.", opts: ["were", "was"], ans: "were", exp: "分数修饰可数复数时谓语用复数。" },
  { q: "All of the water ____ spilled.", opts: ["has", "have"], ans: "has", exp: "water 是不可数，谓语用单数。" },
  { q: "All of the books ____ on the shelf.", opts: ["are", "is"], ans: "are", exp: "books 是复数，谓语用复数。" },
  { q: "Physics ____ his favorite subject.", opts: ["is", "are"], ans: "is", exp: "Physics 作学科名时谓语用单数。" },
  { q: "Politics ____ complicated.", opts: ["is", "are"], ans: "is", exp: "Politics 作学科名时谓语用单数。" },
  { q: "The majority ____ in favor.", opts: ["is", "are"], ans: "is", exp: "The majority 作整体时谓语用单数。" },
  { q: "No one ____ the answer.", opts: ["knows", "know"], ans: "knows", exp: "No one 作主语时谓语用单数。" },
  { q: "Nothing ____ wrong.", opts: ["is", "are"], ans: "is", exp: "Nothing 作主语时谓语用单数。" },
  { q: "Either option ____ fine.", opts: ["is", "are"], ans: "is", exp: "Either 作主语时谓语用单数。" },
  { q: "Neither answer ____ correct.", opts: ["is", "are"], ans: "is", exp: "Neither 作主语时谓语用单数。" },
  { q: "The scissors ____ sharp.", opts: ["are", "is"], ans: "are", exp: "scissors 是复数形式，谓语用复数。" },
  { q: "Mumps ____ a common childhood illness.", opts: ["is", "are"], ans: "is", exp: "Mumps 作疾病名时谓语用单数。" },
  { q: "The staff ____ very helpful.", opts: ["was", "were"], ans: "was", exp: "staff 作整体时谓语用单数。" },
  { q: "A pair of shoes ____ on the floor.", opts: ["is", "are"], ans: "is", exp: "a pair 作主语时谓语用单数。" },
  { q: "Three pairs of socks ____ in the drawer.", opts: ["are", "is"], ans: "are", exp: "pairs 是复数，谓语用复数。" },
  { q: "Half of the students ____ late.", opts: ["were", "was"], ans: "were", exp: "half of + 复数名词，谓语用复数。" },
  { q: "Half of the cake ____ left.", opts: ["is", "are"], ans: "is", exp: "half of + 不可数名词，谓语用单数。" },
];
const MOD11_SENTENCE = [
  { wrong: "Everyone in the class have a book.", right: "Everyone in the class has a book.", exp: "Everyone 作主语时谓语用单数 has。" },
  { wrong: "Somebody need help.", right: "Somebody needs help.", exp: "Somebody 作主语时谓语用单数 needs。" },
  { wrong: "Nobody know the answer.", right: "Nobody knows the answer.", exp: "Nobody 作主语时谓语用单数 knows。" },
  { wrong: "Each of the students have a pen.", right: "Each of the students has a pen.", exp: "Each of 作主语时谓语用单数 has。" },
  { wrong: "Neither of the options were good.", right: "Neither of the options was good.", exp: "Neither of 作主语时谓语用单数 was。" },
  { wrong: "The news are surprising.", right: "The news is surprising.", exp: "news 是不可数名词，谓语用单数 is。" },
  { wrong: "Somebody are at the door.", right: "Somebody is at the door.", exp: "Somebody 作主语时谓语用单数 is。" },
  { wrong: "Everybody were ready.", right: "Everybody was ready.", exp: "Everybody 作主语时谓语用单数 was。" },
  { wrong: "One of the students were absent.", right: "One of the students was absent.", exp: "One of 作主语时谓语用单数 was。" },
  { wrong: "The number of students are increasing.", right: "The number of students is increasing.", exp: "The number of 作主语时谓语用单数 is。" },
  { wrong: "A number of students was absent.", right: "A number of students were absent.", exp: "A number of 表示许多，谓语用复数 were。" },
  { wrong: "The news are bad.", right: "The news is bad.", exp: "news 是不可数，谓语用单数 is。" },
  { wrong: "Someone are calling you.", right: "Someone is calling you.", exp: "Someone 作主语时谓语用单数 is。" },
  { wrong: "Each of the boys have a toy.", right: "Each of the boys has a toy.", exp: "Each of 作主语时谓语用单数 has。" },
  { wrong: "Neither of the answers were right.", right: "Neither of the answers was right.", exp: "Neither of 作主语时谓语用单数 was。" },
  { wrong: "Everybody want to go.", right: "Everybody wants to go.", exp: "Everybody 作主语时谓语用单数 wants。" },
  { wrong: "Five dollars are enough.", right: "Five dollars is enough.", exp: "金额作为整体时谓语用单数。" },
  { wrong: "Mathematics are hard.", right: "Mathematics is hard.", exp: "学科名作主语时谓语用单数。" },
];

// Module 12: 情态动词 (modal verbs)
const MOD12_FILL = [
  { q: "You ____ complete the form.", opts: ["must", "must to"], ans: "must", exp: "must 后接动词原形，不加 to。" },
  { q: "____ I use your phone?", opts: ["May", "May to use"], ans: "May", exp: "May I 后接动词原形，不加 to。" },
  { q: "She ____ speak three languages.", opts: ["can", "can to"], ans: "can", exp: "can 后接动词原形。" },
  { q: "You ____ see a doctor about that.", opts: ["should", "should to"], ans: "should", exp: "should 后接动词原形。" },
  { q: "It ____ snow tonight.", opts: ["might", "might to"], ans: "might", exp: "might 表示可能，后接动词原形。" },
  { q: "You ____ not smoke here.", opts: ["must", "must to"], ans: "must", exp: "must not 表示禁止，后接动词原形。" },
  { q: "____ I borrow your pen?", opts: ["Could", "Could to"], ans: "Could", exp: "Could I 后接动词原形。" },
  { q: "He ____ be at home now.", opts: ["may", "may to"], ans: "may", exp: "may 表示可能，后接 be。" },
  { q: "We ____ leave early tomorrow.", opts: ["should", "should to"], ans: "should", exp: "should 后接动词原形。" },
  { q: "She ____ drive when she was 18.", opts: ["could", "could to"], ans: "could", exp: "could 表示能力，后接动词原形。" },
  { q: "You ____ try this cake.", opts: ["must", "must to"], ans: "must", exp: "must 表示建议，后接动词原形。" },
  { q: "I ____ help you with that.", opts: ["can", "can to"], ans: "can", exp: "can 后接动词原形。" },
  { q: "They ____ have arrived by now.", opts: ["might", "might to"], ans: "might", exp: "might 表示推测，后接 have + 过去分词。" },
  { q: "We ____ not go out in the rain.", opts: ["should", "should to"], ans: "should", exp: "should not 表示建议不要。" },
  { q: "He ____ speak German fluently.", opts: ["can", "can to"], ans: "can", exp: "can 表示能力。" },
  { q: "____ you pass the salt?", opts: ["Could", "Could to pass"], ans: "Could", exp: "Could you 后接动词原形，不加 to。" },
  { q: "You ____ be careful.", opts: ["must", "must to"], ans: "must", exp: "must 表示必须。" },
  { q: "She ____ not come to the party.", opts: ["may", "may to"], ans: "may", exp: "may not 表示可能不。" },
  { q: "We ____ ask for permission.", opts: ["should", "should to"], ans: "should", exp: "should 表示应该。" },
  { q: "He ____ have left already.", opts: ["might", "might to"], ans: "might", exp: "might 表示推测。" },
  { q: "I ____ not find my keys.", opts: ["can", "can to"], ans: "can", exp: "can not 表示不能。" },
  { q: "You ____ wear a seatbelt.", opts: ["must", "must to"], ans: "must", exp: "must 表示必须。" },
  { q: "She ____ play the piano well.", opts: ["can", "can to"], ans: "can", exp: "can 表示能力。" },
  { q: "We ____ wait for the bus.", opts: ["must", "must to"], ans: "must", exp: "must 后接动词原形。" },
  { q: "He ____ be right.", opts: ["could", "could to"], ans: "could", exp: "could 表示可能。" },
  { q: "They ____ not enter without a ticket.", opts: ["may", "may to"], ans: "may", exp: "may not 表示不允许。" },
  { q: "You ____ pay before leaving.", opts: ["must", "must to"], ans: "must", exp: "must 后接动词原形。" },
  { q: "She ____ swim very well.", opts: ["can", "can to"], ans: "can", exp: "can 表示能力。" },
  { q: "We ____ not forget to lock the door.", opts: ["must", "must to"], ans: "must", exp: "must not 表示禁止。" },
  { q: "He ____ be asleep by now.", opts: ["might", "might to"], ans: "might", exp: "might 表示推测。" },
  { q: "____ you open the window?", opts: ["Could", "Could to open"], ans: "Could", exp: "Could you 后接动词原形，不加 to。" },
  { q: "I ____ not understand the question.", opts: ["can", "can to"], ans: "can", exp: "can not 表示不能。" },
  { q: "You ____ take your time.", opts: ["may", "may to"], ans: "may", exp: "may 表示许可。" },
  { q: "She ____ have forgotten.", opts: ["might", "might to"], ans: "might", exp: "might 表示推测。" },
  { q: "We ____ start without him.", opts: ["should", "should to"], ans: "should", exp: "should 表示建议。" },
  { q: "He ____ not be telling the truth.", opts: ["may", "may to"], ans: "may", exp: "may not 表示可能不。" },
  { q: "They ____ arrive soon.", opts: ["might", "might to"], ans: "might", exp: "might 表示可能。" },
  { q: "You ____ check the schedule.", opts: ["should", "should to"], ans: "should", exp: "should 表示建议。" },
  { q: "I ____ help you with that.", opts: ["can", "can to"], ans: "can", exp: "can 表示能力或愿意。" },
  { q: "She ____ not have known.", opts: ["might", "might to"], ans: "might", exp: "might not 表示可能不。" },
  { q: "We ____ be late.", opts: ["may", "may to"], ans: "may", exp: "may 表示可能。" },
  { q: "He ____ try again.", opts: ["should", "should to"], ans: "should", exp: "should 表示建议。" },
  { q: "____ I help you?", opts: ["May", "May to"], ans: "May", exp: "May I 后接动词原形。" },
  { q: "You ____ read the instructions first.", opts: ["must", "must to"], ans: "must", exp: "must 表示必须。" },
  { q: "They ____ not have seen it.", opts: ["could", "could to"], ans: "could", exp: "could not 表示可能不。" },
];
const MOD12_SENTENCE = [
  { wrong: "You must to submit the form.", right: "You must submit the form.", exp: "must 后接动词原形，不加 to。" },
  { wrong: "Could I to have some water?", right: "Could I have some water?", exp: "Could I 后接动词原形。" },
  { wrong: "She can to speak English.", right: "She can speak English.", exp: "can 后接动词原形。" },
  { wrong: "You should to see a doctor.", right: "You should see a doctor.", exp: "should 后接动词原形。" },
  { wrong: "We may to go to the party.", right: "We may go to the party.", exp: "may 后接动词原形。" },
  { wrong: "He must to finish his homework.", right: "He must finish his homework.", exp: "must 后接动词原形。" },
  { wrong: "I could to help you.", right: "I could help you.", exp: "could 后接动词原形。" },
  { wrong: "They might to be late.", right: "They might be late.", exp: "might 后接动词原形。" },
  { wrong: "You have to must come early.", right: "You must come early.", exp: "must 与 have to 不能同时用。" },
  { wrong: "Can I to use your phone?", right: "Can I use your phone?", exp: "Can I 后接动词原形。" },
  { wrong: "You must to pay before leaving.", right: "You must pay before leaving.", exp: "must 后接动词原形。" },
  { wrong: "She can to swim well.", right: "She can swim well.", exp: "can 后接动词原形。" },
  { wrong: "We must not to forget.", right: "We must not forget.", exp: "must not 后接动词原形。" },
  { wrong: "He may to be late.", right: "He may be late.", exp: "may 后接动词原形。" },
  { wrong: "They could to help us.", right: "They could help us.", exp: "could 后接动词原形。" },
  { wrong: "I should to go now.", right: "I should go now.", exp: "should 后接动词原形。" },
  { wrong: "She might to arrive soon.", right: "She might arrive soon.", exp: "might 后接动词原形。" },
  { wrong: "We can to do it.", right: "We can do it.", exp: "can 后接动词原形。" },
  { wrong: "He must to leave early.", right: "He must leave early.", exp: "must 后接动词原形。" },
];

function generateModule6To12Questions(moduleId, moduleNameZh, layer, count, existing, seqStart) {
  const newQ = [];
  const used = new Set(existing.map((q) => getContentKey(q)));
  let seq = seqStart;
  const existingArr = Array.isArray(existing) ? existing : existing.questions || [];
  for (const q of existingArr) used.add(getContentKey(q));

  const banks = {
    6: { fill: MOD6_FILL, sentence: MOD6_SENTENCE },
    7: { fill: MOD7_FILL, sentence: MOD7_SENTENCE },
    8: { fill: MOD8_FILL, sentence: MOD8_SENTENCE },
    9: { fill: MOD9_FILL, sentence: MOD9_SENTENCE },
    10: { fill: MOD10_FILL, sentence: MOD10_SENTENCE },
    11: { fill: MOD11_FILL, sentence: MOD11_SENTENCE },
    12: { fill: MOD12_FILL, sentence: MOD12_SENTENCE },
  };
  const bank = banks[moduleId];
  if (!bank) return [];

  for (const item of bank.fill || []) {
    if (newQ.length >= count) break;
    const key = "q:" + (item.q || item.question_en || "").toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    newQ.push({
      id: `q-exp-mod${moduleId}-${String(seq).padStart(3, "0")}`,
      layer,
      module: moduleId,
      module_name_zh: moduleNameZh,
      type: "fill_choice",
      instruction_zh: "请选择正确的词",
      explanation_zh: item.exp,
      difficulty: 1,
      question_en: item.q || item.question_en,
      options: item.opts || item.options,
      answer: item.ans || item.answer,
    });
    seq++;
  }
  for (const item of bank.sentence || []) {
    if (newQ.length >= count) break;
    const key = "q:" + (item.wrong || "").toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    newQ.push({
      id: `q-exp-mod${moduleId}-${String(seq).padStart(3, "0")}`,
      layer,
      module: moduleId,
      module_name_zh: moduleNameZh,
      type: "sentence_correction",
      instruction_zh: "请修改以下句子中的错误",
      explanation_zh: item.exp,
      difficulty: 1,
      question_en: item.wrong,
      answer: item.right,
    });
    seq++;
  }
  return newQ.slice(0, count);
}

function generateModule2Questions(moduleId, moduleNameZh, layer, count, existing, seqStart) {
  const newQ = [];
  let seq = seqStart;
  const existingQ = existing.questions || existing;
  const usedWordForm = new Set(existingQ.filter((q) => q.type === "word_form").map((q) => (q.prompt_en || "").toLowerCase()));
  const usedSent = new Set(existingQ.filter((q) => q.type === "sentence_correction").map((q) => (q.question_en || "").toLowerCase()));
  const usedFill = new Set(existingQ.filter((q) => q.type === "fill_choice").map((q) => (q.question_en || "").toLowerCase()));
  const usedChoice = new Set();

  // Round-robin through types for balanced variation
  const typeConfigs = [
    { type: "word_form", bank: MOD2_WORD_FORM, used: usedWordForm, getKey: (i) => i.s },
    { type: "sentence_correction", bank: MOD2_SENTENCE_CORRECTION, used: usedSent, getKey: (i) => i.wrong },
    { type: "fill_choice", bank: MOD2_FILL_CHOICE, used: usedFill, getKey: (i) => i.stem },
    { type: "sentence_choice", bank: MOD2_SENTENCE_CHOICE, used: usedChoice, getKey: (i) => i.correct },
  ];
  let ti = 0;
  while (newQ.length < count) {
    const cfg = typeConfigs[ti % typeConfigs.length];
    ti++;
    if (cfg.type === "word_form") {
      for (const item of MOD2_WORD_FORM) {
        if (newQ.length >= count) break;
        if (cfg.used.has(item.s)) continue;
        newQ.push({
          id: `q-exp-mod${moduleId}-${String(seq).padStart(3, "0")}`,
          layer,
          module: moduleId,
          module_name_zh: moduleNameZh,
          type: "word_form",
          instruction_zh: "请写出下列名词的复数形式",
          explanation_zh: item.exp,
          difficulty: 1,
          prompt_en: item.s,
          answer: item.p,
        });
        seq++;
        cfg.used.add(item.s);
      }
    } else if (cfg.type === "sentence_correction") {
      for (const item of MOD2_SENTENCE_CORRECTION) {
        if (newQ.length >= count) break;
        if (cfg.used.has(item.wrong.toLowerCase())) continue;
        newQ.push({
          id: `q-exp-mod${moduleId}-${String(seq).padStart(3, "0")}`,
          layer,
          module: moduleId,
          module_name_zh: moduleNameZh,
          type: "sentence_correction",
          instruction_zh: "请修改以下句子中的错误",
          explanation_zh: item.exp,
          difficulty: 1,
          question_en: item.wrong,
          answer: item.right,
        });
        seq++;
        cfg.used.add(item.wrong.toLowerCase());
      }
    } else if (cfg.type === "sentence_choice") {
      for (const item of MOD2_SENTENCE_CHOICE) {
        if (newQ.length >= count) break;
        if (cfg.used.has(item.correct)) continue;
        const opts = [item.correct, ...item.wrong].sort(() => Math.random() - 0.5);
        newQ.push({
          id: `q-exp-mod${moduleId}-${String(seq).padStart(3, "0")}`,
          layer,
          module: moduleId,
          module_name_zh: moduleNameZh,
          type: "sentence_choice",
          instruction_zh: "请选择语法正确的句子",
          explanation_zh: "语法正确的句子使用正确的复数形式。",
          difficulty: 1,
          options: opts,
          answer: item.correct,
        });
        cfg.used.add(item.correct);
        seq++;
      }
    } else if (cfg.type === "fill_choice") {
      for (const item of MOD2_FILL_CHOICE) {
        if (newQ.length >= count) break;
        if (cfg.used.has(item.stem.toLowerCase())) continue;
        newQ.push({
          id: `q-exp-mod${moduleId}-${String(seq).padStart(3, "0")}`,
          layer,
          module: moduleId,
          module_name_zh: moduleNameZh,
          type: "fill_choice",
          instruction_zh: "请选择正确的词",
          explanation_zh: item.exp,
          difficulty: 1,
          question_en: item.stem,
          options: item.opts,
          answer: item.ans,
        });
        seq++;
        cfg.used.add(item.stem.toLowerCase());
      }
    }
    if (newQ.length === 0 && ti > 40) break; // prevent infinite loop
  }
  return newQ.slice(0, count);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function varyPronoun(text, subj) {
  if (!text || typeof text !== "string") return text;
  return text.replace(/\b(She|He|They|I|We|My|Our|His|Her|Their)\b/g, (m) => {
    const map = { She: subj, He: subj, They: subj, I: subj, We: subj };
    const possess = { My: subj + "'s", Our: "Our", His: "His", Her: "Her", Their: "Their" };
    if (possess[m] !== undefined) return subj === "They" ? "Their" : subj === "I" ? "My" : subj === "We" ? "Our" : subj === "He" ? "His" : "Her";
    return map[m] || m;
  });
}

function getContentKey(q) {
  if (q.question_en) return "q:" + q.question_en.toLowerCase().trim();
  if (q.prompt_en) return "p:" + q.prompt_en.toLowerCase().trim();
  if (q.options && Array.isArray(q.options)) return "opt:" + q.options.slice().sort().join("|").toLowerCase();
  return "id:" + q.id;
}

// Generic generator: clone and vary from existing questions (pronoun swaps)
function generateGenericQuestions(moduleId, moduleNameZh, layer, count, existing, seqStart) {
  const newQ = [];
  const usedContentKeys = new Set();
  for (const q of existing) {
    usedContentKeys.add(getContentKey(q));
  }
  let seq = seqStart;
  const subjs = ["She", "He", "They", "I", "We"];
  const pool = existing.slice();
  let attempts = 0;
  const maxAttempts = count * 100;
  let poolIdx = 0;
  while (newQ.length < count && attempts < maxAttempts) {
    attempts++;
    const template = pool[poolIdx % pool.length];
    poolIdx++;
    const subj = subjs[Math.floor(Math.random() * subjs.length)];
    const q = JSON.parse(JSON.stringify(template));
    if (q.question_en) q.question_en = varyPronoun(q.question_en, subj);
    if (q.answer && (q.type === "sentence_correction" || q.type === "sentence_choice")) {
      q.answer = varyPronoun(q.answer, subj);
    }
    if (q.prompt_en) q.prompt_en = varyPronoun(q.prompt_en, subj);
    if (q.options && Array.isArray(q.options)) {
      q.options = q.options.map((opt) => varyPronoun(opt, subj));
    }
    const contentKey = getContentKey(q);
    if (usedContentKeys.has(contentKey)) continue;
    usedContentKeys.add(contentKey);
    q.id = `q-exp-mod${moduleId}-${String(seq).padStart(3, "0")}`;
    q.layer = layer;
    q.module = moduleId;
    q.module_name_zh = moduleNameZh;
    newQ.push(q);
    seq++;
  }
  return newQ;
}

function main() {
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
  const moduleGuides = JSON.parse(fs.readFileSync(MODULE_GUIDES_PATH, "utf8"));
  const moduleNameMap = buildModuleNameMap(moduleGuides);

  const byModule = {};
  for (const q of questions) {
    const m = q.module;
    if (!byModule[m]) byModule[m] = [];
    byModule[m].push(q);
  }

  const modulesToExpand = Object.keys(byModule)
    .map(Number)
    .filter((m) => byModule[m].length < TARGET)
    .sort((a, b) => a - b);

  if (modulesToExpand.length === 0) {
    console.log("All modules already have at least 75 questions. Nothing to do.");
    return;
  }

  console.log("Modules to expand to 75:");
  for (const m of modulesToExpand) {
    const name = moduleNameMap[m] || (byModule[m][0] && byModule[m][0].module_name_zh) || `Module ${m}`;
    const need = TARGET - byModule[m].length;
    console.log(`  Module ${m} (${name}): ${byModule[m].length} -> need ${need}`);
  }

  const allNew = [];
  for (const moduleId of modulesToExpand) {
    const existing = byModule[moduleId];
    const need = TARGET - existing.length;
    const layer = getLayer(moduleId);
    const moduleNameZh = moduleNameMap[moduleId] || (existing[0] && existing[0].module_name_zh) || `Module ${moduleId}`;
    const seqStart = allNew.filter((q) => q.module === moduleId).length + 1;

    let newQuestions;
    if (moduleId === 2) {
      newQuestions = generateModule2Questions(moduleId, moduleNameZh, layer, need, { questions: existing }, seqStart);
    } else if (moduleId >= 6 && moduleId <= 12) {
      newQuestions = generateModule6To12Questions(moduleId, moduleNameZh, layer, need, existing, seqStart);
    } else {
      newQuestions = generateGenericQuestions(moduleId, moduleNameZh, layer, need, existing, seqStart);
    }
    allNew.push(...newQuestions);
    console.log(`  Generated ${newQuestions.length} new questions for module ${moduleId}`);
  }

  const combined = [...questions, ...allNew];
  fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(combined, null, 2), "utf8");
  console.log(`\nTotal: added ${allNew.length} questions. Saved to ${QUESTIONS_PATH}`);
}

main();
