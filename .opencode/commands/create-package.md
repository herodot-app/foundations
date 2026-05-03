---
description: Create a new package in the monorepo
---

Create a new package using name=$1 and description=$2. The package name is in kebab-case (e.g. `sphragis`). Create the following files under `packages/<name>/`:

---

**`packages/$1/package.json`**

```json
{
  "name": "@herodot-app/$1",
  "description": "$2",
  "license": "MIT",
  "keywords": [
    "typescript",
    "library"
  ],
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/$1.cjs",
  "module": "./dist/$1.js",
  "types": "./dist/$1.d.ts",
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
      "types": "./dist/$1.d.ts",
      "import": "./dist/$1.js",
      "require": "./dist/$1.cjs"
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
      "src/$1.ts"
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

**`packages/$1/src/$1.ts`**

A minimal entry point exporting a namespace matching the PascalCase version of the name:

```ts
export namespace PascalCaseName {
  // TODO: implement
}
```

---

**`packages/$1/src/$1.test.ts`**

A minimal test file:

```ts
import { describe, test } from 'bun:test'
import { PascalCaseName } from './$1'

describe('PascalCaseName', () => {
  test.todo('implement tests')
})
```

---

**`packages/$1/tsconfig.json`**

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

**`packages/$1/README.md`**

```md
# @herodot-app/$1

$2

## Installation

\`\`\`sh
bun add @herodot-app/$1
\`\`\`

## Usage

\`\`\`ts
import { PascalCaseName } from '@herodot-app/$1'
\`\`\`

## License

MIT
```

---

**`packages/$1/moon.yml`**

```yaml
tasks:
  test:
    command: 'bun test'
  lint:
    command: 'biome check'
  build:
    command: 'bun run dist'
```

---

After creating the files, remind the user to run `bun install` from the monorepo root to register the new workspace package.
