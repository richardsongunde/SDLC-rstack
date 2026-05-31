// owner: RStack developed by Richardson Gunde
// Bulletproof dashboard — zero external deps, HTTP-first load, fail-loud errors

export function dashboardHtml(port) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RStack · Business Hub</title>
<style>
/* ── System fonts — no external dependency ── */
:root{
  --f:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --m:"SF Mono","Cascadia Code","Fira Code","Consolas","Courier New",monospace;
  --amber:#D97706; --amber-l:rgba(217,119,6,.1); --amber-b:rgba(217,119,6,.25);
  --green:#16A34A; --green-l:rgba(22,163,74,.1); --green-b:rgba(22,163,74,.25);
  --red:#DC2626;   --red-l:rgba(220,38,38,.1);   --red-b:rgba(220,38,38,.25);
  --blue:#2563EB;  --blue-l:rgba(37,99,235,.1);  --blue-b:rgba(37,99,235,.25);
  --bg:#FAFAFA; --surface:#FFFFFF; --raised:#F4F4F5;
  --border:#E4E4E7; --border2:#D4D4D8;
  --text:#18181B; --text2:#52525B; --text3:#A1A1AA;
  --sidebar:#1C1C1E; --sidebar2:#2C2C2E; --sidebar-t:#F5F5F5; --sidebar-t2:#A1A1A8;
}
*{box-sizing:border-box;margin:0;padding:0}
html{height:100%}
body{height:100%;font-family:var(--f);font-size:13.5px;background:var(--bg);color:var(--text);line-height:1.55}

/* ── Layout — simple, no overflow:hidden traps ── */
#app{display:grid;grid-template-columns:210px 1fr;grid-template-rows:100vh;height:100vh}
#sidebar{grid-column:1;background:var(--sidebar);overflow-y:auto;display:flex;flex-direction:column}
#content{grid-column:2;display:flex;flex-direction:column;overflow:hidden}
#topbar{height:50px;background:var(--surface);border-bottom:1px solid var(--border);
  display:flex;align-items:center;gap:12px;padding:0 18px;flex-shrink:0;
  box-shadow:0 1px 3px rgba(0,0,0,.06)}
#pages{flex:1;overflow-y:auto}

/* ── Sidebar ── */
.sb-brand{padding:16px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:9px}
.sb-logo{width:28px;height:28px;border-radius:7px;background:var(--amber);display:flex;align-items:center;
  justify-content:center;font-family:var(--m);font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
.sb-name{font-size:13px;font-weight:700;color:var(--sidebar-t);letter-spacing:-.01em}
.sb-sub{font-size:10px;color:var(--sidebar-t2);font-family:var(--m);margin-top:1px}
.sb-ws{width:7px;height:7px;border-radius:50%;background:#3F3F42;margin-left:auto;flex-shrink:0;transition:background .3s}
.sb-ws.live{background:var(--green);box-shadow:0 0 5px var(--green)}
.sb-nav{padding:8px;flex:1}
.sb-sec{font-family:var(--m);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;
  color:var(--sidebar-t2);opacity:.5;padding:10px 8px 4px}
.sb-a{display:flex;align-items:center;gap:8px;width:100%;padding:7px 9px;border-radius:6px;border:none;
  background:none;color:var(--sidebar-t2);font-size:12.5px;font-weight:500;cursor:pointer;text-align:left;
  transition:background .1s,color .1s;margin-bottom:1px;font-family:var(--f)}
.sb-a:hover{background:rgba(255,255,255,.07);color:var(--sidebar-t)}
.sb-a.on{background:var(--amber-l);color:var(--amber);border:1px solid var(--amber-b)}
.sb-a .ic{font-size:13px;width:15px;text-align:center;flex-shrink:0}
.sb-badge{margin-left:auto;background:var(--red);color:#fff;font-size:9px;font-weight:700;
  min-width:17px;height:17px;border-radius:9px;display:none;align-items:center;justify-content:center;
  padding:0 4px;font-family:var(--m)}
.sb-foot{padding:10px;border-top:1px solid rgba(255,255,255,.07);flex-shrink:0}
.sb-kpis{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.sb-kpi{background:var(--sidebar2);border-radius:6px;padding:7px 9px}
.sb-kv{font-family:var(--m);font-size:14px;font-weight:700;color:var(--sidebar-t);line-height:1}
.sb-kl{font-size:9px;color:var(--sidebar-t2);text-transform:uppercase;letter-spacing:.06em;margin-top:2px}

/* ── Topbar ── */
.tb-title{font-size:14px;font-weight:700;color:var(--text)}
.tb-sep{width:1px;height:18px;background:var(--border);flex-shrink:0}
.tb-stat{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text2)}
.tb-dot{width:7px;height:7px;border-radius:50%;background:var(--text3)}
.tb-r{margin-left:auto;display:flex;gap:7px}
.tb-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:5px;
  border:1px solid var(--border);background:var(--raised);font-size:11.5px;cursor:pointer;
  transition:all .1s;color:var(--text2);font-family:var(--f)}
.tb-btn:hover,.tb-btn.warn{border-color:var(--amber-b);background:var(--amber-l);color:var(--amber)}
.tb-btn.danger{border-color:var(--red-b);background:var(--red-l);color:var(--red)}

/* ── Pages ── */
.pg{display:none;padding:20px}
.pg.on{display:block}
.pg-h{margin-bottom:18px}
.pg-title{font-size:19px;font-weight:800;letter-spacing:-.02em;margin-bottom:3px}
.pg-sub{font-size:13px;color:var(--text2)}

/* ── Cards ── */
.card{background:var(--surface);border:1px solid var(--border);border-radius:10px;
  overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05);margin-bottom:14px}
.card-h{padding:10px 14px;font-family:var(--m);font-size:9.5px;font-weight:600;text-transform:uppercase;
  letter-spacing:.08em;color:var(--text3);border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between}
.card-h .live{width:5px;height:5px;border-radius:50%;background:var(--green);
  animation:blink 1.8s infinite;margin-right:6px}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.card-b{padding:13px 14px}
.card.al{border-left:3px solid var(--amber)}

/* ── KPIs ── */
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:18px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:14px 15px;
  box-shadow:0 1px 2px rgba(0,0,0,.04)}
.kpi.o{border-left:3px solid var(--amber)}.kpi.g{border-left:3px solid var(--green)}
.kpi.b{border-left:3px solid var(--blue)}.kpi.r{border-left:3px solid var(--red)}
.kv{font-family:var(--m);font-size:22px;font-weight:700;line-height:1;margin-bottom:3px}
.kpi.o .kv{color:var(--amber)}.kpi.g .kv{color:var(--green)}
.kpi.b .kv{color:var(--blue)}.kpi.r .kv{color:var(--red)}
.kl{font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text3)}
.ks{font-size:11px;color:var(--text3);margin-top:2px}

/* ── Two-col ── */
.two{display:grid;grid-template-columns:1fr 340px;gap:14px}
@media(max-width:1100px){.two{grid-template-columns:1fr}}

/* ── Pills ── */
.pill{display:inline-flex;align-items:center;gap:2px;font-family:var(--m);font-size:9.5px;
  font-weight:700;padding:2px 7px;border-radius:20px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.pill.pass,.pill.done{background:var(--green-l);color:var(--green);border:1px solid var(--green-b)}
.pill.fail{background:var(--red-l);color:var(--red);border:1px solid var(--red-b)}
.pill.running,.pill.active{background:var(--amber-l);color:var(--amber);border:1px solid var(--amber-b)}
.pill.stalled,.pill.ended,.pill.idle{background:var(--raised);color:var(--text3);border:1px solid var(--border)}
.pill.queued{background:var(--blue-l);color:var(--blue);border:1px solid var(--blue-b)}

/* ── Table ── */
.tbl{width:100%;border-collapse:collapse}
.tbl th{font-family:var(--m);font-size:9.5px;font-weight:600;text-transform:uppercase;
  letter-spacing:.07em;color:var(--text3);padding:7px 11px;text-align:left;
  border-bottom:1px solid var(--border);background:var(--raised)}
.tbl td{padding:10px 11px;border-bottom:1px solid var(--border);font-size:12.5px;vertical-align:middle}
.tbl tr.row:hover td{background:var(--raised);cursor:pointer}
.tbl tr:last-child td{border-bottom:none}

/* ── Feed rows ── */
.frow{display:flex;gap:9px;padding:9px 0;border-bottom:1px solid var(--border);align-items:flex-start}
.frow:last-child{border-bottom:none}
.fic{width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;
  font-family:var(--m);font-size:9.5px;font-weight:700;flex-shrink:0;margin-top:1px}
.fic.pass{background:var(--green-l);color:var(--green)}.fic.fail{background:var(--red-l);color:var(--red)}
.fic.warn{background:var(--amber-l);color:var(--amber)}.fic.info{background:var(--blue-l);color:var(--blue)}
.fic.tool,.fic.dim{background:var(--raised);color:var(--text3)}
.ftxt{flex:1;min-width:0}.fsum{font-size:12.5px;color:var(--text);line-height:1.35}
.fmeta{font-family:var(--m);font-size:10px;color:var(--text3);margin-top:2px;display:flex;gap:8px}
.fts{font-family:var(--m);font-size:10px;color:var(--text3);white-space:nowrap;flex-shrink:0}

/* ── Agent cards ── */
.ac{background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--amber);
  border-radius:9px;padding:14px;margin-bottom:9px;transition:box-shadow .12s}
.ac:hover{box-shadow:0 3px 10px rgba(0,0,0,.07)}
.ac.pass{border-left-color:var(--green)}.ac.fail{border-left-color:var(--red)}
.ac.queued,.ac.idle{border-left-color:var(--border)}
.ac-eye{font-family:var(--m);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;
  color:var(--amber);margin-bottom:3px}
.ac.pass .ac-eye{color:var(--green)}.ac.fail .ac-eye{color:var(--red)}.ac.queued .ac-eye,.ac.idle .ac-eye{color:var(--text3)}
.ac-title{font-size:13px;font-weight:700;margin-bottom:2px}
.ac-id{font-family:var(--m);font-size:10px;color:var(--text3);margin-bottom:8px}
.ac-sum{font-size:12.5px;color:var(--text2);line-height:1.45;margin-bottom:9px}
.ac-sum.pending{color:var(--text3);font-style:italic}
.ev-bar{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--raised);
  border-radius:5px;margin-bottom:9px;font-size:11px}
.ev-wrap{flex:1;background:var(--border2);border-radius:2px;height:4px;overflow:hidden}
.ev-fill{height:100%;border-radius:2px;background:var(--green)}
.ac-sec{font-family:var(--m);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;
  color:var(--text3);margin-bottom:4px}
.ac-row{display:flex;gap:7px;padding:4px 0;font-size:12px;color:var(--text2);align-items:baseline}
.ac-ic{font-family:var(--m);font-size:9px;font-weight:700;flex-shrink:0;color:var(--amber)}
.ac-chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
.chip{font-family:var(--m);font-size:10px;padding:2px 7px;border-radius:4px;
  background:var(--raised);border:1px solid var(--border);color:var(--text2)}
.chip.g{background:var(--green-l);border-color:var(--green-b);color:var(--green)}
.chip.b{background:var(--blue-l);border-color:var(--blue-b);color:var(--blue)}
.chip.a{background:var(--amber-l);border-color:var(--amber-b);color:var(--amber)}
.chip.r{background:var(--red-l);border-color:var(--red-b);color:var(--red)}

/* ── Stage pipeline ── */
.pipe-run{margin-bottom:16px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);
  border-radius:9px}
.pipe-goal{font-size:13px;font-weight:700;margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pipe-stages{display:flex;gap:6px;overflow-x:auto;padding-bottom:3px}
.ps{flex-shrink:0;min-width:80px;padding:7px 9px;border-radius:7px;text-align:center;
  border:1px solid var(--border);background:var(--raised);transition:all .15s}
.ps.done{background:var(--green-l);border-color:var(--green-b)}
.ps.fail{background:var(--red-l);border-color:var(--red-b)}
.ps.running{background:var(--amber-l);border-color:var(--amber-b)}
.ps-id{font-family:var(--m);font-size:8.5px;color:var(--text3);margin-bottom:2px}
.ps-name{font-size:10.5px;font-weight:700;color:var(--text);margin-bottom:4px;line-height:1.2}
.ps-dot{width:7px;height:7px;border-radius:50%;background:var(--border2);margin:0 auto}
.ps.done .ps-dot{background:var(--green)}.ps.fail .ps-dot{background:var(--red)}
.ps.running .ps-dot{background:var(--amber)}.ps-name{font-size:10.5px}
.ps.done .ps-name{color:var(--green)}.ps.fail .ps-name{color:var(--red)}

/* ── Stage grid ── */
.sg{display:grid;grid-template-columns:repeat(5,1fr);gap:9px;padding:14px}
@media(max-width:1300px){.sg{grid-template-columns:repeat(3,1fr)}}
.st{background:var(--raised);border:1px solid var(--border);border-radius:8px;padding:11px}
.st.hp{border-left:3px solid var(--green)}.st.hf{border-left:3px solid var(--red)}.st.ha{border-left:3px solid var(--amber)}
.st-id{font-family:var(--m);font-size:8.5px;color:var(--text3);margin-bottom:2px}
.st-name{font-size:11.5px;font-weight:700;margin-bottom:7px}
.st-stats{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:7px}
.st-dots{display:flex;gap:3px;flex-wrap:wrap}
.rd{width:7px;height:7px;border-radius:50%;background:var(--border2)}
.rd.pass{background:var(--green)}.rd.fail{background:var(--red)}.rd.active{background:var(--amber)}.rd.ready{background:var(--blue)}

/* ── Approvals ── */
.appr{background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:14px;margin-bottom:9px}
.appr.pending{border-left:3px solid var(--amber)}.appr.approved{border-left:3px solid var(--green);opacity:.7}
.appr.rejected{border-left:3px solid var(--red);opacity:.7}
.appr-title{font-size:13px;font-weight:700;margin-bottom:4px}
.appr-detail{font-size:12px;color:var(--text2);margin-bottom:6px}
.appr-meta{font-family:var(--m);font-size:10px;color:var(--text3);margin-bottom:10px}
.appr-btns{display:flex;gap:7px}
.btn{padding:5px 13px;border-radius:5px;border:1px solid var(--border);font-size:12px;font-weight:700;
  cursor:pointer;background:var(--surface);font-family:var(--f)}
.btn.ok{background:var(--green);color:#fff;border-color:var(--green)}
.btn.no{background:var(--red-l);color:var(--red);border-color:var(--red-b)}

/* ── Alerts ── */
.al{padding:11px 13px;border-radius:7px;margin-bottom:7px;border:1px solid transparent;display:flex;gap:10px}
.al.warn{background:var(--amber-l);border-color:var(--amber-b)}
.al.critical{background:var(--red-l);border-color:var(--red-b)}
.al.info{background:var(--blue-l);border-color:var(--blue-b)}
.al-icon{font-size:16px;flex-shrink:0;margin-top:1px}
.al-title{font-size:12.5px;font-weight:700;margin-bottom:2px}
.al-detail{font-size:12px;color:var(--text2)}

/* ── Progress bar ── */
.pbar-row{margin-bottom:10px}
.pbar-lbl{display:flex;justify-content:space-between;font-size:11.5px;color:var(--text2);margin-bottom:4px}
.pbar{height:5px;background:var(--border2);border-radius:3px;overflow:hidden}
.pbar-fill{height:100%;border-radius:3px;transition:width .4s}
.pbar-fill.g{background:var(--green)}.pbar-fill.a{background:var(--amber)}.pbar-fill.r{background:var(--red)}

/* ── Trace ── */
.tr-card{margin-bottom:14px}
.tr-stages{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 11px}
.tr-s{display:flex;align-items:center;gap:4px;padding:3px 9px;border-radius:5px;font-size:11px;font-weight:600}
.tr-s.ok{background:var(--green-l);color:var(--green);border:1px solid var(--green-b)}
.tr-s.no{background:var(--raised);color:var(--text3);border:1px solid var(--border)}
.tr-req{padding:5px 9px;background:var(--raised);border-radius:5px;font-size:12px;margin-bottom:3px;border-left:2px solid var(--blue)}
.tr-req-id{font-family:var(--m);font-size:9px;color:var(--text3);margin-bottom:1px}
.tr-task{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px}
.tr-task:last-child{border-bottom:none}

/* ── Empty ── */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:44px 20px;gap:9px;text-align:center;color:var(--text3)}
.empty-ic{font-size:30px;opacity:.35}.empty-t{font-size:14px;font-weight:700;color:var(--text2)}
.empty-s{font-size:12.5px;max-width:280px;line-height:1.5}

/* ── Error banner ── */
#err-banner{display:none;background:var(--red-l);border-bottom:1px solid var(--red-b);
  padding:8px 18px;font-size:12px;color:var(--red);font-family:var(--m)}

/* ── Spark ── */
.spark{display:inline-block;vertical-align:middle}

/* ── Detail drawer ── */
#overlay{display:none;position:fixed;inset:0;background:rgba(28,28,30,.4);z-index:90}
#overlay.on{display:block}
#drawer{position:fixed;right:0;top:0;bottom:0;width:500px;background:var(--surface);
  border-left:1px solid var(--border);z-index:91;display:flex;flex-direction:column;
  transform:translateX(100%);transition:transform .22s cubic-bezier(.4,0,.2,1);
  box-shadow:-4px 0 18px rgba(0,0,0,.08)}
#drawer.on{transform:translateX(0)}
.dr-h{padding:15px 18px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:10px;flex-shrink:0}
.dr-hm{flex:1;min-width:0}
.dr-eye{font-family:var(--m);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;
  color:var(--amber);margin-bottom:3px}
.dr-title{font-size:14px;font-weight:800;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dr-sub{font-family:var(--m);font-size:10px;color:var(--text3);margin-top:2px}
.dr-close{background:none;border:none;font-size:18px;cursor:pointer;color:var(--text3);line-height:1;padding:2px}
.dr-body{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:15px}
.dr-sec{font-family:var(--m);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;
  color:var(--text3);margin-bottom:7px}
.dr-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.dr-kpi{background:var(--raised);border-radius:7px;padding:8px 10px;text-align:center}
.dr-kv{font-family:var(--m);font-size:17px;font-weight:700;line-height:1;margin-bottom:2px}
.dr-kl{font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em}
.dr-min{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid var(--border);font-size:11.5px}
.dr-min:last-child{border-bottom:none}
.dr-mt{font-family:var(--m);font-size:10px;color:var(--text3);width:44px;flex-shrink:0}
.dr-mb{flex:1;background:var(--border2);border-radius:2px;height:5px;overflow:hidden}
.dr-mf{height:100%;border-radius:2px;background:var(--blue)}
.dr-mc{font-family:var(--m);font-size:10px;color:var(--text3);width:30px;text-align:right;flex-shrink:0}
.dr-tags{display:flex;gap:3px;flex-wrap:wrap;margin-left:6px}

/* ── Scrollbar ── */
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
</style>
</head>
<body>

<div id="err-banner" id="err-banner"></div>

<div id="app">
  <div id="sidebar">
    <div class="sb-brand">
      <div class="sb-logo">R</div>
      <div><div class="sb-name">rstack</div><div class="sb-sub">business hub</div></div>
      <div class="sb-ws" id="ws-dot"></div>
    </div>
    <div class="sb-nav">
      <div class="sb-sec">Observe</div>
      <button class="sb-a on"  data-pg="command"><span class="ic">⌘</span>Command Center</button>
      <button class="sb-a" data-pg="feed"><span class="ic">⚡</span>Live Feed</button>
      <button class="sb-a" data-pg="pipeline"><span class="ic">→</span>Pipeline</button>
      <button class="sb-a" data-pg="agents"><span class="ic">◈</span>Agent Actions</button>
      <div class="sb-sec">Manage</div>
      <button class="sb-a" data-pg="approvals"><span class="ic">✓</span>Approvals<span class="sb-badge" id="ba-a">0</span></button>
      <button class="sb-a" data-pg="alerts"><span class="ic">△</span>Alerts<span class="sb-badge" id="ba-al">0</span></button>
      <div class="sb-sec">Explore</div>
      <button class="sb-a" data-pg="runs"><span class="ic">▦</span>All Runs</button>
      <button class="sb-a" data-pg="trace"><span class="ic">◉</span>Traceability</button>
      <button class="sb-a" data-pg="team"><span class="ic">≡</span>Team</button>
    </div>
    <div class="sb-foot">
      <div class="sb-kpis">
        <div class="sb-kpi"><div class="sb-kv" id="sk-runs">—</div><div class="sb-kl">Runs</div></div>
        <div class="sb-kpi"><div class="sb-kv" id="sk-cost">—</div><div class="sb-kl">Cost</div></div>
        <div class="sb-kpi"><div class="sb-kv" id="sk-pass">—</div><div class="sb-kl">Pass</div></div>
        <div class="sb-kpi"><div class="sb-kv" id="sk-agents">—</div><div class="sb-kl">Agents</div></div>
      </div>
    </div>
  </div>

  <div id="content">
    <div id="topbar">
      <span class="tb-title" id="tb-title">Command Center</span>
      <div class="tb-sep"></div>
      <div class="tb-stat"><div class="tb-dot" id="tb-dot"></div><span id="tb-status">Loading…</span></div>
      <div class="tb-r">
        <button class="tb-btn" id="btn-alerts"  onclick="nav('alerts')">△ <span id="tb-al">—</span></button>
        <button class="tb-btn" id="btn-approvals" onclick="nav('approvals')">✓ <span id="tb-ap">—</span></button>
      </div>
    </div>

    <div id="pages">

      <!-- COMMAND CENTER -->
      <div class="pg on" id="pg-command">
        <div class="pg-h"><div class="pg-title">Command Center</div><div class="pg-sub">Live view across all projects, runs, and agent actions</div></div>
        <div class="kpis">
          <div class="kpi o"><div class="kv" id="k-runs">—</div><div class="kl">Total Runs</div><div class="ks" id="k-runs-s"></div></div>
          <div class="kpi g"><div class="kv" id="k-pass">—</div><div class="kl">Tasks Passed</div><div class="ks" id="k-pass-s"></div></div>
          <div class="kpi b"><div class="kv" id="k-agents">—</div><div class="kl">Agent Actions</div><div class="ks" id="k-agents-s"></div></div>
          <div class="kpi r"><div class="kv" id="k-cost">—</div><div class="kl">Total Cost</div><div class="ks" id="k-cost-s"></div></div>
        </div>
        <div class="two">
          <div>
            <div class="card"><div class="card-h"><span><span class="live"></span>Activity</span><span id="cmd-feed-cnt"></span></div><div class="card-b" id="cmd-feed" style="max-height:260px;overflow-y:auto"></div></div>
            <div class="card"><div class="card-h">Projects <span id="cmd-proj-cnt"></span></div><div class="card-b" id="cmd-projs"></div></div>
          </div>
          <div>
            <div class="card"><div class="card-h">Recent Runs</div><div class="card-b" id="cmd-runs"></div></div>
            <div class="card"><div class="card-h">Guardrail Health</div><div class="card-b" id="cmd-guard"></div></div>
            <div class="card"><div class="card-h">Alerts</div><div class="card-b" id="cmd-alerts"></div></div>
          </div>
        </div>
      </div>

      <!-- LIVE FEED -->
      <div class="pg" id="pg-feed">
        <div class="pg-h"><div class="pg-title">Live Feed</div><div class="pg-sub">Every agent event in plain language</div></div>
        <div class="card"><div class="card-h"><span><span class="live"></span>Stream</span><span id="feed-cnt"></span></div><div class="card-b" id="feed-list" style="max-height:calc(100vh - 180px);overflow-y:auto"></div></div>
      </div>

      <!-- PIPELINE -->
      <div class="pg" id="pg-pipeline">
        <div class="pg-h"><div class="pg-title">Pipeline</div><div class="pg-sub">15-stage SDLC per run — done / running / queued</div></div>
        <div id="pipeline-body"></div>
      </div>

      <!-- AGENT ACTIONS -->
      <div class="pg" id="pg-agents">
        <div class="pg-h"><div class="pg-title">Agent Actions</div><div class="pg-sub">Every builder.json contract — decisions, evidence, risks, tests run</div></div>
        <div class="card"><div class="card-h">Agent Work <span id="agents-count"></span></div>
          <div class="card-b"><div style="font-size:12px;color:var(--text2);padding:4px 0 10px;border-bottom:1px solid var(--border);margin-bottom:10px">Each card is a <code style="font-family:var(--m);background:var(--raised);padding:1px 5px;border-radius:3px">builder.json</code> written by an RStack agent. Green = PASS + evidence. Amber = running. Grey = pending.</div><div id="agent-list"></div></div>
        </div>
      </div>

      <!-- APPROVALS -->
      <div class="pg" id="pg-approvals">
        <div class="pg-h"><div class="pg-title">Approvals</div><div class="pg-sub">Human-in-loop gates</div></div>
        <div style="max-width:680px" id="approvals-list"></div>
      </div>

      <!-- ALERTS -->
      <div class="pg" id="pg-alerts">
        <div class="pg-h"><div class="pg-title">Alerts</div><div class="pg-sub">Threshold violations</div></div>
        <div style="max-width:680px" id="alerts-list"></div>
      </div>

      <!-- ALL RUNS -->
      <div class="pg" id="pg-runs">
        <div class="pg-h"><div class="pg-title">All Runs</div><div class="pg-sub">Every SDLC run — click any row for the full timeline</div></div>
        <div class="card"><div class="card-h">Runs <span id="runs-cnt"></span></div>
          <table class="tbl">
            <colgroup><col style="width:95px"><col style="width:auto"><col style="width:80px"><col style="width:100px"><col style="width:110px"><col style="width:52px"></colgroup>
            <thead><tr><th>Status</th><th>Goal</th><th>Project</th><th>Activity</th><th>Tasks</th><th>Cost</th></tr></thead>
            <tbody id="runs-body"></tbody>
          </table>
        </div>
      </div>

      <!-- TRACEABILITY -->
      <div class="pg" id="pg-trace">
        <div class="pg-h"><div class="pg-title">Traceability</div><div class="pg-sub">Requirements → Architecture → Code → Test evidence</div></div>
        <div id="trace-list"></div>
      </div>

      <!-- TEAM -->
      <div class="pg" id="pg-team">
        <div class="pg-h"><div class="pg-title">Team</div><div class="pg-sub">Framework and runtime breakdown</div></div>
        <div class="card"><div class="card-h">Frameworks</div><div class="card-b" id="team-body"></div></div>
      </div>

    </div><!-- /pages -->
  </div><!-- /content -->
</div><!-- /app -->

<div id="overlay" onclick="closeDrawer()"></div>
<div id="drawer">
  <div class="dr-h">
    <div class="dr-hm">
      <div class="dr-eye" id="dr-eye">◆ run detail</div>
      <div class="dr-title" id="dr-title">—</div>
      <div class="dr-sub" id="dr-sub">—</div>
    </div>
    <button class="dr-close" onclick="closeDrawer()">✕</button>
  </div>
  <div class="dr-body" id="dr-body"></div>
</div>

<script>
// ── State ─────────────────────────────────────────────────────────────────────
var S = null;
var PORT = ${port};
var PAGE_NAMES = {
  command:'Command Center',feed:'Live Feed',pipeline:'Pipeline',
  agents:'Agent Actions',approvals:'Approvals',alerts:'Alerts',
  runs:'All Runs',trace:'Traceability',team:'Team'
};

// ── Error display ─────────────────────────────────────────────────────────────
function showErr(msg) {
  var b = document.getElementById('err-banner');
  b.textContent = '⚠ ' + msg;
  b.style.display = 'block';
}

// ── Navigation ────────────────────────────────────────────────────────────────
function nav(id) {
  try {
    document.querySelectorAll('.sb-a').forEach(function(b){ b.classList.toggle('on', b.dataset.pg === id); });
    document.querySelectorAll('.pg').forEach(function(p){ p.classList.toggle('on', p.id === 'pg-' + id); });
    var titleEl = document.getElementById('tb-title');
    if (titleEl) titleEl.textContent = PAGE_NAMES[id] || id;
  } catch(e) { showErr('nav error: ' + e.message); }
}

document.querySelectorAll('.sb-a').forEach(function(btn) {
  btn.addEventListener('click', function() { nav(btn.dataset.pg); });
});

// ── WebSocket ─────────────────────────────────────────────────────────────────
var ws, reconnTimer;

function connect() {
  try {
    ws = new WebSocket('ws://localhost:' + PORT);
  } catch(e) { showErr('WS init failed: ' + e.message); return; }

  ws.onopen = function() {
    var d = document.getElementById('ws-dot'); if (d) { d.className = 'sb-ws live'; }
    var t = document.getElementById('tb-dot'); if (t) t.style.background = 'var(--green)';
    var s = document.getElementById('tb-status'); if (s) s.textContent = 'Live';
    clearTimeout(reconnTimer);
  };

  ws.onmessage = function(e) {
    try {
      var data = JSON.parse(e.data);
      apply(data);
    } catch(err) {
      showErr('Render error: ' + err.message + ' (check console)');
      console.error('Dashboard render error:', err);
    }
  };

  ws.onclose = ws.onerror = function() {
    var d = document.getElementById('ws-dot'); if (d) d.className = 'sb-ws';
    var t = document.getElementById('tb-dot'); if (t) t.style.background = 'var(--amber)';
    var s = document.getElementById('tb-status'); if (s) s.textContent = 'Reconnecting…';
    reconnTimer = setTimeout(connect, 2500);
  };
}

// ── Apply state ───────────────────────────────────────────────────────────────
function apply(s) {
  S = s;
  try { renderSidebar(); }     catch(e) { showErr('sidebar: ' + e.message); console.error(e); }
  try { renderTopbar(); }      catch(e) { showErr('topbar: ' + e.message); console.error(e); }
  try { renderCommand(); }     catch(e) { showErr('command: ' + e.message); console.error(e); }
  try { renderFeed(); }        catch(e) { showErr('feed: ' + e.message); console.error(e); }
  try { renderPipeline(); }    catch(e) { showErr('pipeline: ' + e.message); console.error(e); }
  try { renderAgents(); }      catch(e) { showErr('agents: ' + e.message); console.error(e); }
  try { renderApprovals(); }   catch(e) { showErr('approvals: ' + e.message); console.error(e); }
  try { renderAlerts(); }      catch(e) { showErr('alerts: ' + e.message); console.error(e); }
  try { renderRuns(); }        catch(e) { showErr('runs: ' + e.message); console.error(e); }
  try { renderTrace(); }       catch(e) { showErr('trace: ' + e.message); console.error(e); }
  try { renderTeam(); }        catch(e) { showErr('team: ' + e.message); console.error(e); }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function renderSidebar() {
  var allTasks = (S.runs || []).flatMap(function(r){ return r.tasks || []; });
  var passed = allTasks.filter(function(t){ return t.status === 'PASS'; }).length;
  set('sk-runs',   S.totalRuns || 0);
  set('sk-cost',   '$' + ((S.totalCost || 0).toFixed(2)));
  set('sk-pass',   passed);
  set('sk-agents', (S.agentWork || []).length);
  var pa = (S.approvalStats || {}).pending || 0;
  var al = (S.alerts || []).length;
  showBadge('ba-a',  pa);
  showBadge('ba-al', al);
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function renderTopbar() {
  var al = (S.alerts || []).length;
  var pa = (S.approvalStats || {}).pending || 0;
  set('tb-al', al + ' alert' + (al !== 1 ? 's' : ''));
  set('tb-ap', pa + ' pending');
  var ba = document.getElementById('btn-alerts');
  var bp = document.getElementById('btn-approvals');
  if (ba) ba.className = 'tb-btn' + (al > 0 ? ' danger' : '');
  if (bp) bp.className = 'tb-btn' + (pa > 0 ? ' warn' : '');
}

// ── Command Center ────────────────────────────────────────────────────────────
function renderCommand() {
  var allTasks = (S.runs || []).flatMap(function(r){ return r.tasks || []; });
  var passed  = allTasks.filter(function(t){ return t.status === 'PASS'; }).length;
  var failed  = allTasks.filter(function(t){ return t.status === 'FAIL'; }).length;
  var withEv  = (S.agentWork || []).filter(function(w){ return (w.evidenceCount || 0) > 0; }).length;

  set('k-runs',     S.totalRuns || 0);
  set('k-runs-s',   (S.todayCount || 0) + ' today');
  set('k-pass',     passed);
  set('k-pass-s',   failed + ' failed');
  set('k-agents',   (S.agentWork || []).length);
  set('k-agents-s', withEv + ' with evidence');
  set('k-cost',     '$' + ((S.totalCost || 0).toFixed(4)));
  set('k-cost-s',   Object.keys(S.frameworks || {}).join(', ') || '—');

  // Feed (top 12)
  var feed = (S.feed || []).slice(0, 12);
  set('cmd-feed-cnt', feed.length + ' events');
  el('cmd-feed').innerHTML = feed.length ? feed.map(feedRow).join('') : empty('⚡','No events yet','Events stream here as agents run');

  // Projects
  var projs = buildProjects();
  var pkeys = Object.keys(projs);
  set('cmd-proj-cnt', pkeys.length + ' projects');
  el('cmd-projs').innerHTML = pkeys.length
    ? pkeys.sort(function(a,b){ return (projs[b].last||'').localeCompare(projs[a].last||''); }).map(function(k){
        var p = projs[k];
        return '<div style="padding:9px 0;border-bottom:1px solid var(--border)">' +
          '<div style="font-size:12.5px;font-weight:700;margin-bottom:2px">' + esc(p.name) + '</div>' +
          '<div style="font-size:11px;color:var(--text3);margin-bottom:5px;font-family:var(--m);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(p.path) + '</div>' +
          '<div style="display:flex;gap:5px">' + pill('pass', p.pass + ' pass') + pill('fail', p.fail + ' fail') + '</div>' +
          '</div>';
      }).join('')
    : empty('', 'No projects', '');

  // Recent runs
  var activeIds = S.activeRuns || [];
  var recent = (S.runs || []).filter(function(r){ return activeIds.indexOf(r.runId) >= 0; });
  if (!recent.length) recent = (S.runs || []).slice(0, 3);
  el('cmd-runs').innerHTML = recent.length ? recent.map(function(r){
    var tasks = r.tasks || [];
    var p = tasks.filter(function(t){ return t.status === 'PASS'; }).length;
    var pct = tasks.length ? Math.round(p / tasks.length * 100) : 0;
    var tc  = (r.activityTimeline || []).reduce(function(n,m){ return n + m.toolCalls; }, 0);
    var proj = (r.projectRoot || '').split('/').filter(Boolean).pop() || '—';
    var sc = {active:'var(--amber)',done:'var(--green)',stalled:'var(--red)',ended:'var(--text3)'}[r.derivedStatus] || 'var(--text3)';
    return '<div style="padding:9px 0;border-bottom:1px solid var(--border)">' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">' +
        '<div style="width:6px;height:6px;border-radius:50%;background:' + sc + ';flex-shrink:0"></div>' +
        '<span style="font-size:12.5px;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc((r.manifest && r.manifest.goal || '—').slice(0,55)) + '</span>' +
        '<span style="font-family:var(--m);font-size:9.5px;color:var(--blue)">' + esc(proj) + '</span>' +
      '</div>' +
      (tasks.length ? '<div style="height:3px;background:var(--border2);border-radius:2px;overflow:hidden;margin-bottom:4px"><div style="width:' + pct + '%;height:100%;background:var(--amber)"></div></div>' : '') +
      '<div style="font-size:11px;color:var(--text3)">' + p + '/' + tasks.length + ' tasks' + (tc ? ' · ' + tc + ' calls' : '') + ' · ' + esc(r.derivedStatus || '?') + '</div>' +
    '</div>';
  }).join('') : '<div style="padding:8px;color:var(--text3);font-size:12px;font-style:italic">No runs yet</div>';

  // Guardrails
  var tl = (S.runs || []).flatMap(function(r){ return r.activityTimeline || []; });
  var tc = tl.reduce(function(n,m){ return n + m.toolCalls; }, 0);
  var gh = tl.reduce(function(n,m){ return n + (m.guardrails || 0); }, 0);
  el('cmd-guard').innerHTML = pbar('Tool Calls', tc, Math.max(200, tc)) + pbar('Guardrail Hits', gh, Math.max(10, gh)) + pbar('Cost $', S.totalCost || 0, 10, '$', 4);

  // Alerts top 3
  var alts = (S.alerts || []).slice(0, 3);
  el('cmd-alerts').innerHTML = alts.length
    ? alts.map(alertRow).join('')
    : '<div style="padding:4px;color:var(--text3);font-size:12px">All clear</div>';
}

// ── Live Feed ─────────────────────────────────────────────────────────────────
function renderFeed() {
  var feed = S.feed || [];
  set('feed-cnt', feed.length + ' events');
  el('feed-list').innerHTML = feed.length ? feed.map(feedRow).join('') : empty('⚡','No events yet','Events appear as runs execute');
}

// ── Pipeline ──────────────────────────────────────────────────────────────────
function renderPipeline() {
  var stages = S.stageMatrix || [];
  var runs   = (S.runs || []).slice(0, 8);
  if (!runs.length) { el('pipeline-body').innerHTML = empty('→','No runs yet','Pipeline stages appear once runs execute'); return; }
  el('pipeline-body').innerHTML = runs.map(function(r) {
    var tasks = r.tasks || [];
    var smap = {};
    tasks.forEach(function(t) {
      (t.stage_artifacts || []).forEach(function(sa) {
        if (sa.stage_id) smap[sa.stage_id] = t.status === 'PASS' ? 'done' : t.status === 'FAIL' ? 'fail' : t.status === 'IN_PROGRESS' ? 'running' : 'queued';
      });
    });
    var proj = (r.projectRoot || '').split('/').filter(Boolean).pop() || '—';
    var stagesHtml = stages.slice(0, 15).map(function(s) {
      var st = smap[s.id] || 'queued';
      return '<div class="ps ' + st + '"><div class="ps-id">' + esc(s.id ? s.id.slice(0,2) : '') + '</div><div class="ps-name">' + esc((s.title || '').slice(0,9)) + '</div><div class="ps-dot"></div></div>';
    }).join('');
    return '<div class="pipe-run">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
        pill(r.derivedStatus || 'idle') +
        '<div class="pipe-goal">' + esc(r.manifest && r.manifest.goal || '—') + '</div>' +
        '<span style="font-family:var(--m);font-size:9.5px;color:var(--blue);flex-shrink:0">' + esc(proj) + '</span>' +
      '</div>' +
      '<div class="pipe-stages">' + stagesHtml + '</div></div>';
  }).join('');
}

// ── Agent Actions ─────────────────────────────────────────────────────────────
function renderAgents() {
  var work = S.agentWork || [];
  set('agents-count', work.length + ' items');
  if (!work.length) { el('agent-list').innerHTML = empty('◈','No agent actions yet','builder.json contracts appear here once agents complete tasks'); return; }
  el('agent-list').innerHTML = work.slice(0, 60).map(function(w) {
    var sts = { PASS:'pass', FAIL:'fail', IN_PROGRESS:'running', READY:'queued', PENDING:'queued' }[w.status] || 'idle';
    var evPct = w.totalChecks > 0 ? Math.round((w.passChecks / w.totalChecks) * 100) : 0;
    var proj  = (w.projectRoot || '').split('/').filter(Boolean).pop() || '—';
    var hasSummary = w.summary && w.summary.length > 5;
    var decisHtml = (w.decisions || []).length
      ? '<div class="ac-sec">Key decisions</div>' + w.decisions.map(function(d){ return '<div class="ac-row"><span class="ac-ic">◆</span><span>' + esc(d) + '</span></div>'; }).join('')
      : '';
    var risksHtml = (w.risks || []).length
      ? '<div class="ac-sec" style="margin-top:7px">Risks</div>' + w.risks.map(function(r){ return '<div class="ac-row"><span class="ac-ic" style="color:var(--red)">▲</span><span>' + esc(r) + '</span></div>'; }).join('')
      : '';
    var testsHtml = (w.testsRun || []).length
      ? '<div class="ac-sec" style="margin-top:7px">Evidence — tests run</div>' + w.testsRun.map(function(t){ return '<div class="ac-row"><span class="ac-ic" style="color:var(--green)">✓</span><span style="font-family:var(--m);font-size:10.5px">' + esc(t) + '</span></div>'; }).join('')
      : '';
    var filesHtml = (w.filesModified || []).length
      ? '<div style="font-family:var(--m);font-size:10.5px;background:var(--raised);border-radius:5px;padding:7px 9px;margin-top:7px;display:grid;grid-template-columns:auto 1fr;gap:4px 8px">' + w.filesModified.map(function(f){ return '<span style="color:var(--text3)">→</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(f) + '</span>'; }).join('') + '</div>'
      : '';
    return '<div class="ac ' + sts + '">' +
      '<div class="ac-eye">◆ ' + esc(w.agent || 'builder') + ' · ' + esc(proj) + '</div>' +
      '<div class="ac-title">' + esc(w.title || w.taskId) + '</div>' +
      '<div class="ac-id">' + esc(w.taskId) + ' · ' + esc((w.runId || '').slice(-12)) + '</div>' +
      (hasSummary ? '<div class="ac-sum">' + esc(w.summary) + '</div>' : '<div class="ac-sum pending">Task pending — no builder contract yet</div>') +
      (w.totalChecks > 0 ? '<div class="ev-bar"><div class="ev-wrap"><div class="ev-fill" style="width:' + evPct + '%"></div></div><span style="font-family:var(--m);font-size:11px;color:var(--green);font-weight:700">' + w.passChecks + '/' + w.totalChecks + ' checks</span>' + ((w.failedChecks || []).length ? '<span style="font-family:var(--m);font-size:10px;color:var(--red)">' + w.failedChecks.length + ' failed</span>' : '') + '</div>' : '') +
      decisHtml + risksHtml + testsHtml + filesHtml +
      '<div class="ac-chips">' +
        chip(w.agent || 'builder', 'a') +
        (w.totalChecks > 0 ? chip(evPct + '% quality', 'g') : '') +
        (w.riskCount > 0 ? chip(w.riskCount + ' risks', 'r') : '') +
        (w.specialists || []).slice(0,2).map(function(s){ return chip(s.replace('agent.',''), 'b'); }).join('') +
      '</div></div>';
  }).join('');
}

// ── Approvals ─────────────────────────────────────────────────────────────────
function renderApprovals() {
  var approvals = S.approvals || [];
  if (!approvals.length) { el('approvals-list').innerHTML = empty('✓','No approvals yet','Blocked actions appear here for review'); return; }
  var pending  = approvals.filter(function(a){ return !a.status || a.status === 'pending'; });
  var resolved = approvals.filter(function(a){ return a.status && a.status !== 'pending'; });
  el('approvals-list').innerHTML =
    (pending.length ? '<div style="font-family:var(--m);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px">Pending (' + pending.length + ')</div>' + pending.map(function(a){ return apprCard(a, true); }).join('') : '') +
    (resolved.length ? '<div style="font-family:var(--m);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin:16px 0 8px">Resolved</div>' + resolved.slice(0, 20).map(function(a){ return apprCard(a, false); }).join('') : '');
}

function apprCard(a, canAct) {
  var s = a.status || 'pending';
  var sp = s === 'approved' ? pill('pass','Approved') : s === 'rejected' ? pill('fail','Rejected') : pill('running','Pending');
  return '<div class="appr ' + s + '">' +
    '<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:5px"><div class="appr-title">' + esc(a.title || a.type || 'Approval required') + '</div>' + sp + '</div>' +
    '<div class="appr-detail">' + esc(a.detail || a.reason || '') + '</div>' +
    '<div class="appr-meta">' + esc((a.runId || '—').slice(-14)) + ' · ' + esc((a.ts || '').replace('T',' ').slice(0,16)) + '</div>' +
    (canAct ? '<div class="appr-btns"><button class="btn ok" onclick="doApprove(\'' + esc(a.id) + '\')">Approve</button><button class="btn no" onclick="doReject(\'' + esc(a.id) + '\')">Reject</button></div>' : '') +
  '</div>';
}

function doApprove(id){ fetch('/api/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id})}); }
function doReject(id){ fetch('/api/reject',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id})}); }

// ── Alerts ────────────────────────────────────────────────────────────────────
function renderAlerts() {
  var alerts = S.alerts || [];
  el('alerts-list').innerHTML = alerts.length ? alerts.map(alertRow).join('') : empty('△','All clear','No thresholds breached');
}

// ── All Runs ──────────────────────────────────────────────────────────────────
function renderRuns() {
  var runs = S.runs || [];
  set('runs-cnt', runs.length + ' runs');
  el('runs-body').innerHTML = runs.map(function(r) {
    var tasks  = r.tasks || [];
    var passed = tasks.filter(function(t){ return t.status === 'PASS'; }).length;
    var tl     = r.activityTimeline || [];
    var totalTc= tl.reduce(function(n,m){ return n + m.toolCalls; }, 0);
    var proj   = (r.projectRoot || '').split('/').filter(Boolean).pop() || '—';
    var created = r.manifest && r.manifest.created_at ? r.manifest.created_at.slice(0,16).replace('T',' ') : '—';
    var cost   = ((r.metrics && r.metrics.cumulative_cost_usd) || 0).toFixed(4);
    return '<tr class="row" onclick="openDrawer(\'' + esc(r.runId) + '\')">' +
      '<td>' + pill(r.derivedStatus || 'idle') + '</td>' +
      '<td style="max-width:0"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600">' + esc(r.manifest && r.manifest.goal || '—') + '</div>' +
        '<div style="font-family:var(--m);font-size:10px;color:var(--text3);margin-top:2px">' + created + '</div></td>' +
      '<td><span style="font-family:var(--m);font-size:10.5px;color:var(--blue)">' + esc(proj) + '</span></td>' +
      '<td>' + sparkSvg(tl, 100, 16) + (totalTc ? '<div style="font-family:var(--m);font-size:9.5px;color:var(--text3)">' + totalTc + ' calls</div>' : '') + '</td>' +
      '<td><span style="color:var(--green);font-weight:700">' + passed + '</span><span style="color:var(--text3)">/' + tasks.length + '</span></td>' +
      '<td style="font-family:var(--m);font-size:11px;color:var(--text3)">$' + cost + '</td>' +
    '</tr>';
  }).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text3)">No runs yet</td></tr>';
}

// ── Traceability ──────────────────────────────────────────────────────────────
function renderTrace() {
  var traceMap = S.traceMap || [];
  if (!traceMap.length) { el('trace-list').innerHTML = empty('◉','No traceability data','Runs with stage artifacts will appear here'); return; }
  el('trace-list').innerHTML = traceMap.map(function(t) {
    var reqs  = t.requirements || [];
    var tasks2 = t.passTasks || [];
    var stagesHtml = [['Requirements',t.stages && t.stages.requirements,reqs.length+' reqs'],['Architecture',t.stages && t.stages.architecture,''],['Code',t.stages && t.stages.code,''],['Testing',t.stages && t.stages.testing,'']].map(function(arr){
      var l=arr[0], done=arr[1], sub=arr[2];
      return '<div class="tr-s ' + (done ? 'ok' : 'no') + '">' + (done ? '✓' : '○') + ' ' + esc(l) + (sub && done ? ' <span style="font-size:9px;opacity:.7">(' + esc(sub) + ')</span>' : '') + '</div>';
    }).join('');
    var reqsHtml = reqs.length
      ? '<div style="font-family:var(--m);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--text3);margin-top:11px;margin-bottom:6px">Requirements (' + reqs.length + ')</div>' +
        reqs.slice(0,8).map(function(r){ return '<div class="tr-req"><div class="tr-req-id">' + esc(r.id || '') + (r.area ? ' · ' + esc(r.area) : '') + (r.priority ? ' · ' + esc(r.priority) : '') + '</div>' + esc((r.description || '').slice(0,120)) + '</div>'; }).join('')
      : '';
    var tasksHtml = tasks2.length
      ? '<div style="font-family:var(--m);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--text3);margin-top:11px;margin-bottom:6px">Verified Tasks (' + tasks2.length + ') · ' + (t.evidenceTotal || 0) + ' checks</div>' +
        tasks2.slice(0,6).map(function(task){ return '<div class="tr-task">' + pill('pass','PASS') + '<span style="flex:1">' + esc(task.title) + '</span>' + (task.evidenceCount ? '<span style="font-family:var(--m);font-size:9.5px;color:var(--green)">' + task.evidenceCount + ' checks</span>' : '') + '</div>'; }).join('')
      : '';
    return '<div class="card tr-card"><div class="card-h"><span>' + esc(t.runId.slice(-20)) + '</span><span style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;color:var(--text3)">' + esc((t.goal || '').slice(0,50)) + '</span></div>' +
      '<div class="card-b">' +
        (t.brief ? '<div style="font-size:12px;color:var(--text2);background:var(--raised);border-radius:5px;padding:7px 9px;margin-bottom:9px">' + esc(t.brief.slice(0,200)) + '</div>' : '') +
        '<div class="tr-stages">' + stagesHtml + '</div>' + reqsHtml + tasksHtml +
      '</div></div>';
  }).join('');
}

// ── Team ──────────────────────────────────────────────────────────────────────
function renderTeam() {
  var fw = S.frameworks || {};
  var entries = Object.keys(fw).map(function(k){ return [k, fw[k]]; });
  el('team-body').innerHTML = entries.length
    ? '<table class="tbl" style="width:100%"><thead><tr><th>Framework</th><th>Runs</th><th>Pass</th><th>Fail</th><th>Cost</th><th>Rate</th></tr></thead><tbody>' +
      entries.map(function(e){
        var name=e[0],d=e[1], total=d.pass+d.fail, rate=total?Math.round(d.pass/total*100):0;
        return '<tr><td style="font-weight:700">' + esc(name) + '</td><td>' + d.runs + '</td>' +
          '<td style="color:var(--green);font-weight:600">' + d.pass + '</td>' +
          '<td style="color:' + (d.fail?'var(--red)':'var(--text3)') + '">' + d.fail + '</td>' +
          '<td style="font-family:var(--m);font-size:11px">$' + d.cost.toFixed(4) + '</td>' +
          '<td>' + pill(rate >= 80 ? 'pass' : rate >= 50 ? 'running' : 'fail', rate + '%') + '</td></tr>';
      }).join('') + '</tbody></table>'
    : empty('≡','No team data','');
}

// ── Run detail drawer ─────────────────────────────────────────────────────────
function openDrawer(runId) {
  var r = (S.runs || []).filter(function(x){ return x.runId === runId; })[0];
  if (!r) return;
  var tl     = r.activityTimeline || [];
  var tasks  = r.tasks || [];
  var passed = tasks.filter(function(t){ return t.status === 'PASS'; }).length;
  var failed = tasks.filter(function(t){ return t.status === 'FAIL'; }).length;
  var totalTc= tl.reduce(function(n,m){ return n + m.toolCalls; }, 0);
  var maxTc  = Math.max(1, Math.max.apply(null, tl.map(function(m){ return m.toolCalls; }).concat([1])));

  set('dr-eye',   '◆ ' + esc(r.host || r.manifest && r.manifest.framework || 'run') + ' · ' + esc(r.derivedStatus || '?'));
  set('dr-title', r.manifest && r.manifest.goal || runId);
  set('dr-sub',   runId.slice(0, 50));

  var svgW = 440, svgH = 46;
  var bw = tl.length ? Math.max(3, Math.floor(svgW / tl.length) - 1) : 0;
  var bars = tl.map(function(m, i){
    var bh = Math.max(2, Math.round((m.toolCalls / maxTc) * svgH));
    var col = (m.stagesDone || []).length ? '#16A34A' : (m.guardrails ? '#DC2626' : '#2563EB');
    return '<rect x="' + (i*(bw+1)) + '" y="' + (svgH-bh) + '" width="' + bw + '" height="' + bh + '" fill="' + col + '" rx="1" opacity=".8"><title>' + esc(m.minute) + ' · ' + m.toolCalls + ' calls</title></rect>';
  }).join('');

  var minRows = tl.map(function(m){
    var pct = Math.round((m.toolCalls / maxTc) * 100);
    var tags = [
      (m.tasksPassed ? '<span class="pill pass">' + m.tasksPassed + ' pass</span>' : ''),
      (m.tasksFailed ? '<span class="pill fail">' + m.tasksFailed + ' fail</span>' : ''),
      ((m.stagesDone||[]).length ? '<span class="pill queued">stage: ' + esc(m.stagesDone[0]) + '</span>' : ''),
      (m.guardrails ? '<span class="pill fail">guardrail</span>' : ''),
    ].filter(Boolean).join('');
    return '<div class="dr-min"><span class="dr-mt">' + esc(m.minute.slice(11,16)) + '</span>' +
      '<div class="dr-mb"><div class="dr-mf" style="width:' + pct + '%"></div></div>' +
      '<span class="dr-mc">' + m.toolCalls + '</span>' +
      (tags ? '<div class="dr-tags">' + tags + '</div>' : '') + '</div>';
  }).join('');

  var stagesHtml = tl.flatMap(function(m){ return (m.stagesDone||[]).map(function(s){ return {s:s,min:m.minute}; }); }).map(function(x){
    return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px"><span>' + esc(x.s) + '</span><span style="font-family:var(--m);font-size:10px;color:var(--text3)">' + esc(x.min.slice(11,16)) + '</span></div>';
  }).join('');

  el('dr-body').innerHTML =
    '<div><div class="dr-sec">Overview</div><div class="dr-kpis">' +
    [[totalTc,'Tool Calls','var(--blue)'],[tl.length,'Minutes','var(--amber)'],[passed,'Passed','var(--green)'],[failed,'Failed',failed>0?'var(--red)':'var(--text3)']].map(function(a){
      return '<div class="dr-kpi"><div class="dr-kv" style="color:'+a[2]+'">'+a[0]+'</div><div class="dr-kl">'+a[1]+'</div></div>';
    }).join('') + '</div></div>' +
    (tl.length ? '<div><div class="dr-sec">Activity Timeline</div><svg style="width:100%;height:' + svgH + 'px;display:block" viewBox="0 0 ' + svgW + ' ' + svgH + '">' + bars + '</svg><div style="font-family:var(--m);font-size:9px;color:var(--text3);margin-top:4px">Blue = tool calls · Green = stage · Red = guardrail</div></div>' : '') +
    (minRows ? '<div><div class="dr-sec">Minute Breakdown</div>' + minRows + '</div>' : '') +
    (stagesHtml ? '<div><div class="dr-sec">Stage Completions</div>' + stagesHtml + '</div>' : '');

  el('overlay').classList.add('on');
  el('drawer').classList.add('on');
}

function closeDrawer() {
  el('overlay').classList.remove('on');
  el('drawer').classList.remove('on');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function feedRow(f) {
  var ts   = f.ts ? f.ts.replace('T',' ').slice(0,16) : '';
  var proj = f.projectRoot ? f.projectRoot.split('/').filter(Boolean).pop() : '';
  var ICONS = {pass:'✓',fail:'✗',warn:'!',info:'i',tool:'·',dim:'·'};
  var lv = f.level || 'info';
  return '<div class="frow"><div class="fic ' + esc(lv) + '">' + (ICONS[lv]||'i') + '</div>' +
    '<div class="ftxt"><div class="fsum">' + esc(f.summary||'') + '</div>' +
    '<div class="fmeta">' + (f.runId?'<span>'+esc(f.runId.slice(-10))+'</span>':'') + (proj?'<span style="color:var(--blue)">'+esc(proj)+'</span>':'') + (f.goal?'<span>'+esc(f.goal.slice(0,38))+'</span>':'') + '</div></div>' +
    '<div class="fts">' + ts + '</div></div>';
}

function alertRow(a) {
  var icons = {warn:'⚠️',critical:'🔴',info:'ℹ️'};
  return '<div class="al ' + esc(a.level||'info') + '"><div class="al-icon">' + (icons[a.level]||'ℹ️') + '</div>' +
    '<div><div class="al-title">' + esc(a.title||'') + '</div><div class="al-detail">' + esc(a.detail||'') + '</div></div></div>';
}

function buildProjects() {
  var p = {};
  (S.runs || []).forEach(function(r) {
    var key = r.projectRoot || 'unknown';
    var name = key.split('/').filter(Boolean).pop() || key;
    if (!p[key]) p[key] = {name:name,path:key,runs:0,pass:0,fail:0,last:''};
    p[key].runs++;
    p[key].last = p[key].last > r.runId ? p[key].last : r.runId;
    (r.tasks||[]).forEach(function(t){ if(t.status==='PASS') p[key].pass++; if(t.status==='FAIL') p[key].fail++; });
  });
  return p;
}

function pill(status, label) {
  var l = label || (status||'—').toUpperCase();
  var cls = {active:'running',done:'done',pass:'pass',fail:'fail',running:'running',stalled:'stalled',idle:'idle',ended:'ended',queued:'queued',warn:'running'}[status && status.toLowerCase()] || 'idle';
  return '<span class="pill ' + cls + '">'+esc(l)+'</span>';
}
function chip(label, sty) { return '<span class="chip ' + (sty||'') + '">' + esc(label) + '</span>'; }
function pbar(label, val, max, prefix, dp) {
  var pct = max > 0 ? Math.min(100, (val/max)*100) : 0;
  var cls = pct < 60 ? 'g' : pct < 85 ? 'a' : 'r';
  var fmt = function(v){ return (prefix||'') + (dp ? Number(v).toFixed(dp) : v); };
  return '<div class="pbar-row"><div class="pbar-lbl"><span>'+esc(label)+'</span><span style="font-family:var(--m)">'+fmt(val)+' / '+fmt(max)+'</span></div>' +
    '<div class="pbar"><div class="pbar-fill '+cls+'" style="width:'+pct.toFixed(1)+'%"></div></div></div>';
}
function empty(ic, title, sub) {
  return '<div class="empty"><div class="empty-ic">'+(ic||'')+'</div><div class="empty-t">'+esc(title)+'</div><div class="empty-s">'+esc(sub)+'</div></div>';
}
function sparkSvg(tl, W, H) {
  if (!tl || !tl.length) return '';
  var maxTc = Math.max(1, Math.max.apply(null, tl.map(function(m){ return m.toolCalls; })));
  var bw = Math.max(1, Math.floor(W/tl.length)-1);
  var bars = tl.map(function(m,i){
    var bh = Math.max(1, Math.round((m.toolCalls/maxTc)*H));
    var col = (m.stagesDone||[]).length ? '#16A34A' : (m.guardrails ? '#DC2626' : '#2563EB');
    return '<rect x="'+(i*(bw+1))+'" y="'+(H-bh)+'" width="'+bw+'" height="'+bh+'" fill="'+col+'" rx="1" opacity=".75"/>';
  }).join('');
  return '<svg width="'+W+'" height="'+H+'" class="spark">'+bars+'</svg>';
}
function set(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
function el(id) { return document.getElementById(id); }
function showBadge(id, n) { var e = document.getElementById(id); if (!e) return; e.textContent = n; e.style.display = n > 0 ? 'flex' : 'none'; }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── HTTP first load — don't wait for WS ──────────────────────────────────────
fetch('/api/state').then(function(r){ return r.json(); }).then(function(data){
  apply(data);
  var s = document.getElementById('tb-status'); if (s) s.textContent = 'Loaded';
  var d = document.getElementById('tb-dot'); if (d) d.style.background = 'var(--amber)';
}).catch(function(err){
  showErr('HTTP load failed: ' + err.message);
});

// ── WS for live updates ───────────────────────────────────────────────────────
connect();
</script>
</body>
</html>`;
}
