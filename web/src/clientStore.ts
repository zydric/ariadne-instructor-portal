import seedDataRaw from '../../data/seed.json';

export interface DatabaseSchema {
  instructor: any;
  courses: any[];
  sections: any[];
  assignments: any[];
  guardrailPacks: any[];
  students: any[];
  submissions: any[];
}

const STORAGE_KEY = 'ariadne_demo_db_v1';

export class ClientStore {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.loadDb();
  }

  private loadDb(): DatabaseSchema {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback to fresh seed
    }
    return JSON.parse(JSON.stringify(seedDataRaw));
  }

  private saveDb(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch {
      // Storage unavailable or full
    }
  }

  public resetToSeed(): DatabaseSchema {
    this.db = JSON.parse(JSON.stringify(seedDataRaw));
    this.saveDb();
    return this.db;
  }

  public getCourses(): any[] {
    return this.db.courses;
  }

  public getSections(): any[] {
    return this.db.sections;
  }

  public getAssignments(): any[] {
    return this.db.assignments;
  }

  public getGuardrailPacks(): any[] {
    return this.db.guardrailPacks;
  }

  public getAssignment(id: string): any {
    return this.db.assignments.find((a: any) => a.id === id) || this.db.assignments[0];
  }

  public getGuardrailPack(id: string): any {
    return this.db.guardrailPacks.find((p: any) => p.id === id) || this.db.guardrailPacks[0];
  }

  public updateGuardrailPack(id: string, updates: any): any {
    const pack = this.getGuardrailPack(id);
    if (!pack) throw new Error('Guardrail pack not found');
    if (updates.policies) {
      pack.policies = { ...pack.policies, ...updates.policies };
    }
    if (updates.rules) {
      pack.rules = { ...pack.rules, ...updates.rules };
    }
    this.saveDb();
    return pack;
  }

  public assignGuardrailPack(assignmentId: string, packId: string): any {
    const asg = this.getAssignment(assignmentId);
    if (!asg) throw new Error('Assignment not found');
    asg.guardrailPackId = packId;
    this.saveDb();
    return asg;
  }

  public joinClass(params: {
    joinCode: string;
    name: string;
    studentNo: string;
    githubUser: string;
    repoUrl?: string;
  }): { message: string; student: any } {
    const section = this.db.sections.find(
      (s: any) => s.joinCode.toUpperCase() === params.joinCode.trim().toUpperCase()
    );
    if (!section) {
      throw new Error(`Invalid join code "${params.joinCode}". Please verify your section syllabus code.`);
    }

    const existing = this.db.students.find(
      (s: any) => s.studentNo === params.studentNo.trim() || s.githubUser.toLowerCase() === params.githubUser.trim().toLowerCase()
    );

    if (existing) {
      existing.sectionId = section.id;
      existing.name = params.name.trim();
      existing.repoUrl = params.repoUrl?.trim() || existing.repoUrl;
      this.saveDb();
      return { message: `Updated enrollment for ${existing.name} in section ${section.name}!`, student: existing };
    }

    const newStudent = {
      id: `stu-${Date.now()}`,
      sectionId: section.id,
      studentNo: params.studentNo.trim(),
      name: params.name.trim(),
      githubUser: params.githubUser.trim(),
      repoUrl: params.repoUrl?.trim() || `https://github.com/citu-csit321/dormfinder-${params.githubUser.trim()}`,
      enrolledAt: new Date().toISOString()
    };

    this.db.students.unshift(newStudent);
    this.saveDb();
    return { message: `Enrolled ${newStudent.name} into section ${section.name}!`, student: newStudent };
  }

  public computeSubmissionScore(findings: any[], flags: any[], pack: any) {
    const activeFindings: any[] = [];
    const ignoredFindings: any[] = [];

    for (const f of findings) {
      const isRuleEnabled = pack.rules[f.rule_id] !== false;
      if (isRuleEnabled) {
        activeFindings.push(f);
      } else {
        ignoredFindings.push(f);
      }
    }

    let penaltyCritical = 0;
    let penaltyHigh = 0;
    let penaltyMedium = 0;
    let penaltyLow = 0;

    for (const f of activeFindings) {
      const sev = (f.severity?.toLowerCase() || 'medium');
      if (sev === 'critical') penaltyCritical += 25;
      else if (sev === 'high') penaltyHigh += 15;
      else if (sev === 'medium') penaltyMedium += 8;
      else if (sev === 'low') penaltyLow += 3;
    }

    const penaltyIntegrity = flags.length * 10;
    const totalDeductions = penaltyCritical + penaltyHigh + penaltyMedium + penaltyLow + penaltyIntegrity;
    const clampedScore = Math.max(0, Math.min(100, 100 - totalDeductions));

    const policyViolations: string[] = [];
    if (clampedScore < 75) {
      policyViolations.push(`Failing Security Score: Score (${clampedScore}/100) is below the minimum passing threshold (75/100).`);
    }

    const hasCritical = activeFindings.some(f => f.severity?.toLowerCase() === 'critical');
    const hasHighOrCritical = activeFindings.some(f => {
      const s = f.severity?.toLowerCase();
      return s === 'critical' || s === 'high';
    });

    if (pack.policies.zeroCritical && hasCritical) {
      policyViolations.push('Zero Critical Policy: One or more Critical vulnerabilities detected.');
    }
    if (pack.policies.blockMergeOnHigh && hasHighOrCritical) {
      policyViolations.push('Block on High+ Policy: High or Critical severity findings present.');
    }
    if (flags.length > 0) {
      policyViolations.push(`Academic Integrity Flag: ${flags.length} potential bypass attempt(s) detected.`);
    }

    return {
      score: clampedScore,
      baseScore: 100,
      penalties: {
        critical: penaltyCritical,
        high: penaltyHigh,
        medium: penaltyMedium,
        low: penaltyLow,
        integrity: penaltyIntegrity
      },
      passedPolicy: policyViolations.length === 0,
      policyViolations,
      activeFindings,
      ignoredFindings,
      flags
    };
  }

  public getGradebookData(assignmentId: string, sectionId?: string) {
    const assignment = this.getAssignment(assignmentId);
    const pack = this.getGuardrailPack(assignment.guardrailPackId);
    let students = this.db.students;
    if (sectionId) {
      students = students.filter(s => s.sectionId === sectionId);
    }

    const rows = students.map(student => {
      const section = this.db.sections.find(s => s.id === student.sectionId);
      const studentSubs = this.db.submissions.filter(
        sub => sub.assignmentId === assignmentId && sub.studentId === student.id
      );
      const latestSub = studentSubs.length > 0 ? studentSubs[studentSubs.length - 1] : null;
      const score = latestSub
        ? this.computeSubmissionScore(latestSub.findings || [], latestSub.integrityFlags || [], pack)
        : null;

      return {
        student,
        section,
        submission: latestSub,
        score
      };
    });

    const submitted = rows.filter(r => !!r.submission);
    const passed = submitted.filter(r => r.score?.passedPolicy);
    const avgScore = submitted.length > 0
      ? Math.round(submitted.reduce((acc, r) => acc + (r.score?.score || 0), 0) / submitted.length)
      : 0;
    const passRate = submitted.length > 0
      ? Math.round((passed.length / submitted.length) * 100)
      : 0;

    let totalCritical = 0;
    let totalFlags = 0;
    for (const r of submitted) {
      if (r.score) {
        totalCritical += r.score.activeFindings.filter((f: any) => f.severity === 'critical').length;
        totalFlags += r.score.flags.length;
      }
    }

    return {
      assignment,
      guardrailPack: pack,
      stats: {
        totalStudents: students.length,
        submittedCount: submitted.length,
        passedCount: passed.length,
        passRate,
        avgScore,
        totalCritical,
        totalFlags
      },
      rows
    };
  }

  public getHeatmapData(assignmentId: string, sectionId?: string) {
    const assignment = this.getAssignment(assignmentId);
    const sections = sectionId
      ? this.db.sections.filter(s => s.id === sectionId)
      : this.db.sections;

    const flawCategories = [
      { cwe: 'CWE-89', title: 'SQL Injection' },
      { cwe: 'CWE-798', title: 'Hardcoded Credentials' },
      { cwe: 'CWE-22', title: 'Path Traversal' },
      { cwe: 'CWE-79', title: 'Cross-Site Scripting (XSS)' }
    ];

    const matrix = sections.map(section => {
      const sectionStudents = this.db.students.filter(s => s.sectionId === section.id);
      const totalStudents = sectionStudents.length;

      const cells = flawCategories.map(flaw => {
        let affectedCount = 0;
        for (const student of sectionStudents) {
          const subs = this.db.submissions.filter(
            s => s.assignmentId === assignmentId && s.studentId === student.id
          );
          const latest = subs.length > 0 ? subs[subs.length - 1] : null;
          if (latest && latest.findings?.some((f: any) => f.cwe_id === flaw.cwe)) {
            affectedCount++;
          }
        }
        const percentage = totalStudents > 0 ? Math.round((affectedCount / totalStudents) * 100) : 0;
        return {
          category: flaw,
          cwe: flaw.cwe,
          title: flaw.title,
          affectedCount,
          totalStudents,
          percentage
        };
      });

      return {
        section,
        totalStudents,
        cells
      };
    });

    return {
      assignment,
      categories: flawCategories,
      matrix
    };
  }

  public getStudentTimeline(studentId: string, assignmentId: string) {
    const student = this.db.students.find(s => s.id === studentId);
    const section = this.db.sections.find(s => s.id === student?.sectionId);
    const assignment = this.getAssignment(assignmentId);
    const pack = this.getGuardrailPack(assignment.guardrailPackId);

    const submissions = this.db.submissions.filter(
      s => s.studentId === studentId && s.assignmentId === assignmentId
    );

    const timeline = submissions.map(sub => ({
      submission: sub,
      score: this.computeSubmissionScore(sub.findings || [], sub.integrityFlags || [], pack)
    }));

    return {
      student,
      section,
      assignment,
      guardrailPack: pack,
      timeline
    };
  }

  public getCopilotNotes(assignmentId: string, cwe: string) {
    const asg = this.getAssignment(assignmentId);
    if (cwe.includes('89') || cwe.toLowerCase().includes('sql')) {
      return {
        cwe: 'CWE-89',
        categoryTitle: 'SQL Injection via Concatenated Queries',
        affectedCount: 8,
        totalCohort: 42,
        percentage: 19,
        sectionName: 'BSIT 3A & 3B',
        assignmentTitle: asg.title,
        summary: '19% (8 of 42 students) concatenated raw HTTP parameters into SQL query strings rather than using parameterized PreparedStatements.',
        talkingPoints: [
          'Clarify the boundary between SQL code and user data: concatenation forces database to parse user input as executable SQL.',
          'Contrast dynamic queries with PreparedStatement pre-compilation.',
          'Address ORM misconceptions: JPQL and native queries remain equally vulnerable if concatenated.'
        ],
        codeComparison: {
          insecure: {
            title: 'Flawed Pattern (Vulnerable Concatenation)',
            code: '// Insecure: User input directly alters query AST\nString sql = "SELECT id FROM users WHERE username = \'" + username + "\' AND password = \'" + password + "\'";\nStatement stmt = conn.createStatement();\nResultSet rs = stmt.executeQuery(sql);',
            critique: 'If username contains "\' OR \'1\'=\'1", the WHERE clause becomes tautological, bypassing authentication without a password.'
          },
          secure: {
            title: 'Remediated Pattern (Parameterized PreparedStatement)',
            code: '// Secure: Placeholder parameterization ensures data treated purely as literal\nString sql = "SELECT id FROM users WHERE username = ? AND password = ?";\nPreparedStatement stmt = conn.prepareStatement(sql);\nstmt.setString(1, username);\nstmt.setString(2, password);\nResultSet rs = stmt.executeQuery();',
            explanation: 'The database engine compiles query structure first; parameter values cannot mutate the execution plan.'
          }
        },
        quiz: [
          {
            question: 'Why does PreparedStatement prevent SQL Injection?',
            options: [
              'It sanitizes characters by removing quotation marks.',
              'The query AST is compiled before parameters are bound, treating input strictly as literals.',
              'It encrypts query parameters over HTTPS.',
              'It prevents database connections from unauthorized IPs.'
            ],
            correctIndex: 1,
            explanation: 'PreparedStatements compile the execution structure ahead of time; user input cannot alter SQL syntax.'
          },
          {
            question: 'Is using an ORM like Hibernate or JPA an automatic guarantee against SQL injection?',
            options: [
              'Yes, ORMs automatically parameterize all queries under all circumstances.',
              'No, concatenating user input into HQL, JPQL, or native queries re-introduces the vulnerability.',
              'Yes, because SQL is translated to Java byte-code.',
              'No, because ORMs disable database indexing.'
            ],
            correctIndex: 1,
            explanation: 'Concatenating untrusted inputs into JPQL or Criteria queries creates query injection vulnerabilities regardless of ORM use.'
          }
        ]
      };
    }

    return {
      cwe: 'CWE-798',
      categoryTitle: 'Hardcoded Credentials & API Secrets',
      affectedCount: 6,
      totalCohort: 42,
      percentage: 14,
      sectionName: 'BSIT 3A',
      assignmentTitle: asg.title,
      summary: '14% (6 of 42 students) committed plaintext database passwords or secret keys directly to version control repositories.',
      talkingPoints: [
        'Emphasize that Git history permanently retains committed secrets even if deleted in future commits.',
        'Demonstrate 12-factor application design using System.getenv() or .env configurations.',
        'Explain classroom repository exposure risks when pushing to public GitHub.'
      ],
      codeComparison: {
        insecure: {
          title: 'Flawed Pattern (Hardcoded Secret in Source)',
          code: 'public class DatabaseConfig {\n    public static final String DB_PASS = "admin_secret_2026!";\n}',
          critique: 'Secrets committed to VCS can be scraped from git commits and public repositories.'
        },
        secure: {
          title: 'Remediated Pattern (Environment Variables)',
          code: 'public class DatabaseConfig {\n    public static final String DB_PASS = System.getenv("DB_PASSWORD");\n}',
          explanation: 'Decouples credentials from application source code, adhering to 12-Factor principles.'
        }
      },
      quiz: [
        {
          question: 'What is the primary risk of committing API keys directly to Git?',
          options: [
            'It slows down compile times.',
            'Git commit logs permanently preserve the secret across repo clones and public forks.',
            'It prevents unit tests from executing.',
            'Java cannot compile strings containing special symbols.'
          ],
          correctIndex: 1,
          explanation: 'Git is an immutable log; committed secrets remain in commit objects even after deletion in HEAD.'
        }
      ]
    };
  }

  public simulateBot(req: {
    studentId: string;
    assignmentId: string;
    guardrailPackId?: string;
    sampleKey: string;
    commitMessage?: string;
  }) {
    const student = this.db.students.find(s => s.id === req.studentId) || this.db.students[0];
    const assignment = this.getAssignment(req.assignmentId);
    const pack = this.getGuardrailPack(req.guardrailPackId || assignment.guardrailPackId);

    const randSha = Math.random().toString(16).substring(2, 9);
    const commitMsg = req.commitMessage || `feat: simulated commit (${req.sampleKey})`;

    let findings: any[] = [];
    let integrityFlags: any[] = [];

    if (req.sampleKey === 'v1-initial') {
      findings = [
        {
          rule_id: 'taint.sql.execute',
          type: 'SQL Injection via Concatenation',
          severity: 'critical',
          file_path: 'src/main/java/edu/citu/dormfinder/controller/ListingController.java',
          line_number: 42,
          cwe_id: 'CWE-89',
          description: 'Unsanitized user parameter concatenated directly into SQL executeQuery statement.'
        },
        {
          rule_id: 'pattern.hardcoded.field',
          type: 'Hardcoded Database Password',
          severity: 'high',
          file_path: 'src/main/java/edu/citu/dormfinder/config/DatabaseConfig.java',
          line_number: 18,
          cwe_id: 'CWE-798',
          description: 'Plaintext production database credential committed directly to repository source.'
        },
        {
          rule_id: 'pattern.hardcoded.assignment',
          type: 'Hardcoded JWT Signing Secret',
          severity: 'high',
          file_path: 'src/main/java/edu/citu/dormfinder/controller/LoginController.java',
          line_number: 31,
          cwe_id: 'CWE-798',
          description: 'Hardcoded secret token string used in symmetric HMAC signature generation.'
        },
        {
          rule_id: 'taint.path.fileApi',
          type: 'Path Traversal File Read',
          severity: 'high',
          file_path: 'src/main/java/edu/citu/dormfinder/controller/ListingController.java',
          line_number: 88,
          cwe_id: 'CWE-22',
          description: 'Unvalidated user filename passed directly to File or FileInputStream constructor.'
        }
      ];
    } else if (req.sampleKey === 'v2-bypassed') {
      findings = [
        {
          rule_id: 'pattern.hardcoded.field',
          type: 'Hardcoded Database Password',
          severity: 'high',
          file_path: 'src/main/java/edu/citu/dormfinder/config/DatabaseConfig.java',
          line_number: 18,
          cwe_id: 'CWE-798',
          description: 'Plaintext production database credential committed directly to repository source.'
        },
        {
          rule_id: 'pattern.hardcoded.assignment',
          type: 'Hardcoded JWT Signing Secret',
          severity: 'high',
          file_path: 'src/main/java/edu/citu/dormfinder/controller/LoginController.java',
          line_number: 31,
          cwe_id: 'CWE-798',
          description: 'Hardcoded secret token string used in symmetric HMAC signature generation.'
        }
      ];
      integrityFlags = [
        {
          kind: 'comment_out',
          rule_id: 'taint.sql.execute',
          cwe_id: 'CWE-89',
          title: 'Comment-Out Bypass Detected (SQL Injection)',
          file_path: 'src/main/java/edu/citu/dormfinder/controller/ListingController.java',
          line_number: 42,
          evidence: {
            previousSnippet: 'ResultSet rs = stmt.executeQuery(sql);',
            currentSnippet: '// ResultSet rs = stmt.executeQuery(sql);',
            explanation: 'The previously flagged call to stmt.executeQuery was commented out to suppress scanner alerts rather than being parameterized.'
          }
        }
      ];
    } else {
      findings = [];
      integrityFlags = [];
    }

    const scoreResult = this.computeSubmissionScore(findings, integrityFlags, pack);

    const submission = {
      id: `sub-${Date.now()}`,
      assignmentId: req.assignmentId,
      studentId: student.id,
      commitSha: randSha,
      commitMessage: commitMsg,
      source: 'simulate',
      scannedAt: new Date().toISOString(),
      findings,
      integrityFlags
    };

    this.db.submissions.push(submission);
    this.saveDb();

    const isClean100 = scoreResult.passedPolicy && scoreResult.score === 100;
    const title = isClean100
      ? 'All Ariadne Security Guardrails Passed (100/100)'
      : scoreResult.passedPolicy
        ? `Ariadne Security Passed with Warnings — Score: ${scoreResult.score}/100`
        : `Ariadne Security Gatekeeper Failed — Score: ${scoreResult.score}/100`;

    const summary = scoreResult.passedPolicy
      ? `No policy violations detected under guardrail pack "${pack.name}". All rules verified.`
      : scoreResult.policyViolations.join(' | ');

    const prCommentMarkdown = this.buildPrComment(
      student.name,
      randSha,
      pack,
      scoreResult,
      findings,
      integrityFlags
    );

    return {
      submission,
      checkRun: {
        name: 'Ariadne Academic Gatekeeper',
        status: 'completed',
        conclusion: scoreResult.passedPolicy ? 'success' : 'failure',
        title,
        summary,
        detailsUrl: 'https://github.com/citu-csit321/dormfinder'
      },
      prCommentMarkdown,
      computedScore: scoreResult
    };
  }

  private buildPrComment(
    studentName: string,
    sha: string,
    pack: any,
    scoreResult: any,
    findings: any[],
    flags: any[]
  ): string {
    const isPassing = scoreResult.passedPolicy;
    const isClean = isPassing && findings.length === 0 && flags.length === 0;

    let md = `## Ariadne Security Gatekeeper — ${isClean ? 'ALL CHECKS PASSED' : isPassing ? 'PASSED WITH WARNINGS' : 'FAILING (MERGE BLOCKED)'}\n\n`;
    md += `**Commit:** \`${sha}\` | **Student:** ${studentName} | **Guardrail Pack:** ${pack.name} | **Computed Security Score:** ${scoreResult.score}/100\n\n`;

    if (!isPassing) {
      md += `### Policy Violations\n\n`;
      for (const v of scoreResult.policyViolations) {
        md += `- **${v}**\n`;
      }
      md += `\n`;
    }

    if (flags.length > 0) {
      md += `### Academic Integrity Audit Warnings\n\n`;
      md += `The gatekeeper detected possible bypass attempts compared to your previous commit:\n\n`;
      for (const flag of flags) {
        md += `> **[${flag.kind.toUpperCase()}] ${flag.title}** (${flag.cwe_id})\n`;
        md += `> Location: \`${flag.file_path}:${flag.line_number}\`\n`;
        md += `> Evidence: ${flag.evidence.explanation}\n\n`;
        if (flag.evidence.previousSnippet || flag.evidence.currentSnippet) {
          md += `\`\`\`diff\n`;
          if (flag.evidence.previousSnippet) md += `- ${flag.evidence.previousSnippet}\n`;
          if (flag.evidence.currentSnippet) md += `+ ${flag.evidence.currentSnippet}\n`;
          md += `\`\`\`\n\n`;
        }
      }
    }

    if (findings.length > 0) {
      md += `### Detected Vulnerabilities (${findings.length})\n\n`;
      md += `| Severity | Vulnerability | Rule ID | Location |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      for (const f of findings) {
        md += `| **${f.severity.toUpperCase()}** | ${f.type} (${f.cwe_id}) | \`${f.rule_id}\` | \`${f.file_path}:${f.line_number}\` |\n`;
      }
      md += `\n`;

      md += `### Pedagogical Guidance (How to Remediate)\n\n`;
      const uniqueCwes = Array.from(new Set(findings.map(f => f.cwe_id)));
      for (const cwe of uniqueCwes) {
        if (cwe === 'CWE-89') {
          md += `- **SQL Injection (CWE-89):** Replace dynamic SQL concatenation with \`PreparedStatement\` parameter placeholders (\`?\`).\n`;
        } else if (cwe === 'CWE-798') {
          md += `- **Hardcoded Credentials (CWE-798):** Remove all plain-text passwords and API keys from source files. Retrieve credentials at runtime using \`System.getenv("VARIABLE_NAME")\`.\n`;
        } else if (cwe === 'CWE-22') {
          md += `- **Path Traversal (CWE-22):** Normalize file paths with \`Path.normalize()\` and verify the canonical path begins with the allowed upload/storage directory before opening.\n`;
        }
      }
      md += `\n`;
    }

    if (isClean) {
      md += `No security vulnerabilities or evasion patterns detected under active guardrails. Ready to merge!\n\n`;
    }

    md += `*Note: Ariadne never provides copy-paste solutions. Understand the underlying security principle to build resilient systems.*\n`;
    return md;
  }
}

export const clientStore = new ClientStore();
