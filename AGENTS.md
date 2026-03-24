# Scholar-Seek - Agent Guidelines

A Better-T-Stack monorepo with TanStack Start (frontend), ElysiaJS (backend), and Drizzle ORM.

## Quick Reference

- **Dev server**: `bun run dev` (starts both web:3001 and server:3000)
- **Build**: `bun run build`
- **Type check**: `bun run check-types`
- **Format/lint**: `bun x ultracite fix` or `bun run check`
- **Lint check only**: `bun x ultracite check`

## Project Structure

```
apps/
├── web/          # TanStack Start + React frontend (port 3001)
└── server/       # ElysiaJS backend (port 3000)
packages/
├── ui/           # Shared shadcn/ui components (@scholar-seek/ui)
├── db/           # Drizzle schema & queries (@scholar-seek/db)
├── env/          # Environment validation (@scholar-seek/env)
└── config/       # Shared TypeScript config
```

## Database Commands

- `bun run db:start` - Start PostgreSQL via Docker
- `bun run db:push` - Push schema changes
- `bun run db:generate` - Generate migrations
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open Drizzle Studio

## Code Conventions

### Imports
- External imports first, then workspace (`@scholar-seek/*`), then relative
- Use `verbatimModuleSyntax` - type imports must use `import type { X }`
- Example:
```ts
import { Elysia } from "elysia";
import { env } from "@scholar-seek/env/server";
import { db } from "@scholar-seek/db";
import { Button } from "@scholar-seek/ui/components/button";
import { cn } from "@scholar-seek/ui/lib/utils";
import Header from "./components/header";
```

### Formatting
- Tab indentation (enforced by Biome)
- Double quotes for strings
- Import organization handled automatically by Biome

### TypeScript
- Strict mode with `noUncheckedIndexedAccess`
- No unused locals/parameters
- Prefer `as const` for literal types
- Use `unknown` over `any`

### Naming Conventions
- React components: PascalCase files (`Button.tsx`) and names (`Button`)
- Route files: TanStack conventions (`__root.tsx`, `index.tsx`, `[id].tsx`)
- Constants: `UPPER_SNAKE_CASE`
- Functions: camelCase

### Exports
- Page/route components: default export (`export default function HomePage()`)
- Shared components: named export (`export function Button()`)
- Use `export const Route = createFileRoute(...)` for route definitions

### React Components
- Function components only
- Default props via destructuring with defaults
- Use `data-slot` attribute for styling identification

## Framework Patterns

### TanStack Router
- Routes in `apps/web/src/routes/`
- `__root.tsx` for root layout
- File-based routing with `[param]` for dynamic segments

### ElysiaJS Backend
- Single entry point in `apps/server/src/index.ts`
- Use `.use()` for plugins and middleware
- Import env from `@scholar-seek/env/server`

### Drizzle Schema
- Define schemas in `packages/db/src/schema/`
- Export from `packages/db/src/index.ts`
- Use `db` exported instance for queries

### UI Components
- Shared primitives in `packages/ui/src/components/`
- Add components: `npx shadcn@latest add accordion -c packages/ui`
- Import: `import { Button } from "@scholar-seek/ui/components/button"`

---

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Diagnose setup**: `bun x ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.