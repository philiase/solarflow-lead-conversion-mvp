const fs = require('fs');
const crypto = require('crypto');

const inputPath = 'n8n-workflows-before-sales-notifications.json';
const outputPath = 'n8n-workflows-sales-notifications.json';

const workflows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workflow = workflows.find((item) => item.name === 'Solar Lead Conversion MVP');

if (!workflow) {
  throw new Error('Solar Lead Conversion MVP workflow was not found.');
}

const existingNames = new Set(workflow.nodes.map((node) => node.name));
const removeNames = new Set([
  'Prepare HOT Sales Notification',
  'Prepare HUMAN REVIEW Sales Notification',
]);

workflow.nodes = workflow.nodes.filter((node) => !removeNames.has(node.name));

for (const name of removeNames) {
  delete workflow.connections[name];
}

function setNode(name, position, status, urgency, reason) {
  return {
    parameters: {
      assignments: {
        assignments: [
          {
            id: crypto.randomUUID(),
            name: 'sales_notification_required',
            value: true,
            type: 'boolean',
          },
          {
            id: crypto.randomUUID(),
            name: 'sales_notification_status',
            value: status,
            type: 'string',
          },
          {
            id: crypto.randomUUID(),
            name: 'sales_notification_urgency',
            value: urgency,
            type: 'string',
          },
          {
            id: crypto.randomUUID(),
            name: 'sales_notification_reason',
            value: reason,
            type: 'string',
          },
          {
            id: crypto.randomUUID(),
            name: 'sales_notification_payload',
            value:
              `={
  "lead_id": "{{$json.id}}",
  "channel_user_id": "{{$json.channel_user_id}}",
  "customer_name": "{{$json.name}}",
  "location": "{{$json.location}}",
  "property_type": "{{$json.property_type}}",
  "ownership_status": "{{$json.ownership_status}}",
  "monthly_electricity_spend": {{$json.monthly_electricity_spend}},
  "primary_goal": "{{$json.primary_goal}}",
  "existing_equipment": "{{$json.existing_equipment}}",
  "critical_loads": "{{$json.critical_loads}}",
  "timeline": "{{$json.timeline}}",
  "payment_preference": "{{$json.payment_preference}}",
  "intent": "{{$json.intent}}",
  "in_service_area": {{$json.in_service_area}},
  "lead_score": {{$json.lead_score}},
  "lead_temperature": "{{$json.lead_temperature}}",
  "lead_status": "{{$json.lead_status}}",
  "booking_status": "{{$json.booking_status}}",
  "appointment_date": "{{$json.appointment_date}}",
  "appointment_time": "{{$json.appointment_time}}",
  "summary": "{{$json.sales_summary || $json.human_review_summary}}"
}`,
            type: 'string',
          },
        ],
      },
      includeOtherFields: true,
      options: {},
    },
    type: 'n8n-nodes-base.set',
    typeVersion: 3.5,
    position,
    id: crypto.randomUUID(),
    name,
  };
}

workflow.nodes.push(
  setNode(
    'Prepare HOT Sales Notification',
    [2016, -736],
    'READY_TO_SEND',
    'HIGH',
    'Hot lead has been qualified and simulated booking was created.',
  ),
  setNode(
    'Prepare HUMAN REVIEW Sales Notification',
    [2016, -160],
    'READY_TO_SEND',
    'HIGH',
    'Lead is outside the automated service-area path and requires manual review.',
  ),
);

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

connect('Edit Fields', 'Prepare HOT Sales Notification');
connect('Prepare HOT Sales Notification', 'Persist HOT Result');
connect('HUMAN REVIEW SUMMARY', 'Prepare HUMAN REVIEW Sales Notification');
connect('Prepare HUMAN REVIEW Sales Notification', 'Persist HUMAN REVIEW Result');

const currentNames = new Set(workflow.nodes.map((node) => node.name));
for (const nodeName of currentNames) {
  if (existingNames.has(nodeName) || removeNames.has(nodeName)) {
    continue;
  }
  console.log(`Added ${nodeName}`);
}

fs.writeFileSync(outputPath, `${JSON.stringify(workflows, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
