import { appState } from '../state.ts';

export function renderDrilldownModal(data: any): string {
  const { student, section, assignment, guardrailPack, timeline } = data;
  if (!student) return '';

  const latestScored = timeline.length > 0 ? timeline[timeline.length - 1] : null;
  const scoreData = latestScored?.score;

  // Timeline
  const timelineHtml = timeline.map((item: any, idx: number) => {
    const isLatest = idx === timeline.length - 1;
    const sub = item.submission;
    const score = item.score?.score ?? 0;
    const pass = item.score?.passedPolicy;

    return `
      <div class="list-row">
        <div class="list-row-head">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="sha">${sub.commitSha}</span>
            ${isLatest ? '<span class="badge badge-muted">Latest</span>' : ''}
            <span class="cell-secondary">${new Date(sub.scannedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <span class="mono" style="font-size: 13px; font-weight: 500;">${score}/100</span>
            <span class="badge ${pass ? 'badge-pass' : 'badge-fail'}">
              ${pass ? 'Pass' : 'Blocked'}
            </span>
          </div>
        </div>
        <div class="list-row-title">${sub.commitMessage}</div>
        <div class="cell-secondary">
          ${sub.findings?.length || 0} finding${sub.findings?.length === 1 ? '' : 's'} • ${sub.integrityFlags?.length || 0} flag${sub.integrityFlags?.length === 1 ? '' : 's'}
        </div>
      </div>
    `;
  }).join('');

  // Flags HTML
  const flags = scoreData?.flags || [];
  const flagsHtml = flags.length === 0
    ? `<p class="empty-note">No bypass attempts or unauthorized suppression markers detected.</p>`
    : flags.map((f: any) => `
        <div class="list-row" style="background: var(--amber-soft); padding: 12px 14px; border: 1px solid var(--amber-border); border-radius: var(--radius-md); margin-bottom: 8px;">
          <div class="list-row-head">
            <span class="badge badge-warning">${f.kind} bypass</span>
            <span class="location">${f.file_path}:${f.line_number}</span>
          </div>
          <div class="list-row-title" style="color: var(--amber-foreground); font-weight: 600;">${f.title}</div>
          <div class="list-row-text" style="color: var(--foreground);">${f.evidence.explanation}</div>
          ${f.evidence.previousSnippet || f.evidence.currentSnippet ? `
            <pre class="code-diff">${f.evidence.previousSnippet ? `<span class="diff-del">- ${f.evidence.previousSnippet}</span>` : ''}${f.evidence.currentSnippet ? `<span class="diff-add">+ ${f.evidence.currentSnippet}</span>` : ''}</pre>
          ` : ''}
        </div>
      `).join('');

  // Active Findings HTML
  const findings = scoreData?.activeFindings || [];
  const findingsHtml = findings.length === 0
    ? `<p class="empty-note">Zero security vulnerabilities detected under active guardrails.</p>`
    : findings.map((f: any) => {
        const badgeClass = f.severity === 'critical' ? 'badge-critical' : f.severity === 'high' ? 'badge-high' : 'badge-warning';
        return `
          <div class="list-row">
            <div class="list-row-head">
              <span class="badge ${badgeClass}">${f.severity} • ${f.cwe_id}</span>
              <span class="location">${f.file_path}:${f.line_number}</span>
            </div>
            <div class="list-row-title">${f.type} <span class="mono" style="font-size: 12px; color: var(--muted-foreground); font-weight: normal;">${f.rule_id}</span></div>
            <div class="list-row-text">${f.description}</div>
          </div>
        `;
      }).join('');

  return `
    <div class="modal-overlay" id="drilldown-modal-overlay">
      <div class="modal-card" role="dialog" aria-labelledby="drilldown-title">
        <div class="modal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 class="modal-title" id="drilldown-title">${student.name}</h2>
              <span class="badge badge-info">${section?.name}</span>
            </div>
            <p class="modal-description">
              ID: <span class="mono">${student.studentNo}</span> • GitHub: <a href="${student.repoUrl}" target="_blank">@${student.githubUser}</a>
            </p>
          </div>
          <button class="close-btn" id="drilldown-close-btn" aria-label="Close dialog">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Score Summary Strip -->
          ${scoreData ? `
            <div class="stat-grid" style="margin-bottom: 20px;">
              <div class="stat">
                <div class="stat-label">Security Grade</div>
                <div class="stat-value tabular ${scoreData.passedPolicy ? 'is-success' : 'is-alert'}">${scoreData.score}<small>/100</small></div>
                <div class="stat-sub">${scoreData.passedPolicy ? 'Passed course policy' : 'Blocked by gatekeeper'}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Critical Deductions</div>
                <div class="stat-value tabular ${scoreData.penalties.critical > 0 ? 'is-alert' : ''}">-${scoreData.penalties.critical}</div>
                <div class="stat-sub">25 pts per Critical</div>
              </div>
              <div class="stat">
                <div class="stat-label">High Deductions</div>
                <div class="stat-value tabular ${scoreData.penalties.high > 0 ? 'is-alert' : ''}">-${scoreData.penalties.high}</div>
                <div class="stat-sub">15 pts per High</div>
              </div>
              <div class="stat">
                <div class="stat-label">Integrity Penalties</div>
                <div class="stat-value tabular ${scoreData.penalties.integrity > 0 ? 'is-warning' : ''}">-${scoreData.penalties.integrity}</div>
                <div class="stat-sub">10 pts per evasion</div>
              </div>
            </div>
          ` : ''}

          <!-- Academic Integrity Audit Section -->
          <div class="section">
            <div class="section-title">
              <span>Academic Integrity Audit</span>
              <span class="count">${flags.length} flag${flags.length === 1 ? '' : 's'}</span>
            </div>
            ${flagsHtml}
          </div>

          <!-- Active Findings Section -->
          <div class="section">
            <div class="section-title">
              <span>Active SAST Findings</span>
              <span class="count">${findings.length} finding${findings.length === 1 ? '' : 's'}</span>
            </div>
            ${findingsHtml}
          </div>

          <!-- Submission Evolution Timeline -->
          <div class="section">
            <div class="section-title">
              <span>Submission Evolution</span>
              <span class="count">${timeline.length} commit${timeline.length === 1 ? '' : 's'}</span>
            </div>
            ${timelineHtml}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" id="drilldown-close-footer">Close</button>
        </div>
      </div>
    </div>
  `;
}

export function attachDrilldownEvents(container: HTMLElement): void {
  const closeBtn = container.querySelector('#drilldown-close-btn');
  const closeFooter = container.querySelector('#drilldown-close-footer');
  const overlay = container.querySelector('#drilldown-modal-overlay');

  const close = () => {
    window.removeEventListener('keydown', handleKey);
    if (overlay) {
      overlay.classList.add('is-closing');
      setTimeout(() => appState.closeStudentDrilldown(), 140);
    } else {
      appState.closeStudentDrilldown();
    }
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  window.addEventListener('keydown', handleKey);

  closeBtn?.addEventListener('click', close);
  closeFooter?.addEventListener('click', close);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}
