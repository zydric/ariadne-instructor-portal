# 🛡️ Ariadne Instructor Security Portal & Academic Integrity Gatekeeper

> **Functional Prototype built for the Philippine Startup Challenge Pitch**  
> *Course Pilot Context:* **CSIT 321 — Enterprise Web Systems & Security** (Cebu Institute of Technology – University)

---

## 🚀 Quick Start

### 1. Launch Development Environment (Vite + Node API)
```bash
cd instructor-portal
npm run dev
```
- **Web Frontend:** [http://localhost:5173](http://localhost:5173) (Vite HMR with live `/api` proxy)
- **Node REST API:** [http://localhost:4000](http://localhost:4000)

### 2. Or Run Standalone Production Server
```bash
cd instructor-portal
npm run build
npm start
```
- Serves both the compiled SPA frontend and the backend REST API on [http://localhost:4000](http://localhost:4000).

### 3. Run Test Suite
```bash
cd instructor-portal
npm test
```
- Validates scoring penalty calculations, Zero Critical policy enforcement, rule toggles, and Academic Integrity audit logic.

---

## 📋 The 4 Approved Concepts

| Concept | Status | Core Capability |
| :--- | :---: | :--- |
| **1. Automated Security Gradebook & Academic Integrity Audit** | ✅ Built | Dynamic 0–100 score computation, Canvas/Moodle/Standard CSV exports, and detection of `comment-out` / `ariadne:ignore` bypasses with visual before/after diff evidence. |
| **2. Cohort Vulnerability Heatmap & AI Lecture Co-Pilot** | ✅ Built | Real-time section density matrix across OWASP categories, trend tracking, and one-click generation of pedagogical talking points, code comparisons, and formative quizzes. |
| **3. No-Code Assignment Guardrails (Syllabus Packs)** | ✅ Built | Preset year-level packs (`2nd Year OOP`, `3rd Year Web`, `4th Year Capstone`), policy switches (*Zero Critical*, *Block High+*), and instant cohort re-scoring. |
| **5. Ariadne CI/CD GitHub Bot (Repository Gatekeeper)** | ✅ Built | Spawns real `./bin/linux-x64/ariadne scan` binary against repository code, generating realistic GitHub Status Check Runs and pedagogical PR review comments. |

---

## 🎯 5-Minute Startup Challenge Pitch Walkthrough Script

### Act 1: The Instructor's Blind Spot (Gradebook & Audit)
1. Open the portal at [http://localhost:4000](http://localhost:4000).
2. Point to the **4 KPI Cards**: Cohort Average (76%), Pass Rate (45%), 11 Critical Findings, and Active Integrity Flags.
3. Highlight student **Juan Carlos Dela Cruz**:
   - Click **"Inspect Audit 🔍"**.
   - Show the **Academic Integrity Audit**: Point out that Ariadne detected an unauthorized `comment-out` bypass where a student commented out `Statement.executeQuery()` to fool traditional grading scripts.
   - Explain the philosophy: *"Ariadne assists the professor by flagging bypass evidence with visual diffs, rather than blindly auto-punishing."*

### Act 2: Turning Data into Teaching (Heatmap & Lecture Co-Pilot)
1. Switch to the **"🔥 Cohort Heatmap & Co-Pilot"** tab.
2. Show the color-coded matrix across **BSIT 3A**, **BSIT 3B**, and **BSCS 3A**.
3. Point out that **SQL Injection (CWE-89)** is concentrated in 57% of Section 3A.
4. Click **"✨ Co-Pilot: SQLi Lecture Notes"**:
   - Point to the **Cohort Summary**: *"57% of Section 3A concatenated raw parameters into SQL strings."*
   - Review the **3 Talking Points** prepared for tomorrow's lecture.
   - Show the **Insecure vs. Secure Pattern Comparison** (concatenation vs. `PreparedStatement`).
   - Click **Option B** on Question 1 in the **Formative Assessment Quiz** to reveal the instructor key.
   - Click **"📋 Copy Notes for Slides / LMS"** to demonstrate workflow integration.

### Act 3: Syllabus-Aligned Guardrails
1. Switch to the **"🛡️ Course Guardrails"** tab.
2. Show the 3 built-in packs:
   - *2nd Year:* Basic hardcoded secrets & null safety.
   - *3rd Year:* Web vulnerabilities (SQLi, XSS, Path Traversal).
   - *4th Year:* Hardened zero-tolerance capstone.
3. Toggle the **"Zero Critical Policy"** switch or disable **"SQL Injection"**:
   - Switch back to the Gradebook to show that every student's score and pass/fail badge re-calculated immediately.

### Act 4: The Developer Gatekeeper (CI/CD GitHub Bot Simulator)
1. Switch to the **"🤖 CI/CD Bot Simulator"** tab.
2. Select **Juan Carlos Dela Cruz** and sample **`v1-initial`**:
   - Click **"🚀 Run Push & Ariadne Gatekeeper"**.
   - Watch the backend spawn `./bin/linux-x64/ariadne scan`.
   - Point out the failing GitHub Check Run (`❌ 3 policy violations`) and the realistic GitHub PR comment from `ariadne-security-bot`.
3. Select sample **`v2-bypassed`**:
   - Click Run. Show that the bot caught the bypass attempt and flagged it as an **Academic Integrity Violation**.
4. Select sample **`v3-fixed`**:
   - Click Run. Show that with parameterized queries and sanitized inputs, all checks pass: **`✅ All Ariadne Security Guardrails Passed (100/100)`** and the PR is approved for merge.
5. Click **"📊 View in Gradebook →"** to show Juan Carlos's updated 100% score reflected instantly!

### Act 5: Pitch Reset
- Click **"🔄 Reset Demo Seed"** in the top right to restore the initial state before your next practice run.

---

## 🏗️ Architecture & Clean Code Notes

- **Zero Heavy Backend Frameworks:** Written in native Node.js 24 using `node:http`, `node:fs`, and `node:child_process` (following Ponytail ladder rung 3).
- **Scanner Integration:** Directly executes `./bin/linux-x64/ariadne scan` via non-blocking child process, parsing newline JSON findings identical to the VS Code extension.
- **Git Hygiene:** Self-contained in `instructor-portal/` and excluded from git via `.git/info/exclude`. No private scanner URLs, secrets, or internal paths.
