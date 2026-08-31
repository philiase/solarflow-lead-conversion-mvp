const fs = require('fs');

const inputPath = 'n8n-workflows-after-terminal-persist-fix.json';
const outputPath = 'n8n-workflows-export.extraction-hardened.json';

const workflows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workflow = workflows.find((item) => item.name === 'Solar Lead Conversion MVP');

if (!workflow) {
  throw new Error('Solar Lead Conversion MVP workflow was not found.');
}

function findNode(name) {
  const node = workflow.nodes.find((item) => item.name === name);
  if (!node) {
    throw new Error(`${name} node was not found.`);
  }
  return node;
}

const llm = findNode('Basic LLM Chain');
const prompt = llm.parameters.text;

const primaryGoalRules = `\nPrimary goal normalization examples:\n\"I want solar and battery backup\" -> \"Backup power\"\n\"I want battery backup\" -> \"Backup power\"\n\"I need backup during load shedding\" -> \"Backup power\"\n\"I want to reduce my bill\" -> \"Bill reduction\"\n\"I want to save on electricity\" -> \"Bill reduction\"\n\"I want to reduce my bill and have backup\" -> \"Bill reduction + backup\"\n\"I want solar and battery backup and lower bills\" -> \"Bill reduction + backup\"\n\nIf the customer clearly mentions solar, batteries, backup, load shedding, bill reduction, or saving on electricity, set primary_goal to the clearest short phrase instead of null.\n`;

if (!prompt.includes('Primary goal normalization examples:')) {
  llm.parameters.text = prompt.replace(
    'monthly_electricity_spend must be a NUMBER only.',
    `${primaryGoalRules}\nmonthly_electricity_spend must be a NUMBER only.`,
  );
}

const mergeNode = findNode('Merge Supabase + AI update');
const oldMergeCode = mergeNode.parameters.jsCode;

const fallbackBlock = `
const mentionsBackup =
  latestMessage.includes('backup') ||
  latestMessage.includes('battery') ||
  latestMessage.includes('load shedding') ||
  latestMessage.includes('loadshed') ||
  latestMessage.includes('load-shedding');

const mentionsBillReduction =
  latestMessage.includes('reduce') ||
  latestMessage.includes('lower') ||
  latestMessage.includes('save') ||
  latestMessage.includes('saving') ||
  latestMessage.includes('bill') ||
  latestMessage.includes('electricity cost');

if (!update.primary_goal || update.primary_goal === null) {
  if (mentionsBackup && mentionsBillReduction) {
    update.primary_goal = 'Bill reduction + backup';
  } else if (mentionsBackup) {
    update.primary_goal = 'Backup power';
  } else if (mentionsBillReduction) {
    update.primary_goal = 'Bill reduction';
  }
}

if (
  typeof update.monthly_electricity_spend === 'string' &&
  update.monthly_electricity_spend.trim() !== ''
) {
  const numericSpend = Number(
    update.monthly_electricity_spend.replace(/[^0-9.]/g, '')
  );

  if (Number.isFinite(numericSpend)) {
    update.monthly_electricity_spend = numericSpend;
  }
}
`;

if (!oldMergeCode.includes('const mentionsBackup =')) {
  mergeNode.parameters.jsCode = oldMergeCode.replace(
    `// IMPORTANT:
// null from AI means "not mentioned", so don't overwrite`,
    `${fallbackBlock}
// IMPORTANT:
// null from AI means "not mentioned", so don't overwrite`,
  );
}

fs.writeFileSync(outputPath, `${JSON.stringify(workflows, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
