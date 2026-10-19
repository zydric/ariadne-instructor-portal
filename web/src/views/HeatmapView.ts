import { appState, type AppState } from '../state.ts';

export function renderHeatmapView(state: AppState): string {
  const data = state.heatmapData;
  if (!data) {
    return `
      <div class="panel-card">
        <div style="padding: 48px; text-align: center; color: var(--muted-foreground);">
          <div class="spinner" style="margin: 0 auto 12px;"></div>
          <p>Loading cohort vulnerability heatmap...</p>
        </div>
      </div>
    `;
  }

  const { matrix, categories, assignment } = data;

  const getHeatClass = (pct: number) => {
    if (pct === 0) return 'heat-0';
    if (pct < 30) return 'heat-low';
    if (pct < 60) return 'heat-med';
    return 'heat-high';
  };

  const headersHtml = categories.map((cat: any) => `
    <th>
      <div style="font-weight: 600; color: var(--foreground);">${cat.title}</div>
      <div class="location" style="margin-top: 2px;">${cat.cwe}</div>
    </th>
  `).join('');

  const rowsHtml = matrix.map((row: any) => {
    const cellsHtml = row.cells.map((cell: any) => {
      const heatClass = getHeatClass(cell.percentage);
      return `
        <td 
          class="heatmap-cell ${heatClass}" 
          data-cwe="${cell.category.cwe}" 
          data-sec-id="${row.section.id}"
          data-sec-name="${row.section.name}"
          data-affected="${cell.affectedCount}"
          data-total="${cell.totalStudents}"
          title="Click to view affected students or generate lecture notes"
        >
          <div class="cell-percentage">${cell.percentage}%</div>
          <div class="cell-sub">${cell.affectedCount} of ${cell.totalStudents} students</div>
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td class="heatmap-row-header">
          <div>${row.section.name}</div>
          <div class="cell-secondary">${row.totalStudents} enrolled</div>
        </td>
        ${cellsHtml}
      </tr>
    `;
  }).join('');

  return `
    <div class="heatmap-view-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Cohort Heatmap</h1>
          <p class="page-description">
            ${assignment.title} • Security flaw density across cohort sections. Click any cell to open Lecture Co-Pilot.
          </p>
        </div>
        <div>
          <button class="btn btn-outline btn-sm btn-quick-copilot" data-cwe="CWE-89">
            Lecture Notes: SQL Injection
          </button>
        </div>
      </div>

      <!-- Main Heatmap Grid Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            <span>Vulnerability Density Matrix</span>
            <span class="badge badge-info">${state.selectedSectionId ? `Section: ${matrix[0]?.section?.name || 'Selected'}` : 'All Sections'}</span>
          </div>
          <div class="heatmap-legend" style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--muted-foreground); flex-wrap: wrap;">
            <span>Scale:</span>
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <span style="width: 10px; height: 10px; border-radius: 2px; background: var(--heat-0-bg); border: 1px solid var(--border);"></span> 0%
            </span>
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <span style="width: 10px; height: 10px; border-radius: 2px; background: var(--heat-low-bg); border: 1px solid var(--emerald-border);"></span> &lt;30%
            </span>
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <span style="width: 10px; height: 10px; border-radius: 2px; background: var(--heat-med-bg); border: 1px solid var(--amber-border);"></span> &lt;60%
            </span>
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <span style="width: 10px; height: 10px; border-radius: 2px; background: var(--red-soft); border: 1px solid var(--red-border);"></span> 60%+
            </span>
          </div>
        </div>

        <div class="table-scroll-hint hide-desktop">← Scroll horizontally to inspect sections & CWE density →</div>
        <div class="heatmap-wrapper">
          <table class="heatmap-table">
            <thead>
              <tr>
                <th style="text-align: left; width: 180px;">Section</th>
                ${headersHtml}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Action Cards for Top Weaknesses -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        <div class="panel-card" style="padding: 20px; margin-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="badge badge-fail">Highest Density</span>
            <span class="location">CWE-89</span>
          </div>
          <h3 style="font-size: 15px; font-weight: 600;">SQL Injection</h3>
          <p class="cell-secondary" style="margin-top: 4px; line-height: 1.45;">
            Dynamic string concatenation in statement execution. Highest frequency in BSIT 3A and 3B.
          </p>
          <button class="btn btn-outline btn-sm btn-quick-copilot" data-cwe="CWE-89" style="width: 100%; margin-top: 16px;">
            Synthesize Lecture Plan
          </button>
        </div>

        <div class="panel-card" style="padding: 20px; margin-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="badge badge-warning">Configuration Flaw</span>
            <span class="location">CWE-798</span>
          </div>
          <h3 style="font-size: 15px; font-weight: 600;">Hardcoded Credentials</h3>
          <p class="cell-secondary" style="margin-top: 4px; line-height: 1.45;">
            Plaintext database credentials committed directly to repository configuration files.
          </p>
          <button class="btn btn-outline btn-sm btn-quick-copilot" data-cwe="CWE-798" style="width: 100%; margin-top: 16px;">
            Synthesize Lecture Plan
          </button>
        </div>

        <div class="panel-card" style="padding: 20px; margin-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="badge badge-info">Access Control</span>
            <span class="location">CWE-22</span>
          </div>
          <h3 style="font-size: 15px; font-weight: 600;">Path Traversal</h3>
          <p class="cell-secondary" style="margin-top: 4px; line-height: 1.45;">
            Unvalidated file download and upload parameters allowing access outside sandbox directory.
          </p>
          <button class="btn btn-outline btn-sm btn-quick-copilot" data-cwe="CWE-22" style="width: 100%; margin-top: 16px;">
            Synthesize Lecture Plan
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachHeatmapEvents(container: HTMLElement): void {
  // Cell clicks
  container.querySelectorAll('.heatmap-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const cwe = target.getAttribute('data-cwe') || 'CWE-89';
      const secId = target.getAttribute('data-sec-id') || '';
      const affected = parseInt(target.getAttribute('data-affected') || '0', 10);
      const total = parseInt(target.getAttribute('data-total') || '14', 10);

      appState.openCopilotModal(cwe, secId, affected, total);
    });
  });

  // Quick copilot buttons
  container.querySelectorAll('.btn-quick-copilot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cwe = (e.currentTarget as HTMLElement).getAttribute('data-cwe') || 'CWE-89';
      appState.openCopilotModal(cwe);
    });
  });
}
