import { appState, type AppState } from '../state.ts';

export function renderStudentJoinView(state: AppState): string {
  const sections = state.sections;

  const joinCodesHtml = sections.map((s: any) => `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--background);">
      <div>
        <div style="font-weight: 600; font-size: 13px; color: var(--foreground);">${s.name}</div>
        <div class="cell-secondary">${s.id} • CIT-University</div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <code class="mono" style="font-size: 12px; font-weight: 600; padding: 4px 8px; background: var(--blue-soft); border: 1px solid var(--blue-border); color: var(--blue-foreground); border-radius: var(--radius-sm); letter-spacing: 0.04em;">
          ${s.joinCode}
        </code>
        <button class="btn btn-outline btn-sm btn-icon btn-copy-code" data-code="${s.joinCode}" title="Copy join code ${s.joinCode}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  return `
    <div class="student-join-container" style="max-width: 980px; margin: 0 auto;">
      <!-- Overview Banner -->
      <div class="panel-card" style="margin-bottom: 24px;">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Student Enrollment & Repository Registration</h2>
            <p class="panel-subtitle">
              Students enter their section Join Code to bind their GitHub account and repository to the automated academic integrity gatekeeper.
            </p>
          </div>
          <span class="badge badge-info">${sections.length} Active Sections</span>
        </div>
      </div>

      <div class="student-join-grid" style="display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start;">
        <!-- Registration Form -->
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">Enroll Student</h3>
              <p class="panel-subtitle">Register student metadata and bind remote Git repository</p>
            </div>
          </div>
          <div class="panel-body">
            <form id="student-join-form" style="display: flex; flex-direction: column; gap: 16px;">
              <div class="form-group">
                <label class="form-label" for="join-code">Course Section Join Code <span style="color: var(--red);">*</span></label>
                <input 
                  type="text" 
                  id="join-code" 
                  class="form-input mono" 
                  placeholder="e.g. CITU-3A-SEC" 
                  required 
                  style="text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;" 
                />
                <span class="cell-secondary">Click any active code on the right to pre-populate.</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="student-name">Full Name <span style="color: var(--red);">*</span></label>
                <input 
                  type="text" 
                  id="student-name" 
                  class="form-input" 
                  placeholder="e.g. Maria Teresa Santos" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="student-no">Student ID Number <span style="color: var(--red);">*</span></label>
                <input 
                  type="text" 
                  id="student-no" 
                  class="form-input mono" 
                  placeholder="e.g. 22-1088-301" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="github-user">GitHub Username <span style="color: var(--red);">*</span></label>
                <input 
                  type="text" 
                  id="github-user" 
                  class="form-input mono" 
                  placeholder="e.g. mtsantos-dev" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="repo-url">Classroom Repository URL</label>
                <input 
                  type="url" 
                  id="repo-url" 
                  class="form-input mono" 
                  placeholder="https://github.com/citu-csit321/dormfinder-mtsantos" 
                />
                <span class="cell-secondary">Public or classroom-accessible GitHub repository URL.</span>
              </div>

              <button type="submit" class="btn btn-primary" style="height: 38px; width: 100%; margin-top: 8px;">
                Complete Enrollment & Bind Repository
              </button>
            </form>
          </div>
        </div>

        <!-- Section Join Codes Reference -->
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">Active Join Codes</h3>
              <p class="panel-subtitle">Syllabus codes for section enrollment</p>
            </div>
          </div>
          <div class="panel-body" style="display: flex; flex-direction: column; gap: 10px;">
            ${joinCodesHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachStudentJoinEvents(container: HTMLElement): void {
  const form = container.querySelector('#student-join-form') as HTMLFormElement;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const joinCode = (container.querySelector('#join-code') as HTMLInputElement).value.trim();
    const name = (container.querySelector('#student-name') as HTMLInputElement).value.trim();
    const studentNo = (container.querySelector('#student-no') as HTMLInputElement).value.trim();
    const githubUser = (container.querySelector('#github-user') as HTMLInputElement).value.trim();
    const repoUrl = (container.querySelector('#repo-url') as HTMLInputElement).value.trim();

    const ok = await appState.joinClass({
      joinCode,
      name,
      studentNo,
      githubUser,
      repoUrl
    });

    if (ok) {
      form.reset();
      appState.setTab('gradebook');
    }
  });

  // Copy code buttons
  container.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = (e.currentTarget as HTMLElement).getAttribute('data-code');
      if (code) {
        navigator.clipboard.writeText(code);
        appState.showToast(`Join code ${code} copied to clipboard`, 'success');
        const input = container.querySelector('#join-code') as HTMLInputElement;
        if (input) {
          input.value = code;
          input.focus();
        }
      }
    });
  });
}
