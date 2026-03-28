# Contributing to Fide Vocabulary

Thank you for contributing to the Fide Vocabulary.

This repository is spec-first. The vocabulary specification is the primary product, and the SDK and documentation are generated downstream artifacts.

## Source Of Truth

For the current alpha line, the normative source of truth is:

- `spec/v0/vocabulary.json`

If you are changing the vocabulary, start there.

Do not treat generated SDK or generated docs files as the canonical place to make vocabulary changes.

## Current Stability Policy

The repository is currently in alpha.

- `spec/v0/` is mutable.
- Breaking changes are allowed during alpha.
- `spec/v1/` should be introduced only when the vocabulary model and compatibility expectations are intentionally stable.

Even during alpha, changes should still be deliberate and easy to review.

## What Changes Belong Here

This repository is responsible for:

- Fide entity type definitions
- entity type codes
- standards alignment metadata
- entity-specific Fide ID rules
- generated SDK vocabulary exports
- generated vocabulary documentation

Changes that belong somewhere else should be made in the relevant repository instead:

- Fide ID method behavior belongs in `fide/id`
- Fide Context Protocol statement rules belong in `fide/context-protocol`

## How To Contribute

1. Open or reference an issue describing the change.
2. Update `spec/v0/vocabulary.json` if the vocabulary itself is changing.
3. Regenerate affected artifacts.
4. Review the generated diff carefully.
5. Submit a focused pull request with a clear explanation of the change.

## Generated Files

The spec currently drives generated artifacts, including:

- `sdk/javascript/src/spec/index.ts`
- `docs/sdk/javascript/`
- `docs/definitions/`

If you change the spec, regenerate the corresponding outputs before submitting your change.

Generated files should not be edited by hand unless the change is specifically to the generator or the generated-file post-processing logic.

## Local Commands

From `sdk/javascript/`:

```bash
pnpm run generate:sdk:spec
pnpm run generate:docs
pnpm run build
pnpm run check-types
pnpm test
```

## Pull Request Expectations

Keep pull requests focused.

A good pull request for this repository should make it obvious:

- what changed in the vocabulary
- whether the change is breaking, additive, or editorial
- why the change belongs in the vocabulary rather than in docs or a downstream package
- whether generated artifacts were refreshed

If a change alters an existing entity code, entity meaning, or identifier rule, call that out explicitly in the PR description.

## Editing Guidance

When contributing to `spec/v0/vocabulary.json`:

- preserve the existing naming and structural conventions unless the structure itself is the subject of the change
- keep descriptions and boundaries concise and normative in tone
- keep examples concrete
- prefer additive changes over semantic redefinition of existing entities

The current `v0` spec file is intentionally dense because it feeds both SDK generation and documentation generation. That structure is acceptable for alpha, but it should be treated carefully.

## Before Opening A PR

Check the following:

- the vocabulary change is made in `spec/v0/vocabulary.json`
- generated artifacts are in sync
- the SDK still builds
- tests still pass
- the PR description explains the compatibility impact

## AI Use

If you used AI assistance to prepare a contribution, disclose that in the pull request.

You are still responsible for understanding the change, reviewing the generated output, and ensuring the contribution is technically correct.
