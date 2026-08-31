const fs = require('fs');

const inputPath = 'n8n-workflows-after-extraction-hardening.json';
const outputPath = 'n8n-workflows-export.cold-goal-hardened.json';

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
if (!llm.parameters.text.includes('"I am researching solar prices" -> "Price research"')) {
  llm.parameters.text = llm.parameters.text.replace(
    `"I want solar and battery backup and lower bills" -> "Bill reduction + backup"`,
    `"I want solar and battery backup and lower bills" -> "Bill reduction + backup"
"I am researching solar prices" -> "Price research"
"I am just checking prices for someday" -> "Price research"
"I want a quote" -> "Price research"`,
  );
}

const mergeNode = findNode('Merge Supabase + AI update');
if (!mergeNode.parameters.jsCode.includes('const mentionsPriceResearch =')) {
  mergeNode.parameters.jsCode = mergeNode.parameters.jsCode.replace(
    `const mentionsBillReduction =
  latestMessage.includes('reduce') ||
  latestMessage.includes('lower') ||
  latestMessage.includes('save') ||
  latestMessage.includes('saving') ||
  latestMessage.includes('bill') ||
  latestMessage.includes('electricity cost');`,
    `const mentionsBillReduction =
  latestMessage.includes('reduce') ||
  latestMessage.includes('lower') ||
  latestMessage.includes('save') ||
  latestMessage.includes('saving') ||
  latestMessage.includes('bill') ||
  latestMessage.includes('electricity cost');

const mentionsPriceResearch =
  latestMessage.includes('price') ||
  latestMessage.includes('prices') ||
  latestMessage.includes('pricing') ||
  latestMessage.includes('quote') ||
  latestMessage.includes('cost') ||
  latestMessage.includes('researching') ||
  latestMessage.includes('someday') ||
  latestMessage.includes('future');`,
  );

  mergeNode.parameters.jsCode = mergeNode.parameters.jsCode.replace(
    `  } else if (mentionsBillReduction) {
    update.primary_goal = 'Bill reduction';
  }
}`,
    `  } else if (mentionsBillReduction) {
    update.primary_goal = 'Bill reduction';
  } else if (mentionsPriceResearch) {
    update.primary_goal = 'Price research';
  }
}`,
  );
}

fs.writeFileSync(outputPath, `${JSON.stringify(workflows, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
