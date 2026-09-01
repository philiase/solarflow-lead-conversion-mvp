const form = document.querySelector('#leadForm');
const result = document.querySelector('#result');
const submitButton = document.querySelector('#submitButton');

function cleanSpend(value) {
  const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function stableChannelId(contact) {
  return `website_${String(contact)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')}`;
}

function buildCustomerMessage(data) {
  const spend = cleanSpend(data.monthly_electricity_spend);
  const spendText = spend ? `R${spend.toLocaleString('en-ZA')}` : data.monthly_electricity_spend;
  const notes = data.notes ? ` Additional notes: ${data.notes}` : '';

  return [
    `Hi, I am ${data.name}.`,
    `I am enquiring from ${data.location}.`,
    `The property is a ${data.property_type}.`,
    `Ownership status: ${data.ownership_status}.`,
    `I spend around ${spendText} a month on electricity.`,
    `My main goal is ${data.primary_goal}.`,
    `Existing equipment: ${data.existing_equipment}.`,
    `Timeline: ${data.timeline}.`,
    `Payment preference: ${data.payment_preference}.`,
    notes,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function setResult(text, tone) {
  result.textContent = text;
  result.dataset.tone = tone;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  const payload = {
    channel_user_id: stableChannelId(data.contact),
    customer_message: buildCustomerMessage(data),
    access_code: data.access_code,
  };

  submitButton.disabled = true;
  setResult('Sending lead...', '');

  try {
    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await response.json();

    if (!response.ok || !body.ok) {
      throw new Error(body.message || body.workflow?.message || 'Lead submission failed.');
    }

    const workflow = body.workflow;
    setResult(
      [
        `Status: ${workflow.status}`,
        `Temperature: ${workflow.lead_temperature || 'Pending'}`,
        workflow.lead_score !== undefined ? `Score: ${workflow.lead_score}` : null,
        workflow.message ? `Message: ${workflow.message}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      'success',
    );
  } catch (error) {
    setResult(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
});
