# 🎬 Ariadne Instructor Portal — Video Demo Recording Guide & Script

**Live Demo URL to Record:** [https://zydric.github.io/ariadne-instructor-portal/](https://zydric.github.io/ariadne-instructor-portal/)  
**Target Video Duration:** 2:30 – 3:00 minutes  
**Target Audience:** Philippine Startup Challenge Judges, Pitch Evaluators, & Capstone Panelists  
**Tone:** Confident, professional, pedagogical, crisp.

---

## 🛠️ Pre-Recording Setup Checklist (Do This First!)

1. **Browser Setup:**
   * Open Chrome/Edge in a clean window (hide Bookmarks bar: `Ctrl+Shift+B` or `Cmd+Shift+B`).
   * Window resolution: **1920×1080** (Full HD).
   * Zoom level: **100%** (or **110%** if text looks small on a 4K display).
2. **Pristine State Reset:**
   * Open [https://zydric.github.io/ariadne-instructor-portal/](https://zydric.github.io/ariadne-instructor-portal/).
   * Click **"Reset Demo"** in the top right navbar to guarantee the database is in the clean starting state.
   * Ensure **Palette: Semantic** is active (green indicator dot) and light theme (or dark mode, whichever you prefer—light mode with high contrast is great for presentation videos).
3. **Recording Cursor & Movement:**
   * Move the mouse smoothly; avoid frantic circular wiggling.
   * Pause for 1 second on each screen before clicking so viewers can register what they are seeing.
   * Keep microphone close with background noise reduction enabled.

---

## ⏱️ Step-by-Step Recording Timeline & Script

```
0:00 ── 0:20  [Hook] The Instructor's Blind Spot
0:20 ── 0:55  [Act 1] Gradebook & The Forensic Bypass Audit
0:55 ── 1:40  [Act 2] Cohort Heatmap & AI Lecture Co-Pilot
1:40 ── 2:10  [Act 3] No-Code Course Guardrails in Action
2:10 ── 2:45  [Act 4] The Developer Gatekeeper (CI/CD Bot Simulation)
2:45 ── 3:00  [Outro] Theme, Palette, & Conclusion
```

---

### 🎬 Scene 1: The Hook & Gradebook Overview (0:00 – 0:20)

| Visual Action (What to show on screen) | Voiceover Script (What to say) |
| :--- | :--- |
| **Start on the Gradebook tab.**<br>Slowly hover across the **4 KPI Cards** (Cohort Average: `76/100`, Pass Rate: `45%`, Critical Findings: `11`, Integrity Flags: `0`). | *"In programming education, autograders only check if student code works—not if it's secure. Students routinely pass unit tests while leaving severe SQL injections and hardcoded secrets in their projects.*<br><br>*Welcome to the **Ariadne Instructor Security Portal**—the automated gatekeeper and pedagogical co-pilot for computing faculty."* |

---

### 🎬 Scene 2: Forensic Academic Integrity Audit (0:20 – 0:55)

| Visual Action (What to show on screen) | Voiceover Script (What to say) |
| :--- | :--- |
| **Scroll down to Student Roster.**<br>Highlight student **Juan Carlos Dela Cruz** (`BSIT 3A`, Score: `15`, Status: `Blocked`, `1 Crit`).<br><br>Click **"Inspect Audit"** button. | *"Here in our CSIT 321 classroom gradebook, we see real-time calculated security grades across sections. Let’s look at Juan Carlos Dela Cruz.*<br><br>*Juan Carlos has a score of 15 and is blocked by the course policy.* |
| **Inside the Drilldown Modal:**<br>1. Scroll past the score deductions.<br>2. Point out the **Academic Integrity Audit** card.<br>3. Show the red/green code diff (`- Statement.executeQuery(...)`). | *When security tools are introduced, students often try to cheat the grader by commenting out vulnerable methods. Traditional graders get fooled—but Ariadne’s AST diff engine detects the bypass.*<br><br>*Here, Ariadne flags an unauthorized comment-out bypass with visual diff evidence, allowing instructors to intervene with proof rather than guessing."* |
| Click the **Close (X)** button. | *(Brief 1-second pause as modal closes)* |

---

### 🎬 Scene 3: Cohort Heatmap & AI Lecture Co-Pilot (0:55 – 1:40)

| Visual Action (What to show on screen) | Voiceover Script (What to say) |
| :--- | :--- |
| Click **"Cohort Heatmap"** tab in the top navbar.<br><br>Let the matrix show on screen.<br>Hover mouse over **BSIT 3A** under **SQL Injection** (`29% - 4 of 14 students`). | *"Instead of burying security findings in spreadsheets, Ariadne aggregates cohort vulnerabilities into a real-time heatmap matrix across sections and OWASP categories.*<br><br>*Immediately, we notice a clustering problem: SQL Injection is concentrated in Section 3A and 3B."* |
| Click the **"Lecture Notes: SQL Injection"** button (or click the SQLi table cell).<br><br>**Inside Lecture Co-Pilot Modal:**<br>1. Show the **Observed Pattern Summary**.<br>2. Scroll to the **3 Lecture Talking Points**.<br>3. Show the side-by-side **Insecure vs Remediated PreparedStatement** diff. | *"With one click, the **AI Lecture Co-Pilot** synthesizes tomorrow's lecture prep from real student mistakes.*<br><br>*It explains what students did wrong in plain English, generates 3 immediate talking points for tomorrow’s slides, and provides side-by-side remediation patterns."* |
| Scroll to the **Formative Assessment Quiz**.<br>Click **Option B** (the correct answer).<br>Show the green highlight and the **Instructor Key** appearing.<br><br>Click **"📋 Copy Notes for Slides / LMS"** (notice the toast: *"Copied to clipboard"*).<br>Click **"Done"** to close modal. | *"It even generates a recitation quiz with an interactive instructor key, and allows one-click copying straight into Canvas or Moodle announcements. This closes the loop between grading and teaching."* |

---

### 🎬 Scene 4: No-Code Course Guardrails (1:40 – 2:10)

| Visual Action (What to show on screen) | Voiceover Script (What to say) |
| :--- | :--- |
| Click **"Course Guardrails"** tab in the navbar.<br><br>Show the 3 syllabus cards:<br>- *2nd Year — OOP Hygiene*<br>- *3rd Year — Web Systems (OWASP Core)*<br>- *4th Year — Hardened Enterprise* | *"Every course has different security expectations. Rather than writing complex CI scripts, instructors simply select syllabus packs aligned with their curriculum year level."* |
| Scroll down to **Rule Configuration**.<br>Toggle the **"Zero Critical Policy"** switch or adjust a point penalty slider.<br><br>Immediately click back to **"Gradebook"** tab.<br>Show that student scores and pass/fail badges updated dynamically. | *"Instructors can toggle policies like Zero Critical or customize point deductions. The moment a policy changes, the entire cohort's gradebook recalculates dynamically—no manual regrading needed."* |

---

### 🎬 Scene 5: The CI/CD Bot Simulator (2:10 – 2:45)

| Visual Action (What to show on screen) | Voiceover Script (What to say) |
| :--- | :--- |
| Click **"Bot Gatekeeper"** tab in the navbar.<br><br>Leave student as **Juan Carlos Dela Cruz**.<br>Select sample: **`v1-initial`**.<br>Click **"🚀 Run Push & Ariadne Gatekeeper"**. | *"Now, what does the student actually experience? Under the Bot Gatekeeper, we simulate a student pull request on GitHub.*<br><br>*On initial commit `v1`, the student pushes unvalidated SQL. Ariadne fails the status check run and leaves an educational PR comment explaining why it's vulnerable."* |
| Select sample: **`v2-bypassed`**.<br>Click **"🚀 Run Push & Ariadne Gatekeeper"**. | *"In `v2`, the student tries commenting out the query to game the test. Ariadne catches the bypass, flags an Academic Integrity violation, and blocks the merge."* |
| Select sample: **`v3-fixed`**.<br>Click **"🚀 Run Push & Ariadne Gatekeeper"**.<br>Watch the check turn green: **`✅ 100/100 Passed`**.<br><br>Click **"📊 View in Gradebook →"** link. | *"In `v3`, the student uses parameterized queries. All checks pass, the PR is approved, and their gradebook score instantly reflects a 100%!"* |

---

### 🎬 Scene 6: Outro & Takeaway (2:45 – 3:00)

| Visual Action (What to show on screen) | Voiceover Script (What to say) |
| :--- | :--- |
| On the Gradebook view:<br>1. Click the **Theme Toggle (Moon icon)** to show Dark Charcoal mode, then back to Light mode.<br>2. Click the **Palette Toggle** to demonstrate Semantic vs Strict.<br>3. End on the hero view of the Gradebook with the Ariadne shield logo visible. | *"With clean institutional theming, forensic integrity tracking, and automated lecture prep, Ariadne turns raw vulnerability scans into pedagogical insights.*<br><br>*Ariadne: empowering instructors, gatekeeping code, and shaping secure software engineers from day one. Thank you."* |

---

## 💡 Quick Tips for the Teammate Recording

1. **Audio Recording:** Record the voiceover in a quiet room using a USB mic or headset. Speak at a steady, conversational pace—don't rush!
2. **If You Make a Mistake:** Don't stop recording! Pause for 3 seconds in silence, re-say the sentence, and cut out the flub during video editing.
3. **Zoom & Highlights:** In editing (Premiere, CapCut, DaVinci, or Camtasia), add subtle 110% zooms when clicking "Inspect Audit" or revealing the "Lecture Co-Pilot" to make the demo feel high-budget and dynamic.
4. **Need to Re-take?** Click **"Reset Demo"** in the top right at any time to return to the clean starting state.
