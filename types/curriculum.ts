export interface ModuleInfo {
  id: number;
  name_zh: string;
  layerId: number;
}

export interface LayerInfo {
  id: number;
  name_zh: string;
  modules: ModuleInfo[];
  isPlaceholder?: boolean;
}

export const LAYERS: LayerInfo[] = [
  {
    id: 1,
    name_zh: "基础语法",
    isPlaceholder: false,
    modules: [
      { id: 1, name_zh: "可数 vs 不可数名词", layerId: 1 },
      { id: 2, name_zh: "名词复数", layerId: 1 },
      { id: 3, name_zh: "不可数名词", layerId: 1 },
      { id: 4, name_zh: "冠词 (a / an / the)", layerId: 1 },
      { id: 5, name_zh: "一般现在时", layerId: 1 },
      { id: 6, name_zh: "一般过去时", layerId: 1 },
      { id: 7, name_zh: "现在进行时", layerId: 1 },
      { id: 8, name_zh: "过去进行时", layerId: 1 },
      { id: 9, name_zh: "现在完成时", layerId: 1 },
      { id: 10, name_zh: "将来时", layerId: 1 },
      { id: 11, name_zh: "主谓一致", layerId: 1 },
      { id: 12, name_zh: "情态动词", layerId: 1 },
    ],
  },
  {
    id: 2,
    name_zh: "句子结构",
    isPlaceholder: false,
    modules: [
      { id: 13, name_zh: "介词：时间", layerId: 2 },
      { id: 14, name_zh: "介词：地点", layerId: 2 },
      { id: 15, name_zh: "常见介词搭配", layerId: 2 },
      { id: 16, name_zh: "形容词 vs 副词", layerId: 2 },
      { id: 17, name_zh: "常见动词搭配", layerId: 2 },
      { id: 18, name_zh: "基础句型结构", layerId: 2 },
      { id: 23, name_zh: "及物动词 vs 不及物动词", layerId: 2 },
    ],
  },
  {
    id: 3,
    name_zh: "复杂语言",
    isPlaceholder: false,
    modules: [
      { id: 24, name_zh: "复杂句型结构", layerId: 3 },
      { id: 25, name_zh: "从句关系", layerId: 3 },
      { id: 26, name_zh: "段落衔接与过渡", layerId: 3 },
      { id: 27, name_zh: "句子合并与升级", layerId: 3 },
      { id: 28, name_zh: "同义替换与表达升级", layerId: 3 },
      { id: 29, name_zh: "论点生成练习", layerId: 3 },
    ],
  },
];
