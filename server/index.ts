import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { parse, fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { BINARY_PATH } from './scanner.ts';
import { store } from './store.ts';
import { computeSubmissionScore } from './scoring.ts';
import { generateLectureCoPilot } from './copilot.ts';
import { generateCanvasCsv, generateMoodleCsv, generateStandardCsv } from './exports.ts';
import { simulateBotPush } from './botSimulator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const json = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(json);
}

function sendCsv(res: ServerResponse, filename: string, csvContent: string): void {
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Access-Control-Allow-Origin': '*'
  });
  res.end(csvContent);
}

async function readBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error(`Invalid JSON body: ${(err as Error).message}`));
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost:4000'}`);
  const pathname = url.pathname;
  const query = Object.fromEntries(url.searchParams.entries());
  const method = req.method || 'GET';

  try {
    // 1. Health check
    if (method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, {
        status: 'ok',
        version: '1.0.0',
        scannerAvailable: existsSync(BINARY_PATH),
        timestamp: new Date().toISOString()
      });
    }

    // 2. Instructor info
    if (method === 'GET' && pathname === '/api/instructor') {
      return sendJson(res, 200, store.getDb().instructor);
    }

    // 3. Courses
    if (method === 'GET' && pathname === '/api/courses') {
      return sendJson(res, 200, store.getCourses());
    }

    // 4. Sections
    if (method === 'GET' && pathname === '/api/sections') {
      const courseId = query.courseId as string | undefined;
      return sendJson(res, 200, store.getSections(courseId));
    }

    // 5. Student Join by code
    if (method === 'POST' && pathname === '/api/sections/join') {
      const body = await readBody<{
        joinCode: string;
        name: string;
        studentNo: string;
        githubUser: string;
        repoUrl: string;
      }>(req);

      if (!body.joinCode || !body.name || !body.studentNo) {
        return sendJson(res, 400, { error: 'Missing required registration fields.' });
      }

      const allSections = store.getSections();
      const matchedSection = allSections.find(s => s.joinCode.toUpperCase() === body.joinCode.trim().toUpperCase());
      if (!matchedSection) {
        return sendJson(res, 404, { error: `Invalid join code: "${body.joinCode}". Please verify with your instructor.` });
      }

      const newStudent = store.registerStudent({
        name: body.name.trim(),
        studentNo: body.studentNo.trim(),
        sectionId: matchedSection.id,
        githubUser: body.githubUser.trim() || body.name.toLowerCase().replace(/\s+/g, '-'),
        repoUrl: body.repoUrl.trim() || `https://github.com/citu-csit321/dormfinder-${body.studentNo}`
      });

      return sendJson(res, 201, {
        student: newStudent,
        section: matchedSection,
        message: `Successfully registered for ${matchedSection.name}!`
      });
    }

    // 6. Students
    if (method === 'GET' && pathname === '/api/students') {
      const sectionId = query.sectionId as string | undefined;
      return sendJson(res, 200, store.getStudents(sectionId));
    }

    // 7. Assignments
    if (method === 'GET' && pathname === '/api/assignments') {
      const courseId = query.courseId as string | undefined;
      return sendJson(res, 200, store.getAssignments(courseId));
    }

    // 8. Gradebook for an assignment
    // Route: GET /api/assignments/:id/gradebook
    const gradebookMatch = pathname.match(/^\/api\/assignments\/([^/]+)\/gradebook$/);
    if (method === 'GET' && gradebookMatch) {
      const assignmentId = gradebookMatch[1];
      const assignment = store.getAssignment(assignmentId);
      if (!assignment) {
        return sendJson(res, 404, { error: `Assignment ${assignmentId} not found.` });
      }

      const pack = store.getGuardrailPack(assignment.guardrailPackId) || store.getGuardrailPacks()[0];
      const sectionId = query.sectionId as string | undefined;
      const students = store.getStudents(sectionId);
      const allSubmissions = store.getSubmissions(assignmentId);

      const rows = students.map(student => {
        const studentSubs = allSubmissions.filter(s => s.studentId === student.id);
        const latestSub = studentSubs.length > 0 ? studentSubs[studentSubs.length - 1] : null;

        const score = latestSub
          ? computeSubmissionScore(latestSub.findings || [], latestSub.integrityFlags || [], pack)
          : {
              score: 0,
              baseScore: 100,
              penalties: { critical: 0, high: 0, medium: 0, low: 0, integrity: 0 },
              passedPolicy: false,
              policyViolations: ['No submission recorded.'],
              activeFindings: [],
              ignoredFindings: [],
              flags: []
            };

        const sec = store.getSections().find(s => s.id === student.sectionId)!;

        return {
          student,
          section: sec,
          submission: latestSub,
          score
        };
      });

      // Compute aggregate stats
      const submittedRows = rows.filter(r => r.submission !== null);
      const totalScores = submittedRows.reduce((acc, r) => acc + r.score.score, 0);
      const avgScore = submittedRows.length > 0 ? Math.round(totalScores / submittedRows.length) : 0;
      const passedCount = submittedRows.filter(r => r.score.passedPolicy).length;
      const passRate = submittedRows.length > 0 ? Math.round((passedCount / submittedRows.length) * 100) : 0;

      let totalCritical = 0;
      let totalFlags = 0;
      for (const r of submittedRows) {
        totalCritical += r.score.activeFindings.filter(f => f.severity === 'critical').length;
        totalFlags += r.score.flags.length;
      }

      return sendJson(res, 200, {
        assignment,
        guardrailPack: pack,
        stats: {
          totalStudents: students.length,
          submittedCount: submittedRows.length,
          avgScore,
          passRate,
          totalCritical,
          totalFlags
        },
        rows
      });
    }

    // 9. Gradebook CSV Export
    // Route: GET /api/assignments/:id/export
    const exportMatch = pathname.match(/^\/api\/assignments\/([^/]+)\/export$/);
    if (method === 'GET' && exportMatch) {
      const assignmentId = exportMatch[1];
      const format = (query.format as string) || 'csv';
      const sectionId = query.sectionId as string | undefined;

      const assignment = store.getAssignment(assignmentId);
      if (!assignment) return sendJson(res, 404, { error: 'Assignment not found.' });

      const pack = store.getGuardrailPack(assignment.guardrailPackId) || store.getGuardrailPacks()[0];
      const students = store.getStudents(sectionId);
      const allSubmissions = store.getSubmissions(assignmentId);

      const rows = students.map(student => {
        const studentSubs = allSubmissions.filter(s => s.studentId === student.id);
        const latestSub = studentSubs.length > 0 ? studentSubs[studentSubs.length - 1] : null;
        const score = latestSub
          ? computeSubmissionScore(latestSub.findings || [], latestSub.integrityFlags || [], pack)
          : {
              score: 0,
              baseScore: 100,
              penalties: { critical: 0, high: 0, medium: 0, low: 0, integrity: 0 },
              passedPolicy: false,
              policyViolations: ['No submission'],
              activeFindings: [],
              ignoredFindings: [],
              flags: []
            };
        const sec = store.getSections().find(s => s.id === student.sectionId)!;
        return { student, section: sec, submission: latestSub, score };
      });

      if (format === 'canvas') {
        const csv = generateCanvasCsv(assignment, rows);
        return sendCsv(res, `canvas_grades_${assignment.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`, csv);
      }
      if (format === 'moodle') {
        const csv = generateMoodleCsv(assignment, rows);
        return sendCsv(res, `moodle_grades_${assignment.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`, csv);
      }

      const csv = generateStandardCsv(assignment, rows);
      return sendCsv(res, `ariadne_gradebook_${assignment.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`, csv);
    }

    // 10. Heatmap Matrix
    // Route: GET /api/assignments/:id/heatmap
    const heatmapMatch = pathname.match(/^\/api\/assignments\/([^/]+)\/heatmap$/);
    if (method === 'GET' && heatmapMatch) {
      const assignmentId = heatmapMatch[1];
      const assignment = store.getAssignment(assignmentId);
      if (!assignment) return sendJson(res, 404, { error: 'Assignment not found.' });

      const pack = store.getGuardrailPack(assignment.guardrailPackId) || store.getGuardrailPacks()[0];
      const sectionId = query.sectionId as string | undefined;
      const allSections = store.getSections();
      const sections = sectionId ? allSections.filter(s => s.id === sectionId) : allSections;
      const allSubmissions = store.getSubmissions(assignmentId);

      const targetCategories = [
        { cwe: 'CWE-89', title: 'SQL Injection', owasp: 'A03:2021-Injection' },
        { cwe: 'CWE-798', title: 'Hardcoded Credentials', owasp: 'A07:2021-Auth' },
        { cwe: 'CWE-22', title: 'Path Traversal', owasp: 'A01:2021-Broken Access' },
        { cwe: 'CWE-79', title: 'Cross-Site Scripting (XSS)', owasp: 'A03:2021-Injection' }
      ];

      const matrix = sections.map(sec => {
        const secStudents = store.getStudents(sec.id);
        const cellData = targetCategories.map(cat => {
          const affectedStudents: Array<{ id: string; name: string; findingCount: number }> = [];

          for (const stu of secStudents) {
            const studentSubs = allSubmissions.filter(s => s.studentId === stu.id);
            if (studentSubs.length === 0) continue;
            const latestSub = studentSubs[studentSubs.length - 1];
            const matchingFindings = (latestSub.findings || []).filter(f => {
              const ruleActive = pack.rules[f.rule_id] !== false;
              return ruleActive && (f.cwe_id === cat.cwe || f.type.toLowerCase().includes(cat.title.toLowerCase()));
            });

            if (matchingFindings.length > 0) {
              affectedStudents.push({
                id: stu.id,
                name: stu.name,
                findingCount: matchingFindings.length
              });
            }
          }

          const percentage = secStudents.length > 0
            ? Math.round((affectedStudents.length / secStudents.length) * 100)
            : 0;

          return {
            category: cat,
            affectedCount: affectedStudents.length,
            totalStudents: secStudents.length,
            percentage,
            affectedStudents
          };
        });

        return {
          section: sec,
          totalStudents: secStudents.length,
          cells: cellData
        };
      });

      return sendJson(res, 200, {
        assignment,
        categories: targetCategories,
        matrix
      });
    }

    // 11. Lecture Co-Pilot Generation
    // Route: POST /api/assignments/:id/copilot
    const copilotMatch = pathname.match(/^\/api\/assignments\/([^/]+)\/copilot$/);
    if (method === 'POST' && copilotMatch) {
      const assignmentId = copilotMatch[1];
      const assignment = store.getAssignment(assignmentId);
      if (!assignment) return sendJson(res, 404, { error: 'Assignment not found.' });

      const body = await readBody<{ cwe: string; sectionId?: string; affectedCount?: number; totalCohort?: number }>(req);
      const cwe = body.cwe || 'CWE-89';
      const section = body.sectionId ? store.getSections().find(s => s.id === body.sectionId) : null;
      const sectionName = section ? section.name : 'Cohort (All Sections)';
      const affected = body.affectedCount || 8;
      const total = body.totalCohort || 14;

      const notes = generateLectureCoPilot(cwe, affected, total, sectionName, assignment.title);
      return sendJson(res, 200, notes);
    }

    // 12. Guardrail Packs
    if (method === 'GET' && pathname === '/api/guardrails') {
      return sendJson(res, 200, store.getGuardrailPacks());
    }

    // PUT /api/guardrails/:id
    const guardrailPutMatch = pathname.match(/^\/api\/guardrails\/([^/]+)$/);
    if (method === 'PUT' && guardrailPutMatch) {
      const packId = guardrailPutMatch[1];
      const body = await readBody<Record<string, unknown>>(req);
      const updated = store.updateGuardrailPack(packId, body);
      return sendJson(res, 200, updated);
    }

    // PUT /api/assignments/:id/guardrail
    const asgGuardrailMatch = pathname.match(/^\/api\/assignments\/([^/]+)\/guardrail$/);
    if (method === 'PUT' && asgGuardrailMatch) {
      const assignmentId = asgGuardrailMatch[1];
      const body = await readBody<{ guardrailPackId: string }>(req);
      if (!body.guardrailPackId) {
        return sendJson(res, 400, { error: 'guardrailPackId required' });
      }
      store.updateAssignmentGuardrail(assignmentId, body.guardrailPackId);
      const asg = store.getAssignment(assignmentId);
      return sendJson(res, 200, asg);
    }

    // 13. Student Timeline / Drilldown
    // Route: GET /api/students/:id/timeline
    const timelineMatch = pathname.match(/^\/api\/students\/([^/]+)\/timeline$/);
    if (method === 'GET' && timelineMatch) {
      const studentId = timelineMatch[1];
      const student = store.getStudent(studentId);
      if (!student) return sendJson(res, 404, { error: 'Student not found.' });

      const assignmentId = query.assignmentId as string | undefined;
      const submissions = store.getSubmissions(assignmentId, studentId);
      const assignment = assignmentId ? store.getAssignment(assignmentId) : null;
      const pack = assignment ? store.getGuardrailPack(assignment.guardrailPackId) : store.getGuardrailPacks()[0];

      const scoredTimeline = submissions.map(sub => {
        const score = pack ? computeSubmissionScore(sub.findings || [], sub.integrityFlags || [], pack) : null;
        return {
          submission: sub,
          score
        };
      });

      return sendJson(res, 200, {
        student,
        section: store.getSections().find(s => s.id === student.sectionId),
        assignment,
        guardrailPack: pack,
        timeline: scoredTimeline
      });
    }

    // 14. Bot Simulator
    // Route: POST /api/bot/simulate
    if (method === 'POST' && pathname === '/api/bot/simulate') {
      const body = await readBody<{
        studentId: string;
        assignmentId: string;
        sampleKey: 'v1-initial' | 'v2-bypassed' | 'v3-fixed' | 'custom';
        customPath?: string;
        commitMessage?: string;
      }>(req);

      if (!body.studentId || !body.assignmentId || !body.sampleKey) {
        return sendJson(res, 400, { error: 'Missing studentId, assignmentId, or sampleKey.' });
      }

      const result = await simulateBotPush(body);
      return sendJson(res, 200, result);
    }

    // 15. Demo Reset
    // Route: POST /api/demo/reset
    if (method === 'POST' && pathname === '/api/demo/reset') {
      const resetData = store.resetToSeed();
      return sendJson(res, 200, {
        message: 'Successfully reset database to pristine CIT-U pilot demo state.',
        totalStudents: resetData.students.length,
        totalSubmissions: resetData.submissions.length
      });
    }

    // Static files serving from dist/
    if ((method === 'GET' || method === 'HEAD') && !pathname.startsWith('/api')) {
      const distDir = resolve(__dirname, '../dist');
      let targetFile = resolve(distDir, pathname.replace(/^\//, ''));

      if (!existsSync(targetFile) || pathname === '/') {
        targetFile = resolve(distDir, 'index.html');
      }

      if (existsSync(targetFile)) {
        const ext = targetFile.split('.').pop() || '';
        const mimeTypes: Record<string, string> = {
          html: 'text/html; charset=utf-8',
          js: 'application/javascript; charset=utf-8',
          css: 'text/css; charset=utf-8',
          svg: 'image/svg+xml',
          json: 'application/json',
          png: 'image/png'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        if (method === 'HEAD') {
          return res.end();
        }
        const fileContent = readFileSync(targetFile);
        return res.end(fileContent);
      }
    }

    // 404 Not Found
    return sendJson(res, 404, { error: `Endpoint not found: ${method} ${pathname}` });
  } catch (err) {
    console.error('Server error:', err);
    return sendJson(res, 500, { error: (err as Error).message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Ariadne Instructor Portal API] Server running on http://localhost:${PORT}`);
  console.log(`[Ariadne Instructor Portal API] Scanner binary: ${BINARY_PATH} (${existsSync(BINARY_PATH) ? 'READY' : 'MISSING'})`);
});
