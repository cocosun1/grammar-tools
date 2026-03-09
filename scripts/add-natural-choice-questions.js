/**
 * Adds Natural vs Unnatural questions to Layer 2 modules (13, 14, 15, 16, 17, 18, 23)
 */
const fs = require("fs");
const path = require("path");

const QUESTIONS_PATH = path.join(__dirname, "../data/questions.json");

const NATURAL_CHOICE_QUESTIONS = {
  13: [
    { opts: ["The meeting starts at 3pm on Monday.", "The meeting starts on 3pm at Monday."], ans: 0, exp: "钟点用 at，星期几用 on。" },
    { opts: ["I usually have coffee in the morning.", "I usually have coffee on the morning."], ans: 0, exp: "泛指早上用 in the morning，不说 on the morning。" },
    { opts: ["She was born in 2010.", "She was born at 2010."], ans: 0, exp: "年份用 in，不用 at。" },
    { opts: ["We arrived at noon.", "We arrived in noon."], ans: 0, exp: "noon、midnight 用 at。" },
    { opts: ["The store opens at 9 o'clock.", "The store opens in 9 o'clock."], ans: 0, exp: "钟点用 at。" },
    { opts: ["I'll see you on Friday.", "I'll see you at Friday."], ans: 0, exp: "星期几用 on。" },
    { opts: ["He works at night.", "He works in night."], ans: 0, exp: "at night 是固定搭配。" },
    { opts: ["We meet in the afternoon.", "We meet on the afternoon."], ans: 0, exp: "泛指下午用 in the afternoon。" },
    { opts: ["The deadline is on June 15th.", "The deadline is in June 15th."], ans: 0, exp: "具体某日用 on。" },
    { opts: ["They left at midnight.", "They left in midnight."], ans: 0, exp: "midnight 用 at。" },
    { opts: ["She goes to bed at 11pm.", "She goes to bed in 11pm."], ans: 0, exp: "钟点用 at。" },
    { opts: ["We have class on Mondays.", "We have class at Mondays."], ans: 0, exp: "星期几用 on。" },
    { opts: ["I finished the report in two hours.", "I finished the report at two hours."], ans: 0, exp: "表示「在……之内」用 in。" },
    { opts: ["The conference is in January.", "The conference is on January."], ans: 0, exp: "月份用 in。" },
    { opts: ["Call me at lunchtime.", "Call me in lunchtime."], ans: 0, exp: "lunchtime、noon 等时刻用 at。" },
  ],
  14: [
    { opts: ["She works in a hospital.", "She works at a hospital."], ans: 0, exp: "医院作为较大场所用 in；at 强调具体工作地点。" },
    { opts: ["The keys are on the table.", "The keys are at the table."], ans: 0, exp: "物体在表面上用 on。" },
    { opts: ["I'll wait for you at the station.", "I'll wait for you in the station."], ans: 0, exp: "在车站（作为接人点）用 at。" },
    { opts: ["They live in London.", "They live at London."], ans: 0, exp: "城市、国家用 in。" },
    { opts: ["He is at home.", "He is in home."], ans: 0, exp: "at home 是固定搭配。" },
    { opts: ["The bathroom is in the house.", "The bathroom is on the house."], ans: 0, exp: "在建筑物内部用 in。" },
    { opts: ["The office is on the third floor.", "The office is in the third floor."], ans: 0, exp: "楼层用 on。" },
    { opts: ["She is sitting at the desk.", "She is sitting on the desk."], ans: 0, exp: "at the desk 表示在桌前工作；on 表示在桌面上。" },
    { opts: ["The picture hangs on the wall.", "The picture hangs at the wall."], ans: 0, exp: "挂在墙面用 on。" },
    { opts: ["We met at the entrance.", "We met in the entrance."], ans: 0, exp: "门口作为会合点用 at。" },
    { opts: ["He parked the car in the garage.", "He parked the car at the garage."], ans: 0, exp: "车停在车库内用 in。" },
    { opts: ["She was born in Beijing.", "She was born at Beijing."], ans: 0, exp: "城市用 in。" },
    { opts: ["The store is on Main Street.", "The store is in Main Street."], ans: 0, exp: "街道用 on。" },
    { opts: ["I'll see you at the airport.", "I'll see you in the airport."], ans: 0, exp: "机场作为会合点用 at。" },
    { opts: ["The books are in the box.", "The books are on the box."], ans: 0, exp: "在容器内用 in。" },
  ],
  15: [
    { opts: ["She is interested in science.", "She is interested at science."], ans: 0, exp: "interested in 固定搭配。" },
    { opts: ["Please listen to the teacher.", "Please listen the teacher."], ans: 0, exp: "listen 后必须加 to。" },
    { opts: ["I'm waiting for the bus.", "I'm waiting the bus."], ans: 0, exp: "wait for 固定搭配。" },
    { opts: ["He is good at math.", "He is good in math."], ans: 0, exp: "good at 固定搭配。" },
    { opts: ["The key to success is practice.", "The key of success is practice."], ans: 0, exp: "key to 固定搭配。" },
    { opts: ["She depends on her parents.", "She depends to her parents."], ans: 0, exp: "depend on 固定搭配。" },
    { opts: ["We need to talk about the project.", "We need to talk the project."], ans: 0, exp: "talk about 固定搭配。" },
    { opts: ["He is afraid of spiders.", "He is afraid from spiders."], ans: 0, exp: "afraid of 固定搭配。" },
    { opts: ["Please pay attention to the screen.", "Please pay attention the screen."], ans: 0, exp: "pay attention to 固定搭配。" },
    { opts: ["She is satisfied with the result.", "She is satisfied about the result."], ans: 0, exp: "satisfied with 固定搭配。" },
    { opts: ["We're looking for a solution.", "We're looking a solution."], ans: 0, exp: "look for 固定搭配。" },
    { opts: ["The answer to the question is 5.", "The answer of the question is 5."], ans: 0, exp: "answer to 固定搭配。" },
    { opts: ["He is responsible for the project.", "He is responsible to the project."], ans: 0, exp: "responsible for 固定搭配。" },
    { opts: ["She belongs to this team.", "She belongs this team."], ans: 0, exp: "belong to 固定搭配。" },
    { opts: ["I agree with you.", "I agree to you."], ans: 0, exp: "agree with 后接人。" },
  ],
  16: [
    { opts: ["She speaks English well.", "She speaks English good."], ans: 0, exp: "修饰动词用副词 well，good 是形容词。" },
    { opts: ["He runs quickly.", "He runs quick."], ans: 0, exp: "修饰动词用副词 quickly。" },
    { opts: ["The food tastes delicious.", "The food tastes deliciously."], ans: 0, exp: "taste 是系动词，后接形容词。" },
    { opts: ["She looks happy.", "She looks happily."], ans: 0, exp: "look 作系动词时后接形容词。" },
    { opts: ["He works hard.", "He works hardly."], ans: 0, exp: "hard 既可作形容词又可作副词；hardly 意思是「几乎不」。" },
    { opts: ["They drove carefully.", "They drove careful."], ans: 0, exp: "修饰动词用副词 carefully。" },
    { opts: ["The music sounds beautiful.", "The music sounds beautifully."], ans: 0, exp: "sound 作系动词时后接形容词。" },
    { opts: ["She did well on the test.", "She did good on the test."], ans: 0, exp: "did 表示「考得/做得」，用副词 well。" },
    { opts: ["He speaks slowly.", "He speaks slow."], ans: 0, exp: "修饰动词用副词 slowly。" },
    { opts: ["I feel tired.", "I feel tiredly."], ans: 0, exp: "feel 作系动词时后接形容词。" },
    { opts: ["The train moves fast.", "The train moves fastly."], ans: 0, exp: "fast 既是形容词也是副词，没有 fastly。" },
    { opts: ["She answered correctly.", "She answered correct."], ans: 0, exp: "修饰动词用副词 correctly。" },
    { opts: ["He seems nervous.", "He seems nervously."], ans: 0, exp: "seem 作系动词时后接形容词。" },
    { opts: ["They arrived early.", "They arrived earlily."], ans: 0, exp: "early 既是形容词也是副词，没有 earlily。" },
    { opts: ["She writes clearly.", "She writes clear."], ans: 0, exp: "修饰动词用副词 clearly。" },
  ],
  17: [
    { opts: ["She made a decision.", "She did a decision."], ans: 0, exp: "make a decision 固定搭配。" },
    { opts: ["I need to take a break.", "I need to make a break."], ans: 0, exp: "take a break 固定搭配。" },
    { opts: ["He does his homework every day.", "He makes his homework every day."], ans: 0, exp: "do homework 固定搭配。" },
    { opts: ["We had a meeting.", "We made a meeting."], ans: 0, exp: "have a meeting 固定搭配。" },
    { opts: ["She took a photo.", "She made a photo."], ans: 0, exp: "take a photo 固定搭配。" },
    { opts: ["He made a mistake.", "He did a mistake."], ans: 0, exp: "make a mistake 固定搭配。" },
    { opts: ["I need to do some research.", "I need to make some research."], ans: 0, exp: "do research 固定搭配。" },
    { opts: ["They gave a presentation.", "They made a presentation."], ans: 0, exp: "give a presentation 固定搭配。" },
    { opts: ["She paid attention to the details.", "She gave attention to the details."], ans: 0, exp: "pay attention to 固定搭配。" },
    { opts: ["He took care of his mother.", "He made care of his mother."], ans: 0, exp: "take care of 固定搭配。" },
    { opts: ["We had breakfast at 8.", "We took breakfast at 8."], ans: 0, exp: "have breakfast 固定搭配。" },
    { opts: ["She made progress.", "She did progress."], ans: 0, exp: "make progress 固定搭配。" },
    { opts: ["He got a job.", "He took a job."], ans: 0, exp: "get a job 表示找到工作。" },
    { opts: ["Please take a seat.", "Please make a seat."], ans: 0, exp: "take a seat 固定搭配。" },
    { opts: ["She gave him advice.", "She made him advice."], ans: 0, exp: "give advice 固定搭配。" },
  ],
  18: [
    { opts: ["She arrived at the station.", "She arrived the station."], ans: 0, exp: "arrive 是不及物动词，需加 at。" },
    { opts: ["He opened the door.", "He opened."], ans: 0, exp: "open 作及物动词时需要宾语。" },
    { opts: ["She likes coffee.", "She likes."], ans: 0, exp: "like 作及物动词需要宾语。" },
    { opts: ["I waited for the bus.", "I waited the bus."], ans: 0, exp: "wait 不及物，需加 for。" },
    { opts: ["The meeting took place yesterday.", "The meeting took place in yesterday."], ans: 0, exp: "take place 后直接接时间，不加 in。" },
    { opts: ["She gave him a gift.", "She gave to him a gift."], ans: 0, exp: "give 后接间接宾语 + 直接宾语，不说 give to sb sth。" },
    { opts: ["He listened to music.", "He listened music."], ans: 0, exp: "listen 不及物，需加 to。" },
    { opts: ["The baby slept for eight hours.", "The baby slept eight hours."], ans: 0, exp: "sleep 后接时长时用 for。" },
    { opts: ["She works in a hospital.", "She works at a hospital."], ans: 0, exp: "在医院工作用 in。" },
    { opts: ["They discussed the plan.", "They discussed about the plan."], ans: 0, exp: "discuss 是及物动词，不加 about。" },
    { opts: ["He suggested a solution.", "He suggested me a solution."], ans: 0, exp: "suggest 后接 that 从句或 suggest sth to sb。" },
    { opts: ["I agree with you.", "I agree you."], ans: 0, exp: "agree 不及物，需加 with。" },
    { opts: ["She replied to my email.", "She replied my email."], ans: 0, exp: "reply 不及物，需加 to。" },
    { opts: ["The movie was interesting.", "The movie was interestingly."], ans: 0, exp: "系动词后接形容词。" },
    { opts: ["We need to focus on the task.", "We need to focus the task."], ans: 0, exp: "focus 不及物，需加 on。" },
  ],
  23: [
    { opts: ["She arrived at the station.", "She arrived the station."], ans: 0, exp: "arrive 是不及物动词，需加 at。" },
    { opts: ["He opened the door.", "He opened to the door."], ans: 0, exp: "open 是及物动词，直接接宾语。" },
    { opts: ["Please listen to me.", "Please listen me."], ans: 0, exp: "listen 不及物，需加 to。" },
    { opts: ["I'm waiting for the bus.", "I'm waiting the bus."], ans: 0, exp: "wait 不及物，需加 for。" },
    { opts: ["She likes coffee.", "She likes to coffee."], ans: 0, exp: "like 是及物动词，直接接名词。" },
    { opts: ["He disappeared.", "He disappeared himself."], ans: 0, exp: "disappear 是不及物动词，不接宾语。" },
    { opts: ["The meeting happened yesterday.", "The meeting happened in yesterday."], ans: 0, exp: "happen 后直接接时间。" },
    { opts: ["She looked at the picture.", "She looked the picture."], ans: 0, exp: "look 不及物，需加 at。" },
    { opts: ["We discussed the plan.", "We discussed about the plan."], ans: 0, exp: "discuss 是及物动词，不加 about。" },
    { opts: ["He depends on his parents.", "He depends his parents."], ans: 0, exp: "depend 不及物，需加 on。" },
    { opts: ["She married him.", "She married with him."], ans: 0, exp: "marry 作及物动词时直接接宾语。" },
    { opts: ["They agreed with the proposal.", "They agreed the proposal."], ans: 0, exp: "agree 不及物，需加 with。" },
    { opts: ["I reached the office at 9.", "I reached to the office at 9."], ans: 0, exp: "reach 是及物动词，直接接宾语。" },
    { opts: ["She replied to my message.", "She replied my message."], ans: 0, exp: "reply 不及物，需加 to。" },
    { opts: ["The baby slept for eight hours.", "The baby slept eight hours."], ans: 0, exp: "sleep 不及物，表示时长用 for。" },
  ],
};

function main() {
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
  const moduleNames = {
    13: "介词：时间",
    14: "介词：地点",
    15: "常见介词搭配",
    16: "形容词 vs 副词",
    17: "常见动词搭配",
    18: "基础句型结构",
    23: "及物动词 vs 不及物动词",
  };
  const instructionZh = "请选择听起来更自然的英语句子";
  const newQuestions = [];

  for (const [moduleStr, items] of Object.entries(NATURAL_CHOICE_QUESTIONS)) {
    const moduleId = Number(moduleStr);
    const moduleNameZh = moduleNames[moduleId];
    items.forEach((item, i) => {
      const seq = String(i + 1).padStart(3, "0");
      const answer = item.opts[item.ans];
      newQuestions.push({
        id: `q-nat-${moduleId}-${seq}`,
        layer: 2,
        module: moduleId,
        module_name_zh: moduleNameZh,
        type: "natural_choice",
        instruction_zh: instructionZh,
        explanation_zh: item.exp,
        difficulty: 2,
        options: item.opts,
        answer,
      });
    });
  }

  const combined = [...questions, ...newQuestions];
  fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(combined, null, 2), "utf8");
  console.log(`Added ${newQuestions.length} natural_choice questions to questions.json`);
}

main();
