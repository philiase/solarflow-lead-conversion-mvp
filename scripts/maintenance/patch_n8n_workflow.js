const fs = require('fs');
const crypto = require('crypto');

const inputPath = 'n8n-workflows-export.json';
const outputPath = 'n8n-workflows-export.flow-fixed.json';

const workflows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workflow = workflows.find((item) => item.name === 'Solar Lead Conversion MVP');

if (!workflow) {
  throw new Error('Solar Lead Conversion MVP workflow was not found.');
}

const nodes = workflow.nodes;
const connections = workflow.connections;

const updateLeadMemory = nodes.find((node) => node.name === 'Update Lead Memory');
if (!updateLeadMemory) {
  throw new Error('Update Lead Memory node was not found.');
}

workflow.nodes = nodes.filter(
  (node) =>
    node.name !== 'Mark Lead Qualified' &&
    node.name !== 'Update Qualified Status',
);

delete connections['Mark Lead Qualified'];
delete connections['Update Qualified Status'];

const markLeadQualified = {
  parameters: {
    assignments: {
      assignments: [
        {
          id: crypto.randomUUID(),
          name: 'lead_status',
          value: 'QUALIFIED',
          type: 'string',
        },
        {
          id: crypto.randomUUID(),
          name: 'qualification_complete',
          value: true,
          type: 'boolean',
        },
      ],
    },
    includeOtherFields: true,
    options: {},
  },
  type: 'n8n-nodes-base.set',
  typeVersion: 3.5,
  position: [224, -640],
  id: crypto.randomUUID(),
  name: 'Mark Lead Qualified',
};

const updateQualifiedStatus = {
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
          fieldValue: 'QUALIFIED',
        },
        {
          fieldId: 'qualification_complete',
          fieldValue: '={{true}}',
        },
        {
          fieldId: 'next_missing_field',
          fieldValue: '={{null}}',
        },
      ],
    },
  },
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position: [448, -640],
  id: crypto.randomUUID(),
  name: 'Update Qualified Status',
  credentials: updateLeadMemory.credentials,
};

workflow.nodes.push(markLeadQualified, updateQualifiedStatus);

const setIncludeOtherFields = [
  'Prepare Nurture Record',
  'Sales_summary',
  'Edit Fields1',
  'Prepare COLD Record',
  'COLD Summary',
  'HUMAN REVIEW',
  'HUMAN REVIEW SUMMARY',
];

for (const nodeName of setIncludeOtherFields) {
  const node = workflow.nodes.find((item) => item.name === nodeName);
  if (node?.type === 'n8n-nodes-base.set') {
    node.parameters.includeOtherFields = true;
  }
}

connections['Qualification Complete?'].main[0] = [
  {
    node: 'Mark Lead Qualified',
    type: 'main',
    index: 0,
  },
];

connections['Mark Lead Qualified'] = {
  main: [
    [
      {
        node: 'Update Qualified Status',
        type: 'main',
        index: 0,
      },
    ],
  ],
};

connections['Update Qualified Status'] = {
  main: [
    [
      {
        node: 'Apply Business Rules',
        type: 'main',
        index: 0,
      },
    ],
  ],
};

connections.If.main[0] = [
  {
    node: 'HUMAN REVIEW',
    type: 'main',
    index: 0,
  },
];

connections.If.main[1] = [
  {
    node: 'Prepare COLD Record',
    type: 'main',
    index: 0,
  },
];

fs.writeFileSync(outputPath, `${JSON.stringify(workflows, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
