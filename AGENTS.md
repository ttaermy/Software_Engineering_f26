
# AGENTS.md — Smart Campus Room Availability Checker

## 1. Project Purpose

This is a frontend-only React and TypeScript prototype for checking the availability of fictional campus rooms.

The application allows students to:
- Browse a predefined room catalog.
- Filter rooms by capacity and equipment.
- Select a room and inspect its details.
- Check availability for a requested time interval.
- Request an optional automated explanation of the availability result.

The application is for demonstration purposes only. It does not create reservations or connect to a real booking system.

## 2. Architecture

- `src/App.tsx` — Main React application and UI.
- `src/main.tsx` — Application entry point.
- `src/lib/availability.ts` — Deterministic availability validation.
- `src/lib/filtering.ts` — Pure room filtering functions.
- `src/lib/explanation.ts` — Explanation validation, mock adapter, and fallback.
- `src/lib/room-fixture.ts` — Shared fictional room and booking data.
- `src/lib/*.test.ts` — Automated tests.

Keep UI components, business logic, and fixture data separated.

## 3. Non-Negotiable Constraints

- Preserve acceptance criteria AC1–AC6.
- Keep availability checking deterministic.
- Never let an explanation adapter determine or override availability.
- Do not create, modify, or confirm bookings.
- Do not introduce a backend, database, authentication, or real personal data.
- Preserve all existing fictional booking values unless explicitly authorized.
- Do not weaken, delete, or bypass existing test assertions.
- Preserve desktop and mobile behavior.
- Keep validation functions pure where practical.

## 4. Agent Permissions

Agents may:
- Read project files and inspect repository structure.
- Explain existing code and identify potential risks.
- Propose focused code changes.
- Modify files within the approved project scope.
- Add targeted tests for verified defects.
- Run approved local verification commands.
- Update documentation when requested.

Agents must explain the reason for each proposed change.

## 5. Safe Commands

Approved commands include:

```bash
ls -la
ls -R src
cat README.md
cat AGENTS.md
cat package.json
npx vitest run
npm run typecheck
npm run lint
npm run build
npm run dev
```

Do not assume a command is available. Check the environment first.

## 6. Forbidden Operations

Agents must never:

- Read, print, copy, or expose secrets, credentials, API keys, or tokens.
- Access real personal or confidential data.
- Run destructive shell commands or delete project data.
- Run commands such as `rm -rf`, `git reset --hard`, or forced Git operations.
- Modify production environments or publish/deploy the application.
- Push directly to the main branch.
- Install, remove, or upgrade dependencies without explicit approval.
- Change package lock files without approval.
- Disable security checks or remove existing tests to make a build pass.
- Modify unrelated files or introduce unnecessary dependencies.

## 7. Coding Standards

- Use TypeScript and existing project conventions.
- Prefer small, focused changes.
- Avoid unnecessary abstractions and design patterns.
- Keep business logic independent from UI where possible.
- Validate external or user-provided input.
- Handle errors with safe and understandable feedback.
- Add tests for new behavior and repaired defects.

## 8. Design Pattern Policy

Apply at most one focused refactoring when a concrete maintainability problem justifies it.

Consider Strategy or Adapter only when there is a real need for interchangeable behavior or isolated external dependencies.

Do not introduce patterns merely to increase architectural complexity.

## 9. Verification Requirements

After changes:

1. Run `npx vitest run`.
2. Run `npm run typecheck`.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Check affected behavior in the browser when relevant.

Report exact commands, actual results, and tests not executed.

Never claim that an unexecuted test passed.

## 10. Human Review and Approval

- Explain planned changes before making significant modifications.
- Show a summary of modified files.
- Require human approval before dependency changes, deployments, or other high-impact operations.
- Do not merge or publish without explicit human approval.
- Report unresolved risks and limitations.

## 11. Acceptance Criteria

- AC1: Reject start times greater than or equal to end times and requests in the past.
- AC2: Reject durations longer than 120 minutes.
- AC3: Reject blocked rooms.
- AC4: Reject overlapping bookings but allow intervals touching at endpoints.
- AC5: Never mutate existing booking data.
- AC6: Preserve clear desktop and mobile feedback.

## 12. Reporting

For every assigned change, report:
- Purpose and rationale.
- Files inspected and modified.
- Tests added or changed.
- Exact verification commands and results.
- Remaining limitations and risks.
