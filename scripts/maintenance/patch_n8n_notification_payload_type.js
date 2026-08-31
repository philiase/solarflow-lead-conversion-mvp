const fs = require('fs');

const inputPath = 'n8n-workflows-after-gmail-notifications.json';
const outputPath = 'n8n-workflows-after-gmail-notifications-payload-fix.json';

const workflows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workflow = workflows.find((item) => item.name === 'Solar Lead Conversion MVP');

if (!workflow) {
  throw new Error('Solar Lead Conversion MVP workflow was not found.');
}

for (const nodeName of ['Prepare HOT Sales Notification', 'Prepare HUMAN REVIEW Sales Notification']) {
  const node = workflow.nodes.find((item) => item.name === nodeName);
  const assignments = node?.parameters?.assignments?.assignments;
  const payload = assignments?.find((item) => item.name === 'sales_notification_payload');

  if (!payload) {
    throw new Error(`${nodeName} sales_notification_payload assignment was not found.`);
  }

  payload.type = 'string';
}

fs.writeFileSync(outputPath, `${JSON.stringify(workflows, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
