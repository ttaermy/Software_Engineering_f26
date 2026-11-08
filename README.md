# Smart Campus Room Availability Checker

## Overview

The **Smart Campus Room Availability Checker** is a frontend prototype that helps students identify suitable campus rooms and check their availability for a requested time slot.

Users can browse available rooms, filter them by capacity and required equipment, and check whether a selected room is available.

This project is for demonstration purposes only. It uses fictional room and booking data and does not create actual reservations.

## Features

- **Room Catalog:** Browse four fictional campus rooms.
- **Capacity Filtering:** Find rooms that can accommodate the required number of attendees.
- **Equipment Filtering:** Filter rooms by required equipment. All selected equipment items must be available.
- **Room Selection:** Select a room to view its details, capacity, equipment, and existing bookings.
- **Availability Checking:** Check whether a requested time slot is available.
- **Blocked Room Handling:** Blocked rooms remain visible but cannot be reported as available.
- **Empty State:** Displays a message when no rooms match the selected filters.

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Vitest

## Room Catalog

The application includes four fictional rooms:

| Room | Capacity | Equipment | Status |
|---|---:|---|---|
| Library Study Room 204 | 6 | Whiteboard, Power Outlets | Open |
| Engineering Lab 110 | 24 | Projector, Whiteboard, Power Outlets | Open |
| Auditorium 301 | 80 | Projector, Microphone, Stage Lighting | Blocked |
| Collaboration Space A | 12 | TV Screen, Whiteboard | Open |

## Availability Rules

The availability checker follows these rules:

1. The requested start time must be earlier than the end time.
2. Requests cannot start in the past.
3. A requested time slot cannot exceed 120 minutes.
4. Blocked rooms cannot be reported as available.
5. Overlapping bookings make a room unavailable.
6. Bookings that only touch at their endpoints are allowed.
7. Existing booking data must not be modified during availability checks.

## Project Structure

```text
src/
├── lib/
│   ├── availability.ts
│   ├── availability.test.ts
│   ├── filtering.ts
│   ├── filtering.test.ts
│   └── room-fixture.ts
├── App.tsx
├── index.css
└── main.tsx

AGENTS.md
README.md
package.json
```

### Main Files

- `availability.ts` — Core availability validation functions and room-related types.
- `room-fixture.ts` — Shared fictional room catalog and room cloning helper.
- `filtering.ts` — Pure functions for filtering rooms by capacity and equipment.
- `availability.test.ts` — Tests for the original availability rules.
- `filtering.test.ts` — Tests for the room catalog, filtering functions, and availability integration pipeline.
- `App.tsx` — Main React application and user interface.
- `AGENTS.md` — Project requirements, constraints, and engineering guidelines.

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/ttaermy/Software_Engineering_f26
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## Testing and Verification

Run the automated tests:

```bash
npx vitest run
```

Check TypeScript:

```bash
npm run typecheck
```

Create a production build:

```bash
npm run build
```

### Verification Results

The latest reported verification results:

| Command | Result |
|---|---|
| `npx vitest run` | 32 tests passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |

The test suite contains 15 original availability tests and 17 additional catalog, filtering, and pure-function integration tests.

## Limitations

- The application uses fictional room and booking data.
- No backend or database is connected.
- No user authentication is implemented.
- The application checks availability but does not create or confirm reservations.
- Availability information is limited to the predefined room catalog.

## Project Preview

[Open Smart Campus Room Availability Checker](https://smart-campus-room-av-2iqc.bolt.host)

## Author

**Student:** Tomiris Tulebayeva  
**Student ID:** 24B030317  
**Group:** Tue 16–19
