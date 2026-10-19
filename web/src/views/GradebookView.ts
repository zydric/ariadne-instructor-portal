import { appState, type AppState } from '../state.ts';

export function renderGradebookView(state: AppState): string {
  const data = state.gradebookData;
  if (!data) {
    return `
      <div class="panel-card">
        <div style="padding: 48px; text-align: center; color: var(--muted-foreground);">
          <div class="spinner" style="margin: 0 auto 12px;"></div>
          <p>Loading gradebook data...</p>
        </div>
      </div>
    `;
  }

  const { stats, rows, assignment, guardrailPack } = data;

  const rowsHtml = rows.map((r: any) => {
    const scoreVal = r.submission ? r.score.score : 0;
    const isPassing = r.score?.passedPolicy;
    const flagCount = r.score?.flags?.length || 0;
    const critCount = r.score?.activeFindings?.filter((f: any) => f.severity === 'critical').length || 0;
    const highCount = r.score?.activeFindings?.filter((f: any) => f.severity === 'high').length || 0;
    const hasSubmission = !!r.submission;
    const isFailing = hasSubmission && (scoreVal < 75 || !isPassing);

    return `
      <tr data-student-id="${r.student.id}">
        <td>
          <div class="cell-primary">${r.student.name}</div>
          <div class="cell-secondary mono">${r.student.studentNo} • @${r.student.githubUser}</div>
        </td>
        <td>
          <span class="badge badge-info">${r.section.name}</span>
        </td>
        <td>
          ${r.submission ? `
            <div class="sha">${r.submission.commitSha}</div>
            <div class="cell-secondary truncate" style="max-width: 200px;">
              ${r.submission.commitMessage}
            </div>
          ` : `<span class="cell-muted">No submission</span>`}
        </td>
        <td>
          <div class="score-cell">
            <span class="score-num ${!hasSubmission ? 'cell-muted' : isFailing ? 'is-failing' : 'is-passing'}">${scoreVal}</span>
            <div class="score-track">
              <div class="score-fill ${!hasSubmission ? '' : isFailing ? 'is-failing' : ''}" style="width: ${scoreVal}%;"></div>
            </div>
          </div>
        </td>
        <td>
          ${hasSubmission ? (
            isPassing
              ? `<span class="badge badge-pass">Pass</span>`
              : `<span class="badge badge-fail">Blocked</span>`
          ) : `<span class="badge badge-neutral">Pending</span>`}
        </td>
        <td>
          ${flagCount > 0
            ? `<span class="badge badge-warning" title="Potential academic integrity bypass attempt detected">${flagCount} Flag${flagCount > 1 ? 's' : ''}</span>`
            : `<span class="cell-muted">0</span>`
          }
        </td>
        <td>
          ${hasSubmission ? (
            critCount > 0 || highCount > 0
              ? `<div style="display: flex; gap: 4px;">
                  ${critCount > 0 ? `<span class="badge badge-critical">${critCount} Crit</span>` : ''}
                  ${highCount > 0 ? `<span class="badge badge-high">${highCount} High</span>` : ''}
                </div>`
              : `<span class="badge badge-neutral">0 findings</span>`
          ) : `<span class="cell-muted">—</span>`}
        </td>
        <td style="text-align: right;">
          <button class="btn btn-outline btn-sm btn-inspect" data-student-id="${r.student.id}">
            Inspect Audit
          </button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="gradebook-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gradebook & Audit</h1>
          <p class="page-description">
            ${assignment.title} • Enforcing guardrail pack "${guardrailPack.name}".
          </p>
        </div>
      </div>

      <!-- Stat strip: 4 connected stats in 1 container -->
      <div class="stat-grid">
        <div class="stat">
          <div class="stat-label">Cohort Average</div>
          <div class="stat-value tabular">${stats.avgScore}<small>/100</small></div>
          <div class="stat-sub">${stats.submittedCount} of ${stats.totalStudents} submitted</div>
        </div>

        <div class="stat">
          <div class="stat-label">Pass Rate</div>
          <div class="stat-value tabular ${stats.passRate >= 70 ? 'is-success' : 'is-warning'}">${stats.passRate}<small>%</small></div>
          <div class="stat-sub">${stats.passedCount || Math.round((stats.passRate / 100) * stats.submittedCount)} passing gatekeeper</div>
        </div>

        <div class="stat">
          <div class="stat-label">Critical Findings</div>
          <div class="stat-value tabular ${stats.totalCritical > 0 ? 'is-alert' : ''}">${stats.totalCritical}</div>
          <div class="stat-sub">Zero Critical policy: ${guardrailPack.policies.zeroCritical ? 'Enforced' : 'Off'}</div>
        </div>

        <div class="stat">
          <div class="stat-label">Integrity Flags</div>
          <div class="stat-value tabular ${stats.totalFlags > 0 ? 'is-warning' : ''}">${stats.totalFlags}</div>
          <div class="stat-sub">Bypasses & suppression markers</div>
        </div>
      </div>

      <!-- Main Roster Table Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">
              <span>Student Roster</span>
              <span class="badge badge-info">${rows.length}</span>
            </div>
            <div class="panel-subtitle">Evaluated live against course policy rules</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input 
              type="text" 
              id="gradebook-search" 
              class="form-input" 
              placeholder="Search by name, ID, or handle..." 
              style="width: 260px; height: 32px; font-size: 13px;"
            />
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="gradebook-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Section</th>
                <th>Latest Commit</th>
                <th>Score</th>
                <th>Policy Status</th>
                <th>Integrity</th>
                <th>Findings</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function attachGradebookEvents(container: HTMLElement): void {
  // Inspect button click
  container.querySelectorAll('.btn-inspect').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const studentId = (e.currentTarget as HTMLElement).getAttribute('data-student-id');
      if (studentId) {
        appState.openStudentDrilldown(studentId);
      }
    });
  });

  // Search filter
  const searchInput = container.querySelector('#gradebook-search') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      const rows = container.querySelectorAll('#gradebook-table tbody tr');
      rows.forEach(r => {
        const text = r.textContent?.toLowerCase() || '';
        (r as HTMLElement).style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
}
