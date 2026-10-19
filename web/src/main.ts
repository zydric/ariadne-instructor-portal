import { appState, type AppState } from './state.ts';
import { initTheme } from './theme.ts';
import { renderNavbar, attachNavbarEvents } from './components/Navbar.ts';

// Initialize light/dark theme preference before first paint
initTheme();
import { renderGradebookView, attachGradebookEvents } from './views/GradebookView.ts';
import { renderHeatmapView, attachHeatmapEvents } from './views/HeatmapView.ts';
import { renderGuardrailsView, attachGuardrailsEvents } from './views/GuardrailsView.ts';
import { renderBotSimulatorView, attachBotSimulatorEvents } from './views/BotSimulatorView.ts';
import { renderStudentJoinView, attachStudentJoinEvents } from './views/StudentJoinView.ts';
import { renderDrilldownModal, attachDrilldownEvents } from './modals/DrilldownModal.ts';
import { renderCopilotModal, attachCopilotEvents } from './modals/CopilotModal.ts';

function renderApp(state: AppState): void {
  const appContainer = document.getElementById('app');
  const modalContainer = document.getElementById('modal-root');
  if (!appContainer || !modalContainer) return;

  if (state.isLoading && !state.gradebookData) {
    appContainer.innerHTML = `
      <div class="initial-loader">
        <div class="spinner"></div>
        <p style="font-weight: 500; font-size: 0.95rem; color: #CBD5E1;">
          Initializing Ariadne Instructor Security Portal...
        </p>
      </div>
    `;
    return;
  }

  // 1. Render Navbar
  const navbarHtml = renderNavbar(state);

  // 2. Render Main Active View
  let viewHtml = '';
  switch (state.activeTab) {
    case 'gradebook':
      viewHtml = renderGradebookView(state);
      break;
    case 'heatmap':
      viewHtml = renderHeatmapView(state);
      break;
    case 'guardrails':
      viewHtml = renderGuardrailsView(state);
      break;
    case 'bot':
      viewHtml = renderBotSimulatorView(state);
      break;
    case 'join':
      viewHtml = renderStudentJoinView(state);
      break;
  }

  appContainer.innerHTML = `
    ${navbarHtml}
    <main class="main-content">
      ${viewHtml}
    </main>
  `;

  // Attach view events
  attachNavbarEvents(appContainer);

  switch (state.activeTab) {
    case 'gradebook':
      attachGradebookEvents(appContainer);
      break;
    case 'heatmap':
      attachHeatmapEvents(appContainer);
      break;
    case 'guardrails':
      attachGuardrailsEvents(appContainer);
      break;
    case 'bot':
      attachBotSimulatorEvents(appContainer);
      break;
    case 'join':
      attachStudentJoinEvents(appContainer);
      break;
  }

  // 3. Render Modals
  if (state.selectedStudentDrilldown) {
    modalContainer.innerHTML = renderDrilldownModal(state.selectedStudentDrilldown);
    attachDrilldownEvents(modalContainer);
  } else if (state.copilotModalData) {
    modalContainer.innerHTML = renderCopilotModal(state.copilotModalData);
    attachCopilotEvents(modalContainer);
  } else {
    modalContainer.innerHTML = '';
  }
}

// Subscribe to state changes and start
appState.subscribe(renderApp);
appState.init();
