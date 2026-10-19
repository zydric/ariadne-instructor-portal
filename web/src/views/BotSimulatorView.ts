import { appState, type AppState } from '../state.ts';

export function renderBotSimulatorView(state: AppState): string {
  const students = state.gradebookData?.rows?.map((r: any) => r.student) || state.courses;
  const assignments = state.assignments;
  const currentAsg = assignments.find((a: any) => a.id === state.selectedAssignmentId) || assignments[0];
  const packs = state.guardrailPacks;
  const activePack = packs.find((p: any) => p.id === (currentAsg?.guardrailPackId || 'pack-3rd-year')) || packs.find((p: any) => p.id === 'pack-3rd-year') || packs[0];
  const result = state.botSimulationResult;
  const isSimulating = state.isSimulatingBot;

  const studentOptions = (students || []).map((s: any) => `
    <option value="${s.id}" ${s.name?.includes('Juan Carlos') ? 'selected' : ''}>
      ${s.name} (${s.studentNo})
    </option>
  `).join('');

  const packOptions = (packs || []).map((p: any) => `
    <option value="${p.id}" ${p.id === activePack?.id ? 'selected' : ''}>
      ${p.name}
    </option>
  `).join('');

  return `
    <div class="bot-simulator-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Bot Gatekeeper Simulator</h1>
          <p class="page-description">
            Simulate a student Pull Request against classroom repositories to preview automated check runs and feedback.
          </p>
        </div>
      </div>

      <!-- Simulator Layout Grid -->
      <div class="simulator-layout">
        <!-- Left: Controls -->
        <div class="sim-sidebar">
          <div class="panel-card" style="padding: 20px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 16px;">
              Simulation Parameters
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label" for="sim-student-id">Target Student</label>
              <select id="sim-student-id" class="select-control" style="width: 100%;">
                ${studentOptions}
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Assignment Context</label>
              <input type="text" class="form-input" value="${currentAsg?.title || 'Midterm Project: CIT-U DormFinder Microservice'}" disabled />
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label" for="sim-pack-id">Enforced Course Guardrail</label>
              <select id="sim-pack-id" class="select-control" style="width: 100%; margin-bottom: 6px;">
                ${packOptions}
              </select>
              <div id="sim-pack-badge" style="background: var(--muted); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 12px;">
                <div style="display: flex; gap: 12px; color: var(--muted-foreground);">
                  <span>Zero Critical: <strong id="sim-zero-crit" style="color: var(--foreground);">${activePack?.policies?.zeroCritical ? 'On' : 'Off'}</strong></span>
                  <span>Block Merge: <strong id="sim-block-merge" style="color: var(--foreground);">${activePack?.policies?.blockMergeOnHigh ? 'On' : 'Off'}</strong></span>
                </div>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label" for="sim-sample-key">Code Commit Sample</label>
              <select id="sim-sample-key" class="select-control" style="width: 100%;">
                <option value="v1-initial">v1-initial: Vulnerable Initial Push (4 Flaws)</option>
                <option value="v2-bypassed">v2-bypassed: Evasion Attempt (Commented Query & Ignore)</option>
                <option value="v3-fixed">v3-fixed: Remediated & Hardened (0 Findings)</option>
              </select>
              <div id="sample-explainer" style="font-size: 12px; color: var(--muted-foreground); margin-top: 6px; line-height: 1.4; background: var(--muted); padding: 8px 10px; border-radius: var(--radius-sm); border-left: 3px solid var(--red);">
                <strong>v1-initial:</strong> Contains 4 vulnerabilities. Expected: Blocked by Zero Critical policy (Score: 15/100).
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
              <label class="form-label" for="sim-commit-msg">Commit Message</label>
              <input 
                type="text" 
                id="sim-commit-msg" 
                class="form-input" 
                value="feat(api): implement dormfinder endpoints" 
              />
            </div>

            <button 
              class="btn btn-primary" 
              id="btn-run-simulation" 
              style="width: 100%;"
              ${isSimulating ? 'disabled' : ''}
            >
              ${isSimulating ? `<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> Scanning...` : `Simulate Push & Run Gatekeeper`}
            </button>
          </div>

          <!-- Code Sample Guide -->
          <div class="panel-card" style="padding: 16px 20px;">
            <div style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: var(--muted-foreground); letter-spacing: 0.04em;">Sample Reference</div>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--muted-foreground); margin-top: 8px; line-height: 1.4;">
              <div>
                <strong style="color: var(--foreground);">v1-initial:</strong> Baseline vulnerabilities (SQLi, secrets, path, XSS). Fails check run.
              </div>
              <div>
                <strong style="color: var(--foreground);">v2-bypassed:</strong> Evasion tricks. Comments out vulnerable call and adds suppressions.
              </div>
              <div>
                <strong style="color: var(--foreground);">v3-fixed:</strong> Defensive programming. Parameterized queries and env vars (100/100).
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Realistic GitHub Output Box -->
        <div class="sim-output">
          ${result ? `
            <div class="github-pr-box">
              <div class="github-header">
                <div>
                  <div class="github-title">
                    Pull Request #14: ${result.submission.commitMessage}
                  </div>
                  <div class="cell-secondary mono" style="margin-top: 2px;">
                    merge into <code>main</code> from <code>feature/auth-${result.submission.commitSha}</code>
                  </div>
                </div>
                <button class="btn btn-outline btn-sm" id="btn-goto-gradebook">
                  View in Gradebook
                </button>
              </div>

              <!-- GitHub Status Check Run -->
              <div class="github-check-run ${result.checkRun.conclusion === 'success' ? 'pass' : 'fail'}">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span class="badge ${result.checkRun.conclusion === 'success' ? 'badge-pass' : 'badge-fail'}">
                    ${result.checkRun.conclusion === 'success' ? 'Passed' : 'Failed'}
                  </span>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">
                      ${result.checkRun.title}
                    </div>
                    <div class="cell-secondary">
                      ${result.checkRun.summary}
                    </div>
                  </div>
                </div>
                <div class="sha">
                  commit ${result.submission.commitSha}
                </div>
              </div>

              <!-- Ariadne Bot PR Comment -->
              <div class="github-comment">
                <div class="comment-author-bar">
                  <div class="brand-mark" style="width: 18px; height: 18px; border-radius: 4px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <strong style="color: var(--foreground);">ariadne-security-bot</strong>
                  <span class="badge badge-info" style="font-size: 11px; height: 18px; padding: 0 6px;">bot</span>
                  <span class="cell-secondary">commented just now</span>
                </div>
                <div class="comment-body">
                  ${renderMarkdownToHtml(result.prCommentMarkdown)}
                </div>
              </div>
            </div>
          ` : `
            <div class="github-pr-box" style="padding: 64px 24px; text-align: center; color: var(--muted-foreground);">
              <h3 style="font-size: 15px; color: var(--foreground); font-weight: 600;">Gatekeeper Standby</h3>
              <p style="font-size: 13px; max-width: 440px; margin: 6px auto 16px; line-height: 1.5;">
                Select a code sample on the left and click <strong>"Simulate Push & Run Gatekeeper"</strong> to trigger real SAST scanning and inspect the check run outcome.
              </p>
              <button class="btn btn-outline btn-sm" id="btn-quick-run-v1">
                Run Sample v1-initial
              </button>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderMarkdownToHtml(markdown: string): string {
  let content = markdown;

  // 1. Format code blocks (syntax diffs)
  content = content.replace(/```(?:java|diff)?\n([\s\S]*?)```/g, (_match, code) => {
    const lines = code.trim().split('\n');
    const formattedLines = lines.map((line: string) => {
      if (line.trim().startsWith('-')) {
        return `<span class="diff-del">${escapeHtml(line)}</span>`;
      }
      if (line.trim().startsWith('+')) {
        return `<span class="diff-add">${escapeHtml(line)}</span>`;
      }
      return escapeHtml(line);
    }).join('\n');
    return `<pre class="code-diff"><code>${formattedLines}</code></pre>`;
  });

  // 2. Format tables
  const lines = content.split('\n');
  const processedLines: string[] = [];
  let inTable = false;
  let tableHeaderParsed = false;
  let tableRows: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (line.includes('---')) {
        tableHeaderParsed = true;
        continue;
      }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (!tableHeaderParsed) {
        const ths = cells.map(c => `<th style="padding: 8px 12px; background: var(--muted); border: 1px solid var(--border); text-align: left; font-size: 12px; color: var(--muted-foreground);">${c}</th>`).join('');
        tableRows.push(`<thead><tr>${ths}</tr></thead><tbody>`);
        inTable = true;
      } else {
        const tds = cells.map(c => `<td style="padding: 8px 12px; border: 1px solid var(--border); font-size: 13px;">${c}</td>`).join('');
        tableRows.push(`<tr>${tds}</tr>`);
      }
    } else {
      if (inTable) {
        tableRows.push('</tbody></table>');
        processedLines.push(`<table class="data-table" style="margin: 12px 0; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden;">${tableRows.join('')}`);
        tableRows = [];
        inTable = false;
        tableHeaderParsed = false;
      }
      processedLines.push(line);
    }
  }

  if (inTable) {
    tableRows.push('</tbody></table>');
    processedLines.push(`<div style="overflow-x: auto; margin: 14px 0; border: 1px solid var(--border); border-radius: var(--radius-md);"><table class="data-table" style="width: 100%; border-collapse: collapse;">${tableRows.join('')}</table></div>`);
  }

  content = processedLines.join('\n');

  // Clean any stray emojis
  content = content.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // 3. Format Headings
  content = content
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 16px; font-weight: 600; margin: 14px 0 8px; padding-bottom: 6px; border-bottom: 1px solid var(--border); color: var(--foreground);">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 14px; font-weight: 600; margin: 16px 0 8px; color: var(--foreground);">$1</h3>');

  // 4. Format Blockquotes (Integrity Warning Box vs General Quotes)
  content = content.replace(/(?:^> (?:.*)\n?)+/gm, (block) => {
    const inner = block.split('\n').filter(l => l.startsWith('> ')).map(l => l.replace(/^> /, '')).join('<br/>');
    const isIntegrity = inner.toLowerCase().includes('academic integrity') || inner.toLowerCase().includes('evasion') || inner.toLowerCase().includes('flagged');
    const bg = isIntegrity ? 'var(--amber-soft)' : 'var(--red-soft)';
    const border = isIntegrity ? 'var(--amber)' : 'var(--red)';
    const color = isIntegrity ? 'var(--amber-foreground)' : 'var(--red-hover)';
    return `<div style="background: ${bg}; border-left: 3px solid ${border}; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; padding: 12px 14px; margin: 12px 0; color: ${color}; font-size: 13px; line-height: 1.5;">${inner}</div>`;
  });

  // 5. Format Policy Alert list items (only policy violation items get red alert boxes)
  content = content.replace(/^- \*\*((?:Failing|Block|Zero|Policy).*?)\*\*/gim, '<div style="background: var(--red-soft); border: 1px solid var(--red-border); border-radius: var(--radius-sm); padding: 8px 12px; margin-bottom: 6px; color: var(--red-hover); font-size: 13px; font-weight: 500;">$1</div>');
  content = content.replace(/^- ⛔ \*\*(.*?)\*\*/gim, '<div style="background: var(--red-soft); border: 1px solid var(--red-border); border-radius: var(--radius-sm); padding: 8px 12px; margin-bottom: 6px; color: var(--red-hover); font-size: 13px; font-weight: 500;">$1</div>');

  // 6. Inline elements
  content = content
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: var(--foreground); font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="mono" style="background: var(--muted); color: var(--foreground); padding: 2px 5px; border-radius: 3px; font-size: 12px; border: 1px solid var(--border);">$1</code>');

  // 7. Bullet lists
  content = content.replace(/^- (.*$)/gim, '<li style="margin-bottom: 6px;">$1</li>');
  content = content.replace(/(<li.*<\/li>\n?)+/gs, '<ul style="margin: 8px 0 12px 20px; font-size: 13px; line-height: 1.55; color: var(--muted-foreground);">$&</ul>');

  return content;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function attachBotSimulatorEvents(container: HTMLElement): void {
  const runBtn = container.querySelector('#btn-run-simulation');
  const quickV1Btn = container.querySelector('#btn-quick-run-v1');
  const gotoGbBtn = container.querySelector('#btn-goto-gradebook');
  const sampleSelect = container.querySelector('#sim-sample-key') as HTMLSelectElement;
  const explainer = container.querySelector('#sample-explainer') as HTMLElement;

  sampleSelect?.addEventListener('change', () => {
    const val = sampleSelect.value;
    if (explainer) {
      if (val === 'v1-initial') {
        explainer.innerHTML = `<strong>v1-initial:</strong> Contains 4 vulnerabilities. Expected: Blocked by Zero Critical policy (Score: 15/100).`;
        explainer.style.borderLeftColor = 'var(--red)';
      } else if (val === 'v2-bypassed') {
        explainer.innerHTML = `<strong>v2-bypassed:</strong> Evasion attempt. Expected: Blocked with Academic Integrity alert (Score: 30/100).`;
        explainer.style.borderLeftColor = 'var(--amber)';
      } else {
        explainer.innerHTML = `<strong>v3-fixed:</strong> Remediated queries and secrets. Expected: All guardrails passed (Score: 100/100).`;
        explainer.style.borderLeftColor = 'var(--emerald)';
      }
    }
  });

  const packSelect = container.querySelector('#sim-pack-id') as HTMLSelectElement;

  packSelect?.addEventListener('change', () => {
    const pId = packSelect.value;
    const p = appState.getState().guardrailPacks.find((item: any) => item.id === pId);
    if (p) {
      const zeroCritEl = container.querySelector('#sim-zero-crit');
      const blockMergeEl = container.querySelector('#sim-block-merge');
      if (zeroCritEl) {
        zeroCritEl.textContent = p.policies?.zeroCritical ? 'On' : 'Off';
      }
      if (blockMergeEl) {
        blockMergeEl.textContent = p.policies?.blockMergeOnHigh ? 'On' : 'Off';
      }
    }
  });

  const executeSim = () => {
    const studentSelect = container.querySelector('#sim-student-id') as HTMLSelectElement;
    const commitInput = container.querySelector('#sim-commit-msg') as HTMLInputElement;

    const studentId = studentSelect?.value || 'stu-1';
    const sampleKey = (sampleSelect?.value || 'v1-initial') as any;
    const commitMessage = commitInput?.value || 'Simulated commit';
    const assignmentId = appState.getState().selectedAssignmentId || 'asg-midterm';
    const guardrailPackId = packSelect?.value || 'pack-3rd-year';

    appState.runBotSimulation({
      studentId,
      assignmentId,
      guardrailPackId,
      sampleKey,
      commitMessage
    });
  };

  runBtn?.addEventListener('click', executeSim);
  quickV1Btn?.addEventListener('click', executeSim);

  gotoGbBtn?.addEventListener('click', () => {
    appState.setTab('gradebook');
  });
}
