# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LayerCube (魔方小课堂) is a browser-based interactive 3D Rubik's Cube simulator with Layer-by-Layer (LBL) teaching. Built with Next.js 15, React 19, Three.js (via R3F), and Zustand.

Primary language of UI: Chinese (Simplified). Code in English.

## Commands

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm test         # vitest (57 tests: maths, cube, solver)
npx tsc --noEmit  # type check
```

## Architecture

```
src/
├── app/               # Next.js app router (layout, page, globals.css)
├── components/
│   ├── Cube/          # CubeScene (R3F Canvas), RubiksCube (animation), Cubie (single piece)
│   ├── TeachingPanel/ # 7-step LBL teaching UI with progress + formula display
│   ├── Controls/      # ControlBar (scramble, undo/redo, mode toggle, speed, dark mode)
│   └── Layout/        # MobileDrawer (bottom sheet for mobile teaching panel)
├── hooks/
│   ├── useDragRotation.ts   # Click-drag on cube faces → layer rotation
│   ├── useKeyboardShortcuts.ts  # r/R/l/L/u/U/d/D/f/F/b/B, Ctrl+Z, Space, Esc
│   └── useDarkMode.ts       # Class-based dark mode with localStorage
├── lib/
│   ├── maths.ts       # Point (3D vector) + Matrix (3x3) for rotations
│   ├── cube.ts        # Piece class + Cube class (26 pieces, 24 moves, state mgmt)
│   ├── cube-utils.ts  # Scramble generation, notation conversion, color map
│   └── solver/
│       ├── solver.ts        # 7-step LBL solver (ported from pglass/rubik-cube)
│       ├── optimizer.ts     # Move optimizer (inverse cancel, triple collapse, rotation elimination)
│       └── step-detector.ts # detectCurrentStep(cube): 0-7 + STEP_INFO metadata
└── store/
    └── cube-store.ts  # Zustand: cube state, animation queue, undo/redo, teaching mode
```

## Key Design Decisions

- **Cube model**: 26 Piece objects with position Point(x,y,z) ∈ {-1,0,1} and colors[3]. Rotation via matrix multiplication with color-swap on affected axes.
- **Animation**: Model state updates instantly; visual animation is separate (useFrame loop with eased progress). Animation queue ensures moves play sequentially.
- **Drag interaction**: `drag_direction × face_normal` gives rotation axis; `angle_sign = -(cross component)`. Maps to one of 18 face/slice moves via lookup table.
- **Solver**: Direct port of pglass/rubik-cube Python solver. Uses Z-rotation normalization to reuse subroutines per step.
- **Tailwind v4**: CSS-first config (`@import "tailwindcss"` + `@custom-variant dark`).

## Cube Coordinate System

- Front: +Z (green), Back: -Z (blue)
- Right: +X (red), Left: -X (orange)
- Up: +Y (white), Down: -Y (yellow)
- Camera at (4, 3, 4) looking at origin

## Move Notation

Internal: `R`, `Ri`, `L`, `Li`, `U`, `Ui`, etc. Display: `R`, `R'`, `L`, `L'`, `U`, `U'`.
Keyboard: lowercase = CW, Shift = CCW (r→R, R→Ri).
