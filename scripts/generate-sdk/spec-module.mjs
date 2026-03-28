#!/usr/bin/env node

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, "..", "..");
const VOCABULARY_SPEC_PATH = resolve(PACKAGE_ROOT, "spec/v0/vocabulary.json");
const SDK_SPEC_OUTPUT = resolve(PACKAGE_ROOT, "sdk/javascript/src/spec/index.ts");

function ensureString(value, path) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid string at ${path}`);
  }
  return value;
}

function normalizeSpec(raw) {
  const namespaceUrl = ensureString(raw.namespaceUrl, "namespaceUrl");
  const specVersion = ensureString(raw.specVersion, "specVersion");
  const specDate = ensureString(raw.specDate, "specDate");

  if (!raw.entityTypes || typeof raw.entityTypes !== "object") {
    throw new Error("Invalid entityTypes object");
  }

  const entities = Object.entries(raw.entityTypes).map(([name, value]) => {
    if (!value || typeof value !== "object") throw new Error(`Invalid entity type entry for ${name}`);
    const standards = Array.isArray(value.standards)
      ? value.standards.map((standard, idx) => ensureString(standard, `${name}.standards[${idx}]`))
      : [];
    return {
      name: ensureString(name, "entityTypes key"),
      code: ensureString(value.code, `${name}.code`),
      layer: ensureString(value.layer, `${name}.layer`),
      standards,
      standardFit: ensureString(value.standardFit, `${name}.standardFit`),
      description: ensureString(value.description, `${name}.description`),
      litmus: ensureString(value.litmus, `${name}.litmus`),
    };
  });

  return { namespaceUrl, specVersion, specDate, entities };
}

function buildSpecModule(spec) {
  const entityBlocks = spec.entities
    .map(
      (entity) => `    ${entity.name}: {
      code: ${JSON.stringify(entity.code)},
      layer: ${JSON.stringify(entity.layer)},
      standards: ${JSON.stringify(entity.standards)} as const,
      standardFit: ${JSON.stringify(entity.standardFit)},
      description: ${JSON.stringify(entity.description)},
      litmus: ${JSON.stringify(entity.litmus)},
    },`,
    )
    .join("\n");

  return `/**
 * Generated from \`packages/fide-vocabulary/spec/v0/vocabulary.json\`.
 * Do not edit directly; regenerate from the vocabulary source of truth.
 */
export const FIDE_VOCABULARY = {
  namespaceUrl: ${JSON.stringify(spec.namespaceUrl)},
  specVersion: ${JSON.stringify(spec.specVersion)},
  specDate: ${JSON.stringify(spec.specDate)},
  entityTypes: {
${entityBlocks}
  },
} as const;

export const FIDE_ENTITY_TYPES = FIDE_VOCABULARY.entityTypes;
export type FideEntityTypeName = keyof typeof FIDE_ENTITY_TYPES;
export type FideStandardFit = (typeof FIDE_ENTITY_TYPES)[FideEntityTypeName]["standardFit"];
export type FideEntityTypeSpec = (typeof FIDE_ENTITY_TYPES)[FideEntityTypeName];
export type FideEntityTypeCode = FideEntityTypeSpec["code"];

/**
 * Look up the definition for a single Fide entity type by name.
 *
 * @param name The entity type name.
 * @paramDefault name Person
 * @returns The matching entity type definition.
 */
export function getFideEntityTypeSpecByName(name: FideEntityTypeName): FideEntityTypeSpec {
  return FIDE_ENTITY_TYPES[name];
}

/**
 * Look up the definition for a single Fide entity type by hexadecimal code.
 *
 * @param code The 2-character hexadecimal entity type code.
 * @paramDefault code 10
 * @returns The matching entity type definition, if found.
 */
export function getFideEntityTypeSpecByCode(code: FideEntityTypeCode): FideEntityTypeSpec | undefined {
  return Object.values(FIDE_ENTITY_TYPES).find((spec) => spec.code === code);
}

/**
 * List all defined Fide entity type definitions.
 *
 * @returns Entity type definitions in source order.
 */
export function listFideEntityTypes(): FideEntityTypeSpec[] {
  return Object.values(FIDE_ENTITY_TYPES);
}
`;
}

async function main() {
  const rawSpec = JSON.parse(await readFile(VOCABULARY_SPEC_PATH, "utf8"));
  const spec = normalizeSpec(rawSpec);
  await mkdir(dirname(SDK_SPEC_OUTPUT), { recursive: true });
  await writeFile(SDK_SPEC_OUTPUT, buildSpecModule(spec), "utf8");
  console.log(`Generated SDK vocabulary module for ${spec.entities.length} entity types.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
