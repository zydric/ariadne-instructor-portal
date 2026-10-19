import { appState, type AppState } from '../state.ts';

export function renderGuardrailsView(state: AppState): string {
  const packs = state.guardrailPacks;
  const assignments = state.assignments;
  const currentAsg = assignments.find((a: any) => a.id === state.selectedAssignmentId) || assignments[0];
  const activePackId = currentAsg?.guardrailPackId || packs[0]?.id;
  const activePack = packs.find((p: any) => p.id === activePackId) || packs[0];

  if (!activePack) return `<div>Loading guardrail packs...</div>`;

  const packsCardsHtml = packs.map((p: any) => {
    const isAssigned = p.id === activePackId;
    return `
      <div 
        class="guardrail-card ${isAssigned ? 'active' : ''}" 
        data-pack-id="${p.id}"
      >
        <div class="guardrail-card-header">
          <div class="guardrail-card-title">${p.name}</div>
          <span class="badge ${isAssigned ? 'badge-pass' : 'badge-info'}">
            ${isAssigned ? 'Active Pack' : p.yearLevel}
          </span>
        </div>
        <div class="guardrail-card-desc">${p.description}</div>
        <div style="font-size: 13px; color: var(--muted-foreground); display: flex; gap: 16px; margin-bottom: 16px;">
          <div>Zero Critical: <strong style="color: var(--foreground);">${p.policies.zeroCritical ? 'On' : 'Off'}</strong></div>
          <div>Block High+: <strong style="color: var(--foreground);">${p.policies.blockMergeOnHigh ? 'On' : 'Off'}</strong></div>
        </div>
        ${!isAssigned ? `
          <button class="btn btn-outline btn-sm btn-assign-pack" data-pack-id="${p.id}" style="width: 100%;">
            Assign to Assignment
          </button>
        ` : `
          <div style="font-size: 12px; color: var(--muted-foreground); font-weight: 500; text-align: center; padding: 6px 0;">
            Currently enforcing on Gradebook & Bot
          </div>
        `}
      </div>
    `;
  }).join('');

  // Rules list for currently active pack
  const ruleDefinitions = [
    {
      id: 'taint.sql.execute',
      title: 'SQL Injection via Query Execution',
      cwe: 'CWE-89',
      category: 'A03:2021-Injection',
      severity: 'critical'
    },
    {
      id: 'pattern.hardcoded.assignment',
      title: 'Hardcoded Credential in Variable Assignment',
      cwe: 'CWE-798',
      category: 'A07:2021-Identification & Auth',
      severity: 'high'
    },
    {
      id: 'pattern.hardcoded.field',
      title: 'Hardcoded Credential in Class Field Literal',
      cwe: 'CWE-798',
      category: 'A07:2021-Identification & Auth',
      severity: 'high'
    },
    {
      id: 'taint.path.fileApi',
      title: 'Path Traversal via Unvalidated File API',
      cwe: 'CWE-22',
      category: 'A01:2021-Broken Access Control',
      severity: 'high'
    },
    {
      id: 'taint.xss.responseWrite',
      title: 'Reflected Cross-Site Scripting (XSS) in Response Writer',
      cwe: 'CWE-79',
      category: 'A03:2021-Injection',
      severity: 'high'
    }
  ];

  const rulesListHtml = ruleDefinitions.map(rule => {
    const isEnabled = activePack.rules[rule.id] !== false;
    const badgeClass = rule.severity === 'critical' ? 'badge-critical' : 'badge-high';

    return `
      <div class="rule-item">
        <div style="display: flex; align-items: center; gap: 12px;">
          <label class="switch">
            <input type="checkbox" class="rule-toggle" data-rule-id="${rule.id}" ${isEnabled ? 'checked' : ''} />
            <span class="slider"></span>
          </label>
          <div>
            <div style="font-weight: 500; font-size: 14px;">
              ${rule.title}
            </div>
            <div class="cell-secondary mono">
              ${rule.id} • ${rule.category}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="badge ${badgeClass}">${rule.severity}</span>
          <span class="badge badge-outline">${rule.cwe}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="guardrails-view-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Course Guardrails</h1>
          <p class="page-description">
            Syllabus-aligned static analysis presets. Select a course pack to apply its rules and policies.
          </p>
        </div>
      </div>

      <!-- Course Packs Cards -->
      <div class="guardrail-cards">
        ${packsCardsHtml}
      </div>

      <!-- Active Guardrail Customizer -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">
              <span>Rule Configuration: ${activePack.name}</span>
            </div>
            <div class="panel-subtitle">
              Adjust policy thresholds and individual scanner rules for ${currentAsg?.title || 'Assignment'}
            </div>
          </div>
          <div>
            <button class="btn btn-outline btn-sm" id="btn-reset-rules">Restore Default Rules</button>
          </div>
        </div>

        <div style="padding: 20px;">
          <!-- Course-Wide Policy Controls -->
          <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px;">
              Cohort Gatekeeper Policies
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--muted);">
                <div>
                  <div style="font-weight: 500; font-size: 14px;">Zero Critical Policy</div>
                  <div class="cell-secondary">Fail submission immediately if any Critical finding is present</div>
                </div>
                <label class="switch">
                  <input type="checkbox" id="policy-zero-critical" ${activePack.policies.zeroCritical ? 'checked' : ''} />
                  <span class="slider"></span>
                </label>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--muted);">
                <div>
                  <div style="font-weight: 500; font-size: 14px;">Block Merge on High+</div>
                  <div class="cell-secondary">Block Pull Request merge if High or Critical findings exist</div>
                </div>
                <label class="switch">
                  <input type="checkbox" id="policy-block-high" ${activePack.policies.blockMergeOnHigh ? 'checked' : ''} />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Individual Rules Checklist -->
          <div>
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px;">
              Enabled SAST Scanner Rules (${Object.values(activePack.rules).filter(Boolean).length} Active)
            </div>
            <div class="rules-checklist">
              ${rulesListHtml}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachGuardrailsEvents(container: HTMLElement): void {
  const state = appState.getState();
  const currentAsg = state.assignments.find((a: any) => a.id === state.selectedAssignmentId) || state.assignments[0];
  const activePackId = currentAsg?.guardrailPackId || state.guardrailPacks[0]?.id;
  const activePack = state.guardrailPacks.find((p: any) => p.id === activePackId) || state.guardrailPacks[0];

  // Click card to assign
  container.querySelectorAll('.guardrail-card').forEach(card => {
    card.addEventListener('click', () => {
      const packId = card.getAttribute('data-pack-id');
      if (packId && currentAsg) {
        appState.assignGuardrailToAssignment(currentAsg.id, packId);
      }
    });
  });

  container.querySelectorAll('.btn-assign-pack').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const packId = (e.currentTarget as HTMLElement).getAttribute('data-pack-id');
      if (packId && currentAsg) {
        appState.assignGuardrailToAssignment(currentAsg.id, packId);
      }
    });
  });

  // Toggles for policies
  const zeroCritToggle = container.querySelector('#policy-zero-critical') as HTMLInputElement;
  zeroCritToggle?.addEventListener('change', () => {
    if (!activePack) return;
    const updated = {
      policies: {
        ...activePack.policies,
        zeroCritical: zeroCritToggle.checked
      }
    };
    appState.updateGuardrailPack(activePack.id, updated);
  });

  const blockHighToggle = container.querySelector('#policy-block-high') as HTMLInputElement;
  blockHighToggle?.addEventListener('change', () => {
    if (!activePack) return;
    const updated = {
      policies: {
        ...activePack.policies,
        blockMergeOnHigh: blockHighToggle.checked
      }
    };
    appState.updateGuardrailPack(activePack.id, updated);
  });

  // Toggles for individual rules
  container.querySelectorAll('.rule-toggle').forEach(t => {
    t.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const ruleId = target.getAttribute('data-rule-id');
      if (!ruleId || !activePack) return;

      const updated = {
        rules: {
          ...activePack.rules,
          [ruleId]: target.checked
        }
      };
      appState.updateGuardrailPack(activePack.id, updated);
    });
  });

  // Reset rules
  const resetBtn = container.querySelector('#btn-reset-rules');
  resetBtn?.addEventListener('click', () => {
    if (!activePack) return;
    const defaultRules = {
      'pattern.hardcoded.assignment': true,
      'pattern.hardcoded.field': true,
      'taint.sql.execute': activePack.id !== 'pack-2nd-year',
      'taint.path.fileApi': activePack.id !== 'pack-2nd-year',
      'taint.xss.responseWrite': activePack.id !== 'pack-2nd-year'
    };
    appState.updateGuardrailPack(activePack.id, { rules: defaultRules });
  });
}
