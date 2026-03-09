/** Intro page content for Layer 3 modules */

export interface Layer3IntroKeyPattern {
  category_zh: string;
  items: string[];
}

export interface Layer3IntroMistake {
  wrong_en: string;
  correct_en: string;
  explanation_zh: string;
}

/** Optional: step in "如何快速找到句子主干" section */
export interface Layer3IntroBackboneStep {
  stepTitle_zh: string;
  instruction_zh: string;
  example_en?: string;
  highlight_zh?: string;
}

/** Optional: category in "常见逻辑关系与连接词" with description, connectors, example */
export interface Layer3RelationshipCategory {
  category_zh: string;
  description_zh?: string;
  /** Sub-groups e.g. 原因 + 结果, each with label and items */
  connectorGroups?: { label_zh?: string; items: string[] }[];
  /** Flat list when no sub-groups */
  items?: string[];
  example_en?: string;
  example_note_zh?: string;
}

/** Optional: richer example with structure and backbone breakdown */
export interface Layer3IntroDetailedExample {
  example_en: string;
  structure_zh?: string;
  backbone_en?: string;
  note_zh?: string;
}

export interface Layer3IntroContent {
  moduleId: number;
  moduleName_zh: string;
  skillOverview_zh: string;
  keyPatterns: Layer3IntroKeyPattern[];
  quickExamples: { example_en: string; note_zh?: string }[];
  commonMistakes: Layer3IntroMistake[];
  practiceTypes_zh: string[];
  /** Optional: 如何快速找到句子主干 - step-by-step guide */
  backboneSteps?: Layer3IntroBackboneStep[];
  /** Optional: 常见从句信号词 - replaces keyPatterns when using detailed format */
  signalWords?: Layer3IntroKeyPattern[];
  /** Optional: 常见逻辑关系与连接词 - richer format for clause relationships */
  relationshipCategories?: Layer3RelationshipCategory[];
  /** Optional: 示例分析 - richer examples with structure breakdown */
  detailedExamples?: Layer3IntroDetailedExample[];
  /** Optional: 这些能力可以帮助你 - benefits list under 你将练习 */
  practiceBenefits_zh?: string[];
  /** Optional: 同义/表达升级小词库 (simple → upgraded, with optional note) */
  synonymBank?: { simple_en: string; upgraded_en: string; note_zh?: string }[];

  /** Optional: 论点生成 - 如何快速想出论点 (three angles: 个人影响, 社会影响, 实际效果) */
  argumentFramework?: {
    title_zh: string;
    angles: {
      title_zh: string;
      title_en?: string;
      description_zh?: string;
      angles_zh: string[];
      exampleQuestion_zh?: string;
      exampleQuestion_en?: string;
      exampleReasonLabel_zh?: string;
      exampleReason_en?: string;
    }[];
  };
  /** Optional: 一个简单的思考公式 (steps + example) */
  thinkingFormula?: {
    title_zh: string;
    steps_zh: string[];
    example?: {
      topic_zh: string;
      view_en: string;
      reasons_en: string[];
    };
  };
  /** Optional: 常见话题领域 (list) */
  topicAreas_zh?: string[];
  /** Optional: 练习方式 (numbered flow) */
  practiceFlow_zh?: string[];
  /** Optional: 小提示 (tips list) */
  tips_zh?: string[];
}

export type Layer3IntroContentMap = Record<string, Layer3IntroContent>;
