import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { mockOneClient } from './adapters/mockOneClient'
import './App.css'

type View = 'home' | 'tasks' | 'inbox' | 'automations' | 'artifacts' | 'integrations'
type ApprovalState = 'pending' | 'approved' | 'denied'
type WorkRole = 'Research' | 'Build' | 'Operate' | 'Coordinate'
type Theme = 'system' | 'dark' | 'light'

type IconName =
  | 'home' | 'task' | 'inbox' | 'automation' | 'artifact' | 'plug'
  | 'search' | 'command' | 'pause' | 'play' | 'activity' | 'shield'
  | 'check' | 'browser' | 'terminal' | 'file' | 'send' | 'more'
  | 'chevron' | 'spark' | 'clock' | 'settings' | 'folder' | 'layers' | 'sun' | 'moon'

const iconPaths: Record<IconName, ReactNode> = {
  home: <><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.8V21h13V9.8M9.5 21v-6h5v6"/></>,
  task: <><rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 9 1.5 1.5L12 8M8 15h8"/></>,
  inbox: <><path d="M4 5h16l2 11H16l-2 3h-4l-2-3H2L4 5Z"/><path d="M4 12h4l2 3h4l2-3h4"/></>,
  automation: <><path d="M8 5h8M8 19h8"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M5 7v3a4 4 0 0 0 4 4h6a4 4 0 0 1 4 4"/></>,
  artifact: <><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/></>,
  plug: <><path d="m8 12 8-8M14 3l7 7M5 14l5 5M4 20l3-3M17 7l-3 3"/><path d="M10 19a5 5 0 0 0 7-7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  command: <><path d="M9 6V5a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z"/></>,
  pause: <><path d="M8 5v14M16 5v14"/></>,
  play: <><path d="m8 5 11 7-11 7Z"/></>,
  activity: <><path d="M3 12h4l2-6 4 12 2-6h6"/></>,
  shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="m9 12 2 2 4-5"/></>,
  check: <><path d="m5 12 4 4L19 6"/></>,
  browser: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></>,
  terminal: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12 15h5"/></>,
  file: <><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5"/></>,
  send: <><path d="m3 3 18 9-18 9 4-9zM7 12h14"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  chevron: <><path d="m9 18 6-6-6-6"/></>,
  spark: <><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  folder: <><path d="M3 6.5h7l2 2h9v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 10h18"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></>,
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

const navItems: { id: View; label: string; icon: IconName; badge?: number }[] = [
  { id: 'home', label: 'Workbench', icon: 'layers' },
  { id: 'tasks', label: 'Tasks', icon: 'task' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', badge: 1 },
  { id: 'automations', label: 'Automations', icon: 'automation' },
  { id: 'artifacts', label: 'Artifacts', icon: 'artifact' },
  { id: 'integrations', label: 'Integrations', icon: 'plug' },
]

const snapshot = mockOneClient.getSnapshot()
const steps = snapshot.activeTask.steps
const events = snapshot.events

function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false)
  return <div className="workspace-switcher">
    <button className="workspace-button" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="workspace-symbol"><Icon name="folder" size={14}/></span>
      <span className="workspace-label"><strong>unzoo-one</strong><small>D:\code\unzoo-one</small></span>
      <Icon name="chevron" size={13}/>
    </button>
    {open && <div className="workspace-menu">
      <span className="eyebrow">WORKSPACE CONTEXT</span>
      <button className="selected"><Icon name="check" size={13}/><span><strong>unzoo-one</strong><small>Folder · Browser · Memory · Access</small></span></button>
      <button><Icon name="folder" size={13}/><span><strong>Personal</strong><small>No directory attached</small></span></button>
      <button className="new-workspace">＋ New workspace</button>
    </div>}
  </div>
}

function Sidebar({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return <aside className="sidebar">
    <button className="brand" onClick={() => onChange('home')} aria-label="Unzoo One 首页">
      <img src="/brand/unzoo-one-mark-signal.svg" alt="" />
      <span>unzoo one</span>
    </button>
    <WorkspaceSwitcher/>
    <nav aria-label="主要导航">
      {navItems.map(item => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => onChange(item.id)}>
        <Icon name={item.icon} /><span>{item.label}</span>{item.badge && <b>{item.badge}</b>}
      </button>)}
    </nav>
    <div className="sidebar-spacer" />
    <button className="profile"><span className="avatar">A</span><span><strong>Alex</strong><small>Owner · Local</small></span><Icon name="more" /></button>
    <div className="provider-health"><i /> All systems connected</div>
  </aside>
}

function Topbar({ activityOpen, onToggleActivity, theme, onThemeChange }: { activityOpen: boolean; onToggleActivity: () => void; theme: Theme; onThemeChange: () => void }) {
  return <header className="topbar">
    <div className="traffic"><i/><i/><i/></div>
    <button className="search"><Icon name="search" size={15}/><span>Search workbench or run command</span><kbd>⌘ K</kbd></button>
    <div className="top-actions">
      <span className="local governed"><Icon name="shield" size={13}/>Governed</span>
      <button className="icon-button" onClick={onThemeChange} aria-label={`主题：${theme}`} title={`Theme: ${theme}`}><Icon name={theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'settings'}/></button>
      <button className={activityOpen ? 'icon-button active' : 'icon-button'} onClick={onToggleActivity} aria-label="切换活动面板"><Icon name="activity"/></button>
    </div>
  </header>
}

function ApprovalCard({ state, onDecision }: { state: ApprovalState; onDecision: (state: ApprovalState) => void }) {
  if (state !== 'pending') {
    return <div className={`approval-card resolved ${state}`}>
      <span className="risk-symbol"><Icon name={state === 'approved' ? 'check' : 'shield'} /></span>
      <div><strong>{state === 'approved' ? '操作已批准，正在发送' : '已拒绝此操作'}</strong><p>{state === 'approved' ? '本次授权仅适用于这一个动作。' : '任务会跳过发送步骤并继续生成报告。'}</p></div>
      <button className="text-button" onClick={() => onDecision('pending')}>撤销</button>
    </div>
  }
  return <section className="approval-card" aria-label="等待批准">
    <span className="risk-symbol"><Icon name="shield"/></span>
    <div className="approval-copy">
      <div className="approval-kicker">ACTION REQUIRED · EXTERNAL SIDE EFFECT</div>
      <strong>允许发送这封产品咨询邮件？</strong>
      <p>收件人：sales@acme.example · 不包含附件 · 可在发送前查看完整内容</p>
      <button className="preview-link">查看邮件预览 <Icon name="chevron" size={13}/></button>
    </div>
    <div className="approval-actions">
      <button className="secondary-button" onClick={() => onDecision('denied')}>拒绝</button>
      <button className="attention-button" onClick={() => onDecision('approved')}>仅本次允许</button>
    </div>
  </section>
}

const workRoles: WorkRole[] = ['Research', 'Build', 'Operate', 'Coordinate']

function Composer({ role, onRoleChange }: { role: WorkRole; onRoleChange: (role: WorkRole) => void }) {
  const [value, setValue] = useState('')
  const [sent, setSent] = useState(false)
  const submit = () => {
    if (!value.trim()) return
    setValue('')
    setSent(true)
    window.setTimeout(() => setSent(false), 1800)
  }
  return <div className="composer">
    <textarea value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
    }} placeholder="描述结果、调整计划，或输入 / 调用工作台命令…" aria-label="给 One 的新指令" />
    <div className="composer-footer">
      <div className="composer-meta">
        <button>＋</button>
        <label className="role-picker"><Icon name="layers" size={14}/><select value={role} onChange={event => onRoleChange(event.target.value as WorkRole)} aria-label="One 工作角色">{workRoles.map(item => <option key={item}>{item}</option>)}</select></label>
        <span><Icon name="spark" size={14}/>Auto brain</span>
        <span><Icon name="shield" size={14}/>Interactive</span>
      </div>
      <button className={sent ? 'send-button sent' : 'send-button'} onClick={submit} aria-label="发送指令"><Icon name={sent ? 'check' : 'send'} size={16}/></button>
    </div>
  </div>
}

function ActivityRail() {
  return <aside className="activity-rail">
    <div className="rail-head"><div><span className="eyebrow">LIVE TRACE</span><h2>Activity</h2></div><button className="icon-button"><Icon name="more"/></button></div>
    <div className="live-status"><span className="pulse"/><div><strong>Working in browser</strong><small>Reading pricing details</small></div><span>02:18</span></div>
    <div className="event-list">
      {events.map((event, index) => <div className="event" key={event.title}>
        <span className="event-icon"><Icon name={event.icon} size={15}/></span>
        <div><strong>{event.title}</strong><small>{event.meta}</small>{index === 1 && <button className="mini-preview">Open snapshot ↗</button>}</div>
      </div>)}
    </div>
    <button className="audit-link">View complete audit log <Icon name="chevron" size={14}/></button>
  </aside>
}

function TaskView({ approval, setApproval, paused, setPaused, role, setRole }: {
  approval: ApprovalState; setApproval: (value: ApprovalState) => void; paused: boolean; setPaused: (value: boolean) => void; role: WorkRole; setRole: (value: WorkRole) => void
}) {
  return <main className="workspace">
    <div className="task-titlebar">
      <div><span className="breadcrumb">unzoo-one / Tasks / Active</span><h1>调研 AI 客服产品并生成对比报告</h1><div className="task-meta"><span className={paused ? 'status paused' : 'status'}><i/>{paused ? 'Paused' : 'Running'}</span><span><Icon name="folder" size={10}/>unzoo-one</span><span>{role} role</span><span>Codex · Auto</span></div></div>
      <div className="task-actions"><button className="secondary-button" onClick={() => setPaused(!paused)}><Icon name={paused ? 'play' : 'pause'} size={15}/>{paused ? '继续' : '暂停'}</button><button className="icon-button"><Icon name="more"/></button></div>
    </div>
    <div className="progress"><i style={{ width: paused ? '46%' : '62%' }}/></div>
    <section className="plan-card">
      <div className="plan-head"><div><span className="eyebrow">EXECUTION PLAN</span><h2>4 steps · 2 providers</h2></div><div className="provider-pills"><span><Icon name="browser" size={13}/>Unzoo</span><span><Icon name="terminal" size={13}/>Unterm</span></div></div>
      <div className="step-list">
        {steps.map((step, index) => <div className={`step ${step.state}`} key={step.title}>
          <div className="step-track"><span className="step-node">{step.state === 'done' && <Icon name="check" size={10}/>}</span></div>
          <div className="step-copy"><strong><em>{index + 1}</em>{step.title}</strong><p>{step.detail}</p></div>
          <time>{step.time}</time>
        </div>)}
      </div>
    </section>
    <ApprovalCard state={approval} onDecision={setApproval}/>
    <section className="artifact-card">
      <div className="artifact-icon"><Icon name="file"/></div>
      <div><span className="eyebrow">LIVE ARTIFACT</span><strong>AI 客服产品对比矩阵.md</strong><p>24 个数据点 · 最后更新于 12 秒前</p></div>
      <div className="artifact-preview"><i/><i/><i/><i/></div>
      <button className="secondary-button">打开</button>
    </section>
    <Composer role={role} onRoleChange={setRole}/>
  </main>
}

function HomeView({ onOpenTask, role, setRole }: { onOpenTask: () => void; role: WorkRole; setRole: (role: WorkRole) => void }) {
  return <main className="workspace home-view">
    <div className="workbench-head">
      <div><span className="eyebrow">ACTIVE WORKSPACE · D:\CODE\UNZOO-ONE</span><h1>unzoo-one</h1><p>3 active runs · 1 approval · Unzoo and Unterm online</p></div>
      <div className="context-health"><span><i/>Workspace protected</span><span>Owner</span></div>
    </div>
    <Composer role={role} onRoleChange={setRole}/>
    <div className="section-title"><div><span className="eyebrow">RUN QUEUE</span><h2>正在进行</h2></div><button className="text-button" onClick={onOpenTask}>View all tasks</button></div>
    <button className="active-task" onClick={onOpenTask}>
      <span className="task-signal"><span className="pulse"/></span><div><strong>调研 AI 客服产品并生成对比报告</strong><p>正在读取第 6 个官方来源 · 2m 18s</p></div><span className="task-progress">62%</span><Icon name="chevron"/>
    </button>
    <div className="quick-grid">
      <button><span><Icon name="browser"/></span><strong>研究网页</strong><p>浏览、提取并整理可信来源</p></button>
      <button><span><Icon name="terminal"/></span><strong>完成项目</strong><p>让 Codex 在 Unterm 中执行工作</p></button>
      <button><span><Icon name="automation"/></span><strong>创建自动化</strong><p>把重复工作交给 One 定时运行</p></button>
    </div>
  </main>
}

function EmptyView({ view }: { view: Exclude<View, 'home' | 'tasks'> }) {
  const copy: Record<typeof view, [IconName, string, string]> = {
    inbox: ['inbox', '1 项需要你处理', '批准、补充信息和异常都会集中到这里。'],
    automations: ['automation', 'Automations', '把稳定的任务流程保存为可观察、可暂停的自动化。'],
    artifacts: ['artifact', 'Artifacts', '浏览 One 创建的报告、文件、截图与执行快照。'],
    integrations: ['plug', 'Integrations', '管理 Unzoo Browser、Unterm 和模型提供方。'],
  }
  const [icon, title, body] = copy[view]
  return <main className="workspace empty-view"><span className="empty-icon"><Icon name={icon} size={28}/></span><span className="eyebrow">UNZOO ONE</span><h1>{title}</h1><p>{body}</p><button className="primary-button">{view === 'inbox' ? 'Review request' : 'Explore setup'}</button></main>
}

export default function App() {
  const [view, setView] = useState<View>('tasks')
  const [activityOpen, setActivityOpen] = useState(true)
  const [approval, setApproval] = useState<ApprovalState>('pending')
  const [paused, setPaused] = useState(false)
  const [role, setRole] = useState<WorkRole>('Research')
  const [theme, setTheme] = useState<Theme>('system')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  const cycleTheme = () => setTheme(current => current === 'system' ? 'dark' : current === 'dark' ? 'light' : 'system')
  const content = useMemo(() => {
    if (view === 'home') return <HomeView onOpenTask={() => setView('tasks')} role={role} setRole={setRole}/>
    if (view === 'tasks') return <TaskView approval={approval} setApproval={setApproval} paused={paused} setPaused={setPaused} role={role} setRole={setRole}/>
    return <EmptyView view={view}/>
  }, [view, approval, paused, role])

  return <div className={`app-shell ${activityOpen ? 'rail-open' : ''}`}>
    <Topbar activityOpen={activityOpen} onToggleActivity={() => setActivityOpen(!activityOpen)} theme={theme} onThemeChange={cycleTheme}/>
    <Sidebar view={view} onChange={setView}/>
    {content}
    {activityOpen && <ActivityRail/>}
  </div>
}
