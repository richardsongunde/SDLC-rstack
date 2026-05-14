#!/usr/bin/env python3
"""
Generate rstack-architecture.excalidraw — clean presentation version.
Canvas: 3600 × 1960, landscape, high-contrast, large text.
"""
import json

elements = []
seed = 1000

def el(type_, id_, x, y, w, h, **kwargs):
    global seed
    seed += 7
    base = {
        "type": type_, "id": id_,
        "x": x, "y": y, "width": w, "height": h,
        "angle": 0, "seed": seed, "version": 1,
        "versionNonce": seed + 1, "isDeleted": False,
        "groupIds": [], "boundElements": None,
        "link": None, "locked": False,
        "opacity": 100, "roughness": 0,
        "strokeWidth": 2, "strokeStyle": "solid",
        "fillStyle": "solid",
    }
    base.update(kwargs)
    return base

def rect(id_, x, y, w, h, fill, stroke, sw=2, style="solid"):
    return el("rectangle", id_, x, y, w, h,
        backgroundColor=fill, strokeColor=stroke,
        strokeWidth=sw, strokeStyle=style)

def text(id_, x, y, w, h, txt, color, size=16, align="center", valign="middle", lh=1.3):
    global seed
    seed += 7
    return {
        "type": "text", "id": id_,
        "x": x, "y": y, "width": w, "height": h,
        "text": txt, "originalText": txt,
        "fontSize": size, "fontFamily": 3,
        "textAlign": align, "verticalAlign": valign,
        "strokeColor": color, "backgroundColor": "transparent",
        "fillStyle": "solid", "strokeWidth": 1,
        "strokeStyle": "solid", "roughness": 0,
        "opacity": 100, "angle": 0,
        "seed": seed, "version": 1,
        "versionNonce": seed + 1,
        "isDeleted": False, "groupIds": [],
        "boundElements": None, "link": None,
        "locked": False, "containerId": None,
        "lineHeight": lh,
    }

def arrow(id_, x1, y1, x2, y2, color="#1e3a5f", sw=2, style="solid"):
    global seed
    seed += 7
    dx = x2 - x1
    dy = y2 - y1
    return {
        "type": "arrow", "id": id_,
        "x": x1, "y": y1,
        "width": abs(dx), "height": abs(dy),
        "strokeColor": color, "backgroundColor": "transparent",
        "fillStyle": "solid", "strokeWidth": sw,
        "strokeStyle": style, "roughness": 0,
        "opacity": 100, "angle": 0,
        "seed": seed, "version": 1,
        "versionNonce": seed + 1,
        "isDeleted": False, "groupIds": [],
        "boundElements": None, "link": None,
        "locked": False,
        "points": [[0, 0], [dx, dy]],
        "startBinding": None, "endBinding": None,
        "startArrowhead": None, "endArrowhead": "arrow",
    }

def line(id_, x1, y1, x2, y2, color="#e2e8f0", sw=1):
    global seed
    seed += 7
    dx = x2 - x1
    dy = y2 - y1
    return {
        "type": "line", "id": id_,
        "x": x1, "y": y1,
        "width": abs(dx), "height": abs(dy),
        "strokeColor": color, "backgroundColor": "transparent",
        "fillStyle": "solid", "strokeWidth": sw,
        "strokeStyle": "solid", "roughness": 0,
        "opacity": 100, "angle": 0,
        "seed": seed, "version": 1,
        "versionNonce": seed + 1,
        "isDeleted": False, "groupIds": [],
        "boundElements": None, "link": None,
        "locked": False,
        "points": [[0, 0], [dx, dy]],
    }

# ─────────────────────────────────────────────────────────────────────
# CANVAS DIMENSIONS
# ─────────────────────────────────────────────────────────────────────
W = 3600
PAD = 120  # side margin
CONTENT_W = W - 2 * PAD  # 3360

# ─────────────────────────────────────────────────────────────────────
# SECTION 0: HERO BAR
# ─────────────────────────────────────────────────────────────────────
elements.append(rect("hero_bg", 0, 0, W, 120, "#0f172a", "#0f172a"))
elements.append(text("hero_title", PAD, 18, CONTENT_W, 50,
    "rstack  —  Richardson Gunde's AI Engineering Workspace",
    "#f8fafc", size=34, align="center"))
elements.append(text("hero_stats", PAD, 70, CONTENT_W, 36,
    "195 agents   ·   65 skills   ·   72 plugins   ·   16 hooks   ·   10 bin scripts   ·   37 commands",
    "#94a3b8", size=17, align="center"))

# ─────────────────────────────────────────────────────────────────────
# SECTION 1: IDENTITY LAYER
# ─────────────────────────────────────────────────────────────────────
Y1 = 145
elements.append(text("s1_label", PAD, Y1, 300, 26,
    "① IDENTITY", "#1e40af", size=15, align="left"))

cards = [
    ("id_ethos",  "ETHOS.md",  "Builder Philosophy", "#fed7aa", "#c2410c"),
    ("id_design", "DESIGN.md", "Amber · Dark · Tight",  "#ddd6fe", "#6d28d9"),
    ("id_agents", "AGENTS.md", "Master Discovery",   "#bfdbfe", "#1d4ed8"),
    ("id_claude", "CLAUDE.md", "Routing + Rules",    "#a7f3d0", "#047857"),
    ("id_ver",    "v1.0.0",    "VERSION + CHANGELOG","#fef3c7", "#b45309"),
]
CW = 594  # card width
CG = 30   # gap
CY = Y1 + 32
CH = 110

for i, (cid, title, sub, fill, stroke) in enumerate(cards):
    cx = PAD + i * (CW + CG)
    elements.append(rect(cid, cx, CY, CW, CH, fill, stroke, sw=2))
    elements.append(text(f"{cid}_t", cx, CY + 26, CW, 32,
        title, "#1e293b", size=20, align="center"))
    elements.append(text(f"{cid}_s", cx, CY + 66, CW, 26,
        sub, "#374151", size=14, align="center"))

# Divider
DIV1 = CY + CH + 28
elements.append(line("div1", PAD, DIV1, W - PAD, DIV1, "#cbd5e1", sw=1))

# ─────────────────────────────────────────────────────────────────────
# SECTION 2: CORE EXECUTION ENGINE
# ─────────────────────────────────────────────────────────────────────
Y2 = DIV1 + 24
elements.append(text("s2_label", PAD, Y2, 500, 26,
    "② CORE EXECUTION ENGINE", "#1e40af", size=15, align="left"))

BW = 720   # box width
BH = 190   # box height
ARROW_W = 100
TOTAL_CORE = 3 * BW + 2 * ARROW_W
CORE_START = PAD + (CONTENT_W - TOTAL_CORE) // 2
BY = Y2 + 34

# Orchestrator
OX = CORE_START
elements.append(rect("orch", OX, BY, BW, BH, "#ede9fe", "#6d28d9", sw=2))
elements.append(text("orch_title", OX, BY + 16, BW, 32,
    "ORCHESTRATOR", "#4c1d95", size=22, align="center"))
elements.append(text("orch_path", OX, BY + 52, BW, 20,
    "agents/core/orchestrator.md", "#6d28d9", size=13, align="center"))
elements.append(text("orch_body", OX, BY + 80, BW, 80,
    "Routes tasks to the right specialist\nReads AGENTS.md for every decision\nNever executes directly — delegates all\nModel: claude-opus",
    "#374151", size=14, align="center", valign="top", lh=1.5))

# Arrow 1
AX1 = OX + BW + 8
AY1 = BY + BH // 2
elements.append(arrow("arr1", AX1, AY1, AX1 + ARROW_W - 16, AY1, "#6d28d9", sw=3))
elements.append(text("arr1_lbl", AX1, AY1 - 20, ARROW_W - 16, 16,
    "spawn task", "#6d28d9", size=11, align="center"))

# Builder
BXB = OX + BW + ARROW_W
elements.append(rect("build", BXB, BY, BW, BH, "#dbeafe", "#1d4ed8", sw=2))
elements.append(text("build_title", BXB, BY + 16, BW, 32,
    "BUILDER", "#1e3a5f", size=22, align="center"))
elements.append(text("build_path", BXB, BY + 52, BW, 20,
    "agents/core/builder.md", "#1d4ed8", size=13, align="center"))
elements.append(text("build_body", BXB, BY + 80, BW, 80,
    "Executes ONE task at a time\nLoads the right skill + plugin first\nWrites code, creates files, runs tests\nOutputs: outputs/team_state/[task].json",
    "#374151", size=14, align="center", valign="top", lh=1.5))

# Arrow 2
AX2 = BXB + BW + 8
elements.append(arrow("arr2", AX2, AY1, AX2 + ARROW_W - 16, AY1, "#1d4ed8", sw=3))
elements.append(text("arr2_lbl", AX2, AY1 - 20, ARROW_W - 16, 16,
    "state JSON", "#1d4ed8", size=11, align="center"))

# Validator
VX = BXB + BW + ARROW_W
elements.append(rect("valid", VX, BY, BW, BH, "#d1fae5", "#047857", sw=2))
elements.append(text("valid_title", VX, BY + 16, BW, 32,
    "VALIDATOR", "#064e3b", size=22, align="center"))
elements.append(text("valid_path", VX, BY + 52, BW, 20,
    "agents/core/validator.md", "#047857", size=13, align="center"))
elements.append(text("valid_body", VX, BY + 80, BW, 80,
    "Read-only — cannot modify files\nReads and verifies builder state JSON\nWrites validation.json: PASS or FAIL\nModel: claude-opus",
    "#374151", size=14, align="center", valign="top", lh=1.5))

# Feedback arrow (dashed, below)
FB_Y = BY + BH + 32
elements.append(text("fb_lbl", OX + BW // 2, FB_Y - 20, TOTAL_CORE, 18,
    "PASS → next stage   |   FAIL → builder retries (max 2×)", "#047857", size=13, align="center"))

# Hooks box (below builder, dashed red)
HY = BY + BH + 14
elements.append(rect("hooks_badge", BXB, HY, BW, 80,
    "#fff1f2", "#dc2626", sw=1, style="dashed"))
elements.append(text("hooks_badge_t", BXB, HY + 6, BW, 22,
    "HOOKS (auto-fire on builder + validator)", "#dc2626", size=13, align="center"))
elements.append(text("hooks_badge_b", BXB, HY + 32, BW, 46,
    "PreToolUse: blocks rm -rf, DROP TABLE, .env access\nPostToolUse: ruff lint · ty type-check · contract validation",
    "#374151", size=12, align="center", lh=1.5))

DIV2 = HY + 80 + 28
elements.append(line("div2", PAD, DIV2, W - PAD, DIV2, "#cbd5e1", sw=1))

# ─────────────────────────────────────────────────────────────────────
# SECTION 3: AGENT ECOSYSTEM
# ─────────────────────────────────────────────────────────────────────
Y3 = DIV2 + 26
elements.append(text("s3_label", PAD, Y3, 600, 26,
    "③ AGENT ECOSYSTEM  —  195 agents total", "#1e40af", size=15, align="left"))

# SDLC column (left)
SDLC_X = PAD
SDLC_Y = Y3 + 34
SDLC_W = 300
SDLC_H = 380

elements.append(rect("sdlc_box", SDLC_X, SDLC_Y, SDLC_W, SDLC_H, "#f0fdf4", "#047857", sw=2))
elements.append(text("sdlc_title", SDLC_X, SDLC_Y + 14, SDLC_W, 26,
    "SDLC PIPELINE", "#065f46", size=16, align="center"))
elements.append(text("sdlc_sub", SDLC_X, SDLC_Y + 44, SDLC_W, 18,
    "15 sequential stages", "#047857", size=12, align="center"))
elements.append(text("sdlc_list", SDLC_X + 20, SDLC_Y + 70, SDLC_W - 40, 290,
    "00  environment\n01  transcript\n02  requirements\n03  documentation\n04  planning\n05  jira\n06  architecture\n07  code  ←  core\n08  testing\n09  deployment\n10  summary\n──────────────\n11  feedback-loop\n12  security-threat-model\n13  compliance-checker\n14  cost-estimation",
    "#374151", size=12, align="left", valign="top", lh=1.55))

# Domain specialist grid
GX = SDLC_X + SDLC_W + 32  # start x
GW = CONTENT_W - SDLC_W - 32  # remaining width
# 4 columns, 3 gaps
COLS = 4
COL_GAP = 24
BOX_W = (GW - (COLS - 1) * COL_GAP) // COLS  # ~710
BOX_H = 90
ROW_GAP = 20

domains = [
    # (id, name, count, subtitle, fill, stroke)
    ("backend",  "backend",  "49 agents", "APIs · frameworks · language specialists · databases",    "#dbeafe", "#1d4ed8"),
    ("devops",   "devops",   "34 agents", "cloud · CI/CD · Docker · Kubernetes · monitoring · Git", "#d1fae5", "#047857"),
    ("qa",       "qa",       "18 agents", "testing · debugging · code review · e2e · bounty-hunter","#fef3c7", "#b45309"),
    ("security", "security", "11 agents", "OWASP · pentest · compliance · threat modelling",        "#fee2e2", "#b91c1c"),
    ("product",  "product",  "19 agents", "PM · scrum · UX research · sprint · Jira · strategy",   "#e0e7ff", "#3730a3"),
    ("data",     "data",     "13 agents", "ML · LLM architecture · data pipelines · analytics",    "#fce7f3", "#9d174d"),
    ("frontend", "frontend", "10 agents", "React · shadcn/ui · design systems · accessibility",    "#dcfce7", "#15803d"),
    ("docs",     "docs",     "13 agents", "technical writing · diagrams · changelogs · API docs",  "#e0f2fe", "#0369a1"),
]

for i, (did, name, count, sub, fill, stroke) in enumerate(domains):
    col = i % COLS
    row = i // COLS
    bx = GX + col * (BOX_W + COL_GAP)
    by = SDLC_Y + row * (BOX_H + ROW_GAP)
    elements.append(rect(f"dom_{did}", bx, by, BOX_W, BOX_H, fill, stroke, sw=2))
    elements.append(text(f"dom_{did}_name", bx, by + 12, BOX_W, 32,
        f"{name}  ·  {count}", stroke.replace("b9","1e").replace("0369","1e3a"), size=18, align="center"))
    elements.append(text(f"dom_{did}_sub", bx, by + 52, BOX_W, 26,
        sub, "#374151", size=11, align="center"))

# Crypto — full width row
CRY_Y = SDLC_Y + 2 * (BOX_H + ROW_GAP)
elements.append(rect("dom_crypto", GX, CRY_Y, GW, BOX_H, "#fff7ed", "#b45309", sw=2))
elements.append(text("dom_crypto_n", GX, CRY_Y + 14, GW, 30,
    "crypto  ·  10 agents  (all model variants: haiku / sonnet / opus)",
    "#92400e", size=18, align="center"))
elements.append(text("dom_crypto_s", GX, CRY_Y + 52, GW, 26,
    "coin-analyzer  ·  market-agent  ·  investment-plays  ·  movers",
    "#374151", size=12, align="center"))

DIV3 = CRY_Y + BOX_H + 28
elements.append(line("div3", PAD, DIV3, W - PAD, DIV3, "#cbd5e1", sw=1))

# ─────────────────────────────────────────────────────────────────────
# SECTION 4: KNOWLEDGE LAYER
# ─────────────────────────────────────────────────────────────────────
Y4 = DIV3 + 22
elements.append(text("s4_label", PAD, Y4, 700, 26,
    "④ KNOWLEDGE LAYER  —  what agents load before executing",
    "#1e40af", size=15, align="left"))

KH = 260  # knowledge box height
KW = (CONTENT_W - 2 * 32) // 3  # 3 equal cols
KY = Y4 + 34
KG = 32

knowledge = [
    ("sk_box", "65 SKILLS", "skills/[name]/SKILL.md",
     "Loaded by agents before any work:\n\nWORKFLOW (from gstack)\ninvestigate · ship · code-review-pr\nqa-testing · careful · freeze · guard\nautoplan · plan-eng-review · retro\nland-and-deploy · security-owasp\n\nCUSTOM rstack\nfrontend-design · mcp-builder\nbounty-hunting · prompt-engineering",
     "#dbeafe", "#1d4ed8"),
    ("pl_box", "72 PLUGINS", "plugins/[name]/",
     "Domain packs — each contains agents + skills:\n\nbackend-development  →  8 agents + 10 skills\nui-design            →  3 agents + 7 skills\nmachine-learning-ops →  3 agents + 1 skill\npayment-processing   →  1 agent + 4 skills\nincident-response    →  6 agents + 3 skills\ndeveloper-essentials →  1 agent + 2 skills\n\n+ 66 more domain packs",
     "#ede9fe", "#6d28d9"),
    ("cm_box", "37 COMMANDS", "commands/[name].md",
     "Slash command workflows:\n\nCORE  /plan · /build · /code-review\n      /create-pr · /create-feature\n\nCONTEXT  /prime · /question · /sentient\n\nQUALITY  /analyze-coverage · /audit-report\n         /check-owasp · /clean\n\nDEPLOY   /blue-green-deployment · /act\n\nCRYPTO   /crypto_research",
     "#d1fae5", "#047857"),
]

for i, (kid, title, path, body, fill, stroke) in enumerate(knowledge):
    kx = PAD + i * (KW + KG)
    elements.append(rect(kid, kx, KY, KW, KH, fill, stroke, sw=2))
    elements.append(text(f"{kid}_t", kx, KY + 14, KW, 32,
        title, stroke, size=22, align="center"))
    elements.append(text(f"{kid}_p", kx, KY + 50, KW, 18,
        path, stroke, size=12, align="center"))
    elements.append(text(f"{kid}_b", kx + 20, KY + 76, KW - 40, KH - 80,
        body, "#374151", size=12, align="left", valign="top", lh=1.5))

DIV4 = KY + KH + 28
elements.append(line("div4", PAD, DIV4, W - PAD, DIV4, "#cbd5e1", sw=1))

# ─────────────────────────────────────────────────────────────────────
# SECTION 5: INFRASTRUCTURE
# ─────────────────────────────────────────────────────────────────────
Y5 = DIV4 + 22
elements.append(text("s5_label", PAD, Y5, 600, 26,
    "⑤ INFRASTRUCTURE  —  automatic, invisible, always on",
    "#1e40af", size=15, align="left"))

IH = 270
IW = KW
IY = Y5 + 34

infra = [
    ("hk_box", "16 HOOK SCRIPTS", "hooks/scripts/",
     "Fire automatically — no manual invocation:\n\nPreToolUse  →  pre_tool_use.py\n  Blocks: rm -rf, DROP TABLE, force-push\n  Blocks: .env file access\n\nPostToolUse (Write|Edit)\n  →  post_tool_use.py  (validation)\n  →  ruff_validator.py  (Python lint)\n  →  ty_validator.py  (type checking)\n\nSessionEnd\n  →  session_end.py  (state persist)\n  →  post_agent_contract_validator.py",
     "#fff1f2", "#dc2626"),
    ("bn_box", "10 BIN SCRIPTS", ".claude/bin/",
     "rstack tools — called by skills:\n\nrstack-config      config read/write\nrstack-slug        project ID from git\nrstack-repo-mode   solo vs collaborative\nrstack-learnings-log   append learning\nrstack-learnings-search  search sessions\nrstack-review-log  record /review ran\nrstack-review-read gate /ship behind review\nrstack-analytics   log skill usage\nrstack-skill-check validate SKILL.md files\ncheck-careful.sh   destructive cmd guard",
     "#fffbeb", "#b45309"),
    ("st_box", "~/.rstack/  STATE", "Local — never sent anywhere",
     "config.yaml\n  proactive: true\n  analytics: local\n  require_review_before_ship: true\n\nsessions/\n  Active session tracking (2h TTL)\n\nanalytics/skill-usage.jsonl\n  {skill, duration_s, outcome, branch, ts}\n\nprojects/$SLUG/learnings.jsonl\n  {skill, type, key, insight,\n   confidence, source, files, ts}\n\nprojects/$SLUG/review-log.jsonl\n  {branch, status, commit, ts}",
     "#0f172a", "#334155"),
]

for i, (iid, title, path, body, fill, stroke) in enumerate(infra):
    ix = PAD + i * (IW + KG)
    elements.append(rect(iid, ix, IY, IW, IH, fill, stroke, sw=2))
    is_dark = fill == "#0f172a"
    title_color = "#f1f5f9" if is_dark else stroke
    path_color = "#94a3b8" if is_dark else stroke
    body_color = "#e2e8f0" if is_dark else "#374151"
    elements.append(text(f"{iid}_t", ix, IY + 14, IW, 30,
        title, title_color, size=19, align="center"))
    elements.append(text(f"{iid}_p", ix, IY + 48, IW, 18,
        path, path_color, size=12, align="center"))
    elements.append(text(f"{iid}_b", ix + 20, IY + 72, IW - 40, IH - 80,
        body, body_color, size=12, align="left", valign="top", lh=1.5))

DIV5 = IY + IH + 28
elements.append(line("div5", PAD, DIV5, W - PAD, DIV5, "#cbd5e1", sw=1))

# ─────────────────────────────────────────────────────────────────────
# FOOTER — SUMMARY FLOW
# ─────────────────────────────────────────────────────────────────────
FY = DIV5 + 20
elements.append(text("flow_title", PAD, FY, CONTENT_W, 22,
    "⑥  TASK FLOW:   Richardson types request  →  Orchestrator routes  →  Builder loads skill + executes  →  Hooks fire  →  Validator verifies  →  ~/.rstack/ logs learnings",
    "#475569", size=13, align="center"))

FINAL_H = FY + 30

# ─────────────────────────────────────────────────────────────────────
# OUTPUT
# ─────────────────────────────────────────────────────────────────────
diagram = {
    "type": "excalidraw",
    "version": 2,
    "source": "https://excalidraw.com",
    "elements": elements,
    "appState": {
        "viewBackgroundColor": "#f8fafc",
        "gridSize": 20,
    },
    "files": {}
}

with open("/Users/richardsongunde/projects/.claude/docs/rstack-architecture.excalidraw", "w") as f:
    json.dump(diagram, f, indent=2)

print(f"Generated: {len(elements)} elements")
print(f"Canvas: {W} × {FINAL_H}")
print("Saved: docs/rstack-architecture.excalidraw")
