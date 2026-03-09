export type GuidedActivityType = "choose_one" | "match_pairs" | "quick_check";

export interface ExplanationBlock {
  type: "explanation";
  content_zh: string;
  examples_zh?: string[];
}

export interface ChooseOneItem {
  prompt_en: string;
  options: string[];
  answer: string;
}

export interface GuidedBlockBase {
  type: "guided";
  activity_type: GuidedActivityType;
  instruction_zh: string;
}

export interface ChooseOneGuidedBlock extends GuidedBlockBase {
  activity_type: "choose_one";
  prompt_en: string;
  options: string[];
  answer: string;
}

export interface MatchPairsItem {
  prompt_en: string;
  options: string[];
  answer: string;
}

export interface MatchPairsGuidedBlock extends GuidedBlockBase {
  activity_type: "match_pairs";
  items: MatchPairsItem[];
}

export interface QuickCheckItem {
  prompt_en: string;
  answer: string;
}

export interface QuickCheckGuidedBlock extends GuidedBlockBase {
  activity_type: "quick_check";
  items: QuickCheckItem[];
}

export type GuidedBlock =
  | ChooseOneGuidedBlock
  | MatchPairsGuidedBlock
  | QuickCheckGuidedBlock;

export type ModuleGuideBlock = ExplanationBlock | GuidedBlock;

export interface GuideSection {
  title_zh: string;
  blocks: ModuleGuideBlock[];
}

export interface ModuleGuide {
  id: number;
  name_zh: string;
  title?: string;
  /** Short overview paragraph for the intro lesson (concept overview). */
  overview_zh?: string;
  blocks: ModuleGuideBlock[];
  /** When present, intro is rendered by sections (header + grouped rule cards). */
  sections?: GuideSection[];
}
