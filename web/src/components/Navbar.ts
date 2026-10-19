import { appState, type AppState, type TabKey } from '../state.ts';
import { toggleTheme, togglePalette, getCurrentPalette } from '../theme.ts';

export function renderNavbar(state: AppState): string {
  const currentCourse = state.courses.find((c: any) => c.id === state.selectedCourseId) || state.courses[0];
  const assignments = state.assignments;
  const sections = state.sections;

  const assignmentOptions = assignments.map((a: any) => `
    <option value="${a.id}" ${a.id === state.selectedAssignmentId ? 'selected' : ''}>
      ${a.title}
    </option>
  `).join('');

  const sectionOptions = [
    `<option value="" ${state.selectedSectionId === '' ? 'selected' : ''}>All Sections</option>`,
    ...sections.map((s: any) => `
      <option value="${s.id}" ${s.id === state.selectedSectionId ? 'selected' : ''}>
        ${s.name}
      </option>
    `)
  ].join('');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'gradebook', label: 'Gradebook' },
    { key: 'heatmap', label: 'Cohort Heatmap' },
    { key: 'guardrails', label: 'Course Guardrails' },
    { key: 'bot', label: 'Bot Gatekeeper' },
    { key: 'join', label: 'Student Join' }
  ];

  const tabItemsHtml = tabs.map(t => `
    <button class="nav-tab ${state.activeTab === t.key ? 'active' : ''}" data-tab="${t.key}">
      ${t.label}
    </button>
  `).join('');

  return `
    <header class="app-header">
      <div class="header-inner">
        <div class="header-top">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span class="brand-name">Ariadne</span>
            <span class="brand-divider"></span>
            <span class="brand-course">
              ${currentCourse ? `<strong>${currentCourse.code}</strong> — ${currentCourse.title}` : 'Security Curriculum Suite'}
            </span>
          </div>

          <div class="header-actions">
            <span class="header-term">${currentCourse?.term || 'CIT-U Pilot'}</span>
            <button class="btn btn-outline btn-sm btn-palette-toggle" id="btn-palette-toggle" aria-label="Toggle Color Palette" title="Toggle between Semantic (Emerald/Amber/Blue) and Strict (Monochrome/Red) palettes">
              <span class="palette-indicator" aria-hidden="true"></span>
              <span class="palette-btn-text"><span class="palette-label-prefix">Palette: </span><strong id="palette-label">${getCurrentPalette() === 'strict' ? 'Strict' : 'Semantic'}</strong></span>
            </button>
            <button class="btn btn-outline btn-sm btn-icon" id="btn-theme-toggle" aria-label="Toggle theme" title="Toggle theme (Light / Dark)">
              <svg class="icon theme-icon-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="4" r="1"/><circle cx="12" cy="20" r="1"/><circle cx="20" cy="12" r="1"/><circle cx="4" cy="12" r="1"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
              <svg class="icon theme-icon-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            </button>
            <button class="btn btn-outline btn-sm" id="btn-reset-demo" title="Reset all submissions, scores, and guardrails to initial seed">
              Reset Demo
            </button>
          </div>
        </div>

        <nav class="nav-tabs" aria-label="Course Navigation">
          ${tabItemsHtml}
        </nav>
      </div>
    </header>

    <div class="toolbar">
      <div class="toolbar-inner">
        <div class="filter-group">
          <label class="filter-label" for="select-assignment">Assignment</label>
          <select id="select-assignment" class="select-control select-sm">
            ${assignmentOptions}
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="select-section">Section</label>
          <select id="select-section" class="select-control select-sm">
            ${sectionOptions}
          </select>
        </div>
      </div>
    </div>
  `;
}

export function attachNavbarEvents(container: HTMLElement): void {
  // Tab navigation
  container.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const key = (e.currentTarget as HTMLElement).getAttribute('data-tab') as TabKey;
      if (key) appState.setTab(key);
    });
  });

  // Assignment selector
  const asgSelect = container.querySelector('#select-assignment') as HTMLSelectElement;
  asgSelect?.addEventListener('change', () => {
    appState.setAssignment(asgSelect.value);
  });

  // Section selector
  const secSelect = container.querySelector('#select-section') as HTMLSelectElement;
  secSelect?.addEventListener('change', () => {
    appState.setSection(secSelect.value);
  });

  // Palette toggle button
  const paletteToggleBtn = container.querySelector('#btn-palette-toggle');
  paletteToggleBtn?.addEventListener('click', () => {
    const next = togglePalette();
    const label = container.querySelector('#palette-label');
    if (label) {
      label.textContent = next === 'strict' ? 'Strict' : 'Semantic';
    }
    appState.showToast(
      next === 'strict'
        ? 'Switched to Strict Palette (Monochrome & Red)'
        : 'Switched to Semantic Palette (Emerald, Amber, Blue)',
      'info'
    );
  });

  // Theme toggle button
  const themeToggleBtn = container.querySelector('#btn-theme-toggle');
  themeToggleBtn?.addEventListener('click', () => {
    const next = toggleTheme();
    appState.showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} theme`, 'info');
  });

  // Reset Demo button
  const resetBtn = container.querySelector('#btn-reset-demo');
  resetBtn?.addEventListener('click', () => {
    if (confirm('Reset database to pristine CIT-U pilot demo state?')) {
      appState.resetDemoData();
    }
  });
}
