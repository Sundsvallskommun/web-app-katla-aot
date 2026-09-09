/**
 * Turns the OpenE export for flow 2181 into the two request bodies the jsonschema service takes.
 *
 * The widget for a question follows mechanically from its `x-oe.queryTypeID`, the sections follow
 * from which branch of the flow can reach it, and the field descriptions come from OpenE's own ui
 * schema — so both artifacts are derived rather than hand-written. Rerun when a new export lands:
 *
 *   node docs/jsonschemas/build-ui-schema.mjs
 *
 * Widget names are Draken's canonical ones — both apps render these ui schemas.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => JSON.parse(readFileSync(join(here, name), 'utf8'));

const SCHEMA_NAME = 'aot_opene_test';
const SCHEMA_VERSION = '1.0';
/** The platform is 2020-12 throughout: Ajv2020 throws outright on a draft-07 `$schema`. */
const DIALECT = 'https://json-schema.org/draft/2020-12/schema';

const schema = read('aot_ny_for_draken-2181.schema.json');
const rules = read('aot_ny_for_draken-2181.rules.json').rules;
const oeUiSchema = read('aot_ny_for_draken-2181.uischema.json');

const CONTACT_STEP = 'kontaktuppgifter_6115';
const APPLICATION_STEP = 'ansokan_6116';
const REPRESENTS_COMPANY = 'foretrader_du_ett_foretag_81698';
const APPLICATION_TYPE = 'vad_vill_du_ansoka_om_eller_anmala_81716';
const COMPANY_ANSWER = '49632';
const PRIVATE_ANSWER = '49633';

const queryType = (field) => (field['x-oe']?.queryTypeID ?? '').split('.').at(-1).replace('QueryProviderModule', '');

/* ------------------------------------------------------------------ reachability */

const weightSources = Object.fromEntries(
  rules.filter((rule) => rule.type === 'SetWeightEvaluationProviderModule').map((rule) => [rule.weightType, rule.sourceKey])
);

/** Over-approximates the questions one branch can show. Weight thresholds are absent from the
 *  export, so a weight-gated question counts as reachable once its feeding question is. */
function reachable(companyAnswer, typeAnswer) {
  const visible = new Set([REPRESENTS_COMPANY]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const rule of rules) {
      const source = rule.sourceKey;
      if (rule.type === 'QueryStateEvaluationProviderModule') {
        if (!visible.has(source)) continue;
        const alternatives = rule.requiredAlternativeIDs ?? [];
        if (source === REPRESENTS_COMPANY && !alternatives.includes(companyAnswer)) continue;
        if (source === APPLICATION_TYPE && !alternatives.includes(typeAnswer)) continue;
        for (const target of rule.targetKeys) {
          if (target && !visible.has(target)) {
            visible.add(target);
            changed = true;
          }
        }
      } else if (rule.type.startsWith('Weight') && rule.type !== 'SetWeightEvaluationProviderModule') {
        const buckets =
          rule.weightType ? [rule.weightType]
          : Object.keys(weightSources).filter((bucket) => (rule.weightExpression ?? '').includes(`{${bucket}}`));
        const feeders = buckets.map((bucket) => weightSources[bucket]).filter(Boolean);
        if (feeders.length && feeders.every((feeder) => visible.has(feeder)) && source && !visible.has(source)) {
          visible.add(source);
          changed = true;
        }
      }
    }
  }
  return visible;
}

/**
 * Each branch of the flow becomes one schema, named after the label leaf that selects it. The
 * binding is spelled out rather than matched on text: two of the seven differ in wording between
 * OpenE and the label tree (folköl, and TASTING whose displayName is just "Provsmakning").
 * See docs/aot-branch-label-mapping.md.
 */
const BRANCHES = [
  {
    id: 'privatperson',
    title: 'Ansökan som privatperson',
    icon: 'user',
    answer: null,
    company: PRIVATE_ANSWER,
    leaf: null,
  },
  {
    id: 'stadigvarande-servering',
    title: 'Stadigvarande serveringstillstånd',
    icon: 'wine',
    answer: '49648',
    leaf: 'ALCOHOL/SERVING_PERMIT_APPLICATION/PERMANENT_SERVING',
  },
  {
    id: 'tillfalligt-allmanheten',
    title: 'Tillfälligt tillstånd (allmänheten och slutet sällskap)',
    icon: 'calendar-days',
    answer: '49649',
    leaf: 'ALCOHOL/SERVING_PERMIT_APPLICATION/TEMPORARY_SERVING_PUBLIC',
  },
  {
    id: 'tillfalligt-slutet-sallskap',
    title: 'Tillfälligt tillstånd, endast slutet sällskap',
    icon: 'users',
    answer: '49650',
    leaf: 'ALCOHOL/SERVING_PERMIT_APPLICATION/TEMPORARY_SERVING_PRIVATE',
  },
  {
    id: 'folkol',
    title: 'Servering av folköl (klass 2)',
    icon: 'beer',
    answer: '49651',
    leaf: 'ALCOHOL/FOLKOL_SERVING_NOTIFICATION',
  },
  {
    id: 'gardsforsaljning',
    title: 'Gårdsförsäljning',
    icon: 'store',
    answer: '49652',
    leaf: 'ALCOHOL/SERVING_PERMIT_APPLICATION/FARM_SALES',
  },
  {
    id: 'catering',
    title: 'Catering till slutna sällskap',
    icon: 'utensils-crossed',
    answer: '49653',
    leaf: 'ALCOHOL/SERVING_PERMIT_APPLICATION/PERMANENT_CATERING',
  },
  {
    id: 'provsmakning',
    title: 'Provsmakning',
    icon: 'flask-conical',
    answer: '49654',
    leaf: 'ALCOHOL/SERVING_PERMIT_APPLICATION/TASTING',
  },
];

const reachPerBranch = BRANCHES.map((branch) => ({
  ...branch,
  fields: reachable(branch.company ?? COMPANY_ANSWER, branch.answer),
}));

/* ------------------------------------------------------------------ widgets */

const TEXT_FIELD_ROWS = [
  ['postnummer', 'postort'],
  ['postnummer', 'ort'],
  ['antal_sittplatser_inomhus', 'antal_sittplatser_pa_eventuell_uteserver'],
];
const baseName = (key) => key.replace(/_\d+$/, '');

/** Pairs the sub-fields that belong on one line, e.g. postnummer and postort. */
function rowsFor(keys) {
  const rows = [];
  for (const pair of TEXT_FIELD_ROWS) {
    const matched = pair.map((name) => keys.find((key) => baseName(key) === name));
    if (matched.every(Boolean)) rows.push({ fields: matched, gap: 'gap-24' });
  }
  return rows;
}

function objectUi(field) {
  const keys = Object.keys(field.properties ?? {});
  const ui = { 'ui:order': keys, 'ui:options': { showObjectFieldset: true } };
  for (const key of keys) {
    const child = field.properties[key];
    const widget =
      child.format === 'date' ? 'DateWidget'
      : child.format === 'time' ? 'TimeWidget'
      : 'TextWidget';
    ui[key] = { 'ui:widget': widget };
    if (child.readOnly) ui[key]['ui:readonly'] = true;
  }
  const dateOrTime = keys.filter((key) => ['date', 'time'].includes(field.properties[key].format ?? ''));
  const rows = dateOrTime.length === 2 ? [{ fields: dateOrTime, gap: 'gap-24' }] : rowsFor(keys);
  if (rows.length) ui['ui:rows'] = rows;
  return ui;
}

/**
 * OpenE's own ui schema is the only place the description links survive — the schema's plain-text
 * `description` keeps the link text and drops the href. Some entries are CKEditor leftovers.
 */
function oeDescription(stepKey, fieldKey) {
  const html = oeUiSchema[stepKey]?.[fieldKey]?.['ui:options']?.oeDescriptionHtml;
  if (typeof html !== 'string') return undefined;
  const stripped = html.replace(/\s/g, '');
  if (stripped === '' || stripped === '<p></p>' || stripped.startsWith('<p></p><styletype="text/css">')) return undefined;
  return html;
}

function fieldUi(field) {
  switch (queryType(field)) {
    case 'RadioButton':
      return { 'ui:widget': 'RadiobuttonWidget' };
    case 'Checkbox':
      return { 'ui:widget': 'checkboxes', 'ui:options': { multiple: true, className: 'w-full max-w-[48rem]' } };
    case 'TextArea':
      return { 'ui:widget': 'TexteditorWidget', 'ui:options': { className: 'w-full min-h-[14rem]' } };
    case 'FileUpload':
      // RJSF reserves `files` for arrays; `file` is a string-only alias and throws here. Resolves
      // to RJSF's own unstyled FileWidget until a design-system one is registered under that name.
      return {
        'ui:widget': 'files',
        'ui:options': {
          accept: (field['x-oe-allowedFileExtensions'] ?? []).map((extension) => `.${extension}`).join(','),
        },
      };
    case 'DynamicTable':
      return {
        'ui:options': { addable: true, orderable: false, addButtonLabel: 'Lägg till' },
        items: objectUi(field.items ?? {}),
      };
    case 'DateTime':
    case 'TextField':
    case 'ContactDetail':
    case 'CompanyDetails':
      return objectUi(field);
    default:
      return { 'ui:widget': 'TextWidget' };
  }
}

/* ------------------------------------------------------------------ assembly */

function sectionsForApplication(keys) {
  const companyBranches = reachPerBranch.filter((branch) => branch.answer !== null);
  const owner = new Map();
  for (const key of keys) {
    const owners = reachPerBranch.filter((branch) => branch.fields.has(key)).map((branch) => branch.id);
    // Shared means every company branch reaches it. A block two branches share — the temporary
    // permits — belongs to the first of them rather than to a section named "common".
    const isShared = companyBranches.every((branch) => branch.fields.has(key));
    owner.set(key, owners.length === 0 ? 'ej-nabar' : isShared ? 'gemensamt' : owners[0]);
  }
  const pick = (id) => keys.filter((key) => owner.get(key) === id);

  return [
    { id: 'gemensamt', title: 'Om ansökan', icon: 'file-text', defaultOpen: true, fields: pick('gemensamt') },
    ...reachPerBranch.map((branch) => ({
      id: branch.id,
      title: branch.title,
      icon: branch.icon,
      defaultOpen: false,
      fields: pick(branch.id),
    })),
    // Kept visible rather than dropped: eight questions no rule can reach, see
    // docs/aot-form-schema-plan.md section 2.
    { id: 'ej-nabar', title: 'Frågor utan synlighetsregel', icon: 'triangle-alert', defaultOpen: false, fields: pick('ej-nabar') },
  ].filter((section) => section.fields.length > 0);
}

function stepUi(stepKey) {
  const properties = schema.properties[stepKey].properties;
  const keys = Object.keys(properties);
  const ui = { 'ui:order': keys };

  ui['ui:sections'] =
    stepKey === CONTACT_STEP ?
      [{ id: 'kontaktuppgifter', title: 'Kontaktuppgifter och företag', icon: 'building-2', defaultOpen: true, fields: keys }]
    : sectionsForApplication(keys);

  const placed = new Set(ui['ui:sections'].flatMap((section) => section.fields));
  const missing = keys.filter((key) => !placed.has(key));
  if (missing.length) throw new Error(`${stepKey}: questions in no section: ${missing.join(', ')}`);

  const counts = new Map();
  for (const key of ui['ui:sections'].flatMap((section) => section.fields)) counts.set(key, (counts.get(key) ?? 0) + 1);
  const duplicated = [...counts].filter(([, count]) => count > 1).map(([key]) => key);
  if (duplicated.length) throw new Error(`${stepKey}: questions in more than one section: ${duplicated.join(', ')}`);

  for (const key of keys) {
    ui[key] = fieldUi(properties[key]);
    const description = oeDescription(stepKey, key);
    if (description) ui[key]['ui:description'] = description;
  }
  return ui;
}

/**
 * Every name Katla's registry answers to (frontend/src/components/json/widgets/index.ts), plus the
 * RJSF reserved aliases we lean on. An unknown name makes RJSF throw at render time, so the
 * generator refuses to emit one.
 */
const VALID_WIDGETS = new Set([
  'TextWidget',
  'SelectWidget',
  'RadiobuttonWidget',
  'CheckboxWidget',
  'CheckboxGroupWidget',
  'DateWidget',
  'TimeWidget',
  'ComboboxWidget',
  'TexteditorWidget',
  'TextareaWidget',
  'RadioWidget',
  'text',
  'select',
  'radio',
  'radiobutton',
  'checkbox',
  'checkboxes',
  'checkboxGroup',
  'checkbox-group',
  'date',
  'time',
  'combobox',
  'texteditor',
  'textarea',
  'files',
]);

function assertWidgetsResolve(node, path = '') {
  if (Array.isArray(node)) return node.forEach((entry, index) => assertWidgetsResolve(entry, `${path}[${index}]`));
  if (!node || typeof node !== 'object') return;
  for (const [key, entry] of Object.entries(node)) {
    if (key === 'ui:widget' && !VALID_WIDGETS.has(entry)) {
      throw new Error(`${path}: no widget named '${entry}' is registered`);
    }
    assertWidgetsResolve(entry, path ? `${path}.${key}` : key);
  }
}

const value = {
  'ui:order': [CONTACT_STEP, APPLICATION_STEP],
  [CONTACT_STEP]: stepUi(CONTACT_STEP),
  [APPLICATION_STEP]: stepUi(APPLICATION_STEP),
};

assertWidgetsResolve(value);

writeFileSync(
  join(here, `${SCHEMA_NAME}.schema-request.json`),
  `${JSON.stringify(
    {
      name: SCHEMA_NAME,
      version: SCHEMA_VERSION,
      value: { ...schema, $schema: DIALECT },
      description: 'A JSON-schema that defines an open alkoholtillstånd application',
    },
    null,
    2
  )}\n`
);

const output = {
  value,
  description:
    'UI schema for aot_opene_test 1.0. Generated from the OpenE flow 2181 exports by docs/jsonschemas/build-ui-schema.mjs — edit the generator, not this file.',
};

writeFileSync(join(here, 'aot_opene_test.ui-schema-request.json'), `${JSON.stringify(output, null, 2)}\n`);

const sections = value[APPLICATION_STEP]['ui:sections'];
console.log('sections:');
for (const section of [...value[CONTACT_STEP]['ui:sections'], ...sections]) {
  console.log(`  ${section.id.padEnd(30)} ${String(section.fields.length).padStart(3)} questions`);
}
