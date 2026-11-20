"use client";

import { BookOpen, FolderInput, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { t } from "./i18n";
import type { RuntimeSkill, RuntimeTaskPort } from "./lib/provider";

/**
 * 设置 › 技能：交给智能体的技能，一处管理。
 *
 * 自带的教智能体用好这台电脑的终端和浏览器；你自己的，是导入的或者从对话
 * “存为技能”来的。开着的每次交给智能体时挂上，关掉的下一次就不在了。
 */
export function SkillsPanel({
  runtime,
  notify,
}: {
  runtime: Pick<RuntimeTaskPort, "skills" | "setSkillEnabled" | "deleteSkill" | "importSkill">;
  notify: (message: string) => void;
}) {
  const [skills, setSkills] = useState<RuntimeSkill[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [path, setPath] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSkills(await runtime.skills());
      setError(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  }, [runtime]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(work: () => Promise<RuntimeSkill[]>, message: string) {
    setBusy(true);
    try {
      setSkills(await work());
      notify(message);
    } catch (failure) {
      notify(t("没有做成：{error}", { error: failure instanceof Error ? failure.message : String(failure) }));
    } finally {
      setBusy(false);
    }
  }

  async function importFolder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const folder = path.trim();
    if (!folder || busy) return;
    setBusy(true);
    try {
      const result = await runtime.importSkill(folder);
      setSkills(result.skills);
      setPath("");
      notify(t("已导入技能“{name}”", { name: result.imported }));
    } catch (failure) {
      notify(t("没能导入：{error}", { error: failure instanceof Error ? failure.message : String(failure) }));
    } finally {
      setBusy(false);
    }
  }

  const builtin = skills?.filter((skill) => skill.source === "builtin") ?? [];
  const own = skills?.filter((skill) => skill.source !== "builtin") ?? [];

  return (
    <div className="settings-group skills-group" id="settings-skills">
      <div className="skills-heading">
        <span>{t("技能")}</span>
        <h2>{t("智能体会的本事")}</h2>
        <button type="button" onClick={() => void load()} aria-label={t("刷新技能")} title={t("刷新技能")} disabled={busy}>
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="skills-intro">
        {t("技能是一份说明（SKILL.md）加上需要的脚本，智能体遇到对应的事会自己用上。开着的技能每次交给 Claude Code、Codex 或 OpenCode 时挂上，不改它们自己的配置；在“接入其它 AI 客户端”里接入了终端的客户端，也会装上一份。")}
      </p>

      {error ? (
        <p className="skills-empty">{t("读不到技能：{error}", { error })}</p>
      ) : !skills ? (
        <p className="skills-empty">{t("正在读取…")}</p>
      ) : (
        <>
          <SkillList
            title={t("自带")}
            skills={builtin}
            empty={t("这个版本没有带自带技能。")}
            busy={busy}
            onToggle={(skill) =>
              void act(
                () => runtime.setSkillEnabled(skill.name, !skill.enabled),
                skill.enabled ? t("已关掉技能“{name}”", { name: skill.name }) : t("已打开技能“{name}”", { name: skill.name }),
              )
            }
          />
          <SkillList
            title={t("你的技能")}
            skills={own}
            empty={t("还没有。在一个做成了的任务里点“更多 › 存为技能”，或者在下面导入一个技能文件夹。")}
            busy={busy}
            onToggle={(skill) =>
              void act(
                () => runtime.setSkillEnabled(skill.name, !skill.enabled),
                skill.enabled ? t("已关掉技能“{name}”", { name: skill.name }) : t("已打开技能“{name}”", { name: skill.name }),
              )
            }
            confirmDelete={confirmDelete}
            onDelete={(skill) => {
              if (confirmDelete !== skill.name) {
                setConfirmDelete(skill.name);
                return;
              }
              setConfirmDelete(null);
              void act(() => runtime.deleteSkill(skill.name), t("已删除技能“{name}”", { name: skill.name }));
            }}
          />
        </>
      )}

      <form className="skills-import" onSubmit={importFolder}>
        <label>
          <span>{t("导入技能文件夹")}</span>
          <span className="agent-run-input">
            <FolderInput size={14} aria-hidden="true" />
            <input
              type="text"
              value={path}
              spellCheck={false}
              placeholder={t("含 SKILL.md 的文件夹，例如 C:\\skills\\weekly-report")}
              aria-label={t("技能文件夹的路径")}
              onChange={(event) => setPath(event.target.value)}
            />
          </span>
        </label>
        <button type="submit" disabled={busy || !path.trim()}>
          {t("导入")}
        </button>
      </form>
    </div>
  );
}

function SkillList({
  title,
  skills,
  empty,
  busy,
  onToggle,
  onDelete,
  confirmDelete,
}: {
  title: string;
  skills: RuntimeSkill[];
  empty: string;
  busy: boolean;
  onToggle: (skill: RuntimeSkill) => void;
  onDelete?: (skill: RuntimeSkill) => void;
  confirmDelete?: string | null;
}) {
  return (
    <section className="skills-list" aria-label={title}>
      <h3>{title}</h3>
      {skills.length === 0 ? (
        <p className="skills-empty">{empty}</p>
      ) : (
        <ul>
          {skills.map((skill) => (
            <li key={skill.name} className={skill.enabled ? "" : "is-off"}>
              <BookOpen size={15} aria-hidden="true" />
              <span>
                <strong>{skill.name}</strong>
                <small title={skill.path}>{skill.description || t("（没有说明）")}</small>
              </span>
              {onDelete && (
                <button
                  type="button"
                  className={confirmDelete === skill.name ? "danger is-confirming" : "danger"}
                  disabled={busy}
                  onClick={() => onDelete(skill)}
                  aria-label={t("删除技能 {name}", { name: skill.name })}
                  title={confirmDelete === skill.name ? t("再点一次确认删除") : t("删除")}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  {confirmDelete === skill.name && <span>{t("确认删除")}</span>}
                </button>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={skill.enabled}
                aria-label={t("启用技能 {name}", { name: skill.name })}
                className={`switch-control ${skill.enabled ? "on" : ""}`}
                disabled={busy}
                onClick={() => onToggle(skill)}
              >
                <i />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
