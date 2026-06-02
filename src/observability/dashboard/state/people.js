/**
 * People + presence — the human dimension of the Business Hub.
 *
 * Derived entirely from run data (manifest.started_by, approvals.json
 * approver, clarification answered_by). Runs recorded before the people
 * layer (#40) have none of these fields and show up as 'unattributed' —
 * never an error.
 *
 * owner: RStack developed by Richardson Gunde
 */

const LIVE_WINDOW_MS = 5 * 60 * 1000;
const RECENT_WINDOW_MS = 30 * 60 * 1000;

function parseTs(ts) {
  const ms = Date.parse(ts ?? '');
  return Number.isFinite(ms) ? ms : null;
}

function personFor(map, name) {
  const key = name || 'unattributed';
  if (!map[key]) {
    map[key] = {
      name: key,
      email: null,
      runsStarted: 0,
      approvals: 0,
      rejections: 0,
      guidance: 0,
      lastSeen: null,
      projects: new Set(),
    };
  }
  return map[key];
}

function touch(person, ts) {
  const ms = parseTs(ts);
  if (ms !== null && (person.lastSeen === null || ms > person.lastSeen)) person.lastSeen = ms;
}

/** People directory across all runs: who started, approved, guided. */
export function buildPeople(runs) {
  const map = {};
  for (const run of runs ?? []) {
    const startedBy = run.manifest?.started_by;
    const starter = personFor(map, startedBy?.name);
    if (startedBy?.email && !starter.email) starter.email = startedBy.email;
    starter.runsStarted++;
    starter.projects.add(run.projectRoot ?? '');
    touch(starter, run.manifest?.created_at);

    for (const approval of run.approvals ?? []) {
      const approver = personFor(map, approval.approver === 'human-user' ? null : approval.approver);
      if (approval.status === 'APPROVED') approver.approvals++;
      if (approval.status === 'REJECTED') approver.rejections++;
      approver.projects.add(run.projectRoot ?? '');
      touch(approver, approval.timestamp);
    }

    for (const ev of run.events ?? []) {
      if (ev.type === 'clarification_answers_added') {
        const guide = personFor(map, ev.answered_by);
        guide.guidance += Number(ev.count) || 1;
        guide.projects.add(run.projectRoot ?? '');
        touch(guide, ev.ts);
      }
    }
  }
  return Object.values(map)
    .map((person) => ({
      ...person,
      projects: [...person.projects].filter(Boolean),
      lastSeen: person.lastSeen ? new Date(person.lastSeen).toISOString() : null,
    }))
    .sort((a, b) => (b.lastSeen ?? '').localeCompare(a.lastSeen ?? ''));
}

/**
 * Who is live right now: runs with recent events, who started them, and
 * which task/agent is currently executing.
 */
export function buildPresence(runs, now = Date.now()) {
  const presence = [];
  for (const run of runs ?? []) {
    const events = run.events ?? [];
    const last = events[events.length - 1];
    const lastMs = parseTs(last?.ts);
    if (lastMs === null || now - lastMs > RECENT_WINDOW_MS) continue;
    const inProgress = (run.tasks ?? []).find((task) => task.status === 'IN_PROGRESS');
    presence.push({
      runId: run.runId,
      projectRoot: run.projectRoot,
      goal: (run.manifest?.goal ?? '').slice(0, 140),
      startedBy: run.manifest?.started_by?.name ?? 'unattributed',
      lastEventTs: last?.ts ?? null,
      secondsAgo: Math.round((now - lastMs) / 1000),
      live: now - lastMs <= LIVE_WINDOW_MS,
      currentTask: inProgress
        ? { id: inProgress.id, title: inProgress.title ?? inProgress.id, agent: inProgress.agent_name ?? inProgress.agent ?? null }
        : null,
    });
  }
  return presence.sort((a, b) => a.secondsAgo - b.secondsAgo);
}
