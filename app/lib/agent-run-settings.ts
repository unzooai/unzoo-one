/**
 * 控制台交给 agent 跑任务时用的设置：在哪个目录干活、用什么模式。
 *
 * 存在本机浏览器里（每台机器的项目路径本来就不一样），读写都包了 try/catch：
 * 隐私窗口或禁用存储时退回默认值，不影响跑任务。
 */

import type { BrainId, BrainMode } from "./provider";

export type AgentRunSettings = {
  /** 任务交给哪个 agent。 */
  agent: BrainId;
  /** agent 的工作目录。空串：不指定，用 unterm 自己的工作目录。 */
  cwd: string;
  /**
   * 受管：CLI 自己的 shell 和联网工具关掉，只能经 Unterm 执行（AGENTS.md
   * 的要求）。关掉则是托管：CLI 用自己的工具，但每次调用都先进收件箱。
   */
  governed: boolean;
  /**
   * 智能体不问人就能做多少（按网关的风险等级）：
   * - cautious（谨慎）：只放行只读；
   * - balanced（平衡，默认）：只读、工作文件夹里改文件、普通命令、在它自己的浏览器身份里操作；
   * - autonomous（放手）：再加上对外发送。
   * 删除、读取账号密钥、花钱任何一档都要人答。
   */
  autonomy: AgentAutonomy;
  /**
   * 智能体在 Unzoo 浏览器里用哪个身份。空串：Unzoo One 给它预留的专用身份；
   * 也可以指定一个现有身份（比如登录了你账号的那个）。
   */
  browserProfile: string;
};

export type AgentAutonomy = "cautious" | "balanced" | "autonomous";

export const agentAutonomyLevels: readonly AgentAutonomy[] = ["cautious", "balanced", "autonomous"];

export const AGENT_RUN_SETTINGS_KEY = "unzoo-one.agent-run";

export const defaultAgentRunSettings: AgentRunSettings = {
  agent: "claude-code",
  cwd: "",
  governed: true,
  autonomy: "balanced",
  browserProfile: "",
};

const knownAgents: readonly string[] = ["claude-code", "codex-cli", "opencode", "agy"];

export function parseAgentRunSettings(text: string | null): AgentRunSettings {
  if (!text) return { ...defaultAgentRunSettings };
  try {
    const raw = JSON.parse(text) as Partial<AgentRunSettings> & { browser_profile?: unknown };
    const browserProfile = raw.browserProfile ?? raw.browser_profile;
    return {
      agent:
        typeof raw.agent === "string" && knownAgents.includes(raw.agent)
          ? (raw.agent as BrainId)
          : defaultAgentRunSettings.agent,
      cwd: typeof raw.cwd === "string" ? raw.cwd.trim() : defaultAgentRunSettings.cwd,
      governed: typeof raw.governed === "boolean" ? raw.governed : defaultAgentRunSettings.governed,
      autonomy: agentAutonomyLevels.includes(raw.autonomy as AgentAutonomy)
        ? (raw.autonomy as AgentAutonomy)
        : defaultAgentRunSettings.autonomy,
      browserProfile: typeof browserProfile === "string" ? browserProfile.trim() : "",
    };
  } catch {
    return { ...defaultAgentRunSettings };
  }
}

export function readAgentRunSettings(): AgentRunSettings {
  try {
    return parseAgentRunSettings(window.localStorage.getItem(AGENT_RUN_SETTINGS_KEY));
  } catch {
    return { ...defaultAgentRunSettings };
  }
}

export function writeAgentRunSettings(settings: AgentRunSettings): boolean {
  try {
    window.localStorage.setItem(AGENT_RUN_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/** 能受管的智能体：自带 shell 关掉，终端和浏览器换成我们的。 */
const governedAgents: readonly string[] = ["claude-code", "codex-cli", "opencode"];

/**
 * 这次运行用什么模式。Claude Code、Codex、OpenCode 支持受管；别的 agent
 * 退回托管，审批照样进收件箱。
 */
export function brainModeFor(agent: BrainId, settings: AgentRunSettings): BrainMode {
  return settings.governed && governedAgents.includes(agent) ? "governed" : "hosted";
}
