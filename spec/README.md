# Fide Vocabulary Spec Sources

This directory contains the canonical specification artifacts for the Fide Vocabulary.

## Source Of Truth

During alpha, the normative editable source of truth is:

- `v0/vocabulary.json`

Changes to the vocabulary should be made there first.

## Alpha Versioning Policy

- `spec/v0/` is the mutable alpha line.
- Breaking changes are allowed during alpha.
- `spec/v1/` should be introduced only when the vocabulary model and compatibility expectations are intentionally stable.

## Generated Artifacts

The spec source is used to generate downstream artifacts, including:

- JavaScript SDK vocabulary exports in `../sdk/javascript/src/spec/index.ts`
- SDK reference docs in `../docs/sdk/javascript/`
- vocabulary definition docs generated from the same canonical source

Generated files should not become the source of truth. Edit `v0/vocabulary.json`, then regenerate.

## Why `vocabulary.json` Is Dense

The current `v0/vocabulary.json` is intentionally doing more than one job during alpha.

- It provides the canonical structured vocabulary data used to generate the JavaScript SDK.
- It also carries the richer rule text, examples, and prose fragments used to generate the vocabulary definition docs.

That means the file currently mixes machine-readable registry data with documentation-oriented normative content.

This is acceptable for `v0`, but the authored structure should be reviewed before `v1`. The `v1` line should reflect an intentional decision about whether this remains a single canonical document or is split into a cleaner source model for long-term maintenance.
