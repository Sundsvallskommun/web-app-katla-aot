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

/* ------------------------------------------------------------------ keys */

/**
 * OpenE keys carry the query id of one flow version and are truncated at 40 characters, often
 * mid-word, so they are unusable as a durable contract: a key becomes permanent the moment an
 * errand is saved against it. Names are camelCase with the Swedish domain words kept, per the
 * repo convention — translating serveringsställe or kunskapsprov would read worse, not better.
 *
 * Defaults are mechanical; these override the truncated ones and the few that camelCase into a
 * mouthful. The OpenE identity survives in each field's `x-oe.queryID`.
 */
const KEY_OVERRIDES = {
  ange_period_for_servering_till_allmanhet: 'periodServeringAllmanheten',
  ange_period_for_servering_till_slutet_sa: 'periodServeringSlutetSallskap',
  ar_serveringsstallets_besoksadress_samma: 'besoksadressSammaSomForetaget',
  bifoga_egenkontrollprogram_for_servering: 'bifogatEgenkontrollprogramFolkol',
  bifoga_livsmedelsregistrering_fran_miljo: 'bifogadLivsmedelsregistrering',
  du_behover_inte_ansoka_om_serveringstill: 'serveringstillstandBehovsInte',
  egenkontrollprogram_vid_servering_av_fol: 'egenkontrollprogramFolkol',
  har_ni_anmalt_koket_som_livsmedelsanlagg: 'koketAnmaltSomLivsmedelsanlaggning',
  harmed_anmaler_jag_foljande_person_perso: 'personerTillKunskapsprovet',
  ladda_upp_beskrivning_pa_besoksarrangema: 'bifogadBeskrivningBesoksarrangemang',
  ladda_upp_ritning_pa_lokalen_med_serveri: 'bifogadRitningServeringsyta',
  maximalt_antal_personer_som_kommer_att_v: 'maximaltAntalPersonerILokalen',
  ovriga_upplysningar_angaende_finansierin: 'ovrigaUpplysningarFinansiering',
  regler_for_serveringstillstand_till_priv: 'reglerServeringstillstandPrivatperson',
  ska_servering_av_alkohol_ske_till_allman: 'serveringTillAllmanhetenEllerSlutetSallskap',
  vill_du_anmala_personer_i_foretaget_till: 'anmalPersonerTillKunskapsprovet',
  // Not truncated, but the mechanical name is unwieldy.
  ar_fakturaadressen_samma_som_foretagets: 'fakturaadressSammaSomForetaget',
  vad_vill_du_ansoka_om_eller_anmala: 'ansokningstyp',
  foretrader_du_ett_foretag: 'foretraderForetag',
  hamtning_av_foretagsuppgifter: 'hamtaForetagsuppgifter',
};

/**
 * Two questions can share a slug — OpenE gave 81713 (the radio choosing how to supply the
 * description) and 81714 (the text itself) the same title. Those are keyed by the full OpenE key.
 */
const KEY_OVERRIDES_BY_QUERY = {
  verksamhetsbeskrivning_81713: 'verksamhetsbeskrivningsval',
  verksamhetsbeskrivning_81714: 'verksamhetsbeskrivning',
};

const slugOf = (key) => key.replace(/_\d+$/, '');

const allSlugs = new Set(
  Object.values(schema.properties).flatMap((step) => Object.keys(step.properties).map((key) => key.replace(/_\d+$/, '')))
);
for (const slug of Object.keys(KEY_OVERRIDES)) {
  if (!allSlugs.has(slug)) throw new Error(`KEY_OVERRIDES has no question named '${slug}'`);
}

const allQuestionKeys = new Set(Object.values(schema.properties).flatMap((step) => Object.keys(step.properties)));
for (const key of Object.keys(KEY_OVERRIDES_BY_QUERY)) {
  if (!allQuestionKeys.has(key)) throw new Error(`KEY_OVERRIDES_BY_QUERY has no question named '${key}'`);
}

const camelCase = (slug) => {
  const [first, ...rest] = slug.split('_').filter(Boolean);
  return first + rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
};

/** The durable name for an OpenE question or sub-field key. */
const keyFor = (openEKey) => {
  const slug = slugOf(openEKey);
  return KEY_OVERRIDES_BY_QUERY[openEKey] ?? KEY_OVERRIDES[slug] ?? camelCase(slug);
};

/* ------------------------------------------------------------------ enum values */

const ASCII = { å: 'a', ä: 'a', ö: 'o', é: 'e', ü: 'u' };

/**
 * Alternative ids are flow-version identifiers, so they make poor stored values. The label text
 * becomes a stable constant instead; the id survives in `x-oe-alternativeID`.
 */
const constantFrom = (title) =>
  title
    .toLowerCase()
    // Folded before stripping: an uppercase replacement would itself be stripped as non-a-z.
    .replace(/[åäöéü]/g, (char) => ASCII[char])
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase()
    .split('_')
    .slice(0, 5)
    .join('_');

/**
 * Alternatives whose first words are identical, so the mechanical constant cannot tell them apart.
 * Keyed by OpenE alternative id, which is unique across the flow. The three kunskapsprov questions
 * are copies of one block, so each id is listed separately.
 */
const CONSTANT_OVERRIDES = {
  49648: 'STADIGVARANDE_SERVERING',
  49649: 'TILLFALLIGT_ALLMANHETEN',
  49650: 'TILLFALLIGT_SLUTET_SALLSKAP',
  49651: 'FOLKOL_SERVERING',
  49652: 'GARDSFORSALJNING',
  49653: 'STADIGVARANDE_CATERING',
  49654: 'PROVSMAKNING',
  // Kunskap om alkohollagen, three copies of the same three alternatives.
  49655: 'HAR_GODKANT_KUNSKAPSPROV',
  49656: 'DRIVER_ANNAT_FORETAG_MED_TILLSTAND',
  49657: 'BEHOVER_SKRIVA_KUNSKAPSPROV',
  49688: 'HAR_GODKANT_KUNSKAPSPROV',
  49689: 'DRIVER_ANNAT_FORETAG_MED_TILLSTAND',
  49690: 'BEHOVER_SKRIVA_KUNSKAPSPROV',
  49695: 'HAR_GODKANT_KUNSKAPSPROV',
  49696: 'DRIVER_ANNAT_FORETAG_MED_TILLSTAND',
  49697: 'BEHOVER_SKRIVA_KUNSKAPSPROV',
};

const alternativesOf = (field) => field.oneOf ?? field.items?.oneOf ?? [];

/** Per question: alternative id to constant, made unique by suffixing when two titles collapse. */
function constantsFor(field) {
  const used = new Map();
  const byId = {};
  for (const alternative of alternativesOf(field)) {
    const base = CONSTANT_OVERRIDES[alternative.const] ?? constantFrom(alternative.title ?? alternative.const);
    if (used.has(base)) {
      throw new Error(
        `Alternatives ${used.get(base)} and ${alternative.const} both become '${base}'; add them to CONSTANT_OVERRIDES`
      );
    }
    used.set(base, alternative.const);
    byId[alternative.const] = base;
  }
  return byId;
}

/* ------------------------------------------------------------------ conditions */

const questionsByKey = Object.fromEntries(
  Object.values(schema.properties).flatMap((step) => Object.entries(step.properties))
);

const weightSetters = Object.fromEntries(
  rules
    .filter((rule) => rule.type === 'SetWeightEvaluationProviderModule')
    .map((rule) => [
      rule.weightType,
      { source: rule.sourceKey, weights: Object.fromEntries(rule.alternativeWeights.map((w) => [w.alternativeID, Number(w.weight)])) },
    ])
);

/**
 * The export drops the threshold of a WeightQueryState rule — `weightExpression` is null and no
 * other field carries it, so the condition survives only in the rule's Swedish name. These are
 * reconstructed from those names; the mapping is unambiguous because every bucket is fed by one
 * question. Ask OpenE for an export that includes the value, then delete this table.
 */
const WEIGHT_THRESHOLDS = {
  88930: [1, 2], // "visa om uppgifter = 1||2" — either answer to hämtning av företagsuppgifter
  88932: [1, 2],
  88945: [1], // "visa om alkohollag1 = 1"
  88946: [2],
  88947: [3],
  88979: [1], // alkohollag2
  88980: [2],
  88981: [3],
  88991: [1], // alkohollag3
  88992: [2],
  88993: [3],
  89007: [1, 2, 3, 4, 5, 6, 7], // "visa om ansökan = 1-7" — any ärendetyp chosen
};

const alternativesWithWeight = (bucket, values) => {
  const setter = weightSetters[bucket];
  if (!setter) throw new Error(`No SetWeight rule feeds the weight '${bucket}'`);
  const matched = Object.entries(setter.weights)
    .filter(([, weight]) => values.includes(weight))
    .map(([alternativeID]) => alternativeID);
  if (matched.length === 0) throw new Error(`No alternative of '${setter.source}' has weight in ${values.join(', ')}`);
  return { source: setter.source, alternatives: matched };
};

/** `if` for "this question was answered with one of these alternatives". */
function answeredWith(sourceKey, alternativeIds) {
  const field = questionsByKey[sourceKey];
  const constants = constantsFor(field);
  const values = alternativeIds.map((id) => constants[id]).filter(Boolean);
  if (values.length === 0) throw new Error(`No alternatives matched on '${sourceKey}'`);

  const match = values.length === 1 ? { const: values[0] } : { enum: values };
  // A checkbox answer is an array, so the test is containment rather than equality.
  const test = field.type === 'array' ? { contains: match } : match;
  // Paired with `required`: an absent key satisfies `properties`, which would reveal the
  // dependent field before the question has been answered.
  return { properties: { [keyFor(sourceKey)]: test }, required: [keyFor(sourceKey)] };
}

/** The weight expressions in this flow come in two shapes; anything else should stop the build. */
function conditionFromExpression(expression) {
  const equality = [...expression.matchAll(/\$weight\{(\w+)\}\s*=\s*(\d+)/g)];
  const isSum = /\(\s*\$weight\{\w+\}\s*\+\s*\$weight\{\w+\}\s*\)\s*=\s*(\d+)/.test(expression);

  if (isSum) {
    // `($weight{a} + $weight{b}) = 2` with both buckets weighted 1: both must be answered that way.
    const buckets = [...expression.matchAll(/\$weight\{(\w+)\}/g)].map((m) => m[1]);
    return {
      allOf: buckets.map((bucket) => {
        const { source, alternatives } = alternativesWithWeight(bucket, [1]);
        return answeredWith(source, alternatives);
      }),
    };
  }

  if (equality.length > 0 && new Set(equality.map((m) => m[1])).size === 1) {
    const bucket = equality[0][1];
    const { source, alternatives } = alternativesWithWeight(bucket, equality.map((m) => Number(m[2])));
    return answeredWith(source, alternatives);
  }

  throw new Error(`Unrecognised weight expression: ${expression}`);
}

/**
 * One OpenE rule as a JSON Schema conditional. `VISIBLE_REQUIRED` reveals and requires;
 * `VISIBLE` only reveals, which the renderer reads off `then.properties`.
 */
function conditionalFor(rule) {
  const reveal = (condition, targets, required) => ({
    if: condition,
    then:
      required ?
        { required: targets.map(keyFor) }
      : { properties: Object.fromEntries(targets.map((target) => [keyFor(target), true])) },
  });
  const required = rule.resultingQueryState === 'VISIBLE_REQUIRED';

  if (rule.type === 'QueryStateEvaluationProviderModule') {
    const targets = rule.targetKeys.filter(Boolean);
    if (targets.length === 0) return null;
    return reveal(answeredWith(rule.sourceKey, rule.requiredAlternativeIDs ?? []), targets, required);
  }

  // The weight rules reveal their own source rather than a target list.
  if (rule.type === 'WeightQueryStateEvaluationProviderModule') {
    const values = WEIGHT_THRESHOLDS[rule.evaluatorID];
    if (!values) throw new Error(`No reconstructed threshold for weight rule ${rule.evaluatorID} (${rule.name})`);
    const { source, alternatives } = alternativesWithWeight(rule.weightType, values);
    return reveal(answeredWith(source, alternatives), [rule.sourceKey], required);
  }

  if (rule.type === 'WeightCalculatedQueryStateEvaluationProviderModule') {
    return reveal(conditionFromExpression(rule.weightExpression), [rule.sourceKey], required);
  }

  return null;
}

/** The conditionals that apply inside one branch: both ends of the rule have to be in it. */
function conditionalsFor(fields) {
  const conditionals = [];
  for (const rule of rules) {
    if (rule.type === 'SetWeightEvaluationProviderModule') continue;
    const conditional = conditionalFor(rule);
    if (!conditional) continue;

    const targets = Object.keys(conditional.then.required ? {} : (conditional.then.properties ?? {}));
    const revealed = conditional.then.required ?? targets;
    const sources = Object.keys(conditional.if.properties ?? {});
    const nested = (conditional.if.allOf ?? []).flatMap((part) => Object.keys(part.properties ?? {}));
    const names = new Set([...fields].map(keyFor));
    if (![...sources, ...nested].every((name) => names.has(name))) continue;
    if (!revealed.every((name) => names.has(name))) continue;

    conditionals.push(conditional);
  }
  return conditionals;
}

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

/* ------------------------------------------------------------------ per-leaf schemas */

/** The leaf already says which application this is, so the two selector questions become dead. */
const SELECTOR_QUESTIONS = new Set([REPRESENTS_COMPANY, APPLICATION_TYPE]);

/**
 * Questions the app already knows the answer to. The citizen signs in with SAML and picks an
 * errand owner from the organisations they have an engagement in, so asking again would be asking
 * for something the backend holds and can trust (see aot-form-schema-plan.md 4.2).
 *
 * Dropping `hamtning_av_foretagsuppgifter` also removes the reveal condition from `foretagsform`
 * and `ar_du_firmatecknare`, which is right: without a fetch-or-type choice they are simply asked.
 *
 * Deliberately kept:
 * - `foretagsform_81706` — `OrganizationDTO` carries no company form, and it gates four uploads.
 *   Open question 4 in OUTSTANDING_QUESTIONS.md.
 * - `ar_du_firmatecknare_81703` and its fullmakt upload — `isAuthorizedSignatory` could replace the
 *   question, but the upload would then hang off session data rather than an answer. Left intact
 *   until 4.5 settles where attachments live.
 */
const REPLACED_BY_SESSION = new Set([
  'kontaktuppgifter_81699', // private contact details — the SAML citizen
  'kontaktuppgifter_81700', // company contact details — the errand owner
  'hamtning_av_foretagsuppgifter_81701', // fetch-or-type choice, moot once the owner is chosen
  'valj_foretag_81702', // company picker — already picked as errand owner
  'ditt_foretag_81705', // manually typed company details
]);

/** Copies one question's definition across, renaming its keys and alternative values. */
function propertyFor(openEKey) {
  const field = questionsByKey[openEKey];
  const copy = structuredClone(field);
  const constants = constantsFor(field);

  const renameAlternatives = (node) => {
    for (const alternative of node.oneOf ?? []) {
      alternative['x-oe-alternativeID'] = alternative.const;
      alternative.const = constants[alternative.const] ?? alternative.const;
    }
  };
  renameAlternatives(copy);
  if (copy.items) renameAlternatives(copy.items);

  const renameChildren = (node) => {
    if (!node?.properties) return;
    node.properties = Object.fromEntries(Object.entries(node.properties).map(([k, v]) => [keyFor(k), v]));
    if (node.required) node.required = node.required.map(keyFor);
  };
  renameChildren(copy);
  renameChildren(copy.items);
  return copy;
}

function schemaForBranch(branch) {
  const fields = [...branch.fields].filter((key) => !SELECTOR_QUESTIONS.has(key) && !REPLACED_BY_SESSION.has(key));
  const properties = Object.fromEntries(fields.map((key) => [keyFor(key), propertyFor(key)]));
  const conditionals = conditionalsFor(new Set(fields));

  // Every conditional must point at properties this schema actually has, or the form silently
  // loses a field. Requiredness only ever comes from `then.required`, never from a root `required`.
  for (const conditional of conditionals) {
    const referenced = [
      ...Object.keys(conditional.if.properties ?? {}),
      ...(conditional.if.allOf ?? []).flatMap((part) => Object.keys(part.properties ?? {})),
      ...(conditional.then.required ?? []),
      ...Object.keys(conditional.then.properties ?? {}),
    ];
    for (const name of referenced) {
      if (!(name in properties)) throw new Error(`${branch.id}: conditional refers to missing property '${name}'`);
    }
  }

  return {
    $schema: DIALECT,
    title: branch.title,
    type: 'object',
    properties,
    ...(conditionals.length ? { allOf: conditionals } : {}),
    'x-oe-flow': schema['x-oe-flow'],
    'x-katla-label-leaf': branch.leaf,
  };
}

/** Questions that came from the contact step and are kept — invoicing and company documents. */
const COMPANY_SECTION = new Set([
  'ar_du_firmatecknare_81703',
  'ladda_upp_fullmakt_81704',
  'foretagsform_81706',
  'ar_fakturaadressen_samma_som_foretagets_81707',
  'fakturamottagare_81708',
  'fakturareferens_81709',
  'bifoga_aktuellt_registreringsbevis_fran_81710',
  'bifoga_uppgifter_om_agarforhallanden_81711',
  'bifoga_registerutdrag_fran_skatteverket_81712',
  'verksamhetsbeskrivning_81713',
  'verksamhetsbeskrivning_81714',
  'bifoga_verksamhetsbeskrivning_81715',
]);

function uiSchemaForBranch(branch) {
  const fields = [...branch.fields].filter((key) => !SELECTOR_QUESTIONS.has(key) && !REPLACED_BY_SESSION.has(key));
  const company = fields.filter((key) => COMPANY_SECTION.has(key));
  const application = fields.filter((key) => !COMPANY_SECTION.has(key));

  const ui = {
    'ui:order': fields.map(keyFor),
    'ui:sections': [
      { id: 'foretag', title: 'Företag och fakturering', icon: 'building-2', defaultOpen: true, fields: company.map(keyFor) },
      { id: 'ansokan', title: branch.title, icon: 'file-text', defaultOpen: true, fields: application.map(keyFor) },
    ].filter((section) => section.fields.length > 0),
  };

  for (const key of fields) {
    ui[keyFor(key)] = renameUiKeys(fieldUi(questionsByKey[key]));
    const description = oeDescription(CONTACT_STEP, key) ?? oeDescription(APPLICATION_STEP, key);
    if (description) ui[keyFor(key)]['ui:description'] = description;
  }
  return ui;
}

/** The nested ui entries are keyed by sub-field name, which the schema rename also changed. */
function renameUiKeys(entry) {
  const renamed = {};
  for (const [key, value] of Object.entries(entry)) {
    if (key.startsWith('ui:') || key === 'items') {
      renamed[key] = key === 'items' ? renameUiKeys(value) : value;
    } else {
      renamed[keyFor(key)] = value;
    }
  }
  if (Array.isArray(renamed['ui:order'])) renamed['ui:order'] = renamed['ui:order'].map(keyFor);
  if (Array.isArray(renamed['ui:rows'])) {
    renamed['ui:rows'] = renamed['ui:rows'].map((row) => ({ ...row, fields: row.fields.map(keyFor) }));
  }
  return renamed;
}

const perLeaf = reachPerBranch.filter((branch) => branch.leaf);
console.log('\nper-leaf schemas:');
for (const branch of perLeaf) {
  const built = schemaForBranch(branch);
  const name = branch.leaf.split('/').at(-1).toLowerCase();
  writeFileSync(
    join(here, `aot_${name}.schema-request.json`),
    `${JSON.stringify({ name: `aot_${name}`, version: '0.1', value: built, description: branch.title }, null, 2)}\n`
  );
  writeFileSync(
    join(here, `aot_${name}.ui-schema-request.json`),
    `${JSON.stringify({ value: uiSchemaForBranch(branch), description: `UI schema for ${branch.title}` }, null, 2)}\n`
  );
  console.log(
    `  ${name.padEnd(28)} ${String(Object.keys(built.properties).length).padStart(3)} fält, ${String((built.allOf ?? []).length).padStart(2)} villkor`
  );
}

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
