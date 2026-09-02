const crypto = require('crypto');
const fs = require('fs');

const workflowPath = 'workflows/solar-lead-conversion-mvp.cleaned.json';
const data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const workflow = data[0];

function nodeByName(name) {
  const node = workflow.nodes.find((candidate) => candidate.name === name);

  if (!node) {
    throw new Error(`Missing node: ${name}`);
  }

  return node;
}

function upsertAssignment(nodeName, additions) {
  const assignments = nodeByName(nodeName).parameters.assignments.assignments;

  for (const [name, value, type] of additions) {
    const existing = assignments.find((assignment) => assignment.name === name);

    if (existing) {
      existing.value = value;
      existing.type = type;
    } else {
      assignments.push({
        id: crypto.randomUUID(),
        name,
        value,
        type,
      });
    }
  }
}

function upsertPersistFields(nodeName, fields) {
  const fieldValues = nodeByName(nodeName).parameters.fieldsUi.fieldValues;

  for (const [fieldId, fieldValue] of fields) {
    const existing = fieldValues.find((field) => field.fieldId === fieldId);

    if (existing) {
      existing.fieldValue = fieldValue;
    } else {
      fieldValues.push({ fieldId, fieldValue });
    }
  }
}

const consentExpression =
  '={{ ["OPTED_IN", "OPTED_OUT"].includes(String($json.consent_status || "").toUpperCase()) ? String($json.consent_status).toUpperCase() : "UNKNOWN" }}';
const followUpCountExpression = '={{ Number($json.follow_up_count || 0) }}';
const nullExpression = '={{ null }}';
const nowExpression = '={{ new Date().toISOString() }}';
const firstFollowUpExpression =
  '={{ new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() }}';

upsertAssignment('Set HOT Final Status', [
  ['follow_up_status', 'STOPPED', 'string'],
  ['next_follow_up_at', nullExpression, 'string'],
  ['follow_up_count', followUpCountExpression, 'number'],
  ['last_follow_up_at', nullExpression, 'string'],
  ['human_takeover', false, 'boolean'],
  ['assigned_to', nullExpression, 'string'],
  ['takeover_at', nullExpression, 'string'],
  ['takeover_reason', nullExpression, 'string'],
  ['consent_status', consentExpression, 'string'],
]);

upsertAssignment('Prepare Nurture Record', [
  ['follow_up_status', 'ACTIVE', 'string'],
  ['follow_up_count', followUpCountExpression, 'number'],
  ['last_follow_up_at', nullExpression, 'string'],
  ['next_follow_up_at', firstFollowUpExpression, 'string'],
  ['human_takeover', false, 'boolean'],
  ['assigned_to', nullExpression, 'string'],
  ['takeover_at', nullExpression, 'string'],
  ['takeover_reason', nullExpression, 'string'],
  ['consent_status', consentExpression, 'string'],
]);

upsertAssignment('Set WARM Final Status', [
  ['follow_up_status', 'ACTIVE', 'string'],
  ['follow_up_count', followUpCountExpression, 'number'],
  ['last_follow_up_at', nullExpression, 'string'],
  ['next_follow_up_at', firstFollowUpExpression, 'string'],
  ['human_takeover', false, 'boolean'],
  ['assigned_to', nullExpression, 'string'],
  ['takeover_at', nullExpression, 'string'],
  ['takeover_reason', nullExpression, 'string'],
  ['consent_status', consentExpression, 'string'],
]);

upsertAssignment('Prepare COLD Record', [
  ['follow_up_status', 'STOPPED', 'string'],
  ['next_follow_up_at', nullExpression, 'string'],
  ['follow_up_count', followUpCountExpression, 'number'],
  ['last_follow_up_at', nullExpression, 'string'],
  ['human_takeover', false, 'boolean'],
  ['assigned_to', nullExpression, 'string'],
  ['takeover_at', nullExpression, 'string'],
  ['takeover_reason', nullExpression, 'string'],
  ['consent_status', consentExpression, 'string'],
]);

upsertAssignment('HUMAN REVIEW', [
  ['lead_status', 'HUMAN_TAKEOVER', 'string'],
  ['follow_up_status', 'STOPPED', 'string'],
  ['next_follow_up_at', nullExpression, 'string'],
  ['follow_up_count', followUpCountExpression, 'number'],
  ['last_follow_up_at', nullExpression, 'string'],
  ['human_takeover', true, 'boolean'],
  ['assigned_to', 'Sales Team', 'string'],
  ['takeover_at', nowExpression, 'string'],
  [
    'takeover_reason',
    'Requires manual review: outside automated sales path or service area.',
    'string',
  ],
  ['consent_status', consentExpression, 'string'],
]);

const commonPersistFields = [
  ['lead_status', '={{$json.lead_status}}'],
  ['lead_score', '={{$json.lead_score}}'],
  ['lead_temperature', '={{$json.lead_temperature}}'],
  ['in_service_area', '={{$json.in_service_area}}'],
  ['qualification_complete', '={{$json.qualification_complete}}'],
  ['consent_status', '={{$json.consent_status}}'],
  ['follow_up_status', '={{$json.follow_up_status}}'],
  ['next_follow_up_at', '={{$json.next_follow_up_at}}'],
  ['follow_up_count', '={{$json.follow_up_count}}'],
  ['last_follow_up_at', '={{$json.last_follow_up_at}}'],
  ['human_takeover', '={{$json.human_takeover}}'],
  ['assigned_to', '={{$json.assigned_to}}'],
  ['takeover_at', '={{$json.takeover_at}}'],
  ['takeover_reason', '={{$json.takeover_reason}}'],
];

upsertPersistFields('Persist HOT Result', [
  ...commonPersistFields,
  ['booking_status', '={{$json.booking_status}}'],
  ['appointment_date', '={{$json.appointment_date}}'],
  ['appointment_time', '={{$json.appointment_time}}'],
]);
upsertPersistFields('Persist WARM Result', commonPersistFields);
upsertPersistFields('Persist COLD Result', commonPersistFields);
upsertPersistFields('Persist HUMAN REVIEW Result', commonPersistFields);

nodeByName('Respond HUMAN REVIEW').parameters.responseBody =
  '={\n  "status": "HUMAN_TAKEOVER",\n  "lead_temperature": "{{$json.lead_temperature}}",\n  "lead_score": {{$json.lead_score}},\n  "in_service_area": {{$json.in_service_area}},\n  "human_takeover": {{$json.human_takeover}},\n  "message": "Thanks. A member of our team will assist you directly."\n}';

fs.writeFileSync(workflowPath, `${JSON.stringify(data, null, 2)}\n`);
