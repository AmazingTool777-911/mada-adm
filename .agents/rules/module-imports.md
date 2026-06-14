---
trigger: model_decision
description: Follow specific order and grouping for module imports in TypeScript files.
---

# Module Imports

Order and group module imports in TypeScript files according to these
guidelines.

---

## Import Order

Imports must be ordered into the following categories, from top to bottom:

1. **Native Node.js Compatibility APIs**: Imports from the Node.js runtime.
   Always use the `node:` prefix.
   ```ts
   import { join } from "node:path";
   import { Database } from "node:sqlite";
   ```

2. **Remote Standard Libraries (JSR @std)**: Standard libraries from JSR.
   ```ts
   import { assert } from "@std/assert";
   import { copy } from "jsr:@std/io";
   ```

3. **Remote Non-Standard Libraries**: All other external libraries (JSR, NPM,
   etc.).
   ```ts
   import { Command } from "@cliffy/command";
   import { MongoClient } from "mongodb";
   ```

4. **Local Workspace Modules (@scope)**: Modules that belong to other members of
   the workspace.
   - Group multiple sub-paths from the same workspace member together
     line-by-line.
   ```ts
   import { REGIONS } from "@scope/consts";
   import { DB_CONFIG } from "@scope/consts/db";
   import { type User } from "@scope/types";
   ```

5. **Local Relative Modules**: Modules within the same workspace member.
   - Use relative paths (`./`, `../`).
   - **CAUTION**: If a relative import crosses a workspace boundary (references
     a different workspace member), it MUST be changed to a workspace member
     import (`@scope/name`).

---

## Rules

- Always maintain the category order defined above.
- Separate each category with a single blank line.
- Within each category, sort imports alphabetically by their module specifier.
- Group imports from the same workspace package together.
- For mixed imports (types and values), follow the `types-imports` rule.
- Never use relative paths to import from a different workspace package; use
  `@scope/name` instead.
