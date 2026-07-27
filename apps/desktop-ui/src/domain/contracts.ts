export type TaskState =
  | 'draft'
  | 'running'
  | 'waiting_approval'
  | 'paused'
  | 'succeeded'
  | 'failed'

export type StepState = 'queued' | 'active' | 'waiting' | 'done'

export interface TaskStep {
  id: string
  title: string
  detail: string
  state: StepState
  time: string
  provider?: 'unzoo' | 'unterm'
}

export interface TaskSummary {
  id: string
  title: string
  state: TaskState
  progress: number
  startedAt: string
  brain: string
  steps: TaskStep[]
}

export interface ActivityEvent {
  id: string
  icon: 'spark' | 'browser' | 'terminal' | 'file'
  title: string
  meta: string
  artifactRef?: string
}

export interface OneSnapshot {
  activeTask: TaskSummary
  events: ActivityEvent[]
}

export interface OneClient {
  getSnapshot(): OneSnapshot
  pauseTask(taskId: string): Promise<void>
  resumeTask(taskId: string): Promise<void>
  resolveApproval(approvalId: string, decision: 'allow_once' | 'deny'): Promise<void>
  sendInstruction(taskId: string, content: string): Promise<void>
}
