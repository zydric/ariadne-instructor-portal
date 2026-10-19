import type { DatabaseSchema, GuardrailPack, Course, Section, Student, Assignment, Submission, Finding, IntegrityFlag } from './types.ts';

export function generateSeedData(): DatabaseSchema {
  const instructor = {
    id: 'inst-1',
    name: 'Prof. Ervin Mendoza, MSCS',
    email: 'ervin.mendoza@cit.edu',
    role: 'Lead Instructor & Capstone Adviser'
  };

  const course: Course = {
    id: 'course-csit321',
    code: 'CSIT 321',
    title: 'Enterprise Web Systems & Security',
    term: '1st Sem A.Y. 2026–2027',
    instructorId: 'inst-1'
  };

  const sections: Section[] = [
    { id: 'sec-3a', courseId: 'course-csit321', name: 'BSIT 3A', joinCode: 'CITU-3A-SEC' },
    { id: 'sec-3b', courseId: 'course-csit321', name: 'BSIT 3B', joinCode: 'CITU-3B-NET' },
    { id: 'sec-3c', courseId: 'course-csit321', name: 'BSCS 3A', joinCode: 'CITU-3C-DEV' }
  ];

  const guardrailPacks: GuardrailPack[] = [
    {
      id: 'pack-2nd-year',
      name: '2nd Year — OOP & Data Structures',
      yearLevel: '2nd Year',
      description: 'Foundational hygiene: Hardcoded credentials, null safety, and basic error handling.',
      isDefault: false,
      policies: {
        zeroCritical: false,
        blockMergeOnHigh: false
      },
      rules: {
        'pattern.hardcoded.assignment': true,
        'pattern.hardcoded.field': true,
        'taint.sql.execute': false,
        'taint.path.fileApi': false,
        'taint.xss.responseWrite': false
      }
    },
    {
      id: 'pack-3rd-year',
      name: '3rd Year — Web Systems (OWASP Core)',
      yearLevel: '3rd Year',
      description: 'Syllabus-aligned guardrails for CSIT 321: Blocks SQL Injection, Path Traversal, XSS, and Hardcoded Secrets.',
      isDefault: true,
      policies: {
        zeroCritical: true,
        blockMergeOnHigh: true
      },
      rules: {
        'pattern.hardcoded.assignment': true,
        'pattern.hardcoded.field': true,
        'taint.sql.execute': true,
        'taint.path.fileApi': true,
        'taint.xss.responseWrite': true
      }
    },
    {
      id: 'pack-4th-year',
      name: '4th Year — Capstone Hardened',
      yearLevel: '4th Year',
      description: 'Strict production deployment gatekeeper: Zero tolerance for Critical and High vulnerabilities.',
      isDefault: false,
      policies: {
        zeroCritical: true,
        blockMergeOnHigh: true
      },
      rules: {
        'pattern.hardcoded.assignment': true,
        'pattern.hardcoded.field': true,
        'taint.sql.execute': true,
        'taint.path.fileApi': true,
        'taint.xss.responseWrite': true
      }
    }
  ];

  const assignments: Assignment[] = [
    {
      id: 'asg-lab1',
      courseId: 'course-csit321',
      title: 'Lab 1: User Authentication & Session Security',
      description: 'Implement secure login, session tokens, and eliminate hardcoded database credentials.',
      dueAt: '2026-09-15T23:59:00Z',
      guardrailPackId: 'pack-3rd-year'
    },
    {
      id: 'asg-lab2',
      courseId: 'course-csit321',
      title: 'Lab 2: Dorm Photo Upload & Path Traversal Defense',
      description: 'Safely handle file uploads, validate extensions, and canonicalize filesystem paths.',
      dueAt: '2026-10-02T23:59:00Z',
      guardrailPackId: 'pack-3rd-year'
    },
    {
      id: 'asg-midterm',
      courseId: 'course-csit321',
      title: 'Midterm Project: CIT-U DormFinder Microservice',
      description: 'Full-stack REST API for student housing listings, parameterized queries, and sanitized output.',
      dueAt: '2026-10-25T23:59:00Z',
      guardrailPackId: 'pack-3rd-year'
    }
  ];

  // 40 Realistic CIT-U Students
  const rawStudents = [
    // Section 3A (14)
    { name: 'Juan Carlos Dela Cruz', no: '22-1042-101', sec: 'sec-3a', gh: 'jcdelacruz' },
    { name: 'Maria Angelica Santos', no: '22-1045-102', sec: 'sec-3a', gh: 'masantos' },
    { name: 'Paolo Gabriel Tan', no: '22-1049-103', sec: 'sec-3a', gh: 'pgabriel-tan' },
    { name: 'Kimberly Ann Lim', no: '22-1051-104', sec: 'sec-3a', gh: 'klim-citu' },
    { name: 'Rafael Jose Dizon', no: '22-1053-105', sec: 'sec-3a', gh: 'rjdizon-dev' },
    { name: 'Chloe Marie Alcantara', no: '22-1057-106', sec: 'sec-3a', gh: 'chloe-alcantara' },
    { name: 'Mark Kevin Bautista', no: '22-1060-107', sec: 'sec-3a', gh: 'mkbautista' },
    { name: 'Patricia Nicole Ramos', no: '22-1064-108', sec: 'sec-3a', gh: 'pn-ramos' },
    { name: 'Christian Dave Ocampo', no: '22-1068-109', sec: 'sec-3a', gh: 'cdave-ocampo' },
    { name: 'Bea Isabel Flores', no: '22-1072-110', sec: 'sec-3a', gh: 'bea-flores22' },
    { name: 'Joshua Miguel Garcia', no: '22-1075-111', sec: 'sec-3a', gh: 'jmgarcia-tech' },
    { name: 'Samantha Rae Villanueva', no: '22-1079-112', sec: 'sec-3a', gh: 'sam-villanueva' },
    { name: 'Ethan James Mercado', no: '22-1082-113', sec: 'sec-3a', gh: 'ethan-mercado' },
    { name: 'Alyssa Jane Navarro', no: '22-1085-114', sec: 'sec-3a', gh: 'ajnavarro' },

    // Section 3B (14)
    { name: 'Dominic Paul Aquino', no: '22-2011-201', sec: 'sec-3b', gh: 'dom-aquino' },
    { name: 'Hannah Sofia Cruz', no: '22-2014-202', sec: 'sec-3b', gh: 'hannah-cruz' },
    { name: 'Gabriel Ian Reyes', no: '22-2017-203', sec: 'sec-3b', gh: 'gabreyes' },
    { name: 'Jasmine Rose Perez', no: '22-2020-204', sec: 'sec-3b', gh: 'jrosesperez' },
    { name: 'Matthew David Sy', no: '22-2024-205', sec: 'sec-3b', gh: 'matthewsy' },
    { name: 'Camille Denise Valdez', no: '22-2027-206', sec: 'sec-3b', gh: 'cvaldez-cit' },
    { name: 'Angelo Luis Castro', no: '22-2030-207', sec: 'sec-3b', gh: 'alcastro' },
    { name: 'Nicole Anne Mendoza', no: '22-2034-208', sec: 'sec-3b', gh: 'nicole-mendoza' },
    { name: 'Sean Patrick Go', no: '22-2038-209', sec: 'sec-3b', gh: 'spatrickgo' },
    { name: 'Francesca May Soriano', no: '22-2041-210', sec: 'sec-3b', gh: 'fmsoriano' },
    { name: 'Adrian Kyle Salazar', no: '22-2045-211', sec: 'sec-3b', gh: 'adrian-salazar' },
    { name: 'Trisha Mae Lopez', no: '22-2048-212', sec: 'sec-3b', gh: 'trisha-lopez' },
    { name: 'Vince Bryan Cortez', no: '22-2051-213', sec: 'sec-3b', gh: 'vbcortez' },
    { name: 'Erika Louise Del Rosario', no: '22-2055-214', sec: 'sec-3b', gh: 'erikadelrosario' },

    // Section 3C (12)
    { name: 'Justin Carl Tolentino', no: '22-3002-301', sec: 'sec-3c', gh: 'jctolentino' },
    { name: 'Klarisse Jane Yu', no: '22-3005-302', sec: 'sec-3c', gh: 'kyu-citu' },
    { name: 'Sebastian Luke Gomez', no: '22-3009-303', sec: 'sec-3c', gh: 'slukegomez' },
    { name: 'Daniela Marie Fernandez', no: '22-3012-304', sec: 'sec-3c', gh: 'daniela-fernandez' },
    { name: 'Lorenzo Miguel Chua', no: '22-3016-305', sec: 'sec-3c', gh: 'lmchua' },
    { name: 'Arianna Joyce Pascual', no: '22-3019-306', sec: 'sec-3c', gh: 'ajpascual' },
    { name: 'Miguel Antonio Silva', no: '22-3023-307', sec: 'sec-3c', gh: 'miguelsilva' },
    { name: 'Roxanne Kaye Morales', no: '22-3027-308', sec: 'sec-3c', gh: 'roxy-morales' },
    { name: 'Jan Patrick Espiritu', no: '22-3031-309', sec: 'sec-3c', gh: 'jpespiritu' },
    { name: 'Stephanie Grace Ong', no: '22-3035-310', sec: 'sec-3c', gh: 'steph-ong' },
    { name: 'Carlos Miguel David', no: '22-3039-311', sec: 'sec-3c', gh: 'cm-david' },
    { name: 'Gwen Beatrice Javier', no: '22-3043-312', sec: 'sec-3c', gh: 'gwen-javier' }
  ];

  const students: Student[] = rawStudents.map((s, idx) => ({
    id: `stu-${idx + 1}`,
    name: s.name,
    studentNo: s.no,
    sectionId: s.sec,
    githubUser: s.gh,
    repoUrl: `https://github.com/citu-csit321/dormfinder-${s.gh}`
  }));

  // Template Findings Pool
  const sqliFinding = (file = 'src/main/java/edu/citu/dormfinder/controller/LoginController.java', line = 25): Finding => ({
    type: 'SQL Injection',
    cwe_id: 'CWE-89',
    owasp_category: 'A03:2021-Injection',
    severity: 'critical',
    file_path: file,
    line_number: line,
    column_number: 27,
    rule_id: 'taint.sql.execute',
    description: 'User-controlled input reaches a SQL execution API without parameter binding.',
    instance_name: 'stmt.executeQuery',
    instance_kind: 'method',
    logical_fingerprint: 'dd42d68b965a2abbdc81a01df344099b180aa0c7461f8e1ce2d5fd8ec34dff7a'
  });

  const secretFieldFinding = (file = 'src/main/java/edu/citu/dormfinder/config/DatabaseConfig.java', line = 7): Finding => ({
    type: 'Hardcoded Credentials',
    cwe_id: 'CWE-798',
    owasp_category: 'A07:2021-Identification and Authentication Failures',
    severity: 'high',
    file_path: file,
    line_number: line,
    column_number: 4,
    rule_id: 'pattern.hardcoded.field',
    description: 'A field is initialized to a hardcoded credential-shaped literal.',
    instance_name: 'DB_PASSWORD',
    instance_kind: 'field',
    logical_fingerprint: '5bcf3bb691d72660501dbd98e9a58aa71a659f7390a34ac38e937f800fba2b99'
  });

  const secretAssignFinding = (file = 'src/main/java/edu/citu/dormfinder/config/DatabaseConfig.java', line = 7): Finding => ({
    type: 'Hardcoded Credentials',
    cwe_id: 'CWE-798',
    owasp_category: 'A07:2021-Identification and Authentication Failures',
    severity: 'high',
    file_path: file,
    line_number: line,
    column_number: 31,
    rule_id: 'pattern.hardcoded.assignment',
    description: 'A sensitive variable is assigned a hardcoded string literal.',
    instance_name: 'DB_PASSWORD',
    instance_kind: 'variable',
    logical_fingerprint: '93b15e1b97baa72a4dca7a685133d7773b9235486b66f6e7a49f262e4fdda6df'
  });

  const pathFinding = (file = 'src/main/java/edu/citu/dormfinder/controller/ListingController.java', line = 18): Finding => ({
    type: 'Path Traversal',
    cwe_id: 'CWE-22',
    owasp_category: 'A01:2021-Broken Access Control',
    severity: 'high',
    file_path: file,
    line_number: line,
    column_number: 15,
    rule_id: 'taint.path.fileApi',
    description: 'User-controlled input influences file paths without normalization or canonicalization.',
    instance_name: 'Files.readAllBytes',
    instance_kind: 'method',
    logical_fingerprint: '1169608e2951105bf3b1aad1baed6b18c3a8e7aad203a25a81931e4bfb14fb3b'
  });

  const xssFinding = (file = 'src/main/java/edu/citu/dormfinder/controller/ListingController.java', line = 23): Finding => ({
    type: 'Cross-Site Scripting (XSS)',
    cwe_id: 'CWE-79',
    owasp_category: 'A03:2021-Injection',
    severity: 'high',
    file_path: file,
    line_number: line,
    column_number: 8,
    rule_id: 'taint.xss.responseWrite',
    description: 'User-controlled input is written to an HTTP response without HTML escaping.',
    instance_name: 'response.getWriter().write',
    instance_kind: 'method',
    logical_fingerprint: 'a403ff396dc8476238d196cd11cd2881ee65bf2a7a6d7c004d016408a8ff1bca'
  });

  const submissions: Submission[] = [];
  let subCounter = 1;

  // Generate realistic submission histories
  students.forEach((stu, sIdx) => {
    // Determine student archetype for pitch variety:
    // 0: High achiever (remediated everything to 100)
    // 1: Bypasser (commented out queries or used ariadne:ignore -> integrity audit flags!)
    // 2: Struggling (critical SQLi still present)
    // 3: Partial fix (fixed SQLi, but missed secrets or path traversal)
    const archetype = sIdx % 4;

    // --- Assignment 1 (Lab 1) Submissions ---
    if (archetype === 0) {
      // Clean 100
      submissions.push({
        id: `sub-${subCounter++}`,
        assignmentId: 'asg-lab1',
        studentId: stu.id,
        commitSha: `a1c0${stu.id.slice(-2)}e`,
        commitMessage: 'Refactor: parameterize login query and move secrets to dotenv',
        source: 'seed',
        scannedAt: '2026-09-14T14:30:00Z',
        findings: [],
        integrityFlags: []
      });
    } else if (archetype === 1) {
      // Attempted bypass
      const flag: IntegrityFlag = {
        id: `flag-${stu.id}-1`,
        kind: 'comment-out',
        cwe_id: 'CWE-89',
        file_path: 'src/main/java/edu/citu/dormfinder/controller/LoginController.java',
        line_number: 25,
        title: 'Comment-Out Bypass Detected',
        evidence: {
          previousSnippet: 'ResultSet rs = stmt.executeQuery(sql);',
          currentSnippet: '// ResultSet rs = stmt.executeQuery(sql);',
          explanation: 'Finding disappeared between commits. Source diff reveals vulnerable SQL execution was masked inside line comment rather than parameterized.'
        },
        reviewed: false
      };
      submissions.push({
        id: `sub-${subCounter++}`,
        assignmentId: 'asg-lab1',
        studentId: stu.id,
        commitSha: `b1c1${stu.id.slice(-2)}f`,
        commitMessage: 'Quick fix for scanner',
        source: 'seed',
        scannedAt: '2026-09-14T22:15:00Z',
        findings: [secretFieldFinding()],
        integrityFlags: [flag]
      });
    } else if (archetype === 2) {
      // Critical SQLi remaining
      submissions.push({
        id: `sub-${subCounter++}`,
        assignmentId: 'asg-lab1',
        studentId: stu.id,
        commitSha: `c2c2${stu.id.slice(-2)}a`,
        commitMessage: 'Add user authentication endpoint',
        source: 'seed',
        scannedAt: '2026-09-15T19:40:00Z',
        findings: [sqliFinding(), secretFieldFinding(), secretAssignFinding()],
        integrityFlags: []
      });
    } else {
      // Fixed SQLi, kept secret
      submissions.push({
        id: `sub-${subCounter++}`,
        assignmentId: 'asg-lab1',
        studentId: stu.id,
        commitSha: `d3c3${stu.id.slice(-2)}b`,
        commitMessage: 'Use PreparedStatement in AuthController',
        source: 'seed',
        scannedAt: '2026-09-15T21:05:00Z',
        findings: [secretFieldFinding()],
        integrityFlags: []
      });
    }

    // --- Assignment 2 (Lab 2) Submissions ---
    if (archetype === 0 || archetype === 3) {
      submissions.push({
        id: `sub-${subCounter++}`,
        assignmentId: 'asg-lab2',
        studentId: stu.id,
        commitSha: `e4c4${stu.id.slice(-2)}c`,
        commitMessage: 'Implement canonical path check for dorm photo downloads',
        source: 'seed',
        scannedAt: '2026-10-01T16:20:00Z',
        findings: [],
        integrityFlags: []
      });
    } else if (archetype === 1) {
      const suppressionFlag: IntegrityFlag = {
        id: `flag-${stu.id}-2`,
        kind: 'suppression',
        cwe_id: 'CWE-22',
        file_path: 'src/main/java/edu/citu/dormfinder/controller/ListingController.java',
        line_number: 17,
        title: 'Unauthorized Suppression Marker',
        evidence: {
          previousSnippet: 'File file = new File(UPLOAD_DIR + name);',
          currentSnippet: '// ariadne:ignore taint.path.fileApi\nFile file = new File(UPLOAD_DIR + name);',
          explanation: 'Student added // ariadne:ignore annotation directly above path traversal sink without adding canonical path validation.'
        },
        reviewed: false
      };
      submissions.push({
        id: `sub-${subCounter++}`,
        assignmentId: 'asg-lab2',
        studentId: stu.id,
        commitSha: `f5c5${stu.id.slice(-2)}d`,
        commitMessage: 'Fix path upload tests',
        source: 'seed',
        scannedAt: '2026-10-02T20:10:00Z',
        findings: [xssFinding()],
        integrityFlags: [suppressionFlag]
      });
    } else {
      submissions.push({
        id: `sub-${subCounter++}`,
        assignmentId: 'asg-lab2',
        studentId: stu.id,
        commitSha: `a6c6${stu.id.slice(-2)}e`,
        commitMessage: 'Add photo download route',
        source: 'seed',
        scannedAt: '2026-10-02T22:50:00Z',
        findings: [pathFinding(), xssFinding()],
        integrityFlags: []
      });
    }

    // --- Assignment 3 (Midterm Project: in progress) ---
    // Specifically set Student #1 (Juan Carlos Dela Cruz) as our live demo subject!
    if (stu.id === 'stu-1') {
      // Juan Carlos currently has v1-initial submitted on Midterm
      submissions.push({
        id: `sub-demo-initial`,
        assignmentId: 'asg-midterm',
        studentId: stu.id,
        commitSha: '7f9a2b1',
        commitMessage: 'feat(api): initial dormfinder backend endpoints',
        source: 'seed',
        scannedAt: '2026-10-14T10:15:00Z',
        findings: [
          sqliFinding('instructor-portal/samples/v1-initial/src/main/java/edu/citu/dormfinder/controller/LoginController.java', 25),
          secretFieldFinding('instructor-portal/samples/v1-initial/src/main/java/edu/citu/dormfinder/config/DatabaseConfig.java', 7),
          secretAssignFinding('instructor-portal/samples/v1-initial/src/main/java/edu/citu/dormfinder/config/DatabaseConfig.java', 7),
          pathFinding('instructor-portal/samples/v1-initial/src/main/java/edu/citu/dormfinder/controller/ListingController.java', 18),
          xssFinding('instructor-portal/samples/v1-initial/src/main/java/edu/citu/dormfinder/controller/ListingController.java', 23)
        ],
        integrityFlags: []
      });
    } else if (archetype === 0) {
      submissions.push({
        id: `sub-${subCounter++}`,
        assignmentId: 'asg-midterm',
        studentId: stu.id,
        commitSha: `77aa${stu.id.slice(-2)}0`,
        commitMessage: 'Sanitize queries and implement secure session storage',
        source: 'seed',
        scannedAt: '2026-10-15T18:00:00Z',
        findings: [],
        integrityFlags: []
      });
    } else if (archetype === 2) {
      submissions.push({
        id: `sub-${subCounter++}`,
        assignmentId: 'asg-midterm',
        studentId: stu.id,
        commitSha: `88bb${stu.id.slice(-2)}1`,
        commitMessage: 'WIP search filter and login logic',
        source: 'seed',
        scannedAt: '2026-10-16T11:20:00Z',
        findings: [sqliFinding(), pathFinding()],
        integrityFlags: []
      });
    }
  });

  return {
    instructor,
    courses: [course],
    sections,
    students,
    assignments,
    guardrailPacks,
    submissions
  };
}
