# CLAUDE.md - 技能路由

## 技能目录

所有自定义技能位于 `C:\Users\mingmu\.claude\skills\`，完整索引见 `~/.claude/skills/AGENTS.md`。

当用户触发以下指令或请求匹配对应描述时，读取对应 SKILL.md 并遵循其中的指令执行。

## 指令路由

| 指令 | Skill | 路径 |
|------|-------|------|
| `/prd` | product-spec-builder（产品经理，需求收集） | `~/.claude/skills/engineering/product-spec-builder/SKILL.md` |
| `/dev` | dev-builder（全栈开发，实现功能） | `~/.claude/skills/engineering/dev-builder/SKILL.md` |
| `/ui` | ui-prompt-generator（UI 提示词） | `~/.claude/skills/design/ui-prompt-generator/SKILL.md` |
| `/check` | 对照产品文档检查功能完整度 | 读取 Product-Spec.md 逐项比对 |
| `/status` | 显示项目当前状态 | 检查 Product-Spec.md、代码文件 |

## 自然语言触发

| 用户意图 | Skill | 路径 |
|----------|-------|------|
| 调试、排查 bug、diagnose | diagnose | `~/.claude/skills/engineering/diagnose/SKILL.md` |
| UI/UX 设计、风格、配色 | ui-ux-pro-max | `~/.claude/skills/design/ui-ux-pro-max/SKILL.md` |
| 压力测试设计、逐条追问 | grill-me | `~/.claude/skills/productivity/grill-me/SKILL.md` |
| 压力测试+领域文档对照 | grill-with-docs | `~/.claude/skills/engineering/grill-with-docs/SKILL.md` |
| 代码审查 | review | `~/.claude/skills/in-progress/review/SKILL.md` |
| 改善架构、重构 | improve-codebase-architecture | `~/.claude/skills/engineering/improve-codebase-architecture/SKILL.md` |
| 拆任务为 issue/ticket | to-issues | `~/.claude/skills/engineering/to-issues/SKILL.md` |
| TDD、测试驱动开发 | tdd | `~/.claude/skills/engineering/tdd/SKILL.md` |
| 快速原型验证 | prototype | `~/.claude/skills/engineering/prototype/SKILL.md` |
| 压缩对话、交接上下文 | handoff | `~/.claude/skills/productivity/handoff/SKILL.md` |
| 省 token、极简沟通 | caveman | `~/.claude/skills/productivity/caveman/SKILL.md` |
| 保存对话记录 | session-logger | `~/.claude/skills/productivity/session-logger/SKILL.md` |
| 缩小视角、全局概览 | zoom-out | `~/.claude/skills/engineering/zoom-out/SKILL.md` |
| 创建新 skill | write-a-skill | `~/.claude/skills/productivity/write-a-skill/SKILL.md` |
| git 安全保护 | git-guardrails | `~/.claude/skills/misc/git-guardrails-claude-code/SKILL.md` |
| Issue 分诊 | triage | `~/.claude/skills/engineering/triage/SKILL.md` |
| 自我进化、经验学习 | self-improving-agent | `~/.claude/skills/engineering/self-improving-agent/SKILL.md` |

## 项目上下文

- 微信小程序项目（声域友线上社交KTV平台）
- 后端：.NET（`KTV/KTVsystem/backend/`）
- 前端 Web 管理：Vue（`KTV/KTVsystem/web/`）
- 微信小程序：`pages/`、`utils/` 等
