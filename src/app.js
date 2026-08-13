const $ = (id) => document.getElementById(id);

const steps = [$('step1'), $('step2'), $('step3')];
const stepNumber = $('stepNumber');

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
  alert('Next module: quotation options, visit rules, markup and payment plan.');
});

function escapeHtml(value){
  return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
