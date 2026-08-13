const $ = (id) => document.getElementById(id);
const steps = [$('step1'), $('step2'), $('step3'), $('step4')];
const stepNumber = $('stepNumber');
let diagnosisData = null;
let optionCount = 0;

function showStep(index){ steps.forEach((step,i)=>step.classList.toggle('hidden',i!==index)); stepNumber.textContent=index+1; }
function escapeHtml(value){ return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function money(n){ return '$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2}); }
function getPrice(list,id){ return list.find(x=>x.id===id); }
function implantCount(){ return Number($('upperImplants').value||0)+Number($('lowerImplants').value||0); }

$('toDiagnosis').addEventListener('click',()=>{ if(!$('patientName').value.trim()) return $('patientName').focus(); showStep(1); });
$('backToPatient').addEventListener('click',()=>showStep(0));
$('backToDiagnosis').addEventListener('click',()=>showStep(1));
$('backToConfirm').addEventListener('click',()=>showStep(2));

$('parseDiagnosis').addEventListener('click',()=>{
  const text=$('diagnosis').value.trim(); if(!text) return $('diagnosis').focus();
  diagnosisData={patient:$('patientName').value.trim(),language:$('language').value,source:'Diagnosis Copy-past',rawDiagnosis:text,implantMention:/implant|имплант/i.test(text)};
  $('structuredData').innerHTML=`<div class="data-box"><strong>Patient:</strong> ${escapeHtml(diagnosisData.patient)}\n<strong>Language:</strong> ${escapeHtml(diagnosisData.language)}\n<strong>Source:</strong> Diagnosis Copy-past\n<strong>Implants mentioned:</strong> ${diagnosisData.implantMention?'Yes — coordinator must confirm exact quantities':'Not detected'}\n\n<strong>Doctor data:</strong>\n${escapeHtml(text)}</div>`;
  $('confirmTreatment').checked=false; $('continueToOptions').disabled=true; showStep(2);
});
$('confirmTreatment').addEventListener('change',e=>{$('continueToOptions').disabled=!e.target.checked;});
$('continueToOptions').addEventListener('click',()=>{ setupQuotation(); showStep(3); });

function setupQuotation(){
  const hasImplants=diagnosisData?.implantMention || implantCount()>0;
  $('visitRule').textContent=hasImplants?'Implant case detected: 2 visits is mandatory by default. One visit is allowed only after explicit dentist/coordinator confirmation.':'No implant case detected: coordinator may choose the appropriate visit plan.';
  $('visitCount').value=hasImplants?'2':'1';
  $('visitCount').disabled=false;
  toggleVisitFields();
  if(optionCount===0) addOption();
}
$('visitCount').addEventListener('change',toggleVisitFields);
function toggleVisitFields(){
  const one=$('visitCount').value==='1'; $('oneVisitApproval').classList.toggle('hidden',!one); $('twoVisitDurations').classList.toggle('hidden',one);
}
$('bridgeRequired').addEventListener('change',()=>{$('bridgePriceWrap').classList.toggle('hidden',!$('bridgeRequired').checked);});

function optionHtml(n){
  const implants=DUTY_PRICING.implants.map(x=>`<option value="${x.id}">${escapeHtml(x.displayName||x.name)} — ${money(x.price)}/implant</option>`).join('');
  const crowns=DUTY_PRICING.crowns.filter(x=>x.id!=='veneers').map(x=>`<option value="${x.id}">${escapeHtml(x.displayName||x.name)} — ${money(x.price)}/crown</option>`).join('');
  return `<div class="option-card" data-option="${n}"><div class="section-heading"><strong>Option ${n}</strong><button type="button" class="remove-option secondary" data-option="${n}">Remove</button></div><label>Implant system</label><select class="option-implant">${implants}</select><label>Crown / material system</label><select class="option-crown">${crowns}</select></div>`;
}
function addOption(){ if(optionCount>=4) return; optionCount++; $('optionList').insertAdjacentHTML('beforeend',optionHtml(optionCount)); if(optionCount>=4) $('addOption').disabled=true; bindRemoveButtons(); }
$('addOption').addEventListener('click',addOption);
function bindRemoveButtons(){ document.querySelectorAll('.remove-option').forEach(btn=>{btn.onclick=()=>{btn.closest('.option-card').remove(); $('addOption').disabled=false;};}); }

function calculateBase(implant,crown){
  const implants=implantCount(); const crowns=Number($('crownCount').value||0); let total=implants*implant.price+crowns*crown.price;
  if($('bridgeRequired').checked){ const bp=Number($('bridgePrice').value); if(!bp) return {error:'A confirmed bridge price is required because it is not present in the current official XLS price list.'}; total+=bp; }
  const sinus=Number($('sinusLift').value); if(sinus===1) total+=740; if(sinus===2) total+=1400;
  total+=Number($('boneGraftCc').value||0)*400;
  return {total};
}

$('country').addEventListener('change',updateFinancingMessage);
function updateFinancingMessage(){ const eligible=['United States','Canada'].includes($('country').value); $('financingBox').textContent=eligible?'Eligible: +20% is applied to the package for the installment plan. $3,900 can be paid by installments up to 24 months; the remaining balance is paid in cash at the clinic.':'Installment plan is available only for patients residing in the United States or Canada.'; }
updateFinancingMessage();

$('calculateQuotation').addEventListener('click',()=>{
  const implants=implantCount();
  if(implants>0 && $('visitCount').value==='1' && !$('dentistOneVisitConfirmed').checked) return alert('One visit for an implant case requires explicit dentist/coordinator confirmation.');
  if(implants>0 && $('visitCount').value==='1' && Number($('oneVisitDays').value)<1) return alert('Enter the one-visit duration.');
  if(implants===0 && Number($('crownCount').value)===0) return alert('Enter the confirmed treatment quantities.');
  const markup=Number($('markupPercent').value||0)/100; const cards=[...document.querySelectorAll('.option-card')]; if(!cards.length) return alert('Add at least one quotation option.');
  const results=[];
  for(const card of cards){ const implant=getPrice(DUTY_PRICING.implants,card.querySelector('.option-implant').value); const crown=getPrice(DUTY_PRICING.crowns,card.querySelector('.option-crown').value); const calc=calculateBase(implant,crown); if(calc.error) return alert(calc.error); const quoted=calc.total*(1+markup); results.push({implant,crown,base:calc.total,quoted}); }
  const eligible=['United States','Canada'].includes($('country').value);
  const visitCount=Number($('visitCount').value); let html=`<h3>Quotation calculation</h3><p><strong>${escapeHtml($('patientName').value)}</strong> • ${escapeHtml($('language').value)}</p>`;
  results.forEach((r,i)=>{ html+=`<div class="quote-option"><strong>Option ${i+1} — ${escapeHtml(r.implant.displayName||r.implant.name)} + ${escapeHtml(r.crown.displayName||r.crown.name)}</strong><br>Base package: ${money(r.base)}<br>Patient quotation: <strong>${money(r.quoted)}</strong></div>`; });
  const totalQuoted=results.reduce((s,r)=>s+r.quoted,0); const selectedBase=results.reduce((s,r)=>s+r.base,0); // each option is a separate alternative, not a combined treatment
  html+=`<div class="quote-summary"><strong>Visit plan:</strong> ${visitCount} visit${visitCount===1?'':'s'}${visitCount===1?` — ${$('oneVisitDays').value} days`: ` — ${$('visit1Days').value} + ${$('visit2Days').value} days`}<br><strong>Selected options:</strong> ${results.length}<br><strong>Financing:</strong> ${eligible?'Eligible for installment calculation':'Not eligible based on residence'}</div>`;
  if(eligible){ results.forEach((r,i)=>{const financed=r.quoted*1.2; const cash=Math.max(0,financed-3900); const perVisit=visitCount===2?cash/2:cash; html+=`<div class="finance-option"><strong>Option ${i+1} payment plan</strong><br>Package with financing +20%: ${money(financed)}<br>Installments: ${money(Math.min(3900,financed))}<br>Cash balance: ${money(cash)}<br>Cash per visit: ${money(perVisit)}${visitCount===1?'':' each visit'}</div>`;}); }
  $('quotationResult').innerHTML=html; $('quotationResult').classList.remove('hidden');
});
