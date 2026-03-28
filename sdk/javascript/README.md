# `@chris-test/fide-vocabulary`

JavaScript/TypeScript SDK for the Fide Vocabulary.

This package provides typed access to the current Fide Vocabulary spec and helper functions for working with Fide entity type definitions.

## Status

This package is in alpha.

- It currently tracks the mutable `v0` vocabulary line.
- Breaking changes are allowed during alpha.
- Consumers should pin exact versions.

## Install

```bash
pnpm add @chris-test/fide-vocabulary
```

## Usage

```ts
import {
  FIDE_VOCABULARY,
  getFideEntityTypeSpecByName,
  getFideEntityTypeSpecByCode,
  listFideEntityTypes,
} from "@chris-test/fide-vocabulary";

const person = getFideEntityTypeSpecByName("Person");
const statement = getFideEntityTypeSpecByCode("00");
const allEntityTypes = listFideEntityTypes();

console.log(FIDE_VOCABULARY.specVersion);
console.log(person.code);
console.log(statement?.description);
console.log(allEntityTypes.length);
```

## Exports

- `FIDE_VOCABULARY`
- `FIDE_ENTITY_TYPES`
- `getFideEntityTypeSpecByName(name)`
- `getFideEntityTypeSpecByCode(code)`
- `listFideEntityTypes()`

## Types

- `FideEntityTypeName`
- `FideEntityTypeCode`
- `FideEntityTypeSpec`
- `FideStandardFit`

## Source Of Truth

The exported vocabulary data is generated from the canonical spec source in:

- `../../spec/v0/vocabulary.json`

Do not edit generated SDK files directly.

## Development

- `pnpm run generate:sdk:spec`
- `pnpm run generate:docs`
- `pnpm run build`
- `pnpm run check-types`
- `pnpm test`
- `pnpm run test:verbose`
