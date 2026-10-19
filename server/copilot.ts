export interface CopilotLectureNotes {
  cwe: string;
  categoryTitle: string;
  affectedCount: number;
  totalCohort: number;
  percentage: number;
  sectionName: string;
  assignmentTitle: string;
  summary: string;
  talkingPoints: string[];
  codeComparison: {
    insecure: {
      title: string;
      code: string;
      critique: string;
    };
    secure: {
      title: string;
      code: string;
      explanation: string;
    };
  };
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export function generateLectureCoPilot(
  cwe: string,
  affectedCount: number,
  totalCohort: number,
  sectionName: string,
  assignmentTitle: string
): CopilotLectureNotes {
  const percentage = Math.round((affectedCount / Math.max(1, totalCohort)) * 100);

  if (cwe === 'CWE-89' || cwe.toLowerCase().includes('sql')) {
    return {
      cwe: 'CWE-89',
      categoryTitle: 'SQL Injection via Concatenated Queries',
      affectedCount,
      totalCohort,
      percentage,
      sectionName,
      assignmentTitle,
      summary: `${percentage}% (${affectedCount} of ${totalCohort} students) in ${sectionName} concatenated raw HTTP parameters into SQL query strings rather than using parameterized PreparedStatements.`,
      talkingPoints: [
        'Clarify the boundary between SQL code and user data: string concatenation forces the database parser to treat untrusted input as executable SQL syntax.',
        'Contrast dynamic concatenation with PreparedStatement: explain how the database pre-compiles the query execution plan ahead of parameter binding.',
        'Address ORM misconceptions: remind students that even with Hibernate or Spring Data, native queries or JPQL concatenation remain equally vulnerable.'
      ],
      codeComparison: {
        insecure: {
          title: 'Flawed Pattern (Vulnerable Concatenation)',
          code: `// Insecure: User input directly alters query AST\nString sql = "SELECT id FROM users WHERE username = '" + username + "' AND password = '" + password + "'";\nStatement stmt = conn.createStatement();\nResultSet rs = stmt.executeQuery(sql);`,
          critique: 'If username contains "\' OR \'1\'=\'1", the WHERE clause becomes tautological, bypassing authentication without a valid password.'
        },
        secure: {
          title: 'Curricular Reference Pattern (PreparedStatement)',
          code: `// Secure: Placeholders enforce strict data typing\nString sql = "SELECT id FROM users WHERE username = ? AND password = ?";\ntry (PreparedStatement pstmt = conn.prepareStatement(sql)) {\n    pstmt.setString(1, username);\n    pstmt.setString(2, password);\n    try (ResultSet rs = pstmt.executeQuery()) {\n        return rs.next();\n    }\n}`,
          explanation: 'The database engine treats ? strictly as literal data values, preventing malicious syntax escapes regardless of input contents.'
        }
      },
      quiz: [
        {
          question: 'Why does PreparedStatement prevent SQL Injection while string concatenation fails?',
          options: [
            'It strips quotes and special characters from the input string',
            'It compiles the SQL query structure first, binding user inputs strictly as literal parameters',
            'It encrypts the communication channel between application and database',
            'It checks input against an internal blocklist of known SQL keywords'
          ],
          correctIndex: 1,
          explanation: 'Parameter binding separates the query AST compilation from data evaluation. Input cannot change the SQL execution plan.'
        },
        {
          question: 'A student uses an ORM (e.g. Hibernate). Are they automatically immune to SQL Injection?',
          options: [
            'Yes, all modern ORMs prevent SQL injection by default',
            'No, raw queries (createNativeQuery) or concatenated HQL/JPQL can still be exploited',
            'Yes, but only if they use MySQL dialect',
            'No, ORMs are only immune to XSS, not SQL injection'
          ],
          correctIndex: 1,
          explanation: 'String concatenation inside entityManager.createQuery("... " + input) remains vulnerable to HQL/JPQL injection.'
        }
      ]
    };
  }

  if (cwe === 'CWE-798' || cwe.toLowerCase().includes('credential') || cwe.toLowerCase().includes('hardcoded')) {
    return {
      cwe: 'CWE-798',
      categoryTitle: 'Use of Hardcoded Credentials in Configuration',
      affectedCount,
      totalCohort,
      percentage,
      sectionName,
      assignmentTitle,
      summary: `${percentage}% (${affectedCount} students) committed plain-text database credentials, API keys, or JWT secrets directly into Java source files.`,
      talkingPoints: [
        'Code is meant to be shared; configuration belongs in the execution environment (12-Factor App methodology).',
        'Demonstrate Git history persistence: committing a secret once permanently embeds it in repository history even if deleted in the next commit.',
        'Show standard environment variable ingestion via System.getenv() or Spring @Value.'
      ],
      codeComparison: {
        insecure: {
          title: 'Flawed Pattern (Static Hardcoded Credential)',
          code: `public class DatabaseConfig {\n    // Insecure: Secret committed to version control\n    public static final String DB_PASSWORD = "dormfinder2026!";\n}`,
          critique: 'Anyone with read access to the Git repository or decompiled bytecode obtains root database credentials.'
        },
        secure: {
          title: 'Curricular Reference Pattern (Environment Variable)',
          code: `public class DatabaseConfig {\n    // Secure: Secret injected at runtime via environment\n    public static final String DB_PASSWORD = System.getenv("DB_PASSWORD");\n}`,
          explanation: 'Credentials stay outside of version control. The deployment container or .env injects secrets without exposing source code.'
        }
      },
      quiz: [
        {
          question: 'If a student commits a password in commit A, and deletes it in commit B, is the repository secure?',
          options: [
            'Yes, git HEAD no longer contains the secret',
            'No, the secret remains visible in commit history and git log',
            'Yes, if git push was not executed yet',
            'Yes, modern Git servers automatically redact passwords'
          ],
          correctIndex: 1,
          explanation: 'Git is an append-only graph. Every prior commit snapshot retains the full file content unless purged with git-filter-repo.'
        },
        {
          question: 'What is the standard 12-Factor App approach for storing application secrets?',
          options: [
            'Hardcoded in a private class',
            'Injected as environment variables at runtime',
            'Written in a comments header in source code',
            'Encrypted directly in application.properties'
          ],
          correctIndex: 1,
          explanation: 'Storing configuration in environment variables cleanly separates code from deployment credentials.'
        }
      ]
    };
  }

  if (cwe === 'CWE-22' || cwe.toLowerCase().includes('traversal') || cwe.toLowerCase().includes('path')) {
    return {
      cwe: 'CWE-22',
      categoryTitle: 'Improper Limitation of a Pathname (Path Traversal)',
      affectedCount,
      totalCohort,
      percentage,
      sectionName,
      assignmentTitle,
      summary: `${percentage}% (${affectedCount} students) accepted unvalidated filename parameters in file retrieval APIs without canonical path boundary verification.`,
      talkingPoints: [
        'Explain how relative path sequences ("../") navigate outside the intended directory into sensitive system files (e.g. /etc/passwd).',
        'Highlight why simple string checks (like contains("../")) are fragile against URL encoding (%2e%2e%2f) or double encoding.',
        'Teach canonicalization: always resolve File.getCanonicalFile() and verify .startsWith(baseDir.getPath()).'
      ],
      codeComparison: {
        insecure: {
          title: 'Flawed Pattern (Direct String Concatenation)',
          code: `// Insecure: Attacker supplies "../../etc/passwd"\nFile file = new File("/var/dormfinder/uploads/" + filename);\nreturn Files.readAllBytes(file.toPath());`,
          critique: 'Allows arbitrary file reading across the host filesystem because relative parent directory traversals are resolved blindly.'
        },
        secure: {
          title: 'Curricular Reference Pattern (Canonical Path Sandboxing)',
          code: `File baseDir = new File("/var/dormfinder/uploads/").getCanonicalFile();\nFile target = new File(baseDir, filename).getCanonicalFile();\n\nif (!target.getPath().startsWith(baseDir.getPath() + File.separator)) {\n    throw new SecurityException("Access denied: path traversal attempt");\n}\nreturn Files.readAllBytes(target.toPath());`,
          explanation: 'Resolves all symlinks and relative dots (getCanonicalFile), then guarantees the target stays strictly inside the designated upload root.'
        }
      },
      quiz: [
        {
          question: 'Why is filename.replace("../", "") insufficient to prevent path traversal?',
          options: [
            'Because Java does not support string replacement on filenames',
            'Nested inputs like "....//...." collapse into "../" after a single pass',
            'Because path traversal only works in Windows, not Linux',
            'Because files must always be stored in the root directory'
          ],
          correctIndex: 1,
          explanation: 'Single-pass blocklist stripping leaves surviving traversal tokens. Canonical path containment is the only robust defense.'
        },
        {
          question: 'What does File.getCanonicalFile() accomplish?',
          options: [
            'Compresses the target file into a ZIP archive',
            'Resolves all relative dots (".", "..") and symbolic links into an unambiguous absolute path',
            'Checks whether the file has executable permissions',
            'Encrypts the file contents'
          ],
          correctIndex: 1,
          explanation: 'Canonicalization resolves path aliases and relative dots to compute the true physical filesystem path.'
        }
      ]
    };
  }

  // CWE-79 or Default XSS
  return {
    cwe: 'CWE-79',
    categoryTitle: 'Cross-Site Scripting (XSS) in Dynamic Responses',
    affectedCount,
    totalCohort,
    percentage,
    sectionName,
    assignmentTitle,
    summary: `${percentage}% (${affectedCount} students) echoed unescaped request parameters directly into HTTP response HTML buffers.`,
    talkingPoints: [
      'Contrast reflected vs stored XSS: demonstrate how an attacker crafts malicious search links that execute JavaScript in a victim user\'s session.',
      'Explain context-aware encoding: HTML body encoding vs attribute encoding vs script context.',
      'Emphasize frameworks that auto-escape (Thymeleaf, React) vs low-level PrintWriter / innerHTML pitfalls.'
    ],
    codeComparison: {
      insecure: {
        title: 'Flawed Pattern (Raw HTML Output)',
        code: `// Insecure: User input directly rendered as HTML markup\nresponse.getWriter().write("<h2>Results for " + query + "</h2>");`,
        critique: 'If query contains "<script>fetch(\'/cookie?c=\'+document.cookie)</script>", browser executes untrusted script in the user\'s context.'
      },
      secure: {
        title: 'Curricular Reference Pattern (HTML Entity Escaping)',
        code: `// Secure: HTML entity encoding neutralizes executable tags\nString safeQuery = org.springframework.web.util.HtmlUtils.htmlEscape(query);\nresponse.getWriter().write("<h2>Results for " + safeQuery + "</h2>");`,
        explanation: 'Transforms <, >, &, and quotes into safe HTML entities (&lt;, &gt;), preventing browser script execution while displaying characters correctly.'
      }
    },
    quiz: [
      {
        question: 'What is the primary objective of HTML entity escaping in web applications?',
        options: [
          'Speed up web page rendering time',
          'Convert markup characters like < and > so the browser treats them strictly as display text, not executable tags',
          'Encrypt the user session cookie',
          'Prevent SQL database corruption'
        ],
        correctIndex: 1,
        explanation: 'Escaping ensures user-supplied syntax is parsed as character data rather than actionable HTML tags or script directives.'
      },
      {
        question: 'Which of the following headers provides defense-in-depth against XSS exploitation?',
        options: [
          'Access-Control-Allow-Origin: *',
          'Content-Security-Policy: default-src \'self\'',
          'X-Powered-By: Spring',
          'Cache-Control: no-cache'
        ],
        correctIndex: 1,
        explanation: 'Content-Security-Policy (CSP) restricts where scripts can load from and disables inline execution of malicious scripts.'
      }
    ]
  };
}
