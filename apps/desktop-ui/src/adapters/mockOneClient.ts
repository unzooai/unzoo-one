import type { OneClient, OneSnapshot } from '../domain/contracts'

const snapshot: OneSnapshot = {
  activeTask: {
    id: 'task_demo_research',
    title: '调研 AI 客服产品并生成对比报告',
    state: 'waiting_approval',
    progress: 62,
    startedAt: '09:42',
    brain: 'Codex · Auto',
    steps: [
      { id: 'step_1', title: '理解目标与约束', detail: '已解析目标、交付格式和登录边界', state: 'done', time: '09:42' },
      { id: 'step_2', title: '检索候选产品', detail: 'Unzoo Browser 正在浏览 8 个官方来源', state: 'active', time: '2m 18s', provider: 'unzoo' },
      { id: 'step_3', title: '发送确认邮件', detail: '需要你的批准后才能执行外部操作', state: 'waiting', time: '等待' },
      { id: 'step_4', title: '生成对比报告', detail: '将整理来源、关键差异与建议', state: 'queued', time: '—', provider: 'unterm' },
    ],
  },
  events: [
    { id: 'event_1', icon: 'spark', title: 'Codex 完成任务规划', meta: '刚刚 · 1.2k tokens' },
    { id: 'event_2', icon: 'browser', title: 'Unzoo 打开官方定价页', meta: '12 秒前 · 已验证', artifactRef: 'artifact_snapshot_1' },
    { id: 'event_3', icon: 'browser', title: '提取 24 项结构化数据', meta: '38 秒前 · 3 个来源' },
    { id: 'event_4', icon: 'terminal', title: 'Unterm 运行分析脚本', meta: '1 分钟前 · exit 0' },
    { id: 'event_5', icon: 'file', title: '创建竞品矩阵草稿', meta: '2 分钟前 · 本地文件' },
  ],
}

const settle = () => Promise.resolve()

export const mockOneClient: OneClient = {
  getSnapshot: () => snapshot,
  pauseTask: settle,
  resumeTask: settle,
  resolveApproval: settle,
  sendInstruction: settle,
}
