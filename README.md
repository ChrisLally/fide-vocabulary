# Fide Vocabulary

Canonical vocabulary and registry for foundational Fide entity and reference typing.

The Fide Vocabulary defines the canonical registry for:

- valid entity types
- valid reference types
- allowed entity-type/reference-type combinations
- entity-specific identifier rules

These definitions are used by:

- [Fide ID](https://github.com/fide/id)
- [Fide Context Protocol](https://github.com/fide/context-protocol)
- generated SDKs and docs derived from this repository

Public docs are published at:

- [fide.work/docs/vocabulary](https://fide.work/docs/vocabulary)

## Status

This repository is currently in alpha.

- The active spec line is `spec/v0/`.
- `v0` is mutable and may change incompatibly.
- `v1` should be introduced only when the vocabulary model and compatibility expectations are intentionally stable.

## Source Of Truth

The normative source of truth for the current alpha line is:

- `spec/v0/vocabulary.json`

Generated SDK and docs artifacts derive from that file.

## Repository Structure

- `spec/`: canonical versioned specification artifacts
- `docs/`: human-readable vocabulary docs and generated SDK reference docs
- `sdk/javascript/`: JavaScript/TypeScript SDK package
- `scripts/`: generators for SDK and docs artifacts

## JavaScript SDK

The JavaScript SDK package lives in:

- `sdk/javascript/`

Current package name:

- `@chris-test/fide-vocabulary`

The SDK exports typed access to the vocabulary registry and helper lookup functions.

Additional docs:

- [fide.work/docs/vocabulary/definitions](https://fide.work/docs/vocabulary/definitions)
- [fide.work/docs/vocabulary/sdk/javascript](https://fide.work/docs/vocabulary/sdk/javascript)

## License

Licensed under Apache-2.0. See `LICENSE` for the full text.
