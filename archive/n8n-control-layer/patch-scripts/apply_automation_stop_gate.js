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

function upsertNode(node) {
  const index = workflow.nodes.findIndex((candidate) => candidate.name === node.name);

  if (index >= 0) {
    workflow.nodes[index] = {
      ...workflow.nodes[index],
      ...node,
    };
  } else {
    workflow.nodes.push(node);
  }
}

function connect(source, outputs) {
  workflow.connections[source] = { main: outputs };
}

upsertNode({
  parameters: {
    jsCode:
      'const lead = $json;\n' +
      'const incomingMessage = String($("Incoming Solar Message").item.json.body.customer_message || "");\n' +
      'const normalizedMessage = incomingMessage.toLowerCase();\n\n' +
      'const stopIntentPatterns = [\n' +
      '  /^\\s*stop\\s*[.!?]?\\s*$/,\n' +
      '  /stop messaging/,\n' +
      '  /stop contacting/,\n' +
      '  /do not message/,\n' +
      '  /don\\\'t message/,\n' +
      '  /do not contact/,\n' +
      '  /don\\\'t contact/,\n' +
      '  /unsubscribe/,\n' +
      '  /opt\\s*out/,\n' +
      '  /not interested anymore/,\n' +
      '  /no longer interested/,\n' +
      '  /someone from your team already called/,\n' +
      '  /your team already called/,\n' +
      '  /already called me/,\n' +
      '];\n\n' +
      'const hasStopIntent = stopIntentPatterns.some((pattern) => pattern.test(normalizedMessage));\n' +
      'const isAlreadyCalled = /already called me|your team already called|someone from your team already called/.test(normalizedMessage);\n' +
      'const consentStatus = String(lead.consent_status || "UNKNOWN").trim().toUpperCase();\n' +
      'const leadStatus = String(lead.lead_status || "").trim().toUpperCase();\n' +
      'const stopReasons = [];\n\n' +
      'if (hasStopIntent) {\n' +
      '  stopReasons.push("customer_stop_intent");\n' +
      '}\n\n' +
      'if (consentStatus === "OPTED_OUT") {\n' +
      '  stopReasons.push("consent_opted_out");\n' +
      '}\n\n' +
      'if (["BOOKED", "CLOSED", "HUMAN_TAKEOVER"].includes(leadStatus)) {\n' +
      '  stopReasons.push(`lead_status_${leadStatus.toLowerCase()}`);\n' +
      '}\n\n' +
      'if (lead.human_takeover === true) {\n' +
      '  stopReasons.push("human_takeover");\n' +
      '}\n\n' +
      'const shouldStop = stopReasons.length > 0;\n' +
      'const nextLeadStatus = isAlreadyCalled ? "HUMAN_TAKEOVER" : lead.lead_status;\n' +
      'const takeoverReason = isAlreadyCalled\n' +
      '  ? "Customer said a team member already called."\n' +
      '  : lead.takeover_reason;\n\n' +
      'return [\n' +
      '  {\n' +
      '    json: {\n' +
      '      ...lead,\n' +
      '      automation_can_continue: !shouldStop,\n' +
      '      automation_block_reasons: stopReasons,\n' +
      '      consent_status: hasStopIntent && !isAlreadyCalled ? "OPTED_OUT" : consentStatus,\n' +
      '      follow_up_status: shouldStop ? "STOPPED" : lead.follow_up_status,\n' +
      '      next_follow_up_at: shouldStop ? null : lead.next_follow_up_at,\n' +
      '      human_takeover: isAlreadyCalled ? true : lead.human_takeover === true,\n' +
      '      lead_status: isAlreadyCalled ? nextLeadStatus : lead.lead_status,\n' +
      '      takeover_at: isAlreadyCalled ? new Date().toISOString() : lead.takeover_at,\n' +
      '      takeover_reason: takeoverReason,\n' +
      '    },\n' +
      '  },\n' +
      '];\n',
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [-1760, -1008],
  id: '1d551a6c-5966-4e23-9b9f-632de1631d8c',
  name: 'Check Automation Stop Conditions',
});

upsertNode({
  parameters: {
    conditions: {
      options: {
        caseSensitive: true,
        leftValue: '',
        typeValidation: 'strict',
        version: 3,
      },
      conditions: [
        {
          id: 'fa41bb79-ec5e-4a58-854b-68f05e950a51',
          leftValue: '={{$json.automation_can_continue}}',
          rightValue: '={{true}}',
          operator: {
            type: 'boolean',
            operation: 'equals',
          },
        },
      ],
      combinator: 'and',
    },
    options: {},
  },
  type: 'n8n-nodes-base.if',
  typeVersion: 2.3,
  position: [-1536, -1008],
  id: '0329b11e-8282-44a7-9f06-03289d4ace8c',
  name: 'Can Qualification Continue?',
});

upsertNode({
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
      fieldValues: [
        {
          fieldId: 'lead_status',
          fieldValue: '={{$json.lead_status}}',
        },
        {
          fieldId: 'consent_status',
          fieldValue: '={{$json.consent_status}}',
        },
        {
          fieldId: 'follow_up_status',
          fieldValue: '={{$json.follow_up_status}}',
        },
        {
          fieldId: 'next_follow_up_at',
          fieldValue: '={{$json.next_follow_up_at}}',
        },
        {
          fieldId: 'human_takeover',
          fieldValue: '={{$json.human_takeover}}',
        },
        {
          fieldId: 'takeover_at',
          fieldValue: '={{$json.takeover_at}}',
        },
        {
          fieldId: 'takeover_reason',
          fieldValue: '={{$json.takeover_reason}}',
        },
      ],
    },
  },
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position: [-1312, -768],
  id: '6fca0a8b-ac4d-4db4-81a1-24d92fe28f9e',
  name: 'Persist Automation Stop State',
  credentials: {
    supabaseApi: {
      id: 'fUFZBc5JxtWW5xHi',
      name: 'Supabase account',
    },
  },
});

upsertNode({
  parameters: {
    respondWith: 'json',
    responseBody:
      '={\n  "status": "AUTOMATION_STOPPED",\n  "lead_status": "{{$json.lead_status}}",\n  "human_takeover": {{$json.human_takeover}},\n  "automation_block_reasons": {{JSON.stringify($json.automation_block_reasons)}},\n  "message": "Thanks. We have updated your request and automated follow-up has been stopped."\n}',
    options: {},
  },
  type: 'n8n-nodes-base.respondToWebhook',
  typeVersion: 1.5,
  position: [-1088, -768],
  id: '297c08a5-f58b-4c58-a73c-f38ac85826fb',
  name: 'Respond Automation Stopped',
});

upsertNode({
  parameters: {
    jsCode:
      'const lead = $("Check Automation Stop Conditions").item.json;\n' +
      'const persistResult = $json;\n\n' +
      'return [\n' +
      '  {\n' +
      '    json: {\n' +
      '      ...lead,\n' +
      '      automation_stop_persist_result: persistResult,\n' +
      '    },\n' +
      '  },\n' +
      '];\n',
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [-1200, -768],
  id: 'd1b08602-3988-4eb4-92c0-0426f2768ec2',
  name: 'Restore Automation Stop Context',
});

connect('Lead Exists?', [
  [
    {
      node: 'Check Automation Stop Conditions',
      type: 'main',
      index: 0,
    },
  ],
  [
    {
      node: 'Create New Lead',
      type: 'main',
      index: 0,
    },
  ],
]);

connect('Check Automation Stop Conditions', [
  [
    {
      node: 'Can Qualification Continue?',
      type: 'main',
      index: 0,
    },
  ],
]);

connect('Can Qualification Continue?', [
  [
    {
      node: 'Basic LLM Chain',
      type: 'main',
      index: 0,
    },
  ],
  [
    {
      node: 'Persist Automation Stop State',
      type: 'main',
      index: 0,
    },
  ],
]);

connect('Persist Automation Stop State', [
  [
    {
      node: 'Restore Automation Stop Context',
      type: 'main',
      index: 0,
    },
  ],
]);

connect('Restore Automation Stop Context', [
  [
    {
      node: 'Respond Automation Stopped',
      type: 'main',
      index: 0,
    },
  ],
]);

fs.writeFileSync(workflowPath, `${JSON.stringify(data, null, 2)}\n`);
