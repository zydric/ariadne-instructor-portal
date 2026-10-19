import { clientStore } from './clientStore.ts';

export type TabKey = 'gradebook' | 'heatmap' | 'guardrails' | 'bot' | 'join';

export interface AppState {
  activeTab: TabKey;
  courses: any[];
  sections: any[];
  assignments: any[];
  guardrailPacks: any[];
  selectedCourseId: string;
  selectedSectionId: string; // '' means all
  selectedAssignmentId: string;
  gradebookData: any | null;
  heatmapData: any | null;
  isLoading: boolean;
  selectedStudentDrilldown: any | null;
  copilotModalData: any | null;
  botSimulationResult: any | null;
  isSimulatingBot: boolean;
  isStandaloneDemo: boolean;
}

type Listener = (state: AppState) => void;

class StateManager {
  private state: AppState = {
    activeTab: 'gradebook',
    courses: [],
    sections: [],
    assignments: [],
    guardrailPacks: [],
    selectedCourseId: '',
    selectedSectionId: '',
    selectedAssignmentId: '',
    gradebookData: null,
    heatmapData: null,
    isLoading: true,
    selectedStudentDrilldown: null,
    copilotModalData: null,
    botSimulationResult: null,
    isSimulatingBot: false,
    isStandaloneDemo: false
  };

  private listeners: Set<Listener> = new Set();
  private isStaticMode = false;

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): AppState {
    return this.state;
  }

  private setState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public async init(): Promise<void> {
    try {
      this.setState({ isLoading: true });
      let courses: any[] = [];
      let sections: any[] = [];
      let assignments: any[] = [];
      let guardrails: any[] = [];

      // Detect static hosting (e.g. GitHub Pages) immediately to avoid doomed 404 network requests
      const isStaticHost =
        typeof window !== "undefined" &&
        (window.location.hostname.endsWith("github.io") ||
         window.location.hostname.endsWith("pages.dev") ||
         window.location.protocol === "file:" ||
         window.location.search.includes("demo=true"));

      if (isStaticHost) {
        this.isStaticMode = true;
      }

      // Check if backend API server is reachable
      if (!this.isStaticMode) {
        try {
          const probe = await fetch('/api/courses');
          if (probe.ok) {
            courses = await probe.json();
            [sections, assignments, guardrails] = await Promise.all([
              fetch('/api/sections').then(r => r.json()),
              fetch('/api/assignments').then(r => r.json()),
              fetch('/api/guardrails').then(r => r.json())
            ]);
          } else {
            this.isStaticMode = true;
          }
        } catch {
          this.isStaticMode = true;
        }
      }

      // If on static hosting (like GitHub Pages) or offline, use client-side demo store
      if (this.isStaticMode) {
        courses = clientStore.getCourses();
        sections = clientStore.getSections();
        assignments = clientStore.getAssignments();
        guardrails = clientStore.getGuardrailPacks();
      }

      const selectedCourseId = this.state.selectedCourseId || courses[0]?.id || '';
      const selectedAssignmentId = this.state.selectedAssignmentId || assignments.find((a: any) => a.id === 'asg-midterm')?.id || assignments[0]?.id || '';

      this.setState({
        courses,
        sections,
        assignments,
        guardrailPacks: guardrails,
        selectedCourseId,
        selectedAssignmentId,
        isStandaloneDemo: this.isStaticMode
      });

      await this.refreshCurrentView();
    } catch (err) {
      this.showToast(`Failed to load portal: ${(err as Error).message}`, 'error');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  public async refreshCurrentView(): Promise<void> {
    const { activeTab, selectedAssignmentId, selectedSectionId } = this.state;
    if (!selectedAssignmentId) return;

    if (activeTab === 'gradebook') {
      if (this.isStaticMode) {
        const data = clientStore.getGradebookData(selectedAssignmentId, selectedSectionId || undefined);
        this.setState({ gradebookData: data });
      } else {
        try {
          const url = `/api/assignments/${selectedAssignmentId}/gradebook${selectedSectionId ? `?sectionId=${selectedSectionId}` : ''}`;
          const data = await fetch(url).then(r => r.json());
          this.setState({ gradebookData: data });
        } catch {
          this.isStaticMode = true;
          const data = clientStore.getGradebookData(selectedAssignmentId, selectedSectionId || undefined);
          this.setState({ gradebookData: data });
        }
      }
    } else if (activeTab === 'heatmap') {
      if (this.isStaticMode) {
        const data = clientStore.getHeatmapData(selectedAssignmentId, selectedSectionId || undefined);
        this.setState({ heatmapData: data });
      } else {
        try {
          const url = `/api/assignments/${selectedAssignmentId}/heatmap${selectedSectionId ? `?sectionId=${selectedSectionId}` : ''}`;
          const data = await fetch(url).then(r => r.json());
          this.setState({ heatmapData: data });
        } catch {
          this.isStaticMode = true;
          const data = clientStore.getHeatmapData(selectedAssignmentId, selectedSectionId || undefined);
          this.setState({ heatmapData: data });
        }
      }
    } else if (activeTab === 'guardrails') {
      if (this.isStaticMode) {
        this.setState({ guardrailPacks: clientStore.getGuardrailPacks() });
      } else {
        try {
          const guardrails = await fetch('/api/guardrails').then(r => r.json());
          this.setState({ guardrailPacks: guardrails });
        } catch {
          this.isStaticMode = true;
          this.setState({ guardrailPacks: clientStore.getGuardrailPacks() });
        }
      }
    }
  }

  public async setTab(tab: TabKey): Promise<void> {
    this.setState({ activeTab: tab });
    await this.refreshCurrentView();
  }

  public async setSection(sectionId: string): Promise<void> {
    this.setState({ selectedSectionId: sectionId });
    await this.refreshCurrentView();
  }

  public async setAssignment(assignmentId: string): Promise<void> {
    this.setState({ selectedAssignmentId: assignmentId });
    await this.refreshCurrentView();
  }

  public async openStudentDrilldown(studentId: string): Promise<void> {
    try {
      if (this.isStaticMode) {
        const data = clientStore.getStudentTimeline(studentId, this.state.selectedAssignmentId);
        this.setState({ selectedStudentDrilldown: data });
      } else {
        try {
          const url = `/api/students/${studentId}/timeline?assignmentId=${this.state.selectedAssignmentId}`;
          const data = await fetch(url).then(r => r.json());
          this.setState({ selectedStudentDrilldown: data });
        } catch {
          const data = clientStore.getStudentTimeline(studentId, this.state.selectedAssignmentId);
          this.setState({ selectedStudentDrilldown: data });
        }
      }
    } catch (err) {
      this.showToast(`Failed to load student drilldown: ${(err as Error).message}`, 'error');
    }
  }

  public closeStudentDrilldown(): void {
    this.setState({ selectedStudentDrilldown: null });
  }

  public async openCopilotModal(cwe: string, sectionId?: string, affectedCount?: number, totalCohort?: number): Promise<void> {
    try {
      if (this.isStaticMode) {
        const data = clientStore.getCopilotNotes(this.state.selectedAssignmentId, cwe);
        this.setState({ copilotModalData: data });
      } else {
        try {
          const res = await fetch(`/api/assignments/${this.state.selectedAssignmentId}/copilot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cwe, sectionId, affectedCount, totalCohort })
          });
          const data = await res.json();
          this.setState({ copilotModalData: data });
        } catch {
          const data = clientStore.getCopilotNotes(this.state.selectedAssignmentId, cwe);
          this.setState({ copilotModalData: data });
        }
      }
    } catch (err) {
      this.showToast(`Failed to generate Lecture Co-Pilot: ${(err as Error).message}`, 'error');
    }
  }

  public closeCopilotModal(): void {
    this.setState({ copilotModalData: null });
  }

  public async updateGuardrailPack(packId: string, updates: any): Promise<void> {
    try {
      if (this.isStaticMode) {
        clientStore.updateGuardrailPack(packId, updates);
        this.showToast('Guardrail pack updated. Re-evaluating gradebook...', 'success');
        await this.init();
      } else {
        try {
          const res = await fetch(`/api/guardrails/${packId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          if (!res.ok) throw new Error('Failed to update guardrail pack.');
          this.showToast('Guardrail pack updated. Re-evaluating gradebook...', 'success');
          await this.init();
        } catch {
          clientStore.updateGuardrailPack(packId, updates);
          this.showToast('Guardrail pack updated. Re-evaluating gradebook...', 'success');
          await this.init();
        }
      }
    } catch (err) {
      this.showToast((err as Error).message, 'error');
    }
  }

  public async assignGuardrailToAssignment(assignmentId: string, packId: string): Promise<void> {
    try {
      if (this.isStaticMode) {
        clientStore.assignGuardrailPack(assignmentId, packId);
        this.showToast('Course guardrail pack assigned to assignment!', 'success');
        await this.init();
      } else {
        try {
          const res = await fetch(`/api/assignments/${assignmentId}/guardrail`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guardrailPackId: packId })
          });
          if (!res.ok) throw new Error('Failed to assign guardrail pack.');
          this.showToast('Course guardrail pack assigned to assignment!', 'success');
          await this.init();
        } catch {
          clientStore.assignGuardrailPack(assignmentId, packId);
          this.showToast('Course guardrail pack assigned to assignment!', 'success');
          await this.init();
        }
      }
    } catch (err) {
      this.showToast((err as Error).message, 'error');
    }
  }

  public async runBotSimulation(req: {
    studentId: string;
    assignmentId: string;
    guardrailPackId?: string;
    sampleKey: 'v1-initial' | 'v2-bypassed' | 'v3-fixed';
    commitMessage?: string;
  }): Promise<void> {
    try {
      this.setState({ isSimulatingBot: true });
      if (this.isStaticMode) {
        // Small delay to simulate scanning
        await new Promise(r => setTimeout(r, 450));
        const data = clientStore.simulateBot(req);
        this.setState({ botSimulationResult: data });
        this.showToast('CI/CD Bot Gatekeeper scan complete!', 'success');
        const gb = clientStore.getGradebookData(this.state.selectedAssignmentId, this.state.selectedSectionId || undefined);
        this.setState({ gradebookData: gb });
      } else {
        try {
          const res = await fetch('/api/bot/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req)
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || 'Bot simulation failed.');
          }
          const data = await res.json();
          this.setState({ botSimulationResult: data });
          this.showToast('CI/CD Bot Gatekeeper scan complete!', 'success');
          const url = `/api/assignments/${this.state.selectedAssignmentId}/gradebook`;
          fetch(url).then(r => r.json()).then(gb => this.setState({ gradebookData: gb }));
        } catch {
          const data = clientStore.simulateBot(req);
          this.setState({ botSimulationResult: data });
          this.showToast('CI/CD Bot Gatekeeper scan complete!', 'success');
          const gb = clientStore.getGradebookData(this.state.selectedAssignmentId, this.state.selectedSectionId || undefined);
          this.setState({ gradebookData: gb });
        }
      }
    } catch (err) {
      this.showToast((err as Error).message, 'error');
    } finally {
      this.setState({ isSimulatingBot: false });
    }
  }

  public async resetDemoData(): Promise<void> {
    try {
      clientStore.resetToSeed();
      if (!this.isStaticMode) {
        try {
          await fetch('/api/demo/reset', { method: 'POST' });
        } catch {
          // ignore offline error
        }
      }
      this.showToast('Pristine CIT-U pilot demo data restored!', 'success');
      await this.init();
    } catch (err) {
      this.showToast((err as Error).message, 'error');
    }
  }

  public async joinClass(form: {
    joinCode: string;
    name: string;
    studentNo: string;
    githubUser: string;
    repoUrl: string;
  }): Promise<boolean> {
    try {
      if (this.isStaticMode) {
        const res = clientStore.joinClass(form);
        this.showToast(res.message, 'success');
        await this.init();
        return true;
      } else {
        try {
          const res = await fetch('/api/sections/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to join class.');
          }
          this.showToast(data.message, 'success');
          await this.init();
          return true;
        } catch {
          const res = clientStore.joinClass(form);
          this.showToast(res.message, 'success');
          await this.init();
          return true;
        }
      }
    } catch (err) {
      this.showToast((err as Error).message, 'error');
      return false;
    }
  }

  public showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconSvg = type === 'success'
      ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>`
      : type === 'error'
      ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>`
      : `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;
    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 160);
    }, 4000);
  }
}

export const appState = new StateManager();
