"use client";

import { useState, useEffect } from "react";
import type { Layer3IntroContent } from "@/types/layer3Intro";
import styles from "./Layer3IntroPage.module.css";

interface Props {
  content: Layer3IntroContent;
  onStartPractice: () => void;
}

export function Layer3IntroPage({ content, onStartPractice }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const skillOverviewParagraphs = content.skillOverview_zh
    .split(/\n\n+/)
    .filter((p) => p.trim());
  const patterns = content.signalWords ?? content.keyPatterns;
  const examples = content.detailedExamples ?? content.quickExamples;

  if (!mounted) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>{content.moduleName_zh}</h1>
        <p className={styles.sectionContent} style={{ color: "var(--muted)" }}>
          加载中...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{content.moduleName_zh}</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>技能概览</h2>
        <div className={styles.sectionContent}>
          {skillOverviewParagraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      {content.argumentFramework && content.argumentFramework.angles.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{content.argumentFramework.title_zh}</h2>
          <p className={styles.stepIntro}>
            当你看到一个问题时，可以从以下三个角度思考：
          </p>
          {content.argumentFramework.angles.map((angle, i) => (
            <div key={i} className={styles.argumentAngleBox}>
              <h3 className={styles.argumentAngleTitle}>
                {i + 1}. {angle.title_zh}
              </h3>
              {angle.description_zh && (
                <p className={styles.argumentAngleDesc}>{angle.description_zh}</p>
              )}
              <p className={styles.argumentAngleLabel}>常见角度：</p>
              <div className={styles.patternItems}>
                {angle.angles_zh.map((item, j) => (
                  <span key={j} className={styles.patternTag}>
                    {item}
                  </span>
                ))}
              </div>
              {(angle.exampleQuestion_zh || angle.exampleQuestion_en || angle.exampleReason_en) && (
                <div className={styles.argumentExample}>
                  {(angle.exampleQuestion_zh || angle.exampleQuestion_en) && (
                    <>
                      <p className={styles.argumentExampleLabel}>示例：</p>
                      <p className={styles.argumentExampleQuestion}>
                        {angle.exampleQuestion_zh ?? angle.exampleQuestion_en}
                      </p>
                    </>
                  )}
                  {angle.exampleReason_en && (
                    <p className={styles.argumentExampleReason}>
                      理由示例：
                      {angle.exampleReasonLabel_zh ? (
                        <> {angle.exampleReasonLabel_zh} → {angle.exampleReason_en}</>
                      ) : (
                        <> {angle.exampleReason_en}</>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {content.thinkingFormula && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{content.thinkingFormula.title_zh}</h2>
          <p className={styles.stepIntro}>看到题目时，可以这样思考：</p>
          <div className={styles.formulaSteps}>
            {content.thinkingFormula.steps_zh.map((step, i) => (
              <div key={i} className={styles.formulaStep}>
                {i > 0 && <span className={styles.formulaStepArrow}>↓</span>}
                <span>{step}</span>
              </div>
            ))}
          </div>
          {content.thinkingFormula.example && (
            <div className={styles.formulaExample}>
              <p className={styles.formulaExampleLabel}>例如：</p>
              <p className={styles.formulaExampleTopic}>
                题目：{content.thinkingFormula.example.topic_zh}
              </p>
              <p className={styles.formulaExampleView}>
                观点：{content.thinkingFormula.example.view_en}
              </p>
              <p className={styles.formulaExampleReasonsLabel}>理由：</p>
              <ul className={styles.practiceList}>
                {content.thinkingFormula.example.reasons_en.map((r, j) => (
                  <li key={j}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {content.topicAreas_zh && content.topicAreas_zh.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>常见话题领域</h2>
          <p className={styles.sectionContent}>
            本模块中的问题通常来自以下领域：
          </p>
          <ul className={styles.practiceList}>
            {content.topicAreas_zh.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {content.practiceFlow_zh && content.practiceFlow_zh.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>练习方式</h2>
          <p className={styles.sectionContent}>每一题将按照以下流程进行：</p>
          <ol className={styles.practiceListOrdered}>
            {content.practiceFlow_zh.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
          <p className={styles.practiceFlowNote}>
            本模块不计算正确率，重点是练习快速组织观点的能力。
          </p>
        </section>
      )}

      {content.tips_zh && content.tips_zh.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>小提示</h2>
          <p className={styles.sectionContent}>
            如果一时想不到理由，可以问自己：
          </p>
          <ul className={styles.practiceList}>
            {content.tips_zh.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className={styles.tipsNote}>通常这样就能找到一个论点。</p>
        </section>
      )}

      {content.synonymBank && content.synonymBank.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>同义替换小词库</h2>
          <p className={styles.sectionContent}>
            写作和口语中避免重复简单词，可选用更自然、正式的表达：
          </p>
          <div className={styles.synonymBank}>
            {content.synonymBank.map((row, i) => (
              <div key={i} className={styles.synonymRow}>
                <span className={styles.synonymSimple}>{row.simple_en}</span>
                <span className={styles.synonymArrow}>→</span>
                <span className={styles.synonymUpgraded}>{row.upgraded_en}</span>
                {row.note_zh && (
                  <span className={styles.synonymNote}>{row.note_zh}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {content.backboneSteps && content.backboneSteps.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>如何快速找到句子主干</h2>
          <p className={styles.stepIntro}>
            可以使用下面的三步法：
          </p>
          {content.backboneSteps.map((step, i) => (
            <div key={i} className={styles.stepBox}>
              <h3 className={styles.stepTitle}>{step.stepTitle_zh}</h3>
              <p className={styles.stepInstruction}>{step.instruction_zh}</p>
              {step.example_en && (
                <p className={styles.stepExample}>{step.example_en}</p>
              )}
              {step.highlight_zh && (
                <p className={styles.stepHighlight}>{step.highlight_zh}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {content.relationshipCategories && content.relationshipCategories.length > 0 ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>常见逻辑关系与连接词</h2>
          {content.relationshipCategories.map((cat, i) => (
            <div key={i} className={styles.relationshipBox}>
              <h3 className={styles.relationshipTitle}>{cat.category_zh}</h3>
              {cat.description_zh && (
                <p className={styles.relationshipDesc}>{cat.description_zh}</p>
              )}
              {cat.connectorGroups ? (
                cat.connectorGroups.map((g, j) => (
                  <div key={j} className={styles.connectorGroup}>
                    {g.label_zh && (
                      <span className={styles.connectorLabel}>{g.label_zh}：</span>
                    )}
                    <div className={styles.patternItems}>
                      {g.items.map((item, k) => (
                        <span key={k} className={styles.patternTag}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : cat.items ? (
                <div className={styles.patternItems}>
                  {cat.items.map((item, j) => (
                    <span key={j} className={styles.patternTag}>
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
              {cat.example_en && (
                <div className={styles.relationshipExample}>
                  <span className={styles.exampleLabel}>示例：</span>
                  <p className={styles.exampleText}>{cat.example_en}</p>
                  {cat.example_note_zh && (
                    <p className={styles.exampleNote}>{cat.example_note_zh}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      ) : patterns.length > 0 ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {content.signalWords ? "常见从句信号词" : "关键句型 / 常用表达"}
          </h2>
          {content.signalWords && (
            <p className={styles.signalIntro}>
              以下词通常表示从句或补充信息：
            </p>
          )}
          <table className={styles.patternsTable}>
            <tbody>
              {patterns.map((p, i) => (
                <tr key={i}>
                  <th>{p.category_zh}</th>
                  <td>
                    <div className={styles.patternItems}>
                      {p.items.map((item, j) => (
                        <span key={j} className={styles.patternTag}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {examples.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {content.detailedExamples ? "示例分析" : "示例"}
          </h2>
          {content.detailedExamples ? (
            content.detailedExamples.map((ex, i) => (
              <div key={i} className={styles.detailedExampleBox}>
                <p className={styles.exampleText}>{ex.example_en}</p>
                {ex.structure_zh && (
                  <div className={styles.structureBlock}>
                    <span className={styles.structureLabel}>结构：</span>
                    <pre className={styles.structurePre}>{ex.structure_zh}</pre>
                  </div>
                )}
                {ex.backbone_en && (
                  <p className={styles.backboneLine}>
                    <span className={styles.backboneLabel}>句子主干：</span>
                    {ex.backbone_en}
                  </p>
                )}
                {ex.note_zh && (
                  <p className={styles.exampleNote}>{ex.note_zh}</p>
                )}
              </div>
            ))
          ) : (
            content.quickExamples.map((ex, i) => (
              <div key={i} className={styles.exampleBox}>
                <p className={styles.exampleText}>{ex.example_en}</p>
                {ex.note_zh && (
                  <p className={styles.exampleNote}>{ex.note_zh}</p>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {content.commonMistakes.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>常见错误</h2>
          {content.commonMistakes.map((m, i) => (
            <div key={i} className={styles.mistakeRow}>
              <span className={styles.mistakeWrong}>✗ {m.wrong_en}</span>
              <br />
              <span className={styles.mistakeCorrect}>✓ {m.correct_en}</span>
              <p className={styles.mistakeExplanation}>{m.explanation_zh}</p>
            </div>
          ))}
        </section>
      )}

      {content.practiceTypes_zh.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>你将练习</h2>
          {content.practiceBenefits_zh && (
            <p className={styles.practiceIntro}>在本模块中，你将练习：</p>
          )}
          <ul className={styles.practiceList}>
            {content.practiceTypes_zh.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          {content.practiceBenefits_zh &&
            content.practiceBenefits_zh.length > 0 && (
              <>
                <p className={styles.benefitsIntro}>这些能力可以帮助你：</p>
                <ul className={styles.practiceList}>
                  {content.practiceBenefits_zh.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </>
            )}
        </section>
      )}

      <div className={styles.ctaWrap}>
        <button type="button" className={styles.btnStart} onClick={onStartPractice}>
          <span>🚀</span>
          开始练习
        </button>
      </div>
    </div>
  );
}
