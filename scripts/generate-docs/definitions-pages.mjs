#!/usr/bin/env node

import { mkdir, readdir, rm, writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..', '..');
const VOCABULARY_SPEC_PATH = resolve(PACKAGE_ROOT, 'spec/v1/vocabulary.json');
const DEFINITIONS_DIR = resolve(PACKAGE_ROOT, 'docs/definitions');

const DOCS_BASE = '/vocabulary/definitions';
const FIDE_ID_BASE = '/fide-id/specification';
const FCP_BASE = '/fcp/specification';

const STANDARD_PREFIX_IRIS = {
  schema: 'https://schema.org/',
  rdf: 'https://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'https://www.w3.org/2000/01/rdf-schema#',
  xsd: 'https://www.w3.org/2001/XMLSchema#',
  org: 'https://www.w3.org/ns/org#',
  prov: 'https://www.w3.org/ns/prov#',
  sec: 'https://w3id.org/security#',
  owl: 'https://www.w3.org/2002/07/owl#',
  skos: 'https://www.w3.org/2004/02/skos/core#',
};

const LAYER_ORDER = ['Graph Structure', 'Agents', 'Network Anchors', 'Knowledge', 'Spacetime', 'Literals', 'Unknown'];

const LAYER_DESCRIPTIONS = {
  'Graph Structure': 'Entity types that define the structure of the graph itself.',
  Agents: 'Entities with agency - they make decisions, take actions, and bear responsibility.',
  'Network Anchors': 'Network addresses where evidence lives: resolvable locations, platform handles, and cryptographic principals.',
  Knowledge: 'Things that represent intellectual property, abstract ideas, or data structures.',
  Spacetime: 'Entities bounded in time; optionally in physical or virtual space. Substrate-neutral Places, Events, Actions, and physical Objects.',
  Literals: 'Typed scalar literals represented as first-class addressed values.',
  Unknown: '',
};

function ensureString(value, path) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid string at ${path}`);
  }
  return value;
}

function toSlug(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function quote(text) {
  return JSON.stringify(text);
}

function escapeMdx(text) {
  return text.replace(/\|/g, '\\|').replace(/"/g, '&quot;').replace(/\n/g, ' ').trim();
}

function linkifyRuleText(text, entityNames) {
  const withBackticksLinked = text.replace(/`([^`]+)`/g, (_match, value) => {
    if (value === 'Reference') return '[`Reference`](' + `${FIDE_ID_BASE}/syntax#reference-identifier` + ')';
    if (value === 'Reference Type') return '[`Reference Type`](' + `${FIDE_ID_BASE}/syntax#reference-type` + ')';
    if (value === 'Entity Type') return '[`Entity Type`](' + `${FIDE_ID_BASE}/syntax#entity-type` + ')';
    if (entityNames.has(value)) return `[
\`${value}\`](${DOCS_BASE}/${toSlug(value)})`.replace('\n', '');
    return `\`${value}\``;
  });

  return withBackticksLinked
    .replace(/\bReference Type\b/g, `[Reference Type](${FIDE_ID_BASE}/syntax#reference-type)`)
    .replace(/\bEntity Type\b/g, `[Entity Type](${FIDE_ID_BASE}/syntax#entity-type)`)
    .replace(/\bReference\b/g, `[Reference](${FIDE_ID_BASE}/syntax#reference-identifier)`);
}

function renderExample(example, entityNames) {
  const match = example.match(/^(Valid Reference|Invalid Reference|Preferred Reference|Less Stable Reference): `(.+)`$/);
  if (match && match[2].length > 80) {
    return `- ${match[1]}:\n\n\
\`\`\`text\n${match[2]}\n\`\`\``;
  }
  return `- ${linkifyRuleText(example, entityNames)}`;
}

function sampleReferenceFor(entityName, referenceType) {
  if (referenceType === 'Statement') {
    return 'did:fide:0x10205fcbdc6d73bcfcd2c73eb4795c2f02f1d1c1|did:fide:0x3120580f7f68f7884e6be0603679f41b39d6d15b|did:fide:0xa0a0ba86d94f45ed925f5a31934b31c3d12c268a';
  }
  if (referenceType === 'NetworkResource') {
    if (entityName === 'Person') return 'https://example.com/people/alice';
    if (entityName === 'Organization') return 'https://example.com/orgs/fide';
    if (entityName === 'SoftwareAgent') return 'https://example.com/agents/assistant';
    if (entityName === 'PlatformAccount') return 'acct:alice@example.com';
    if (entityName === 'CryptographicAccount') return 'did:key:z6Mkw...';
    if (entityName === 'CreativeWork') return 'https://example.com/works/whitepaper';
    if (entityName === 'Concept') return 'https://schema.org/Person';
    if (entityName === 'Place') return 'https://example.com/places/hq';
    if (entityName === 'Event') return 'https://example.com/events/launch';
    if (entityName === 'Action') return 'https://example.com/actions/tx-123';
    if (entityName === 'PhysicalObject') return 'https://example.com/objects/device-123';
    return 'https://example.com/resource';
  }
  if (referenceType === 'TextLiteral') return 'Alice';
  if (referenceType === 'IntegerLiteral') return '42';
  if (referenceType === 'DecimalLiteral') return '4.2';
  if (referenceType === 'BoolLiteral') return 'true';
  if (referenceType === 'DateLiteral') return '2026-03-06';
  if (referenceType === 'TimeLiteral') return '14:30:00Z';
  if (referenceType === 'DateTimeLiteral') return '2026-03-06T14:30:00Z';
  if (referenceType === 'DurationLiteral') return 'PT1H30M';
  if (referenceType === 'URILiteral') return 'urn:isbn:9780140328721';
  if (referenceType === 'JSONLiteral') return '{"a":1,"b":2}';
  return 'https://example.com/reference';
}

function invalidReferenceTypeFor(entityName, allowedReferenceTypes) {
  const candidates = ['Statement', 'URILiteral', 'TextLiteral', 'NetworkResource'];
  if (entityName.endsWith('Literal')) {
    const literalCandidates = ['TextLiteral', 'IntegerLiteral', 'DecimalLiteral', 'BoolLiteral', 'DateLiteral', 'TimeLiteral', 'DateTimeLiteral', 'DurationLiteral', 'URILiteral', 'JSONLiteral'];
    for (const candidate of literalCandidates) {
      if (candidate !== entityName && !allowedReferenceTypes.includes(candidate)) return candidate;
    }
  }
  for (const candidate of candidates) {
    if (!allowedReferenceTypes.includes(candidate)) return candidate;
  }
  return null;
}

function buildExamplesSection(entity) {
  const allowedReferenceTypes = Array.isArray(entity.fideIdRules?.allowedReferenceTypes) ? entity.fideIdRules.allowedReferenceTypes : [];
  if (allowedReferenceTypes.length === 0) return '';

  const validReferenceType = allowedReferenceTypes[0];
  const invalidType = invalidReferenceTypeFor(entity.name, allowedReferenceTypes);
  const codeFor = (name) => entity.__entityTypeMap[name] ?? '';
  const rows = [`| Valid | \`${entity.name}\` | \`${validReferenceType}\` | \`did:fide:0x${entity.code}${codeFor(validReferenceType)}\` |`];

  if (invalidType) {
    rows.push(`| Invalid | \`${entity.name}\` | \`${invalidType}\` | \`did:fide:0x${entity.code}${codeFor(invalidType)}\` |`);
  }

  return `
## Examples

| Status | Entity Type | Reference Type | Fide ID Prefix |
| :--- | :--- | :--- | :--- |
${rows.join('\n')}
`;
}

function normalizeSpec(raw) {
  const namespaceUrl = ensureString(raw.namespaceUrl, 'namespaceUrl');
  const specVersion = ensureString(raw.specVersion, 'specVersion');
  const specDate = ensureString(raw.specDate, 'specDate');

  if (!raw.entityTypes || typeof raw.entityTypes !== 'object') {
    throw new Error('Invalid entityTypes object');
  }

  const entities = Object.entries(raw.entityTypes).map(([name, value]) => {
    if (!value || typeof value !== 'object') throw new Error(`Invalid entity type entry for ${name}`);
    const standards = Array.isArray(value.standards) ? value.standards.map((standard, idx) => ensureString(standard, `${name}.standards[${idx}]`)) : [];
    return {
      name: ensureString(name, 'entityTypes key'),
      code: ensureString(value.code, `${name}.code`),
      layer: ensureString(value.layer, `${name}.layer`),
      standards,
      standardFit: ensureString(value.standardFit, `${name}.standardFit`),
      description: ensureString(value.description, `${name}.description`),
      litmus: ensureString(value.litmus, `${name}.litmus`),
      fideIdRules: value.fideIdRules && typeof value.fideIdRules === 'object' ? value.fideIdRules : null,
      __entityTypeMap: null,
      slug: toSlug(name),
    };
  });

  const codeMap = Object.fromEntries(entities.map((entity) => [entity.name, entity.code]));
  for (const entity of entities) entity.__entityTypeMap = codeMap;
  return { namespaceUrl, specVersion, specDate, entities };
}

function expandCurie(curie) {
  if (typeof curie !== 'string') return null;
  const idx = curie.indexOf(':');
  if (idx <= 0) return null;
  const prefix = curie.slice(0, idx);
  const suffix = curie.slice(idx + 1);
  const base = STANDARD_PREFIX_IRIS[prefix];
  if (!base) return null;
  return `${base}${suffix}`;
}

function renderStandardAlignment(standards, standardFit) {
  const rendered = standards.map((standard) => {
    const href = expandCurie(standard);
    return href ? `[
\`${standard}\`](${href})`.replace('\n', '') : `\`${standard}\``;
  }).join(' + ');
  return `${rendered} (${standardFit} fit)`;
}

function buildSpecificationIndex(spec) {
  let links = '';
  for (const layer of LAYER_ORDER) {
    const entities = spec.entities.filter((entity) => entity.layer === layer);
    if (entities.length === 0) continue;
    entities.sort((a, b) => a.code.localeCompare(b.code));
    links += `### ${layer}\n\n`;
    if (LAYER_DESCRIPTIONS[layer]) links += `${LAYER_DESCRIPTIONS[layer]}\n\n`;
    links += '| Entity | Code | Definition | Boundaries |\n';
    links += '| :--- | :--- | :--- | :--- |\n';
    for (const entity of entities) {
      links += `| [\`${entity.name}\`](${DOCS_BASE}/${entity.slug}) | \`${entity.code}\` | ${escapeMdx(entity.description)} | ${escapeMdx(entity.litmus)} |\n`;
    }
    links += '\n';
  }

  return `---
title: Overview
description: Fide Entity Types and identifier rules.
---

${links}
`;
}

function buildVocabularyPage(entity, entityNames) {
  const allowedReferenceTypes = entity.fideIdRules?.allowedReferenceTypes?.length
    ? entity.fideIdRules.allowedReferenceTypes.map((name) => `[\`${name}\`](${DOCS_BASE}/${toSlug(name)})`).join(' or ')
    : null;
  const referenceRequirements = Array.isArray(entity.fideIdRules?.referenceRequirements)
    ? entity.fideIdRules.referenceRequirements
    : entity.fideIdRules?.referenceRequirement ? [entity.fideIdRules.referenceRequirement] : [];
  const referenceRecommendations = Array.isArray(entity.fideIdRules?.referenceRecommendations)
    ? entity.fideIdRules.referenceRecommendations : [];
  const referenceExamples = Array.isArray(entity.fideIdRules?.referenceExamples)
    ? entity.fideIdRules.referenceExamples : [];
  const referenceRuleDetails = Array.isArray(entity.fideIdRules?.referenceRuleDetails)
    ? entity.fideIdRules.referenceRuleDetails : [];
  const referenceTypeRules = entity.fideIdRules?.referenceTypeRules && typeof entity.fideIdRules.referenceTypeRules === 'object'
    ? entity.fideIdRules.referenceTypeRules : null;

  const referenceExamplesBlock = referenceExamples.length > 0
    ? `${referenceExamples.map((group) => `<details>
<summary>${linkifyRuleText(group.summary, entityNames)}</summary>

${group.examples.map((example) => renderExample(example, entityNames)).join('\n')}
</details>`).join('\n\n')}\n`
    : '';
  const referenceRuleDetailsBlock = referenceRuleDetails.length > 0
    ? `${referenceRuleDetails.map((item) => `<details>
<summary>${linkifyRuleText(item.rule, entityNames)}</summary>

${item.examples.map((example) => renderExample(example, entityNames)).join('\n')}
</details>`).join('\n\n')}\n`
    : '';
  const referenceTypeRuleDetails = Array.isArray(referenceTypeRules?.ruleDetails) ? referenceTypeRules.ruleDetails : [];
  const referenceTypeRuleDetailsBlock = referenceTypeRuleDetails.length > 0
    ? `${referenceTypeRuleDetails.map((item) => `<details>
<summary>${linkifyRuleText(item.rule, entityNames)}</summary>

${item.examples.map((example) => renderExample(example, entityNames)).join('\n')}
</details>`).join('\n\n')}\n`
    : '';

  const entityTypeRulesSection = allowedReferenceTypes || referenceRequirements.length > 0 || referenceRecommendations.length > 0 || referenceRuleDetailsBlock || referenceExamplesBlock
    ? `
### As Entity Type

${allowedReferenceTypes ? `- MUST use [Reference Type](${FIDE_ID_BASE}/syntax#reference-type) ${allowedReferenceTypes}.
` : ''}${referenceRequirements.map((rule) => `- ${linkifyRuleText(rule, entityNames)}
`).join('')}${referenceRecommendations.map((rule) => `- ${linkifyRuleText(rule, entityNames)}
`).join('')}
${referenceRuleDetailsBlock}
${referenceExamplesBlock}`
    : '';

  const asReferenceTypeSection = referenceTypeRules
    ? `
### As Reference Type

${Array.isArray(referenceTypeRules.requirements) ? referenceTypeRules.requirements.map((rule) => `- ${linkifyRuleText(rule, entityNames)}
`).join('') : ''}
${referenceTypeRuleDetailsBlock}`
    : '';


  const fideIdRulesSection = entity.fideIdRules || referenceTypeRules
    ? `
---

## Fide ID Rules

These entity-specific constraints apply when ${entity.name} is used in [Fide ID](/fide-id).
${entityTypeRulesSection}
${asReferenceTypeSection}`
    : '';

  const metadataLines = [
    `- **Hex Code:** \`${entity.code}\``,
    entity.standards.length > 0 ? `- **Standard Alignment:** ${renderStandardAlignment(entity.standards, entity.standardFit)}` : null,
  ].filter(Boolean).join('\n');

  return `---
title: ${quote(entity.name)}
description: ${quote(entity.description)}
full: true
---

## Definition

${entity.description}

- **Boundaries:** ${escapeMdx(entity.litmus)}
${metadataLines}

${fideIdRulesSection}
${buildExamplesSection(entity)}
`;
}

function buildDefinitionsMeta(spec) {
  const pages = ['index'];
  for (const layer of LAYER_ORDER) {
    const entities = spec.entities.filter((entity) => entity.layer === layer);
    if (entities.length === 0) continue;
    entities.sort((a, b) => a.code.localeCompare(b.code));
    pages.push(`--- ${layer} ---`);
    for (const entity of entities) pages.push(entity.slug);
  }
  return {
    title: 'Definitions',
    root: true,
    pages,
  };
}

async function cleanDefinitionsDir() {
  await mkdir(DEFINITIONS_DIR, { recursive: true });
  const files = await readdir(DEFINITIONS_DIR);
  for (const file of files) {
    if (file.endsWith('.mdx') || file === 'meta.json') {
      await rm(resolve(DEFINITIONS_DIR, file), { force: true });
    }
  }
}

async function main() {
  const rawSpec = JSON.parse(await readFile(VOCABULARY_SPEC_PATH, 'utf8'));
  const spec = normalizeSpec(rawSpec);
  const entityNames = new Set(spec.entities.map((entity) => entity.name));

  await cleanDefinitionsDir();
  await writeFile(resolve(DEFINITIONS_DIR, 'index.mdx'), buildSpecificationIndex(spec), 'utf8');
  await writeFile(resolve(DEFINITIONS_DIR, 'meta.json'), `${JSON.stringify(buildDefinitionsMeta(spec), null, 2)}\n`, 'utf8');

  for (const entity of spec.entities) {
    await writeFile(resolve(DEFINITIONS_DIR, `${entity.slug}.mdx`), buildVocabularyPage(entity, entityNames), 'utf8');
  }

  console.log(`Generated ${spec.entities.length} vocabulary definition pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
