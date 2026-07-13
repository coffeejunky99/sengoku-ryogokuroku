# AGENTS.md

## 1. Purpose

This repository contains **戦国領国録**, a real-time domain-management simulation game set in Japan's Sengoku period.

This file defines the mandatory operating rules for OpenAI Codex and every automated coding agent working in this repository.

The project is designed so that the human owner primarily performs:

- specification decisions
- review
- playtesting
- balance evaluation
- acceptance testing

Codex performs implementation work, but Codex must not make unapproved game-design decisions.

---

## 2. Source of Truth

The specification hierarchy is strict.

1. `docs/GDD/戦国領国録_GDD_v0.1.docx`
2. `docs/design/戦国領国録_データ設計書_v0.1.docx`
3. `docs/design/戦国領国録_技術設計書_v0.1.docx`
4. the task-specific instruction file under `docs/codex/`
5. existing code and tests

The GDD is the only authority for game design.

If code, tests, task instructions, data, or documentation conflict with the GDD:

- do not silently choose one
- stop implementation of the conflicting scope
- identify the conflict
- propose the smallest necessary specification change
- wait for approval
- update the GDD before implementing the changed design

Do not add, remove, reinterpret, or rebalance a game feature that is not defined in the GDD.

---

## 3. Mandatory Technology Stack

Use the following technologies.

- Phaser
- React
- TypeScript
- Zustand
- Vite
- Capacitor
- IndexedDB
- SQLite
- Vitest
- Playwright

Do not replace these technologies without an approved architecture change.

Do not introduce additional production dependencies merely because they are convenient.

Before adding a dependency:

1. confirm the existing stack cannot reasonably solve the problem
2. explain the maintenance and bundle-size impact
3. verify mobile compatibility
4. obtain approval

---

## 4. Architecture Rules

### 4.1 Dependency Direction

Allowed dependency direction:

```text
presentation -> application -> domain
infrastructure -> application ports
infrastructure -> domain types
```

Forbidden dependencies:

```text
domain -> React
domain -> Phaser
domain -> Capacitor
domain -> infrastructure
React component -> persistence implementation
Phaser scene -> direct Zustand internal mutation
```

### 4.2 Phaser Responsibilities

Phaser owns:

- national map rendering
- battle-field rendering
- camera
- map interaction
- army movement visualization
- battle effects
- pooled visual objects

Phaser must not own authoritative game state.

Phaser scenes must not contain economic, diplomatic, AI, save, or battle-resolution rules.

### 4.3 React Responsibilities

React owns:

- screens
- panels
- castle UI
- officer UI
- diplomacy UI
- army formation UI
- event UI
- settings UI
- save and load UI
- notifications and confirmation dialogs

React components must not contain game-rule calculations.

React must issue typed commands or call application use cases.

### 4.4 Zustand Responsibilities

Zustand owns:

- normalized game state
- UI state
- selection state
- time state
- user settings

Derived values should be calculated through selectors.

Do not duplicate derived values in the store unless a measured performance issue proves caching is necessary.

### 4.5 Domain Responsibilities

The domain layer owns:

- entities
- value objects
- game rules
- calculations
- state transitions
- AI scoring
- event conditions
- battle resolution
- validation

Domain logic must be testable without rendering Phaser or React.

### 4.6 Infrastructure Responsibilities

Infrastructure owns:

- JSON and CSV loading
- schema validation
- IndexedDB
- SQLite
- save migrations
- logging
- asset loading
- platform adapters

Infrastructure must not decide game rules.

---

## 5. Data Rules

Game data must not be hardcoded in UI components, Phaser scenes, or domain services.

Store the following in JSON or CSV-backed master data.

- officers
- castles
- clans
- routes
- terrain
- troop types
- facilities
- events
- AI personalities
- initial diplomatic relations
- scenario initial state

Use stable IDs.

Do not use display names as identifiers.

ID naming examples:

```text
clan_takeda
general_takeda_shingen
castle_kofu
troop_cavalry
facility_market
event_kawanakajima_standoff
```

All external data must be treated as `unknown` until validated.

Do not use `eval`, `Function`, or executable scripts inside event or AI data.

Test fixtures must be separated from production master data.

Temporary values must never remain in production data.

---

## 6. TypeScript Rules

TypeScript strict mode is mandatory.

The following are prohibited:

- `any`
- unchecked type assertions used to bypass errors
- `@ts-ignore`
- broad `eslint-disable`
- implicit `undefined` handling
- stringly typed event names when a typed union is possible

Use:

- explicit interfaces and types
- discriminated unions
- readonly master definitions
- branded IDs
- exhaustive `switch` statements
- `unknown` for untrusted input
- domain-specific error types

Magic numbers are prohibited.

Define named constants for:

- time intervals
- limits
- thresholds
- multipliers
- retries
- animation durations
- save-slot counts

Comments must explain **why** a decision exists.

Do not write comments that merely restate the code.

---

## 7. File and Module Rules

Keep files focused on one responsibility.

Avoid:

- god classes
- giant stores
- giant React components
- giant Phaser scenes
- catch-all utility files
- circular dependencies
- duplicated implementations
- hidden cross-module mutation

Guideline:

- split a file when it contains multiple unrelated responsibilities
- move reusable logic into domain or application modules
- keep feature-specific code inside the relevant feature module
- expose only intentional public APIs

Do not create speculative abstractions for features not present in the GDD.

---

## 8. UI Rules

Design for smartphones first.

Requirements:

- simple hierarchy
- high information density
- modern interface structure
- restrained visual decoration
- touch targets large enough for mobile
- safe-area support
- no required long-press interaction
- important commands require confirmation
- command previews show cost, duration, and expected effects
- colors must not be the only means of identifying clans
- keyboard, mouse, and touch should share behavior where practical

Follow Apple Human Interface Guidelines in spirit without copying platform UI mechanically.

Do not redesign game behavior while implementing UI.

---

## 9. Game Simulation Rules

Separate rendering frequency from simulation frequency.

Use a fixed simulation step.

Supported time scales are defined by the GDD:

```text
0x
1x
2x
4x
```

Simulation behavior must not depend on device frame rate.

Random behavior must use a controlled RNG state that can be saved and restored.

Given the same:

- game state
- command sequence
- RNG state

the simulation must produce the same result.

---

## 10. AI Rules

AI must be rule-based and explainable.

Required process:

```text
observe
-> generate candidates
-> score candidates
-> select action
-> execute
-> record reasons
```

AI must not choose important actions using randomness alone.

For important decisions, retain:

- candidate actions
- score breakdown
- selected action
- reason codes
- decision date

The player-facing UI must be able to explain important AI decisions.

Do not implement machine-learning or opaque external AI services.

---

## 11. Save Data Rules

Save data must include:

- schema version
- game version
- save metadata
- checksum
- serialized game state
- RNG state

Persistence implementations:

- Web: IndexedDB
- iOS and Android: SQLite
- Tests: in-memory repository

All persistence backends must satisfy the same repository contract tests.

Save writes must be atomic:

1. validate state
2. serialize
3. calculate checksum
4. write temporary record
5. verify temporary record
6. replace active save
7. preserve previous valid save on failure

Never break existing save data without a migration.

Every schema change must include:

- version change
- migration
- migration test
- backward-compatibility review

---

## 12. Required Work Process

Implement one feature or one focused change at a time.

### 12.1 Before Implementation

Complete all of the following:

1. read the task-specific instruction
2. read the relevant GDD sections
3. inspect related code
4. inspect related tests
5. inspect dependencies and callers
6. identify affected files
7. confirm the requested behavior already exists in the specification
8. identify risks and edge cases

Do not begin by editing the first matching file.

### 12.2 During Implementation

- keep the change within the requested scope
- preserve existing public behavior unless the task explicitly changes it
- prefer small, reviewable changes
- add types before relying on data
- add or update tests together with logic
- remove obsolete code created by the change
- do not leave temporary debug code
- do not leave commented-out code
- do not leave TODOs without explicit approval

### 12.3 After Implementation

Run all relevant checks.

Minimum required checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Run Playwright when the change affects:

- user flows
- routing
- screen layout
- Phaser interaction
- save and load
- mobile behavior

```bash
npm run test:e2e
```

For UI changes:

- verify the target screen visually
- verify a smartphone viewport
- check overflow, safe area, tap targets, and text truncation

Do not report completion while any required check is failing.

---

## 13. Testing Rules

New domain logic requires tests.

At minimum, test:

- normal behavior
- boundary values
- invalid input
- state-transition guards
- deterministic behavior
- regression scenario when fixing a bug

Use fixed RNG seeds in tests.

Important test categories:

- unit tests for domain rules
- integration tests for application use cases
- repository contract tests
- save migration tests
- React component tests
- Phaser bridge tests
- Playwright end-to-end tests
- visual regression tests for major screens

A bug fix is incomplete without a regression test unless the failure cannot reasonably be automated. In that case, document the manual verification procedure.

---

## 14. Performance Rules

Target:

- 60 FPS during normal play
- minimum 30 FPS on supported devices
- screen transition within 1 second
- save operation within 3 seconds for the vertical slice

Avoid:

- unnecessary React rerenders
- full-store subscriptions
- recreating Phaser objects every frame
- allocating temporary arrays and objects in hot loops
- evaluating all AI clans on the same tick
- rebuilding static map elements
- serializing save data every frame

Prefer:

- Zustand selectors
- memoized presentation values
- object pools
- view culling
- differential updates
- distributed AI scheduling
- profiling before optimization

Performance changes must include measurements or a reproducible benchmark.

---

## 15. Error Handling Rules

Do not swallow errors.

Use distinct error categories:

- domain errors
- validation errors
- persistence errors
- infrastructure errors
- unexpected errors

User-facing messages and developer diagnostics must be separated.

Promises must not be left unhandled.

React presentation boundaries must use error boundaries where appropriate.

A failed save must not destroy the previous valid save.

A failed data validation must prevent the invalid scenario from starting.

---

## 16. Git Rules

Prefer small commits.

Each commit must have one purpose.

Use Conventional Commits.

Examples:

```text
feat(map): add typed castle selection bridge
fix(save): preserve previous slot after write failure
test(ai): cover alliance refusal score breakdown
refactor(domain): extract movement cost calculator
docs(gdd): clarify siege surrender condition
```

Do not mix:

- dependency upgrades with feature work
- formatting-only changes with logic changes
- unrelated refactors with bug fixes
- generated files with unrelated manual edits

Do not rewrite history or force-push unless explicitly instructed.

---

## 17. Documentation Rules

When implementation changes technical behavior, update the corresponding technical documentation.

When game behavior changes:

1. propose the change
2. obtain approval
3. update the GDD
4. update data or technical design documents
5. implement
6. test

Do not treat code as a substitute for missing specification.

Keep task-specific implementation instructions under:

```text
docs/codex/
```

Keep design documents under:

```text
docs/design/
```

---

## 18. Prohibited Actions

The following are prohibited:

- ignoring the GDD
- inventing missing game rules
- silently changing balance
- changing the mandated technology stack
- adding unapproved production dependencies
- using `any`
- leaving type errors
- leaving lint errors
- leaving failing tests
- leaving TODOs
- leaving temporary production data
- copying copyrighted assets or text
- hardcoding master data in source code
- storing authoritative game state inside Phaser objects
- writing game logic directly inside React components
- implementing duplicate logic
- creating circular dependencies
- creating god classes
- masking errors with type assertions
- declaring work complete without verification

---

## 19. Handling Missing Specifications

When required behavior is not specified:

1. state that the specification is missing
2. identify the exact GDD section affected
3. present the smallest viable options
4. describe tradeoffs
5. recommend one option
6. do not implement the choice until approved

Test-only placeholders may be used only under test fixtures.

Test placeholders must never appear in production data or production UI.

---

## 20. Required Completion Report

Every implementation report must use this order.

### 1. 問題の整理

State the requested change and the relevant specification.

### 2. 実装方針

Explain the architecture and why it was selected.

### 3. 実装内容

List the changed files and behavior.

### 4. 影響範囲

State affected modules, data, UI, saves, and compatibility.

### 5. テスト内容

List commands executed and test results.

### 6. 完了条件

Confirm each acceptance condition or clearly state what remains incomplete.

Do not return code alone.

Do not claim success if verification is incomplete.

---

## 21. Vertical Slice Scope

The current approved scope is:

- 1 scenario
- 4 clans
- 3 playable clans
- 10 castles
- 30 officers
- 3 troop types
- 6 facilities
- 3 battlefield maps
- 3 historical events
- manual save slots: 3
- autosave slots: 1

Excluded from the vertical slice:

- nationwide 300-castle map
- 1,000 or more officers
- naval combat
- navy units
- marriage
- complex succession disputes
- officer skill trees
- online multiplayer
- rankings
- gacha
- advertising
- cloud saves
- multiple paid scenarios

Do not implement excluded features without an approved GDD revision.

---

## 22. Definition of Done

A task is complete only when all applicable conditions are satisfied.

- requested behavior matches the GDD
- architecture rules are preserved
- TypeScript strict passes
- lint passes
- unit and integration tests pass
- build passes
- E2E passes when applicable
- UI is visually verified when applicable
- save compatibility is preserved when applicable
- documentation is updated when applicable
- obsolete code is removed
- no debug code remains
- no unapproved TODO remains
- completion report is accurate

Incomplete work must be reported as incomplete.
