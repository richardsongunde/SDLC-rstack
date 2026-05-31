// owner: RStack developed by Richardson Gunde
// Minimal bulletproof dashboard — simple layout, no external deps, HTTP-first

export function dashboardHtml(port) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RStack Business Hub</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; background: #f5f5f5; color: #1a1a1a; }

/* Simple sidebar + content layout */
#shell { display: flex; height: 100vh; }
#sidebar { width: 200px; min-width: 200px; background: #1a1a1a; color: #ccc; display: flex; flex-direction: column; overflow-y: auto; }
#main { flex: 1; display: flex; flex-direction: column; min-height: 0; background: #f5f5f5; }
#topbar { height: 48px; background: #fff; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; padding: 0 16px; gap: 12px; flex-shrink: 0; }
#content { flex: 1; overflow-y: auto; padding: 20px; }

/* Sidebar */
.brand { padding: 14px 12px; border-bottom: 1px solid #333; }
.brand-name { font-size: 14px; font-weight: 700; color: #fff; }
.brand-sub  { font-size: 10px; color: #666; margin-top: 1px; }
.nav-link { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; background: none; border: none; color: #888; font-size: 13px; cursor: pointer; text-align: left; font-family: inherit; border-radius: 4px; margin: 1px 8px; width: calc(100% - 16px); transition: background 0.15s, color 0.15s; }
.nav-link:hover { background: #2a2a2a; color: #ddd; }
.nav-link.active { background: rgba(217,119,6,0.2); color: #d97706; }
.nav-section { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #555; padding: 10px 12px 4px; font-weight: 700; }
.sidebar-kpis { padding: 10px; border-top: 1px solid #333; margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.skpi { background: #2a2a2a; border-radius: 5px; padding: 7px 9px; }
.skpi-v { font-size: 16px; font-weight: 700; color: #fff; font-family: monospace; }
.skpi-l { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
.ws-dot { width: 8px; height: 8px; border-radius: 50%; background: #444; margin-left: auto; flex-shrink: 0; }
.ws-dot.live { background: #22c55e; box-shadow: 0 0 6px #22c55e; }

/* Topbar */
.tb-title { font-size: 15px; font-weight: 700; }
.tb-sep { width: 1px; height: 20px; background: #e0e0e0; }
.tb-chip { padding: 4px 10px; border: 1px solid #e0e0e0; border-radius: 5px; background: #f9f9f9; font-size: 12px; cursor: pointer; color: #666; font-family: inherit; }
.tb-chip:hover { border-color: #d97706; color: #d97706; background: #fffbf0; }
.tb-chip.warn { border-color: #f59e0b; color: #d97706; background: #fffbf0; }
.tb-chip.danger { border-color: #ef4444; color: #dc2626; background: #fff5f5; }
.tb-right { margin-left: auto; display: flex; gap: 8px; }
.tb-status { font-size: 12px; color: #888; display: flex; align-items: center; gap: 5px; }
.tb-dot { width: 7px; height: 7px; border-radius: 50%; background: #999; }

/* Pages */
.page { display: none; }
.page.active { display: block; }

/* Error banner */
#err { display: none; background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; padding: 8px 14px; border-radius: 6px; margin-bottom: 14px; font-size: 12px; font-family: monospace; }

/* Cards */
.card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 14px; overflow: hidden; }
.card-header { padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #888; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
.card-body { padding: 14px; }

/* KPI grid */
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.kpi { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px; }
.kpi-v { font-size: 24px; font-weight: 800; font-family: monospace; margin-bottom: 4px; }
.kpi-l { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #888; }
.kpi-s { font-size: 11px; color: #aaa; margin-top: 2px; }
.kpi.orange .kpi-v { color: #d97706; border-left: 3px solid #d97706; padding-left: 10px; }
.kpi.green  .kpi-v { color: #16a34a; border-left: 3px solid #16a34a; padding-left: 10px; }
.kpi.blue   .kpi-v { color: #2563eb; border-left: 3px solid #2563eb; padding-left: 10px; }
.kpi.red    .kpi-v { color: #dc2626; border-left: 3px solid #dc2626; padding-left: 10px; }

/* Two-column */
.two-col { display: grid; grid-template-columns: 1fr 320px; gap: 14px; }

/* Table */
table { width: 100%; border-collapse: collapse; }
th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #888; padding: 8px 12px; text-align: left; border-bottom: 1px solid #e0e0e0; background: #fafafa; }
td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; vertical-align: middle; }
tr.clickable:hover td { background: #fafafa; cursor: pointer; }
tr:last-child td { border-bottom: none; }

/* Pill */
.pill { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap; font-family: monospace; }
.pill.pass, .pill.done { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.pill.fail { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.pill.running, .pill.active { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.pill.stalled, .pill.ended, .pill.idle { background: #f5f5f5; color: #888; border: 1px solid #e0e0e0; }
.pill.queued { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

/* Feed row */
.frow { display: flex; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f5f5f5; align-items: flex-start; }
.frow:last-child { border-bottom: none; }
.ficon { width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; font-family: monospace; }
.ficon.pass { background: #f0fdf4; color: #16a34a; }
.ficon.fail { background: #fef2f2; color: #dc2626; }
.ficon.warn { background: #fffbeb; color: #d97706; }
.ficon.info { background: #eff6ff; color: #2563eb; }
.ficon.tool, .ficon.dim { background: #f5f5f5; color: #aaa; }
.ftext { flex: 1; min-width: 0; }
.fsummary { font-size: 13px; color: #1a1a1a; line-height: 1.4; }
.fmeta { font-size: 11px; color: #aaa; margin-top: 2px; font-family: monospace; display: flex; gap: 8px; }
.fts { font-size: 11px; color: #aaa; white-space: nowrap; flex-shrink: 0; font-family: monospace; }

/* Agent card */
.acard { background: #fff; border: 1px solid #e0e0e0; border-left: 3px solid #d97706; border-radius: 8px; padding: 14px; margin-bottom: 10px; }
.acard.pass { border-left-color: #16a34a; }
.acard.fail { border-left-color: #dc2626; }
.acard.queued, .acard.idle, .acard.pending { border-left-color: #e0e0e0; }
.acard-eye { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #d97706; margin-bottom: 3px; font-family: monospace; }
.acard.pass .acard-eye { color: #16a34a; }
.acard.fail .acard-eye { color: #dc2626; }
.acard.queued .acard-eye, .acard.idle .acard-eye, .acard.pending .acard-eye { color: #888; }
.acard-title { font-size: 13.5px; font-weight: 700; margin-bottom: 2px; }
.acard-id { font-size: 11px; color: #aaa; margin-bottom: 8px; font-family: monospace; }
.acard-summary { font-size: 13px; color: #555; line-height: 1.45; margin-bottom: 8px; }
.acard-summary.pending { color: #aaa; font-style: italic; }
.evbar { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #f9f9f9; border-radius: 5px; margin-bottom: 8px; }
.evbar-track { flex: 1; background: #e0e0e0; border-radius: 2px; height: 4px; overflow: hidden; }
.evbar-fill { height: 100%; border-radius: 2px; background: #16a34a; }
.asec { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #aaa; margin-bottom: 4px; margin-top: 8px; }
.arow { display: flex; gap: 8px; padding: 3px 0; font-size: 12.5px; color: #555; }
.aic { font-size: 10px; font-family: monospace; font-weight: 700; flex-shrink: 0; color: #d97706; }
.achips { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
.chip { font-family: monospace; font-size: 10px; padding: 2px 7px; border-radius: 4px; background: #f5f5f5; border: 1px solid #e0e0e0; color: #555; }
.chip.g { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }
.chip.b { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
.chip.a { background: #fffbeb; border-color: #fde68a; color: #d97706; }
.chip.r { background: #fef2f2; border-color: #fecaca; color: #dc2626; }

/* Pipeline */
.pipe-run { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }
.pipe-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.pipe-goal { font-size: 13px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.pipe-stages { display: flex; gap: 5px; overflow-x: auto; padding-bottom: 4px; }
.pstage { flex-shrink: 0; min-width: 72px; padding: 6px 8px; border-radius: 6px; text-align: center; border: 1px solid #e0e0e0; background: #f9f9f9; }
.pstage.done { background: #f0fdf4; border-color: #bbf7d0; }
.pstage.fail { background: #fef2f2; border-color: #fecaca; }
.pstage.running { background: #fffbeb; border-color: #fde68a; }
.pstage-id { font-family: monospace; font-size: 8px; color: #aaa; margin-bottom: 2px; }
.pstage-name { font-size: 10px; font-weight: 700; color: #555; margin-bottom: 4px; line-height: 1.2; }
.pstage-dot { width: 6px; height: 6px; border-radius: 50%; background: #ddd; margin: 0 auto; }
.pstage.done .pstage-dot { background: #16a34a; }
.pstage.fail .pstage-dot { background: #dc2626; }
.pstage.running .pstage-dot { background: #d97706; }
.pstage.done .pstage-name { color: #16a34a; }
.pstage.fail .pstage-name { color: #dc2626; }

/* Pbar */
.pbar-row { margin-bottom: 10px; }
.pbar-lbl { display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 4px; }
.pbar { height: 5px; background: #e0e0e0; border-radius: 3px; overflow: hidden; }
.pbar-fill { height: 100%; border-radius: 3px; }
.pbar-fill.g { background: #22c55e; }
.pbar-fill.a { background: #f59e0b; }
.pbar-fill.r { background: #ef4444; }

/* Alerts */
.alert-row { display: flex; gap: 10px; padding: 10px 12px; border-radius: 7px; margin-bottom: 8px; border: 1px solid; }
.alert-row.warn { background: #fffbeb; border-color: #fde68a; }
.alert-row.critical { background: #fef2f2; border-color: #fecaca; }
.alert-row.info { background: #eff6ff; border-color: #bfdbfe; }
.alert-icon { font-size: 16px; flex-shrink: 0; }
.alert-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.alert-detail { font-size: 12px; color: #666; }

/* Approvals */
.appr-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px; margin-bottom: 10px; }
.appr-card.pending { border-left: 3px solid #f59e0b; }
.appr-card.approved { border-left: 3px solid #16a34a; opacity: 0.7; }
.appr-card.rejected { border-left: 3px solid #dc2626; opacity: 0.7; }
.appr-title { font-size: 13.5px; font-weight: 700; margin-bottom: 4px; }
.appr-detail { font-size: 12.5px; color: #666; margin-bottom: 6px; }
.appr-meta { font-family: monospace; font-size: 11px; color: #aaa; margin-bottom: 10px; }
.appr-btns { display: flex; gap: 8px; }
.btn-approve { padding: 5px 14px; border-radius: 5px; border: none; background: #16a34a; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
.btn-reject  { padding: 5px 14px; border-radius: 5px; border: 1px solid #fca5a5; background: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }

/* Traceability */
.trace-card { margin-bottom: 14px; }
.trace-stages { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0 10px; }
.trace-stage { padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
.trace-stage.done { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.trace-stage.todo { background: #f5f5f5; color: #aaa; border: 1px solid #e0e0e0; }
.trace-req { padding: 5px 9px; background: #f9f9f9; border-radius: 5px; font-size: 12px; margin-bottom: 3px; border-left: 2px solid #2563eb; }
.trace-req-id { font-family: monospace; font-size: 9px; color: #aaa; margin-bottom: 1px; }
.trace-task-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f0f0f0; font-size: 12.5px; }
.trace-task-row:last-child { border-bottom: none; }

/* Empty state */
.empty { text-align: center; padding: 40px 20px; color: #aaa; }
.empty-icon { font-size: 28px; opacity: 0.4; margin-bottom: 8px; }
.empty-title { font-size: 14px; font-weight: 700; color: #999; margin-bottom: 4px; }
.empty-sub { font-size: 12.5px; max-width: 280px; margin: 0 auto; line-height: 1.5; }

/* Drawer */
#drawer-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.35); z-index: 100; }
#drawer-overlay.open { display: block; }
#drawer-panel { position: fixed; top: 0; right: -520px; bottom: 0; width: 500px; background: #fff; border-left: 1px solid #e0e0e0; z-index: 101; transition: right 0.25s; display: flex; flex-direction: column; box-shadow: -4px 0 20px rgba(0,0,0,0.08); overflow: hidden; }
#drawer-panel.open { right: 0; }
.dr-header { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 10px; flex-shrink: 0; }
.dr-head-main { flex: 1; min-width: 0; }
.dr-eye { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #d97706; margin-bottom: 3px; font-family: monospace; }
.dr-title { font-size: 14px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dr-sub { font-family: monospace; font-size: 10px; color: #aaa; margin-top: 2px; }
.dr-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #aaa; padding: 2px; line-height: 1; }
.dr-body { flex: 1; overflow-y: auto; padding: 16px; }
.dr-sec { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #aaa; margin-bottom: 8px; }
.dr-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
.dr-kpi { background: #f9f9f9; border-radius: 7px; padding: 9px 10px; text-align: center; border: 1px solid #e0e0e0; }
.dr-kpi-v { font-family: monospace; font-size: 18px; font-weight: 700; margin-bottom: 2px; }
.dr-kpi-l { font-size: 9px; color: #aaa; text-transform: uppercase; letter-spacing: 0.06em; }
.dr-min-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f5f5f5; font-size: 12px; }
.dr-min-row:last-child { border-bottom: none; }
.dr-min-time { font-family: monospace; font-size: 10px; color: #aaa; width: 44px; flex-shrink: 0; }
.dr-min-bar { flex: 1; background: #f0f0f0; border-radius: 2px; height: 5px; overflow: hidden; }
.dr-min-fill { height: 100%; border-radius: 2px; background: #2563eb; }
.dr-min-count { font-family: monospace; font-size: 10px; color: #aaa; width: 30px; text-align: right; flex-shrink: 0; }
.dr-tags { display: flex; gap: 3px; flex-wrap: wrap; margin-left: 6px; }
</style>
</head>
<body>

<div id="shell">
  <!-- SIDEBAR -->
  <div id="sidebar">
    <div class="brand">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:26px;height:26px;border-radius:6px;background:#d97706;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">R</div>
        <div>
          <div class="brand-name">rstack</div>
          <div class="brand-sub">business hub</div>
        </div>
        <div class="ws-dot" id="ws-dot" style="margin-left:auto"></div>
      </div>
    </div>
    <div style="padding:8px 4px;flex:1">
      <div class="nav-section">Observe</div>
      <button class="nav-link active" data-page="command">⌘ Command Center</button>
      <button class="nav-link" data-page="feed">⚡ Live Feed</button>
      <button class="nav-link" data-page="pipeline">→ Pipeline</button>
      <button class="nav-link" data-page="agents">◈ Agent Actions</button>
      <div class="nav-section">Manage</div>
      <button class="nav-link" data-page="approvals">✓ Approvals <span id="badge-approvals" style="display:none;background:#dc2626;color:#fff;font-size:9px;border-radius:9px;padding:1px 5px;margin-left:4px;font-family:monospace">0</span></button>
      <button class="nav-link" data-page="alerts">△ Alerts <span id="badge-alerts" style="display:none;background:#dc2626;color:#fff;font-size:9px;border-radius:9px;padding:1px 5px;margin-left:4px;font-family:monospace">0</span></button>
      <div class="nav-section">Explore</div>
      <button class="nav-link" data-page="runs">▦ All Runs</button>
      <button class="nav-link" data-page="traceability">◉ Traceability</button>
      <button class="nav-link" data-page="team">≡ Team</button>
    </div>
    <div class="sidebar-kpis">
      <div class="skpi"><div class="skpi-v" id="sk-runs">—</div><div class="skpi-l">Runs</div></div>
      <div class="skpi"><div class="skpi-v" id="sk-cost">—</div><div class="skpi-l">Cost</div></div>
      <div class="skpi"><div class="skpi-v" id="sk-pass">—</div><div class="skpi-l">Pass</div></div>
      <div class="skpi"><div class="skpi-v" id="sk-agents">—</div><div class="skpi-l">Agents</div></div>
    </div>
  </div>

  <!-- MAIN -->
  <div id="main">
    <!-- Topbar -->
    <div id="topbar">
      <span class="tb-title" id="page-title">Command Center</span>
      <div class="tb-sep"></div>
      <div class="tb-status">
        <div class="tb-dot" id="status-dot"></div>
        <span id="status-text">Loading…</span>
      </div>
      <div class="tb-right">
        <button class="tb-chip" id="btn-alerts" onclick="showPage('alerts')">△ <span id="alert-count">—</span></button>
        <button class="tb-chip" id="btn-approvals" onclick="showPage('approvals')">✓ <span id="approval-count">—</span></button>
      </div>
    </div>

    <!-- Content -->
    <div id="content">
      <div id="err"></div>

      <!-- COMMAND CENTER -->
      <div class="page active" id="page-command">
        <div class="kpis">
          <div class="kpi orange"><div class="kpi-v" id="kpi-runs">—</div><div class="kpi-l">Total Runs</div><div class="kpi-s" id="kpi-runs-s"></div></div>
          <div class="kpi green"><div class="kpi-v" id="kpi-pass">—</div><div class="kpi-l">Tasks Passed</div><div class="kpi-s" id="kpi-pass-s"></div></div>
          <div class="kpi blue"><div class="kpi-v" id="kpi-agents">—</div><div class="kpi-l">Agent Actions</div><div class="kpi-s" id="kpi-agents-s"></div></div>
          <div class="kpi red"><div class="kpi-v" id="kpi-cost">—</div><div class="kpi-l">Cost</div><div class="kpi-s" id="kpi-cost-s"></div></div>
        </div>
        <div class="two-col">
          <div>
            <div class="card"><div class="card-header"><span>Recent Activity</span><span id="feed-count-cmd" style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;color:#aaa"></span></div><div class="card-body" id="cmd-feed" style="max-height:260px;overflow-y:auto"></div></div>
            <div class="card"><div class="card-header"><span>Projects</span><span id="proj-count" style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;color:#aaa"></span></div><div class="card-body" id="cmd-projects"></div></div>
          </div>
          <div>
            <div class="card"><div class="card-header">Recent Runs</div><div class="card-body" id="cmd-runs"></div></div>
            <div class="card"><div class="card-header">Guardrail Health</div><div class="card-body" id="cmd-guardrails"></div></div>
          </div>
        </div>
      </div>

      <!-- LIVE FEED -->
      <div class="page" id="page-feed">
        <div class="card"><div class="card-header"><span>Activity Stream</span><span id="feed-total-count" style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;color:#aaa"></span></div><div class="card-body" id="feed-list" style="max-height:calc(100vh - 160px);overflow-y:auto"></div></div>
      </div>

      <!-- PIPELINE -->
      <div class="page" id="page-pipeline">
        <div id="pipeline-body"></div>
      </div>

      <!-- AGENT ACTIONS -->
      <div class="page" id="page-agents">
        <div class="card">
          <div class="card-header"><span>Agent Work</span><span id="agents-count-header" style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;color:#aaa"></span></div>
          <div class="card-body">
            <p style="font-size:12px;color:#888;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f0f0f0">Each card is a <code style="font-family:monospace;background:#f5f5f5;padding:1px 4px;border-radius:3px">builder.json</code> written by an RStack agent. Green = PASS with evidence. Amber = active. Grey = pending.</p>
            <div id="agents-list"></div>
          </div>
        </div>
      </div>

      <!-- APPROVALS -->
      <div class="page" id="page-approvals">
        <div style="max-width:680px" id="approvals-list"></div>
      </div>

      <!-- ALERTS -->
      <div class="page" id="page-alerts">
        <div style="max-width:680px" id="alerts-list"></div>
      </div>

      <!-- ALL RUNS -->
      <div class="page" id="page-runs">
        <div class="card">
          <div class="card-header"><span>All Runs</span><span id="runs-count-header" style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;color:#aaa"></span></div>
          <table>
            <thead><tr><th style="width:95px">Status</th><th>Goal</th><th style="width:80px">Project</th><th style="width:100px">Activity</th><th style="width:110px">Tasks</th><th style="width:55px">Cost</th></tr></thead>
            <tbody id="runs-table-body"></tbody>
          </table>
        </div>
      </div>

      <!-- TRACEABILITY -->
      <div class="page" id="page-traceability">
        <div id="traceability-list"></div>
      </div>

      <!-- TEAM -->
      <div class="page" id="page-team">
        <div class="card">
          <div class="card-header">Framework Breakdown</div>
          <div class="card-body" id="team-content"></div>
        </div>
      </div>

    </div><!-- end content -->
  </div><!-- end main -->
</div><!-- end shell -->

<!-- Drawer -->
<div id="drawer-overlay" onclick="closeDrawer()"></div>
<div id="drawer-panel">
  <div class="dr-header">
    <div class="dr-head-main">
      <div class="dr-eye" id="dr-eye">◆ run detail</div>
      <div class="dr-title" id="dr-title">—</div>
      <div class="dr-sub" id="dr-sub">—</div>
    </div>
    <button class="dr-close" onclick="closeDrawer()">✕</button>
  </div>
  <div class="dr-body" id="dr-body"></div>
</div>

<script>
var STATE = null;
var PORT  = ${port};

var PAGE_LABELS = {
  command: 'Command Center', feed: 'Live Feed', pipeline: 'Pipeline',
  agents: 'Agent Actions', approvals: 'Approvals', alerts: 'Alerts',
  runs: 'All Runs', traceability: 'Traceability', team: 'Team'
};

// ── Navigation ─────────────────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.nav-link').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-page') === name);
  });
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.toggle('active', p.id === 'page-' + name);
  });
  var el = document.getElementById('page-title');
  if (el) el.textContent = PAGE_LABELS[name] || name;
}

// Wire nav buttons
document.querySelectorAll('.nav-link').forEach(function(btn) {
  btn.addEventListener('click', function() {
    showPage(btn.getAttribute('data-page'));
  });
});

// ── Error display ───────────────────────────────────────────────────────────
function showErr(msg) {
  var el = document.getElementById('err');
  if (!el) return;
  el.textContent = 'Error: ' + msg;
  el.style.display = 'block';
  console.error('[dashboard]', msg);
}

// ── Apply state ─────────────────────────────────────────────────────────────
function applyState(s) {
  STATE = s;
  try { renderSidebar(s);     } catch(e) { showErr('sidebar: ' + e.message); }
  try { renderTopbar(s);      } catch(e) { showErr('topbar: ' + e.message); }
  try { renderCommand(s);     } catch(e) { showErr('command: ' + e.message); }
  try { renderFeed(s);        } catch(e) { showErr('feed: ' + e.message); }
  try { renderPipeline(s);    } catch(e) { showErr('pipeline: ' + e.message); }
  try { renderAgents(s);      } catch(e) { showErr('agents: ' + e.message); }
  try { renderApprovals(s);   } catch(e) { showErr('approvals: ' + e.message); }
  try { renderAlerts(s);      } catch(e) { showErr('alerts: ' + e.message); }
  try { renderRuns(s);        } catch(e) { showErr('runs: ' + e.message); }
  try { renderTraceability(s);} catch(e) { showErr('traceability: ' + e.message); }
  try { renderTeam(s);        } catch(e) { showErr('team: ' + e.message); }
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
function renderSidebar(s) {
  var all = (s.runs || []).flatMap(function(r) { return r.tasks || []; });
  setText('sk-runs',   s.totalRuns || 0);
  setText('sk-cost',   '$' + ((s.totalCost || 0).toFixed(2)));
  setText('sk-pass',   all.filter(function(t) { return t.status === 'PASS'; }).length);
  setText('sk-agents', (s.agentWork || []).length);
  var pa = (s.approvalStats || {}).pending || 0;
  var al = (s.alerts || []).length;
  setBadge('badge-approvals', pa);
  setBadge('badge-alerts', al);
}

// ── Topbar ───────────────────────────────────────────────────────────────────
function renderTopbar(s) {
  var al = (s.alerts || []).length;
  var pa = (s.approvalStats || {}).pending || 0;
  setText('alert-count',    al + ' alert' + (al !== 1 ? 's' : ''));
  setText('approval-count', pa + ' pending');
  var ba  = document.getElementById('btn-alerts');
  var bap = document.getElementById('btn-approvals');
  if (ba)  ba.className  = 'tb-chip' + (al > 0 ? ' danger' : '');
  if (bap) bap.className = 'tb-chip' + (pa > 0 ? ' warn'   : '');
}

// ── Command Center ───────────────────────────────────────────────────────────
function renderCommand(s) {
  var all    = (s.runs || []).flatMap(function(r) { return r.tasks || []; });
  var passed = all.filter(function(t) { return t.status === 'PASS'; }).length;
  var failed = all.filter(function(t) { return t.status === 'FAIL'; }).length;
  var withEv = (s.agentWork || []).filter(function(w) { return (w.evidenceCount || 0) > 0; }).length;

  setText('kpi-runs',      s.totalRuns || 0);
  setText('kpi-runs-s',    (s.todayCount || 0) + ' today');
  setText('kpi-pass',      passed);
  setText('kpi-pass-s',    failed + ' failed');
  setText('kpi-agents',    (s.agentWork || []).length);
  setText('kpi-agents-s',  withEv + ' with evidence');
  setText('kpi-cost',      '$' + ((s.totalCost || 0).toFixed(4)));
  setText('kpi-cost-s',    Object.keys(s.frameworks || {}).join(', ') || '—');

  // Feed (top 12)
  var feed = (s.feed || []).slice(0, 12);
  setText('feed-count-cmd', feed.length + ' events');
  setHTML('cmd-feed', feed.length ? feed.map(feedRowHtml).join('') : emptyHtml('⚡', 'No events yet', 'Events appear as agents run'));

  // Projects
  var projs = buildProjects(s);
  var pkeys = Object.keys(projs).sort(function(a, b) { return (projs[b].last || '').localeCompare(projs[a].last || ''); });
  setText('proj-count', pkeys.length + ' projects');
  setHTML('cmd-projects', pkeys.map(function(k) {
    var p = projs[k];
    return '<div style="padding:8px 0;border-bottom:1px solid #f5f5f5"><div style="font-size:13px;font-weight:700;margin-bottom:2px">' + esc(p.name) + '</div>' +
      '<div style="font-family:monospace;font-size:10px;color:#aaa;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(p.path) + '</div>' +
      '<div style="display:flex;gap:5px">' + pill('pass', p.pass + ' pass') + pill('fail', p.fail + ' fail') + '</div></div>';
  }).join('') || emptyHtml('', 'No projects', ''));

  // Recent runs
  var activeIds = s.activeRuns || [];
  var recent    = (s.runs || []).filter(function(r) { return activeIds.indexOf(r.runId) >= 0; });
  if (!recent.length) recent = (s.runs || []).slice(0, 3);
  setHTML('cmd-runs', recent.map(function(r) {
    var tasks  = r.tasks || [];
    var p2     = tasks.filter(function(t) { return t.status === 'PASS'; }).length;
    var pct    = tasks.length ? Math.round(p2 / tasks.length * 100) : 0;
    var tc     = (r.activityTimeline || []).reduce(function(n, m) { return n + m.toolCalls; }, 0);
    var proj   = (r.projectRoot || '').split('/').filter(Boolean).pop() || '—';
    var dotClr = { active: '#d97706', done: '#16a34a', stalled: '#ef4444', ended: '#aaa' }[r.derivedStatus] || '#aaa';
    return '<div style="padding:9px 0;border-bottom:1px solid #f5f5f5">' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">' +
        '<div style="width:6px;height:6px;border-radius:50%;background:' + dotClr + ';flex-shrink:0"></div>' +
        '<span style="font-size:13px;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(((r.manifest || {}).goal || '—').slice(0, 55)) + '</span>' +
        '<span style="font-family:monospace;font-size:9.5px;color:#2563eb">' + esc(proj) + '</span>' +
      '</div>' +
      (tasks.length ? '<div style="height:3px;background:#e0e0e0;border-radius:2px;overflow:hidden;margin-bottom:4px"><div style="width:' + pct + '%;height:100%;background:#d97706"></div></div>' : '') +
      '<div style="font-size:11px;color:#aaa">' + p2 + '/' + tasks.length + ' tasks' + (tc ? ' · ' + tc + ' calls' : '') + ' · ' + esc(r.derivedStatus || '?') + '</div>' +
    '</div>';
  }).join('') || '<div style="padding:8px;color:#aaa;font-size:12px;font-style:italic">No runs yet</div>');

  // Guardrails
  var tl  = (s.runs || []).flatMap(function(r) { return r.activityTimeline || []; });
  var tc2 = tl.reduce(function(n, m) { return n + m.toolCalls; }, 0);
  var gh  = tl.reduce(function(n, m) { return n + (m.guardrails || 0); }, 0);
  setHTML('cmd-guardrails', pbarHtml('Tool Calls', tc2, Math.max(200, tc2)) + pbarHtml('Guardrail Hits', gh, Math.max(10, gh)) + pbarHtml('Cost $', s.totalCost || 0, 10, '$', 4));
}

// ── Live Feed ────────────────────────────────────────────────────────────────
function renderFeed(s) {
  var feed = s.feed || [];
  setText('feed-total-count', feed.length + ' events');
  setHTML('feed-list', feed.length ? feed.map(feedRowHtml).join('') : emptyHtml('⚡', 'No events yet', 'Events appear as agents run'));
}

// ── Pipeline ─────────────────────────────────────────────────────────────────
function renderPipeline(s) {
  var stages = s.stageMatrix || [];
  var runs   = (s.runs || []).slice(0, 8);
  if (!runs.length) { setHTML('pipeline-body', emptyHtml('→', 'No runs yet', 'Pipeline stages appear once runs execute')); return; }
  setHTML('pipeline-body', runs.map(function(r) {
    var smap  = {};
    (r.tasks || []).forEach(function(t) {
      (t.stage_artifacts || []).forEach(function(sa) {
        if (sa.stage_id) smap[sa.stage_id] = t.status === 'PASS' ? 'done' : t.status === 'FAIL' ? 'fail' : t.status === 'IN_PROGRESS' ? 'running' : 'queued';
      });
    });
    var proj  = (r.projectRoot || '').split('/').filter(Boolean).pop() || '—';
    var stHtml = stages.slice(0, 15).map(function(st) {
      var cls = smap[st.id] || 'queued';
      return '<div class="pstage ' + cls + '"><div class="pstage-id">' + esc((st.id || '').slice(0, 2)) + '</div><div class="pstage-name">' + esc((st.title || '').slice(0, 9)) + '</div><div class="pstage-dot"></div></div>';
    }).join('');
    return '<div class="pipe-run"><div class="pipe-header">' + pill(r.derivedStatus || 'idle') + '<div class="pipe-goal">' + esc((r.manifest || {}).goal || '—') + '</div><span style="font-family:monospace;font-size:9.5px;color:#2563eb;flex-shrink:0">' + esc(proj) + '</span></div><div class="pipe-stages">' + stHtml + '</div></div>';
  }).join(''));
}

// ── Agent Actions ─────────────────────────────────────────────────────────────
function renderAgents(s) {
  var work = s.agentWork || [];
  setText('agents-count-header', work.length + ' items');
  if (!work.length) { setHTML('agents-list', emptyHtml('◈', 'No agent actions yet', 'builder.json contracts appear here once agents complete tasks')); return; }
  setHTML('agents-list', work.slice(0, 60).map(function(w) {
    var sts = { PASS:'pass', FAIL:'fail', IN_PROGRESS:'running', READY:'queued', PENDING:'pending' }[w.status] || 'idle';
    var evPct = w.totalChecks > 0 ? Math.round((w.passChecks / w.totalChecks) * 100) : 0;
    var proj  = (w.projectRoot || '').split('/').filter(Boolean).pop() || '—';
    var hasSummary = w.summary && w.summary.length > 5;
    var dHtml = (w.decisions || []).length ? '<div class="asec">Decisions</div>' + w.decisions.map(function(d) { return '<div class="arow"><span class="aic">◆</span><span>' + esc(d) + '</span></div>'; }).join('') : '';
    var rHtml = (w.risks || []).length ? '<div class="asec" style="margin-top:8px">Risks</div>' + w.risks.map(function(r2) { return '<div class="arow"><span class="aic" style="color:#dc2626">▲</span><span>' + esc(r2) + '</span></div>'; }).join('') : '';
    var tHtml = (w.testsRun || []).length ? '<div class="asec" style="margin-top:8px">Evidence — tests run</div>' + w.testsRun.map(function(t) { return '<div class="arow"><span class="aic" style="color:#16a34a">✓</span><span style="font-family:monospace;font-size:10.5px">' + esc(t) + '</span></div>'; }).join('') : '';
    var fHtml = (w.filesModified || []).length ? '<div style="font-family:monospace;font-size:10.5px;background:#f9f9f9;border-radius:5px;padding:7px 9px;margin-top:7px;display:grid;grid-template-columns:auto 1fr;gap:3px 8px">' + w.filesModified.map(function(f) { return '<span style="color:#aaa">→</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(f) + '</span>'; }).join('') + '</div>' : '';
    return '<div class="acard ' + sts + '">' +
      '<div class="acard-eye">◆ ' + esc(w.agent || 'builder') + ' · ' + esc(proj) + '</div>' +
      '<div class="acard-title">' + esc(w.title || w.taskId) + '</div>' +
      '<div class="acard-id">' + esc(w.taskId) + ' · ' + esc((w.runId || '').slice(-12)) + '</div>' +
      (hasSummary ? '<div class="acard-summary">' + esc(w.summary) + '</div>' : '<div class="acard-summary pending">Task pending — no builder contract yet</div>') +
      (w.totalChecks > 0 ? '<div class="evbar"><div class="evbar-track"><div class="evbar-fill" style="width:' + evPct + '%"></div></div><span style="font-family:monospace;font-size:11px;color:#16a34a;font-weight:700">' + w.passChecks + '/' + w.totalChecks + ' checks</span>' + ((w.failedChecks || []).length ? '<span style="font-family:monospace;font-size:10px;color:#dc2626">' + w.failedChecks.length + ' failed</span>' : '') + '</div>' : '') +
      dHtml + rHtml + tHtml + fHtml +
      '<div class="achips">' + chip(w.agent || 'builder', 'a') + (w.totalChecks > 0 ? chip(evPct + '% quality', 'g') : '') + (w.riskCount > 0 ? chip(w.riskCount + ' risks', 'r') : '') + (w.specialists || []).slice(0, 2).map(function(sp) { return chip(sp.replace('agent.', ''), 'b'); }).join('') + '</div>' +
    '</div>';
  }).join(''));
}

// ── Approvals ────────────────────────────────────────────────────────────────
function renderApprovals(s) {
  var approvals = s.approvals || [];
  if (!approvals.length) { setHTML('approvals-list', emptyHtml('✓', 'No approvals yet', 'Blocked actions appear here for review')); return; }
  var pending  = approvals.filter(function(a) { return !a.status || a.status === 'pending'; });
  var resolved = approvals.filter(function(a) { return a.status && a.status !== 'pending'; });
  var html = '';
  if (pending.length)  html += '<div style="font-family:monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#aaa;margin-bottom:8px">Pending (' + pending.length + ')</div>' + pending.map(function(a) { return apprCardHtml(a, true); }).join('');
  if (resolved.length) html += '<div style="font-family:monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#aaa;margin:16px 0 8px">Resolved</div>' + resolved.slice(0, 20).map(function(a) { return apprCardHtml(a, false); }).join('');
  setHTML('approvals-list', html);
}

function apprCardHtml(a, canAct) {
  var s = a.status || 'pending';
  var sp = s === 'approved' ? pill('pass', 'Approved') : s === 'rejected' ? pill('fail', 'Rejected') : pill('running', 'Pending');
  return '<div class="appr-card ' + s + '"><div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:5px"><div class="appr-title">' + esc(a.title || a.type || 'Approval required') + '</div>' + sp + '</div>' +
    '<div class="appr-detail">' + esc(a.detail || a.reason || '') + '</div>' +
    '<div class="appr-meta">' + esc((a.runId || '—').slice(-14)) + ' · ' + esc((a.ts || '').replace('T', ' ').slice(0, 16)) + '</div>' +
    (canAct ? '<div class="appr-btns"><button class="btn-approve" data-id="' + esc(a.id) + '" onclick="doApproveBtn(this)">Approve</button><button class="btn-reject" data-id="' + esc(a.id) + '" onclick="doRejectBtn(this)">Reject</button></div>' : '') +
  '</div>';
}

function doApproveBtn(btn) { doApprove(btn.getAttribute('data-id')); }
function doRejectBtn(btn)  { doReject(btn.getAttribute('data-id')); }
function doApprove(id) { fetch('/api/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id }) }); }
function doReject(id)  { fetch('/api/reject',  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id }) }); }

// ── Alerts ───────────────────────────────────────────────────────────────────
function renderAlerts(s) {
  var alerts = s.alerts || [];
  setHTML('alerts-list', alerts.length ? alerts.map(function(a) {
    var icons = { warn: '⚠️', critical: '🔴', info: 'ℹ️' };
    return '<div class="alert-row ' + esc(a.level || 'info') + '"><div class="alert-icon">' + (icons[a.level] || 'ℹ️') + '</div><div><div class="alert-title">' + esc(a.title || '') + '</div><div class="alert-detail">' + esc(a.detail || '') + '</div></div></div>';
  }).join('') : emptyHtml('△', 'All clear', 'No thresholds breached'));
}

// ── All Runs ─────────────────────────────────────────────────────────────────
function renderRuns(s) {
  var runs = s.runs || [];
  setText('runs-count-header', runs.length + ' runs');
  setHTML('runs-table-body', runs.map(function(r) {
    var tasks  = r.tasks || [];
    var passed = tasks.filter(function(t) { return t.status === 'PASS'; }).length;
    var tl     = r.activityTimeline || [];
    var totalTc = tl.reduce(function(n, m) { return n + m.toolCalls; }, 0);
    var proj   = (r.projectRoot || '').split('/').filter(Boolean).pop() || '—';
    var created = (r.manifest || {}).created_at ? (r.manifest.created_at || '').slice(0, 16).replace('T', ' ') : '—';
    var cost   = (((r.metrics || {}).cumulative_cost_usd) || 0).toFixed(4);
    return '<tr class="clickable" data-runid="' + esc(r.runId) + '" onclick="openDrawerRow(this)">' +
      '<td>' + pill(r.derivedStatus || 'idle') + '</td>' +
      '<td style="max-width:0"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700">' + esc((r.manifest || {}).goal || '—') + '</div><div style="font-family:monospace;font-size:10px;color:#aaa;margin-top:2px">' + created + '</div></td>' +
      '<td><span style="font-family:monospace;font-size:10.5px;color:#2563eb">' + esc(proj) + '</span></td>' +
      '<td>' + sparkSvg(tl, 100, 16) + (totalTc ? '<div style="font-family:monospace;font-size:9.5px;color:#aaa">' + totalTc + ' calls</div>' : '') + '</td>' +
      '<td><span style="color:#16a34a;font-weight:700">' + passed + '</span><span style="color:#aaa">/' + tasks.length + '</span></td>' +
      '<td style="font-family:monospace;font-size:11px;color:#aaa">$' + cost + '</td>' +
    '</tr>';
  }).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:#aaa">No runs yet</td></tr>');
}

// ── Traceability ─────────────────────────────────────────────────────────────
function renderTraceability(s) {
  var traceMap = s.traceMap || [];
  if (!traceMap.length) { setHTML('traceability-list', emptyHtml('◉', 'No traceability data', 'Runs with stage artifacts will appear here')); return; }
  setHTML('traceability-list', traceMap.map(function(t) {
    var reqs  = t.requirements || [];
    var tasks2 = t.passTasks || [];
    var stHtml = [['Requirements', t.stages && t.stages.requirements, reqs.length + ' reqs'],
                  ['Architecture', t.stages && t.stages.architecture, ''],
                  ['Code', t.stages && t.stages.code, ''],
                  ['Testing', t.stages && t.stages.testing, '']].map(function(arr) {
      var l = arr[0], done = arr[1], sub = arr[2];
      return '<div class="trace-stage ' + (done ? 'done' : 'todo') + '">' + (done ? '✓' : '○') + ' ' + esc(l) + (sub && done ? ' <span style="font-size:9px;opacity:.7">(' + esc(sub) + ')</span>' : '') + '</div>';
    }).join('');
    var rHtml = reqs.length ? '<div style="font-family:monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#aaa;margin:10px 0 5px">Requirements (' + reqs.length + ')</div>' + reqs.slice(0, 8).map(function(r2) { return '<div class="trace-req"><div class="trace-req-id">' + esc(r2.id || '') + (r2.area ? ' · ' + esc(r2.area) : '') + '</div>' + esc((r2.description || '').slice(0, 120)) + '</div>'; }).join('') : '';
    var tk = tasks2.length ? '<div style="font-family:monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#aaa;margin:10px 0 5px">Verified Tasks (' + tasks2.length + ') · ' + (t.evidenceTotal || 0) + ' checks</div>' + tasks2.slice(0, 6).map(function(tsk) { return '<div class="trace-task-row">' + pill('pass', 'PASS') + '<span style="flex:1">' + esc(tsk.title) + '</span>' + (tsk.evidenceCount ? '<span style="font-family:monospace;font-size:9.5px;color:#16a34a">' + tsk.evidenceCount + ' checks</span>' : '') + '</div>'; }).join('') : '';
    return '<div class="card trace-card"><div class="card-header"><span>' + esc(t.runId.slice(-20)) + '</span><span style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;color:#aaa">' + esc((t.goal || '').slice(0, 50)) + '</span></div><div class="card-body">' + (t.brief ? '<div style="font-size:12px;color:#666;background:#f9f9f9;border-radius:5px;padding:7px 9px;margin-bottom:9px">' + esc(t.brief.slice(0, 200)) + '</div>' : '') + '<div class="trace-stages">' + stHtml + '</div>' + rHtml + tk + '</div></div>';
  }).join(''));
}

// ── Team ──────────────────────────────────────────────────────────────────────
function renderTeam(s) {
  var fw = s.frameworks || {};
  var entries = Object.keys(fw);
  setHTML('team-content', entries.length ? '<table><thead><tr><th>Framework</th><th>Runs</th><th>Pass</th><th>Fail</th><th>Cost</th><th>Rate</th></tr></thead><tbody>' + entries.map(function(name) {
    var d = fw[name], total = d.pass + d.fail, rate = total ? Math.round(d.pass / total * 100) : 0;
    return '<tr><td style="font-weight:700">' + esc(name) + '</td><td>' + d.runs + '</td><td style="color:#16a34a;font-weight:700">' + d.pass + '</td><td style="color:' + (d.fail ? '#dc2626' : '#aaa') + '">' + d.fail + '</td><td style="font-family:monospace;font-size:11px">$' + d.cost.toFixed(4) + '</td><td>' + pill(rate >= 80 ? 'pass' : rate >= 50 ? 'running' : 'fail', rate + '%') + '</td></tr>';
  }).join('') + '</tbody></table>' : emptyHtml('≡', 'No team data', ''));
}

// ── Run Drawer ────────────────────────────────────────────────────────────────
function openDrawerRow(row) { openDrawer(row.getAttribute('data-runid')); }
function openDrawer(runId) {
  var r = (STATE && STATE.runs || []).filter(function(x) { return x.runId === runId; })[0];
  if (!r) return;
  var tl    = r.activityTimeline || [];
  var tasks = r.tasks || [];
  var passed = tasks.filter(function(t) { return t.status === 'PASS'; }).length;
  var failed = tasks.filter(function(t) { return t.status === 'FAIL'; }).length;
  var totalTc = tl.reduce(function(n, m) { return n + m.toolCalls; }, 0);
  var maxTc  = Math.max.apply(null, tl.map(function(m) { return m.toolCalls; }).concat([1]));
  var svgW = 440, svgH = 44;
  var bw = tl.length ? Math.max(3, Math.floor(svgW / tl.length) - 1) : 0;
  var bars = tl.map(function(m, i) {
    var bh  = Math.max(2, Math.round((m.toolCalls / maxTc) * svgH));
    var col = (m.stagesDone || []).length ? '#16a34a' : (m.guardrails ? '#dc2626' : '#2563eb');
    return '<rect x="' + (i * (bw + 1)) + '" y="' + (svgH - bh) + '" width="' + bw + '" height="' + bh + '" fill="' + col + '" rx="1" opacity=".8"><title>' + esc(m.minute) + ' · ' + m.toolCalls + ' calls</title></rect>';
  }).join('');
  var minRows = tl.map(function(m) {
    var pct = Math.round((m.toolCalls / maxTc) * 100);
    var tags = [(m.tasksPassed ? '<span class="pill pass">' + m.tasksPassed + ' pass</span>' : ''), (m.tasksFailed ? '<span class="pill fail">' + m.tasksFailed + ' fail</span>' : ''), ((m.stagesDone || []).length ? '<span class="pill queued">stage</span>' : ''), (m.guardrails ? '<span class="pill fail">guardrail</span>' : '')].filter(Boolean).join('');
    return '<div class="dr-min-row"><span class="dr-min-time">' + esc(m.minute.slice(11, 16)) + '</span><div class="dr-min-bar"><div class="dr-min-fill" style="width:' + pct + '%"></div></div><span class="dr-min-count">' + m.toolCalls + '</span>' + (tags ? '<div class="dr-tags">' + tags + '</div>' : '') + '</div>';
  }).join('');
  var stHtml = tl.flatMap(function(m) { return (m.stagesDone || []).map(function(st) { return { s: st, min: m.minute }; }); }).map(function(x) {
    return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f5f5f5;font-size:12px"><span>' + esc(x.s) + '</span><span style="font-family:monospace;font-size:10px;color:#aaa">' + esc(x.min.slice(11, 16)) + '</span></div>';
  }).join('');
  var eye = r.host || (r.manifest || {}).framework || 'run';
  setText('dr-eye', '◆ ' + eye + ' · ' + (r.derivedStatus || '?'));
  setText('dr-title', (r.manifest || {}).goal || runId);
  setText('dr-sub', runId.slice(0, 50));
  setHTML('dr-body',
    '<div><div class="dr-sec">Overview</div><div class="dr-kpis">' +
    [[totalTc, 'Tool Calls', '#2563eb'], [tl.length, 'Minutes', '#d97706'], [passed, 'Passed', '#16a34a'], [failed, 'Failed', failed > 0 ? '#dc2626' : '#aaa']].map(function(a) { return '<div class="dr-kpi"><div class="dr-kpi-v" style="color:' + a[2] + '">' + a[0] + '</div><div class="dr-kpi-l">' + a[1] + '</div></div>'; }).join('') +
    '</div></div>' +
    (tl.length ? '<div><div class="dr-sec">Activity Timeline</div><svg style="width:100%;height:' + svgH + 'px;display:block" viewBox="0 0 ' + svgW + ' ' + svgH + '">' + bars + '</svg><div style="font-family:monospace;font-size:9px;color:#aaa;margin-top:4px">Blue = tool calls · Green = stage done · Red = guardrail</div></div>' : '') +
    (minRows ? '<div><div class="dr-sec">Minute Breakdown</div>' + minRows + '</div>' : '') +
    (stHtml ? '<div><div class="dr-sec">Stage Completions</div>' + stHtml + '</div>' : '')
  );
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer-panel').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('drawer-panel').classList.remove('open');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function feedRowHtml(f) {
  var ts   = f.ts ? f.ts.replace('T', ' ').slice(0, 16) : '';
  var proj = f.projectRoot ? f.projectRoot.split('/').filter(Boolean).pop() : '';
  var lvl  = f.level || 'info';
  var icons = { pass:'✓', fail:'✗', warn:'!', info:'i', tool:'·', dim:'·' };
  return '<div class="frow"><div class="ficon ' + lvl + '">' + (icons[lvl] || 'i') + '</div><div class="ftext"><div class="fsummary">' + esc(f.summary || '') + '</div><div class="fmeta">' + (f.runId ? '<span>' + esc(f.runId.slice(-10)) + '</span>' : '') + (proj ? '<span style="color:#2563eb">' + esc(proj) + '</span>' : '') + (f.goal ? '<span>' + esc(f.goal.slice(0, 38)) + '</span>' : '') + '</div></div><div class="fts">' + ts + '</div></div>';
}

function buildProjects(s) {
  var p = {};
  (s.runs || []).forEach(function(r) {
    var key  = r.projectRoot || 'unknown';
    var name = key.split('/').filter(Boolean).pop() || key;
    if (!p[key]) p[key] = { name: name, path: key, pass: 0, fail: 0, last: '' };
    p[key].last = p[key].last > r.runId ? p[key].last : r.runId;
    (r.tasks || []).forEach(function(t) { if (t.status === 'PASS') p[key].pass++; if (t.status === 'FAIL') p[key].fail++; });
  });
  return p;
}

function pill(status, label) {
  var l   = label || (status || '—').toUpperCase();
  var map = { active:'running', done:'done', pass:'pass', fail:'fail', running:'running', stalled:'stalled', idle:'idle', ended:'ended', queued:'queued', warn:'running' };
  var cls = map[(status || '').toLowerCase()] || 'idle';
  return '<span class="pill ' + cls + '">' + esc(l) + '</span>';
}

function chip(label, style) { return '<span class="chip ' + (style || '') + '">' + esc(label) + '</span>'; }

function pbarHtml(label, val, max, prefix, dp) {
  var pct = max > 0 ? Math.min(100, (val / max) * 100) : 0;
  var cls = pct < 60 ? 'g' : pct < 85 ? 'a' : 'r';
  var fmt = function(v) { return (prefix || '') + (dp ? Number(v).toFixed(dp) : v); };
  return '<div class="pbar-row"><div class="pbar-lbl"><span>' + esc(label) + '</span><span style="font-family:monospace">' + fmt(val) + ' / ' + fmt(max) + '</span></div><div class="pbar"><div class="pbar-fill ' + cls + '" style="width:' + pct.toFixed(1) + '%"></div></div></div>';
}

function emptyHtml(icon, title, sub) {
  return '<div class="empty">' + (icon ? '<div class="empty-icon">' + icon + '</div>' : '') + '<div class="empty-title">' + esc(title) + '</div>' + (sub ? '<div class="empty-sub">' + esc(sub) + '</div>' : '') + '</div>';
}

function sparkSvg(tl, W, H) {
  if (!tl || !tl.length) return '';
  var maxTc = Math.max.apply(null, tl.map(function(m) { return m.toolCalls; }).concat([1]));
  var bw = Math.max(1, Math.floor(W / tl.length) - 1);
  var bars = tl.map(function(m, i) {
    var bh  = Math.max(1, Math.round((m.toolCalls / maxTc) * H));
    var col = (m.stagesDone || []).length ? '#16a34a' : (m.guardrails ? '#dc2626' : '#2563eb');
    return '<rect x="' + (i * (bw + 1)) + '" y="' + (H - bh) + '" width="' + bw + '" height="' + bh + '" fill="' + col + '" rx="1" opacity=".75"/>';
  }).join('');
  return '<svg width="' + W + '" height="' + H + '" style="display:inline-block;vertical-align:middle">' + bars + '</svg>';
}

function setText(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
function setHTML(id, val) { var e = document.getElementById(id); if (e) e.innerHTML  = val; }
function setBadge(id, n)  { var e = document.getElementById(id); if (!e) return; e.textContent = n; e.style.display = n > 0 ? 'inline-block' : 'none'; }
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// ── WebSocket (live updates) ──────────────────────────────────────────────────
var ws, reconnectTimer;

function connectWS() {
  try { ws = new WebSocket('ws://localhost:' + PORT); } catch (e) { return; }
  ws.onopen = function() {
    document.getElementById('ws-dot').className = 'ws-dot live';
    document.getElementById('status-dot').style.background = '#22c55e';
    document.getElementById('status-text').textContent = 'Live';
    clearTimeout(reconnectTimer);
  };
  ws.onmessage = function(e) {
    try {
      var data = JSON.parse(e.data);
      applyState(data);
    } catch (err) {
      showErr('WS render: ' + err.message);
      console.error('[dashboard WS]', err);
    }
  };
  ws.onclose = ws.onerror = function() {
    document.getElementById('ws-dot').className = 'ws-dot';
    document.getElementById('status-dot').style.background = '#f59e0b';
    document.getElementById('status-text').textContent = 'Reconnecting…';
    reconnectTimer = setTimeout(connectWS, 2500);
  };
}

// ── HTTP first load — shows data immediately, no WS dependency ───────────────
fetch('/api/state')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    applyState(data);
    document.getElementById('status-dot').style.background = '#f59e0b';
    document.getElementById('status-text').textContent = 'Loaded (connecting…)';
  })
  .catch(function(err) { showErr('HTTP load failed: ' + err.message); });

// Start WS after HTTP load attempt
connectWS();
</script>
</body>
</html>`;
}
