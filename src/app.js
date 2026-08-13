const $ = (id) => document.getElementById(id);

const steps = [$('step1'), $('step2'), $('step3'), $('step4')];
const stepNumber = $('stepNumber');
let optionCount = 0;

function showStep(index){
  steps.forEach((step,i)=>step.classList.toggle('hidden',i!==index));
  stepNumber.textContent = index + 1;
}

$('toDiagnosis').addEventListener('click',()=>{
  if(!$('patientName').value.trim()){
    $('patientName').focus();
    return;
  }
  showStep(1);
});

$('backToPatient').addEventListener('click',()=>showStep(0));
$('backToDiagnosis').addEventListener('click',()=>showStep(1));
$('backToConfirmation').addEventListener('click',()=>showStep(2));

$('parseDiagnosis').addEventListener('click',()=>{
  const text = $('diagnosis').value.trim();
  if(!text){$('diagnosis').focus();return;}
  const data = { patient:$('patientName').value.trim(), language:$('language').value, source:'Diagnosis Copy-past', rawDiagnosis:text };
  $('structuredData').innerHTML = `<div class="data-box"><strong>Patient:</strong> ${escapeHtml(data.patient)}\n<strong>Language:</strong> ${escapeHtml(data.language)}\n<strong>Source:</strong> Diagnosis Copy-past\n\n<strong>Doctor data:</strong>\n${escapeHtml(data.rawDiagnosis)}</div>`;
  $('confirmTreatment').checked = false;
  $('continueToOptions').disabled = true;
  showStep(2);
});

$('confirmTreatment').addEventListener('change',(e)=>{
  $('continueToOptions').disabled = !e.target.checked;
});

$('continueToOptions').addEventListener('click',()=>{
  if(!$('quotationOptions').children.length) addQuotationOption();
  showStep(3);
  recalculateQuotation();
});

$('addOption').addEventListener('click',()=>addQuotationOption());
$('refreshQuotation').addEventListener('click',recalculateQuotation);
$('markupPercent').addEventListener('input',recalculateQuotation);
$('patientCountry').addEventListener('change',recalculateQuotation);

function addQuotationOption(){
  // Always derive the next number from the options currently on screen.
  // This prevents a deleted Option 1, 2, 3... from causing the next option
  // to become Option 6, Option 7, etc.
  optionCount = document.querySelectorAll('.quotation-option').length + 1;

  const optionId = `option-${optionCount}`;
  const implantOptions = DUTY_PRICING.implants.map(item => `<option value="${item.id}">${escapeHtml(item.displayName || item.name)} — $${item.price}</option>`).join('');
  const crownOptions = DUTY_PRICING.crowns.filter(item => item.id !== 'veneers').map(item => `<option value="${item.id}">${escapeHtml(item.displayName || item.name)} — $${item.price}</option>`).join('');
  const procedureOptions = DUTY_PRICING.procedures.map(item => `<label class="check-item"><input type="checkbox" class="procedure-choice" data-price="${item.price}" value="${item.id}"> ${escapeHtml(item.name)}${item.unit ? ` (${escapeHtml(item.unit)})` : ''} — $${item.price}</label>`).join('');

  const card = document.createElement('article');
  card.className = 'quotation-option';
  card.dataset.optionId = optionId;
  card.innerHTML = `
    <div class="option-header"><h3>Option ${optionCount}</h3><button type="button" class="remove-option secondary">Remove</button></div>

    <label>Option name</label>
    <input class="option-name" value="Option ${optionCount}" placeholder="e.g. Medentika + Straumann Zirconia">

    <div class="grid-2">
      <div>
        <h4>Upper jaw</h4>
        <label>Implants</label>
        <input class="upper-implant-count" type="number" min="0" step="1" value="0">
        <label>Implant system</label>
        <select class="upper-implant-brand"><option value="">Select implant</option>${implantOptions}</select>
        <label>Bridge price (USD)</label>
        <input class="bridge-price" type="number" min="0" step="1" placeholder="Enter confirmed bridge price">
        <small class="warning-text">Bridge price is not in the official price list, so it must be confirmed before quotation.</small>
      </div>

      <div>
        <h4>Lower jaw</h4>
        <label>Implants</label>
        <input class="lower-implant-count" type="number" min="0" step="1" value="0">
        <label>Implant system</label>
        <select class="lower-implant-brand"><option value="">Select implant</option>${implantOptions}</select>
        <label>Crowns</label>
        <input class="crown-count" type="number" min="0" step="1" value="0">
        <label>Crown material</label>
        <select class="crown-brand"><option value="">Select crown material</option>${crownOptions}</select>
      </div>
    </div>

    <h4>Additional procedures</h4>
    <div class="procedure-list">${procedureOptions}</div>

    <h4>Visit plan</h4>
    <label class="check-row"><input type="checkbox" class="one-visit-confirm"> Doctor/coordinator confirmed that this implant case can be completed in 1 visit</label>
    <div class="grid-2 visit-fields">
      <div><label>Number of visits</label><input class="visit-count" type="number" min="1" step="1" value="2" readonly></div>
      <div><label>Visit duration</label><input class="visit-duration" value="To be confirmed" placeholder="e.g. 5 days + 7 days"></div>
    </div>
    <div class="visit-note">Implant cases default to 2 visits. One visit is allowed only when the coordinator confirms the dentist has approved it; for one-visit cases, the coordinator should specify the planned stay, approximately 15 days.</div>

    <div class="option-total"><span>Option subtotal</span><strong class="option-subtotal">$0</strong></div>
  `;

  $('quotationOptions').appendChild(card);
  bindOptionEvents(card);
  updateVisitFields(card);
  recalculateQuotation();
}

function renumberQuotationOptions(){
  const cards = [...document.querySelectorAll('.quotation-option')];
  optionCount = cards.length;

  cards.forEach((card, index)=>{
    const number = index + 1;
    card.dataset.optionId = `option-${number}`;

    const heading = card.querySelector('.option-header h3');
    if(heading) heading.textContent = `Option ${number}`;

    const nameInput = card.querySelector('.option-name');
    if(nameInput && /^Option \d+$/.test(nameInput.value.trim())){
      nameInput.value = `Option ${number}`;
    }
  });
}

function bindOptionEvents(card){
  card.querySelector('.remove-option').addEventListener('click',()=>{
    card.remove();
    renumberQuotationOptions();
    recalculateQuotation();
  });

  card.querySelector('.one-visit-confirm').addEventListener('change',()=>{
    updateVisitFields(card);
    recalculateQuotation();
  });

  card.querySelector('.visit-count').addEventListener('input',recalculateQuotation);
  card.querySelector('.visit-duration').addEventListener('input',recalculateQuotation);
  card.querySelectorAll('input,select').forEach(input=>input.addEventListener('input',recalculateQuotation));
  card.querySelectorAll('select').forEach(select=>select.addEventListener('change',recalculateQuotation));
}

function updateVisitFields(card){
  const oneVisit = card.querySelector('.one-visit-confirm').checked;
  const count = card.querySelector('.visit-count');
  const duration = card.querySelector('.visit-duration');
  count.value = oneVisit ? 1 : 2;
  duration.placeholder = oneVisit ? 'Approximately 15 days' : 'e.g. 5 days + 7 days';
  if(oneVisit && duration.value === 'To be confirmed') duration.value = 'Approximately 15 days';
  if(!oneVisit && duration.value === 'Approximately 15 days') duration.value = 'To be confirmed';
}

function getSelected(items, id){
  return items.find(item=>item.id===id);
}

function calculateOption(card){
  let subtotal = 0;
  let hasImplants = false;

  const upperCount = numberValue(card.querySelector('.upper-implant-count').value);
  const lowerCount = numberValue(card.querySelector('.lower-implant-count').value);
  const crownCount = numberValue(card.querySelector('.crown-count').value);
  hasImplants = upperCount + lowerCount > 0;

  const upperImplant = getSelected(DUTY_PRICING.implants, card.querySelector('.upper-implant-brand').value);
  const lowerImplant = getSelected(DUTY_PRICING.implants, card.querySelector('.lower-implant-brand').value);
  const crown = getSelected(DUTY_PRICING.crowns, card.querySelector('.crown-brand').value);
  const bridgePrice = numberValue(card.querySelector('.bridge-price').value);

  if(upperImplant) subtotal += upperCount * upperImplant.price;
  if(lowerImplant) subtotal += lowerCount * lowerImplant.price;
  if(crown) subtotal += crownCount * crown.price;
  if(card.querySelector('.bridge-price').value !== '') subtotal += bridgePrice;

  card.querySelectorAll('.procedure-choice:checked').forEach(choice=>subtotal += numberValue(choice.dataset.price));

  card.querySelector('.option-subtotal').textContent = money(subtotal);
  return { subtotal, hasImplants, visits: numberValue(card.querySelector('.visit-count').value) };
}

function recalculateQuotation(){
  const cards = [...document.querySelectorAll('.quotation-option')];
  let baseTotal = 0;
  let implantCase = false;
  const optionSummaries = [];

  cards.forEach(card=>{
    const result = calculateOption(card);
    baseTotal += result.subtotal;
    implantCase = implantCase || result.hasImplants;
    optionSummaries.push({name: card.querySelector('.option-name').value || 'Option', subtotal: result.subtotal, visits: result.visits});
  });

  const markup = Math.max(0, numberValue($('markupPercent').value));
  const markedTotal = baseTotal * (1 + markup / 100);
  const country = $('patientCountry').value;
  const eligible = DUTY_PRICING.financing.eligibleCountries.includes(country);

  let html = optionSummaries.length
    ? optionSummaries.map(item=>`<div class="summary-row"><span>${escapeHtml(item.name)} <small>(${item.visits} visit${item.visits===1?'':'s'})</small></span><strong>${money(item.subtotal)}</strong></div>`).join('')
    : '<p>No quotation options added yet.</p>';

  html += `<div class="summary-row"><span>Base total</span><strong>${money(baseTotal)}</strong></div>`;
  html += `<div class="summary-row"><span>Coordinator markup (${markup}%)</span><strong>${money(markedTotal - baseTotal)}</strong></div>`;
  html += `<div class="summary-row grand-total"><span>Patient quotation total</span><strong>${money(markedTotal)}</strong></div>`;

  if(implantCase){
    html += `<div class="rule-note">Implant case: default is 2 visits. A 1-visit plan requires explicit coordinator confirmation.</div>`;
  }

  if(eligible){
    const financedPackage = markedTotal * 1.20;
    const installment = Math.min(DUTY_PRICING.financing.installmentAmount, financedPackage);
    const cashRemaining = Math.max(0, financedPackage - installment);
    const visits = optionSummaries.length ? Math.max(...optionSummaries.map(item=>item.visits)) : 2;
    const cashPerVisit = visits > 1 ? cashRemaining / visits : cashRemaining;
    html += `<div class="financing-box"><strong>US / Canada installment logic</strong><br>Package + 20%: ${money(financedPackage)}<br>Installments: ${money(installment)} (up to ${DUTY_PRICING.financing.maximumTermMonths} months)<br>Remaining cash: ${money(cashRemaining)}${visits > 1 ? ` / ${visits} visits = ${money(cashPerVisit)} each visit` : ` — payable at the single visit`}</div>`;
  }

  $('summaryLines').innerHTML = html;
}

function numberValue(value){
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function money(value){
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
