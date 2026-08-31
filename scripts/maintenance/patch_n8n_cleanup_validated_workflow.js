const fs = require('fs');

const inputPath = 'n8n-workflows-validated-baseline.json';
const outputPath = 'n8n-workflows-cleaned.json';

const workflows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workflow = workflows.find((item) => item.name === 'Solar Lead Conversion MVP');

if (!workflow) {
  throw new Error('Solar Lead Conversion MVP workflow was not found.');
}

const obsoleteNodes = new Set([
  'When clicking ‘Execute workflow’',
  'structured customer data exists',
  'Message a model',
  'OpenRouter Chat Model1',
  'Extract Follow-up Answer',
  'Merge Lead State',
  'Mock Follow-up Reply',
]);

workflow.nodes = workflow.nodes.filter((node) => !obsoleteNodes.has(node.name));

for (const source of Object.keys(workflow.connections)) {
  if (obsoleteNodes.has(source)) {
    delete workflow.connections[source];
    continue;
  }

  for (const outputType of Object.keys(workflow.connections[source])) {
    const branches = workflow.connections[source][outputType];
    for (const branch of branches) {
      for (let index = branch.length - 1; index >= 0; index -= 1) {
        if (obsoleteNodes.has(branch[index].node)) {
          branch.splice(index, 1);
        }
      }
    }
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify(workflows, null, 2)}\n`);
console.log(`Removed ${obsoleteNodes.size} obsolete nodes`);
console.log(`Wrote ${outputPath}`);
