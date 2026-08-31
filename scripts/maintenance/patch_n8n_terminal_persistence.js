const fs = require('fs');
const crypto = require('crypto');

const inputPath = 'n8n-workflows-after-routing-fix.json';
const outputPath = 'n8n-workflows-export.terminal-persist-fixed.json';

const workflows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workflow = workflows.find((item) => item.name === 'Solar Lead Conversion MVP');

if (!workflow) {
  throw new Error('Solar Lead Conversion MVP workflow was not found.');
}

const nodes = workflow.nodes;
const connections = workflow.connections;
const supabaseCreds = nodes.find((node) => node.name === 'Update Lead Memory')?.credentials;

if (!supabaseCreds) {
  throw new Error('Supabase credentials could not be found from Update Lead Memory.');
}

const removeNames = [
  'Persist HOT Result',
  'Persist WARM Result',
  'Persist COLD Result',
  'Persist HUMAN REVIEW Result',
];

workflow.nodes = nodes.filter((node) => !removeNames.includes(node.name));
for (const name of removeNames) {
  delete connections[name];
}

function setIncludeOther(nodeName) {
  const node = workflow.nodes.find((item) => item.name === nodeName);
  if (node?.type === 'n8n-nodes-base.set') {
    node.parameters.includeOtherFields = true;
  }
}

[
  'Edit Fields',
  'Edit Fields1',
  'COLD Summary',
  'HUMAN REVIEW SUMMARY',
].forEach(setIncludeOther);

function assignment(nodeName, fieldName, value, type = 'string') {
  const node = workflow.nodes.find((item) => item.name === nodeName);
  const assignments = node?.parameters?.assignments?.assignments;
  if (!assignments) {
    throw new Error(`${nodeName} assignments were not found.`);
  }

  const existing = assignments.find((item) => item.name === fieldName);
  if (existing) {
    existing.value = value;
    existing.type = type;
    return;
  }

  assignments.push({
    id: crypto.randomUUID(),
    name: fieldName,
    value,
    type,
  });
}

assignment('Edit Fields', 'lead_status', 'BOOKED');
assignment('Edit Fields1', 'lead_status', 'NURTURE');

function makePersistNode(name, position, extraFields = []) {
  const baseFields = [
    ['lead_status', '={{$json.lead_status}}'],
    ['lead_score', '={{$json.lead_score}}'],
    ['lead_temperature', '={{$json.lead_temperature}}'],
    ['in_service_area', '={{$json.in_service_area}}'],
    ['qualification_complete', '={{$json.qualification_complete}}'],
  ];

  return {
    parameters: {
      operation: 'update',
      tableId: 'leads',
      filters: {
        conditions: [
          {
            keyName: 'id',
            condition: 'eq',
            keyValue: '={{$json.id}}',
          },
        ],
      },
      fieldsUi: {
        fieldValues: [...baseFields, ...extraFields].map(([fieldId, fieldValue]) => ({
          fieldId,
          fieldValue,
        })),
      },
    },
    type: 'n8n-nodes-base.supabase',
    typeVersion: 1,
    position,
    id: crypto.randomUUID(),
    name,
    credentials: supabaseCreds,
  };
}

workflow.nodes.push(
  makePersistNode('Persist HOT Result', [2016, -736], [
    ['booking_status', '={{$json.booking_status}}'],
    ['appointment_date', '={{$json.appointment_date}}'],
    ['appointment_time', '={{$json.appointment_time}}'],
  ]),
  makePersistNode('Persist WARM Result', [2016, -544]),
  makePersistNode('Persist COLD Result', [2016, -352]),
  makePersistNode('Persist HUMAN REVIEW Result', [2016, -160]),
);

function connect(source, target) {
  connections[source] = {
    main: [
      [
        {
          node: target,
          type: 'main',
          index: 0,
        },
      ],
    ],
  };
}

connect('Edit Fields', 'Persist HOT Result');
connect('Persist HOT Result', 'Respond to Webhook');
connect('Edit Fields1', 'Persist WARM Result');
connect('Persist WARM Result', 'Respond to Webhook1');
connect('COLD Summary', 'Persist COLD Result');
connect('Persist COLD Result', 'Respond to Webhook2');
connect('HUMAN REVIEW SUMMARY', 'Persist HUMAN REVIEW Result');
connect('Persist HUMAN REVIEW Result', 'Respond to Webhook3');

function setResponseBody(nodeName, responseBody) {
  const node = workflow.nodes.find((item) => item.name === nodeName);
  if (!node) {
    throw new Error(`${nodeName} was not found.`);
  }
  node.parameters.enableResponseOutput = true;
  node.parameters.respondWith = 'json';
  node.parameters.responseBody = responseBody;
}

setResponseBody(
  'Respond to Webhook1',
  `={
  "status": "NURTURE",
  "lead_temperature": "{{$json.lead_temperature}}",
  "lead_score": {{$json.lead_score}},
  "message": "Thanks. We've saved your solar enquiry and our team can follow up with you."
}`,
);

setResponseBody(
  'Respond to Webhook2',
  `={
  "status": "COLD",
  "lead_temperature": "{{$json.lead_temperature}}",
  "lead_score": {{$json.lead_score}},
  "message": "Thanks for your enquiry. We've saved your details."
}`,
);

setResponseBody(
  'Respond to Webhook3',
  `={
  "status": "HUMAN_REVIEW",
  "lead_temperature": "{{$json.lead_temperature}}",
  "lead_score": {{$json.lead_score}},
  "in_service_area": {{$json.in_service_area}},
  "message": "Thanks. Your enquiry needs a quick manual review and someone from our team will assist you."
}`,
);

fs.writeFileSync(outputPath, `${JSON.stringify(workflows, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
