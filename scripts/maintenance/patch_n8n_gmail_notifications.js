const fs = require('fs');
const crypto = require('crypto');

const inputPath = 'n8n-workflows-before-gmail.json';
const outputPath = 'n8n-workflows-gmail-notifications.json';
const recipientEmail = 'lebusotsilo6@gmail.com';

const workflows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workflow = workflows.find((item) => item.name === 'Solar Lead Conversion MVP');

if (!workflow) {
  throw new Error('Solar Lead Conversion MVP workflow was not found.');
}

const gmailCredentials = {
  gmailOAuth2: {
    id: 'EY0BLdiqqLik7hzD',
    name: 'Gmail account',
  },
};

const removeNames = new Set([
  'Send a message',
  'Send HOT Gmail Notification',
  'Restore HOT Lead Context',
  'Send HUMAN REVIEW Gmail Notification',
  'Restore HUMAN REVIEW Lead Context',
]);

workflow.nodes = workflow.nodes.filter((node) => !removeNames.has(node.name));
for (const name of removeNames) {
  delete workflow.connections[name];
}

function connect(source, target) {
  workflow.connections[source] = {
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

function gmailNode(name, position, subject, message) {
  return {
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: recipientEmail,
      subject,
      emailType: 'text',
      message,
      options: {
        appendAttribution: false,
      },
    },
    type: 'n8n-nodes-base.gmail',
    typeVersion: 2.2,
    position,
    id: crypto.randomUUID(),
    name,
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 5000,
    continueOnFail: true,
    credentials: gmailCredentials,
  };
}

function restoreNode(name, sourceNodeName, position, resultFieldName) {
  return {
    parameters: {
      jsCode: `const lead = $('${sourceNodeName}').item.json;
const gmailResult = $json;

function getErrorMessage(result) {
  if (!result || !result.error) {
    return null;
  }

  if (typeof result.error === 'string') {
    return result.error;
  }

  return result.error.message || result.error.description || JSON.stringify(result.error);
}

const errorMessage = getErrorMessage(gmailResult);

return [
  {
    json: {
      ...lead,
      ${resultFieldName}: gmailResult,
      sales_notification_status: errorMessage ? 'FAILED' : 'SENT',
      sales_notification_error: errorMessage
    }
  }
];`,
    },
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
    id: crypto.randomUUID(),
    name,
  };
}

const hotSubject =
  '=🔥 HOT Solar Lead — {{$json.name}} — {{$json.location}}';

const hotBody = `=New HOT solar lead

Customer: {{$json.name}}
Location: {{$json.location}}
Property: {{$json.property_type}}
Ownership: {{$json.ownership_status}}

Monthly Electricity Spend: R{{Number($json.monthly_electricity_spend).toLocaleString('en-ZA')}}
Goal: {{$json.primary_goal}}
Existing Equipment: {{$json.existing_equipment}}
Timeline: {{$json.timeline}}
Payment Preference: {{$json.payment_preference}}

Lead Score: {{$json.lead_score}}
Lead Temperature: {{$json.lead_temperature}}

Booking:
{{new Date($json.appointment_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}} at {{$json.appointment_time}}

Action:
Contact this customer and prepare for the solar consultation.`;

const humanSubject =
  '=⚠️ Solar Lead Requires Human Review — {{$json.name}} — {{$json.location}}';

const humanBody = `=A solar lead requires manual review.

Customer: {{$json.name}}
Location: {{$json.location}}
Property: {{$json.property_type}}
Ownership: {{$json.ownership_status}}

Monthly Electricity Spend: R{{Number($json.monthly_electricity_spend).toLocaleString('en-ZA')}}
Goal: {{$json.primary_goal}}
Timeline: {{$json.timeline}}
Payment Preference: {{$json.payment_preference}}

Lead Score: {{$json.lead_score}}
Lead Temperature: {{$json.lead_temperature}}

Reason:
This lead falls outside the automated business rules / service area.

Action:
Review manually before proceeding.`;

workflow.nodes.push(
  gmailNode('Send HOT Gmail Notification', [2240, -736], hotSubject, hotBody),
  restoreNode('Restore HOT Lead Context', 'Prepare HOT Sales Notification', [2464, -736], 'gmail_notification_result'),
  gmailNode('Send HUMAN REVIEW Gmail Notification', [2240, -160], humanSubject, humanBody),
  restoreNode(
    'Restore HUMAN REVIEW Lead Context',
    'Prepare HUMAN REVIEW Sales Notification',
    [2464, -160],
    'gmail_notification_result',
  ),
);

connect('Prepare HOT Sales Notification', 'Send HOT Gmail Notification');
connect('Send HOT Gmail Notification', 'Restore HOT Lead Context');
connect('Restore HOT Lead Context', 'Persist HOT Result');

connect('Prepare HUMAN REVIEW Sales Notification', 'Send HUMAN REVIEW Gmail Notification');
connect('Send HUMAN REVIEW Gmail Notification', 'Restore HUMAN REVIEW Lead Context');
connect('Restore HUMAN REVIEW Lead Context', 'Persist HUMAN REVIEW Result');

fs.writeFileSync(outputPath, `${JSON.stringify(workflows, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
