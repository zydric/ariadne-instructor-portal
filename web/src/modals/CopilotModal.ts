import { appState } from '../state.ts';

export function renderCopilotModal(notes: any): string {
  if (!notes) return '';

  const quizHtml = notes.quiz.map((q: any, qIdx: number) => {
    const optionsHtml = q.options.map((opt: string, oIdx: number) => `
      <div 
        class="quiz-option" 
        data-q-idx="${qIdx}" 
        data-o-idx="${oIdx}"
        data-is-correct="${oIdx === q.correctIndex}"
      >
        <span class="mono">${String.fromCharCode(65 + oIdx)}.</span> <span>${opt}</span>
      </div>
    `).join('');

    return `
      <div class="list-row" style="padding: 12px 0;">
        <div class="list-row-title" style="margin-bottom: 8px;">${qIdx + 1}. ${q.question}</div>
        <div class="quiz-options-group" style="display: flex; flex-direction: column; gap: 6px;">
          ${optionsHtml}
        </div>
        <div class="quiz-feedback" style="display: none; margin-top: 8px; font-size: 13px; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
          <strong>Instructor Key:</strong> ${q.explanation}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="modal-overlay" id="copilot-modal-overlay">
      <div class="modal-card" style="max-width: 820px;" role="dialog" aria-labelledby="copilot-title">
        <div class="modal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 class="modal-title" id="copilot-title">Lecture Co-Pilot: ${notes.categoryTitle}</h2>
              <span class="badge badge-outline">${notes.cwe}</span>
            </div>
            <p class="modal-description">
              ${notes.sectionName} • Automated pedagogical talking points and reference fixes.
            </p>
          </div>
          <button class="close-btn" id="copilot-close-btn" aria-label="Close dialog">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Summary Banner -->
          <div style="background: var(--muted); border-left: 3px solid var(--primary); padding: 12px 16px; margin-bottom: 20px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
            <div style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: var(--muted-foreground); letter-spacing: 0.04em;">Observed Pattern</div>
            <div style="font-size: 14px; font-weight: 500; margin-top: 4px; line-height: 1.5;">
              ${notes.summary}
            </div>
          </div>

          <!-- Talking Points -->
          <div class="section">
            <div class="section-title">
              <span>Lecture Talking Points</span>
              <span class="count">3 points</span>
            </div>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px;">
              ${notes.talkingPoints.map((pt: string, idx: number) => `
                <li style="display: flex; gap: 10px; font-size: 13px; line-height: 1.5; padding: 10px 12px; background: var(--muted); border-radius: var(--radius-sm);">
                  <span class="mono" style="font-weight: 600; color: var(--muted-foreground);">0${idx + 1}.</span>
                  <span>${pt}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Code Pattern Comparison -->
          <div class="section">
            <div class="section-title">
              <span>Reference Implementation Diff</span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px;">
              <!-- Insecure -->
              <div style="border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">
                <div style="padding: 8px 12px; font-size: 12px; font-weight: 600; background: var(--red-soft); color: var(--red-hover); border-bottom: 1px solid var(--red-border);">
                  Insecure: ${notes.codeComparison.insecure.title}
                </div>
                <div style="padding: 12px;">
                  <pre class="code-diff" style="margin: 0; background: transparent; border: none; padding: 0;">${notes.codeComparison.insecure.code}</pre>
                  <p class="cell-secondary" style="margin-top: 8px; color: var(--red-hover);">
                    ${notes.codeComparison.insecure.critique}
                  </p>
                </div>
              </div>

              <!-- Secure -->
              <div style="border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">
                <div style="padding: 8px 12px; font-size: 12px; font-weight: 600; background: var(--muted); color: var(--foreground); border-bottom: 1px solid var(--border);">
                  Remediated: ${notes.codeComparison.secure.title}
                </div>
                <div style="padding: 12px;">
                  <pre class="code-diff" style="margin: 0; background: transparent; border: none; padding: 0;">${notes.codeComparison.secure.code}</pre>
                  <p class="cell-secondary" style="margin-top: 8px;">
                    ${notes.codeComparison.secure.explanation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Formative Assessment Quiz -->
          <div class="section">
            <div class="section-title">
              <span>Formative Assessment Questions</span>
              <span class="count">${notes.quiz.length} items</span>
            </div>
            ${quizHtml}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" id="copilot-copy-btn">
            Copy Markdown
          </button>
          <button class="btn btn-primary btn-sm" id="copilot-close-footer">Done</button>
        </div>
      </div>
    </div>
  `;
}

export function attachCopilotEvents(container: HTMLElement): void {
  const closeBtn = container.querySelector('#copilot-close-btn');
  const closeFooter = container.querySelector('#copilot-close-footer');
  const overlay = container.querySelector('#copilot-modal-overlay');
  const copyBtn = container.querySelector('#copilot-copy-btn');

  const close = () => {
    window.removeEventListener('keydown', handleKey);
    if (overlay) {
      overlay.classList.add('is-closing');
      setTimeout(() => appState.closeCopilotModal(), 140);
    } else {
      appState.closeCopilotModal();
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

  // Quiz option clicking
  container.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const isCorrect = target.getAttribute('data-is-correct') === 'true';
      const row = target.closest('.list-row');
      if (!row) return;

      row.querySelectorAll('.quiz-option').forEach(o => {
        (o as HTMLElement).style.background = '';
        (o as HTMLElement).style.borderColor = '';
        (o as HTMLElement).style.color = '';
      });

      if (isCorrect) {
        target.style.background = 'var(--muted)';
        target.style.borderColor = 'var(--foreground)';
        target.style.fontWeight = '600';
      } else {
        target.style.background = 'var(--red-soft)';
        target.style.borderColor = 'var(--red-border)';
        target.style.color = 'var(--red-hover)';
      }

      const feedback = row.querySelector('.quiz-feedback') as HTMLElement;
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = isCorrect ? 'var(--muted)' : 'var(--red-soft)';
        feedback.style.color = isCorrect ? 'var(--foreground)' : 'var(--red-hover)';
        feedback.style.borderColor = isCorrect ? 'var(--border)' : 'var(--red-border)';
      }
    });
  });

  // Copy to clipboard
  copyBtn?.addEventListener('click', () => {
    const data = appState.getState().copilotModalData;
    if (!data) return;

    let md = `# Ariadne Lecture Co-Pilot: ${data.categoryTitle} (${data.cwe})\n\n`;
    md += `**Cohort:** ${data.sectionName} | **Summary:** ${data.summary}\n\n`;
    md += `## Key Talking Points\n`;
    data.talkingPoints.forEach((p: string, i: number) => {
      md += `${i + 1}. ${p}\n`;
    });
    md += `\n## Reference Pattern\n\n`;
    md += `### Insecure:\n\`\`\`java\n${data.codeComparison.insecure.code}\n\`\`\`\n\n`;
    md += `### Remediated:\n\`\`\`java\n${data.codeComparison.secure.code}\n\`\`\`\n\n`;
    md += `## Check-for-Understanding\n\n`;
    data.quiz.forEach((q: any, i: number) => {
      md += `**Q${i + 1}: ${q.question}**\n`;
      q.options.forEach((o: string, oi: number) => {
        md += `- [${oi === q.correctIndex ? 'x' : ' '}] ${o}\n`;
      });
      md += `*Key:* ${q.explanation}\n\n`;
    });

    navigator.clipboard.writeText(md).then(() => {
      appState.showToast('Lecture notes copied to clipboard', 'info');
    }).catch(() => {
      appState.showToast('Failed to copy to clipboard', 'error');
    });
  });
}
