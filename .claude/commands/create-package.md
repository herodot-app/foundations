Ask the user for:
1. `name` — the package name in kebab-case (e.g. `sphragis`)
2. `description` — a short one-line description of what the package does

Then create the following files under `packages/<name>/`:

---

**`packages/<name>/package.json`**

Use this exact structure, replacing `<name>` and `<description>` with the provided values:

```json
{
  "name": "@herodot-app/<name>",
  "description": "<description>",
  "license": "MIT",
  "keywords": [
    "typescript",
    "library"
  ],
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/<name>.cjs",
  "module": "./dist/<name>.js",
  "types": "./dist/<name>.d.ts",
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "exports": {
    ".": {
      "types": "./dist/<name>.d.ts",
      "import": "./dist/<name>.js",
      "require": "./dist/<name>.cjs"
    }
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsup"
  },
  "tsup": {
    "entry": [
      "src/<name>.ts"
    ],
    "format": [
      "esm",
      "cjs"
    ],
    "dts": true,
    "sourcemap": true,
    "clean": true,
    "outDir": "dist",
    "minify": false
  }
}
```

---

**`packages/<name>/src/<name>.ts`**

A minimal entry point exporting a namespace matching the PascalCase version of `<name>`:

```ts
export namespace <PascalCaseName> {
  // TODO: implement
}
```

---

**`packages/<name>/src/<name>.test.ts`**

A minimal test file:

```ts
import { describe, test } from 'bun:test'
import { <PascalCaseName> } from './<name>'

describe('<PascalCaseName>', () => {
  test.todo('implement tests')
})
```

---

**`packages/<name>/tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,

    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
```

---

**`packages/<name>/README.md`**

```md
# @herodot-app/<name>

<description>

## Installation

\`\`\`sh
bun add @herodot-app/<name>
\`\`\`

## Usage

\`\`\`ts
import { <PascalCaseName> } from '@herodot-app/<name>'
\`\`\`

## License

MIT
```

---

After creating the files, remind the user to run `bun install` from the monorepo root to register the new workspace package.
