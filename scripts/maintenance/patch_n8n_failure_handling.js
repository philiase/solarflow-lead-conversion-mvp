const fs = require('fs');

const inputPath = process.argv[2] || 'workflows/solar-lead-conversion-mvp.cleaned.json';
const outputPath = process.argv[3] || inputPath;

const workflows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workflow = workflows.find((item) => item.name === 'Solar Lead Conversion MVP');

if (!workflow) {
  throw new Error('Solar Lead Conversion MVP workflow was not found.');
}

const obsoleteNodeNames = new Set(['Send a message']);

workflow.nodes = workflow.nodes.filter((node) => !obsoleteNodeNames.has(node.name));
for (const nodeName of obsoleteNodeNames) {
  delete workflow.connections[nodeName];
}

function getNode(name) {
  const node = workflow.nodes.find((item) => item.name === name);

  if (!node) {
    throw new Error(`${name} node was not found.`);
  }

  return node;
}

function addRetry(node) {
  node.retryOnFail = true;
  node.maxTries = 2;
  node.waitBetweenTries = 5000;
}

for (const node of workflow.nodes) {
  if (
    node.type === 'n8n-nodes-base.supabase' ||
    node.type === 'n8n-nodes-base.gmail' ||
    node.type === '@n8n/n8n-nodes-langchain.lmChatOpenRouter'
  ) {
    addRetry(node);
  }
}

for (const nodeName of ['Send HOT Gmail Notification', 'Send HUMAN REVIEW Gmail Notification']) {
  const node = getNode(nodeName);
  node.continueOnFail = true;
}

function restoreCode(sourceNodeName, resultFieldName) {
  return `const lead = $('${sourceNodeName}').item.json;
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
];`;
}

getNode('Restore HOT Lead Context').parameters.jsCode = restoreCode(
  'Prepare HOT Sales Notification',
  'gmail_notification_result',
);

getNode('Restore HUMAN REVIEW Lead Context').parameters.jsCode = restoreCode(
  'Prepare HUMAN REVIEW Sales Notification',
  'gmail_notification_result',
);

fs.writeFileSync(outputPath, `${JSON.stringify(workflows, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
