import type { InterviewSession, InterviewStage } from '@/types'
import type { ChatMessage } from './prompts'
import { truncateToTokens } from './tokens'

export const BASIC_QUESTIONS = 3 // 基础题数量
export const DEEP_QUESTIONS = 3 // 深挖题数量
export const SCENARIO_QUESTIONS = 2 // 场景扩展题数量
export const TOTAL_INTERVIEW_QUESTIONS = BASIC_QUESTIONS + DEEP_QUESTIONS + SCENARIO_QUESTIONS

const MAX_HISTORY_MESSAGES = 12

export function stageForQuestion(questionNumber: number): InterviewStage {
  if (questionNumber <= BASIC_QUESTIONS) return 'basic'
  if (questionNumber <= BASIC_QUESTIONS + DEEP_QUESTIONS) return 'deep'
  return 'scenario'
}

const INTERVIEW_SYSTEM = `你是一名资深前端面试官，正在进行一场真实的模拟面试。

规则：
1. 每次只提出一个问题，不要替候选人回答，不要一次列多个问题。
2. 根据当前阶段调整提问目标：
   - 基础阶段：核实简历中的项目、技术栈、职责和基础概念。
   - 深挖阶段：必须基于候选人的上一回答追问细节、指标、方案取舍、失败点。
   - 场景阶段：提出真实工作场景，考察设计、排查、性能、协作，不要求唯一答案。
3. 问题要具体，避免“请介绍一下 Vue”这种泛泛问题。
4. 可以在问题前给 1-2 句简短反馈，但不要长篇点评。
5. 全程使用中文。`

function formatHistory(session: InterviewSession): string {
  const recent = session.messages.slice(-MAX_HISTORY_MESSAGES)

  if (recent.length === 0) return '（还没有对话）'

  return recent
    .map(
      (message) => `${message.speaker === 'interviewer' ? '面试官' : '候选人'}：${message.content}`,
    )
    .join('\n\n')
}

export function buildInterviewMessages(session: InterviewSession): ChatMessage[] {
  const asked = session.messages.filter((message) => message.speaker === 'interviewer').length
  const questionNumber = asked + 1
  const stage = stageForQuestion(questionNumber)

  const resume = truncateToTokens(session.resumeSnapshot, 1200).text
  const jobRequirements = truncateToTokens(session.jobRequirementsSnapshot, 800).text

  return [
    { role: 'system', content: INTERVIEW_SYSTEM },
    {
      role: 'user',
      content: `公司与岗位：${session.company} · ${session.role}

候选人简历（快照）：
${resume || '（未提供）'}

岗位要求（快照）：
${jobRequirements || '（未提供）'}

当前阶段：${stage}（第 ${questionNumber} / ${TOTAL_INTERVIEW_QUESTIONS} 题）

已有对话：
${formatHistory(session)}

请提出下一题。`,
    },
  ]
}

const SUMMARY_SYSTEM = `你是一名资深前端面试官。

面试已经结束。请根据简历、岗位要求和完整对话，给候选人一份具体、可执行的总结。

输出结构：
1. 整体表现：1-2 句；
2. 优势：2-3 条，尽量引用候选人的具体回答；
3. 缺口：2-3 条，指出与岗位要求的差距；
4. 下一步练习：2-3 条具体建议。

不要给虚假的分数，不要空泛鼓励。`

export function buildInterviewSummaryMessages(session: InterviewSession): ChatMessage[] {
  const resume = truncateToTokens(session.resumeSnapshot, 1200).text
  const jobRequirements = truncateToTokens(session.jobRequirementsSnapshot, 800).text
  const history = session.messages
    .slice(-20)
    .map(
      (message) => `${message.speaker === 'interviewer' ? '面试官' : '候选人'}：${message.content}`,
    )
    .join('\n\n')

  return [
    { role: 'system', content: SUMMARY_SYSTEM },
    {
      role: 'user',
      content: `公司与岗位：${session.company} · ${session.role}

简历（快照）：
${resume || '（未提供）'}

岗位要求（快照）：
${jobRequirements || '（未提供）'}

面试对话：
${history || '（无）'}

请输出总结。`,
    },
  ]
}
