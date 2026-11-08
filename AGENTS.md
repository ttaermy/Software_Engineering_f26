# Project

Smart Campus Room Availability Checker. A frontend-only application for checking availability of one room using fictional booking data.

## Constraints

- Preserve acceptance criteria AC1–AC6.
- No backend, database, authentication, or booking creation.
- Keep the existing fixed current-time behavior.
- Preserve all existing fictional booking values.
- Do not mutate booking fixtures.

## Engineering Rules

- Keep availability validation as pure functions.
- Keep UI, validation logic, and shared fixture data appropriately separated.
- Prefer minimal, focused changes.
- Apply at most two justified patterns.
- Avoid unnecessary Singleton, Factory, Strategy, Adapter, and class hierarchies.
- Preserve existing desktop and mobile UI behavior.
- Never weaken or delete existing test assertions.

## Selected Refactoring

Extract duplicated room fixture data into `src/lib/room-fixture.ts` and reuse it in the UI and tests.

Do not modify the core availability validation logic.

## Acceptance Criteria

- AC1: Reject start >= end and past requests.
- AC2: Reject durations longer than 120 minutes.
- AC3: Reject a blocked room.
- AC4: Reject overlaps but allow bookings touching only at endpoints.
- AC5: Do not mutate booking data.
- AC6: Preserve clear desktop/mobile feedback.

## Verification

- Run the existing test suite.
- Preserve and verify regression coverage.
- Run the project typecheck command.
- Run the production build.
- Check desktop and mobile UI.
- Report exact commands and results.

## Reporting

- List changed files, explain the refactoring rationale, report test results, and identify remaining limitations.
