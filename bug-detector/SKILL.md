
---
name: bug-detector
description: Diagnose and debug defects in the Smart Campus room availability checker using acceptance criteria, reproducible tests, and minimal fixes. Use when investigating booking validation, interval overlaps, blocked rooms, or unintended mutation of booking data.
---

# Bug Detector

## Purpose
Identify, reproduce, explain, and help repair defects in the Smart Campus room availability checker.

## Procedure
1. Read the acceptance criteria and relevant source code.
2. Reproduce the reported problem with a deterministic input.
3. Record the expected and actual results.
4. Identify the root cause and the specific code responsible.
5. Propose the smallest safe fix.
6. Add a regression test that fails before the fix and passes afterward.
7. Check that booking data is not mutated.
8. Run the targeted regression test, then the complete test suite.
9. Report verification status honestly. Never claim a test passed unless it was run.

## Acceptance criteria
- AC1: Reject invalid time ranges and requests that start in the past.
- AC2: Reject durations longer than 120 minutes; allow exactly 120 minutes.
- AC3: Reject requests for blocked rooms.
- AC4: Reject overlapping bookings but allow intervals that touch at endpoints.
- AC5: Return an unambiguous availability result without changing existing bookings.
- AC6: Preserve clear UI feedback; do not claim UI behavior was verified without evidence.

## Output format
For each defect, report:
- Defect
- Evidence
- Expected result
- Actual result
- Root cause
- Minimal fix
- Regression test
- Verification status

## Quality rules
- Do not invent test results.
- Do not silently rewrite unrelated code.
- Preserve the original behavior except where a verified defect requires a change.
- Distinguish confirmed defects from hypotheses.
- State limitations when source code, execution access, or UI evidence is missing.
