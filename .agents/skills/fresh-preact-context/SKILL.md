---
name: fresh-preact-context
description: Use this skill when writing, generating, or modifying Preact contexts inside the Fresh-based map-viewer sub-project.
---

# Fresh Preact Context Architecture

When defining a new Preact context inside the `map-viewer` (which uses Deno Fresh), always structure it as a feature folder inside `map-viewer/islands/contexts/`. The folder should contain a set of files that separate the context definition, the provider, the consumer hook, and a barrel export.

## File Structure Pattern

For a context named `my-feature`, the folder structure should be:

```text
map-viewer/islands/contexts/my-feature/
├── index.ts
├── my-feature.context.ts
├── MyFeatureProvider.tsx
└── useMyFeatureContext.ts
```

## Implementation Template

Use the following simple and clean templates for your context structure:

### 1. The Context Definition (`my-feature.context.ts`)

Define the context type and the context object. Provide sensible default values.

```ts
import { createContext } from "preact";

export type MyFeatureContextValue = {
  value: string;
  setValue: (val: string) => void;
};

export const myFeatureContext = createContext<MyFeatureContextValue>({
  value: "",
  setValue: () => {},
});
```

### 2. The Provider Component (`MyFeatureProvider.tsx`)

Implement the provider component that manages the state/logic and passes it down via the context object.

```tsx
import { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { myFeatureContext, MyFeatureContextValue } from "./my-feature.context.ts";

export type MyFeatureProviderProps = {
  children?: ComponentChildren;
};

export function MyFeatureProvider({ children }: MyFeatureProviderProps) {
  const [value, setValue] = useState("");

  const contextValue: MyFeatureContextValue = {
    value,
    setValue,
  };

  return (
    <myFeatureContext.Provider value={contextValue}>
      {children}
    </myFeatureContext.Provider>
  );
}
```

### 3. The Consumer Hook (`useMyFeatureContext.ts`)

Create a custom hook to easily consume the context without needing to manually import `useContext` and the context object every time.

```ts
import { useContext } from "preact/hooks";
import { myFeatureContext, MyFeatureContextValue } from "./my-feature.context.ts";

export function useMyFeatureContext(): MyFeatureContextValue {
  return useContext(myFeatureContext);
}
```

### 4. The Barrel Export (`index.ts`)

Export all elements so they can be easily imported from the directory.

```ts
export * from "./my-feature.context.ts";
export * from "./useMyFeatureContext.ts";
export * from "./MyFeatureProvider.tsx";
```

## Consuming the Context

When consuming the context in components or hooks, **always** use the custom wrapper hook exposed in the barrel (e.g., `useMyFeatureContext()`). **Do not** manually import Preact's native `useContext` and the raw context instance to consume it.
