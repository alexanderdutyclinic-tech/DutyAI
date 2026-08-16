// DutyAI patient-facing quotation PDF renderer.
// First version uses the browser print engine: no PDF API/server cost.
// The calculator remains the single source of truth for all amounts.

function pdfMoney(value){
  const amount = Number(value) || 0;
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
}

function pdfEsc(value){
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function pdfDate(iso, language){
  const date = new Date(iso);
  if(Number.isNaN(date.getTime())) return '';

  return language === 'Russian'
    ? date.toLocaleDateString('ru-RU')
    : date.toLocaleDateString('en-GB');
}

function pdfLabels(language){
  if(language === 'Russian'){
    return {
      proposal: 'ПЕРСОНАЛЬНЫЙ ПЛАН ЛЕЧЕНИЯ',
      preparedFor: 'Подготовлено для',
      date: 'Дата',
      treatmentPlan: 'ПЛАН ЛЕЧЕНИЯ',
      treatment: 'Лечение',
      quantity: 'Кол-во',
      unitPrice: 'Цена за единицу',
      total: 'Стоимость',
      implants: 'Импланты',
      crowns: 'Коронки',
      procedures: 'Дополнительные процедуры',
      accommodation: 'ПРОЖИВАНИЕ И УСЛУГИ',
      visit1: 'ПЕРВЫЙ ВИЗИТ',
      visit2: 'ВТОРОЙ ВИЗИТ',
      hotel: 'Отель',
      room: 'Номер',
      nights: 'Ночей',
      perNight: 'Цена за ночь',
      services: 'Услуги',
      included: 'Включено',
      transfer: 'VIP-трансфер',
      prosthesis: 'Зубной протез',
      translator: 'Переводчик',
      payment: 'ОПЛАТА',
      paymentByVisit: 'Оплата по визитам',
      optionTotal: 'Общая стоимость варианта',
      visit: 'Визит',
      summary: 'ИТОГ',
      oneVisit: '1 визит',
      twoVisits: '2 визита',
      important: 'ВАЖНО',
      generated: 'Документ сформирован автоматически на основании выбранного варианта лечения.',
      disclaimer: 'Окончательный план лечения и объём процедур подтверждаются врачом после клинического осмотра и необходимых диагностических исследований.',
      intro: 'Предлагаем индивидуальный план лечения, подготовленный на основании предоставленной информации. Ниже представлены выбранные варианты лечения, проживание, услуги и порядок оплаты.',
      installment: 'РАССРОЧКА ДЛЯ США / КАНАДЫ',
      package: 'Пакет +',
      installmentAmount: 'Сумма рассрочки',
      remainingCash: 'Оставшаяся сумма',
      cashPerVisit: 'Оплата наличными по визитам',
      recommended: 'РЕКОМЕНДУЕМЫЙ ВАРИАНТ'
    };
  }

  return {
    proposal: 'PERSONALIZED TREATMENT PROPOSAL',
    preparedFor: 'Prepared for',
    date: 'Date',
    treatmentPlan: 'TREATMENT PLAN',
    treatment: 'Treatment',
    quantity: 'Qty.',
    unitPrice: 'Unit price',
    total: 'Total',
    implants: 'Implants',
    crowns: 'Crowns',
    procedures: 'Additional procedures',
    accommodation: 'ACCOMMODATION & SERVICES',
    visit1: 'VISIT 1',
    visit2: 'VISIT 2',
    hotel: 'Hotel',
    room: 'Room',
    nights: 'Nights',
    perNight: 'Price / night',
    services: 'Services',
    included: 'Included',
    transfer: 'VIP transfer',
    prosthesis: 'Dental prosthesis',
    translator: 'Translator',
    payment: 'PAYMENT',
    paymentByVisit: 'Payment by visit',
    optionTotal: 'Option total',
    visit: 'Visit',
    summary: 'SUMMARY',
    oneVisit: '1 visit',
    twoVisits: '2 visits',
    important: 'IMPORTANT',
    generated: 'This document was generated automatically from the selected treatment option.',
    disclaimer: 'The final treatment plan and procedure scope are confirmed by the doctor after clinical examination and required diagnostic assessment.',
    intro: 'We are pleased to provide your personalized treatment proposal based on the information provided. The following pages summarize the selected treatment, accommodation, services and payment plan.',
    installment: 'US / CANADA INSTALLMENT PLAN',
    package: 'Package +',
    installmentAmount: 'Installment amount',
    remainingCash: 'Remaining cash',
    cashPerVisit: 'Cash per visit',
    recommended: 'RECOMMENDED OPTION'
  };
}

function pdfTreatmentRows(option, labels){
  const rows = [];
  const implants = option.treatment?.implants;
  const crowns = option.treatment?.crowns;

  if(implants?.quantity > 0){
    rows.push(`
      <tr>
        <td>${pdfEsc(labels.implants)} — ${pdfEsc(implants.name || '')}</td>
        <td>${implants.quantity}</td>
        <td>${pdfMoney(implants.finalUnitPrice)}</td>
        <td>${pdfMoney(implants.total)}</td>
      </tr>
    `);
  }

  if(crowns?.quantity > 0){
    rows.push(`
      <tr>
        <td>${pdfEsc(labels.crowns)} — ${pdfEsc(crowns.name || '')}</td>
        <td>${crowns.quantity}</td>
        <td>${pdfMoney(crowns.finalUnitPrice)}</td>
        <td>${pdfMoney(crowns.total)}</td>
      </tr>
    `);
  }

  for(const procedure of (option.treatment?.procedures || [])){
    const unitLabel = procedure.unit ? ` / ${pdfEsc(procedure.unit)}` : '';
    rows.push(`
      <tr>
        <td>${pdfEsc(procedure.name)}</td>
        <td>${procedure.quantity}${unitLabel}</td>
        <td>${pdfMoney(procedure.unitPrice)}</td>
        <td>${pdfMoney(procedure.total)}</td>
      </tr>
    `);
  }

  if(!rows.length){
    rows.push(`<tr><td colspan="4">—</td></tr>`);
  }

  return rows.join('');
}

function pdfHotelRows(visit, labels){
  const rows = [];
  const hotel = visit?.hotel;

  if(hotel){
    rows.push(`
      <tr>
        <td>${pdfEsc(labels.hotel)}</td>
        <td>${pdfEsc(hotel.name)}</td>
        <td>${hotel.nights}</td>
        <td>${pdfMoney(hotel.nightlyPrice)}</td>
        <td>${pdfMoney(hotel.total)}</td>
      </tr>
    `);
  }

  const services = visit?.services || {};
  const serviceRows = [
    services.transfer,
    services.prosthesis,
    services.translator
  ].filter(Boolean);

  for(const service of serviceRows){
    rows.push(`
      <tr>
        <td>${pdfEsc(service.name)}</td>
        <td>${service.included ? pdfEsc(labels.included) : '—'}</td>
        <td>—</td>
        <td>—</td>
        <td>${service.total ? pdfMoney(service.total) : pdfEsc(labels.included)}</td>
      </tr>
    `);
  }

  if(!rows.length){
    rows.push(`<tr><td colspan="5">—</td></tr>`);
  }

  return rows.join('');
}

function pdfVisitSummary(option, labels){
  const v1 = option.visits?.visit1;
  const v2 = option.visits?.visit2;
  const rows = [];

  if(v1){
    rows.push(`
      <div class="visit-summary">
        <div class="visit-summary-title">${pdfEsc(labels.visit1)}</div>
        <div class="visit-line"><span>${pdfEsc(labels.treatment)}</span><strong>${pdfMoney(v1.dentalTotal)}</strong></div>
        <div class="visit-line"><span>${pdfEsc(labels.services)}</span><strong>${pdfMoney(v1.servicesTotal)}</strong></div>
        <div class="visit-total"><span>${pdfEsc(labels.visit)} 1</span><strong>${pdfMoney(v1.total)}</strong></div>
      </div>
    `);
  }

  if(v2){
    rows.push(`
      <div class="visit-summary">
        <div class="visit-summary-title">${pdfEsc(labels.visit2)}</div>
        <div class="visit-line"><span>${pdfEsc(labels.treatment)}</span><strong>${pdfMoney(v2.dentalTotal)}</strong></div>
        <div class="visit-line"><span>${pdfEsc(labels.services)}</span><strong>${pdfMoney(v2.servicesTotal)}</strong></div>
        <div class="visit-total"><span>${pdfEsc(labels.visit)} 2</span><strong>${pdfMoney(v2.total)}</strong></div>
      </div>
    `);
  }

  return rows.join('');
}

function pdfInstallmentBlock(quotation, option, labels){
  if(!quotation.payment?.installmentEligible || !quotation.payment?.financing){
    return '';
  }

  const financing = quotation.payment.financing;
  const financedPackage = option.totals.total * (1 + financing.markupPercent / 100);
  const installment = Math.min(financing.installmentAmount, financedPackage);
  const remainingCash = Math.max(0, financedPackage - installment);
  const cashPerVisit = option.visits.count > 1
    ? remainingCash / option.visits.count
    : remainingCash;

  return `
    <section class="installment-box">
      <div class="section-kicker">${pdfEsc(labels.installment)}</div>
      <div class="installment-grid">
        <div><span>${pdfEsc(labels.package)} ${financing.markupPercent}%</span><strong>${pdfMoney(financedPackage)}</strong></div>
        <div><span>${pdfEsc(labels.installmentAmount)}</span><strong>${pdfMoney(installment)}</strong></div>
        <div><span>${pdfEsc(labels.remainingCash)}</span><strong>${pdfMoney(remainingCash)}</strong></div>
        <div><span>${pdfEsc(labels.cashPerVisit)}</span><strong>${pdfMoney(cashPerVisit)}</strong></div>
      </div>
    </section>
  `;
}

function pdfOption(option, quotation, labels, index){
  const v1 = option.visits?.visit1;
  const v2 = option.visits?.visit2;
  const visitCount = option.visits?.count || 1;

  return `
    <section class="option-block">
      <div class="option-title-row">
        <div>
          <div class="option-number">OPTION ${index + 1}</div>
          <h2>${pdfEsc(option.name)}</h2>
        </div>
        <div class="option-total">
          <span>${pdfEsc(labels.optionTotal)}</span>
          <strong>${pdfMoney(option.totals.total)}</strong>
        </div>
      </div>

      <div class="section-kicker">${pdfEsc(labels.treatmentPlan)}</div>
      <table class="proposal-table">
        <thead>
          <tr>
            <th>${pdfEsc(labels.treatment)}</th>
            <th>${pdfEsc(labels.quantity)}</th>
            <th>${pdfEsc(labels.unitPrice)}</th>
            <th>${pdfEsc(labels.total)}</th>
          </tr>
        </thead>
        <tbody>${pdfTreatmentRows(option, labels)}</tbody>
      </table>

      <div class="section-kicker">${pdfEsc(labels.accommodation)} — ${visitCount === 1 ? pdfEsc(labels.oneVisit) : pdfEsc(labels.twoVisits)}</div>

      ${v1 ? `
        <div class="visit-heading">${pdfEsc(labels.visit1)}</div>
        <table class="proposal-table services-table">
          <thead>
            <tr><th>${pdfEsc(labels.services)}</th><th>Details</th><th>${pdfEsc(labels.nights)}</th><th>${pdfEsc(labels.perNight)}</th><th>${pdfEsc(labels.total)}</th></tr>
          </thead>
          <tbody>${pdfHotelRows(v1, labels)}</tbody>
        </table>
      ` : ''}

      ${v2 ? `
        <div class="visit-heading">${pdfEsc(labels.visit2)}</div>
        <table class="proposal-table services-table">
          <thead>
            <tr><th>${pdfEsc(labels.services)}</th><th>Details</th><th>${pdfEsc(labels.nights)}</th><th>${pdfEsc(labels.perNight)}</th><th>${pdfEsc(labels.total)}</th></tr>
          </thead>
          <tbody>${pdfHotelRows(v2, labels)}</tbody>
        </table>
      ` : ''}

      <div class="payment-section">
        <div class="section-kicker">${pdfEsc(labels.paymentByVisit)}</div>
        ${pdfVisitSummary(option, labels)}
        <div class="grand-total">
          <span>${pdfEsc(labels.total)}</span>
          <strong>${pdfMoney(option.totals.total)}</strong>
        </div>
      </div>

      ${pdfInstallmentBlock(quotation, option, labels)}
    </section>
  `;
}

function generateQuotationPdf(){
  if(typeof buildQuotationData !== 'function'){
    alert('Quotation data is not available yet.');
    return;
  }

  const quotation = buildQuotationData();
  const language = quotation.patient.language || 'Russian';
  const labels = pdfLabels(language);
  const patientName = quotation.patient.name || 'Patient';
  const generatedDate = pdfDate(quotation.generatedAt, language);

  const optionsHtml = quotation.options.length
    ? quotation.options.map((option, index) => pdfOption(option, quotation, labels, index)).join('')
    : '<p>No quotation options were added.</p>';

  const diagnosis = quotation.patient.diagnosis;

  const html = `<!doctype html>
<html lang="${language === 'Russian' ? 'ru' : 'en'}">
<head>
<meta charset="utf-8">
<title>Duty Clinic — ${pdfEsc(patientName)}</title>
<style>
  @page { size: A4; margin: 12mm 12mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #18202b; background: #fff; font-size: 10.5pt; line-height: 1.42; }
  .page { max-width: 190mm; margin: 0 auto; }
  .brand-bar { border-bottom: 4px solid #e43b3b; padding: 0 0 12px; margin-bottom: 18px; }
  .brand { font-size: 28pt; font-weight: 800; letter-spacing: -1px; color: #15283f; }
  .brand-meta { margin-top: 5px; font-size: 9pt; color: #56616d; }
  .brand-meta strong { color: #15283f; }
  .title { margin: 16px 0 6px; color: #15283f; font-size: 19pt; letter-spacing: .3px; }
  .subtitle { color: #596572; font-size: 10pt; }
  .patient-card { margin: 18px 0 20px; padding: 14px 16px; background: #f4f7fa; border-left: 5px solid #1f5eff; border-radius: 5px; }
  .patient-name { font-size: 16pt; font-weight: 700; color: #15283f; }
  .patient-meta { margin-top: 4px; color: #596572; }
  .intro { margin: 18px 0 20px; }
  .diagnosis { padding: 11px 13px; background: #fafafa; border: 1px solid #e2e6ea; border-radius: 5px; white-space: pre-wrap; font-size: 9.5pt; }
  .option-block { margin: 0 0 22px; padding: 0 0 20px; border-bottom: 1px solid #d9dfe5; page-break-inside: avoid; }
  .option-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; margin-bottom: 14px; }
  .option-number { color: #e43b3b; font-size: 8pt; font-weight: 800; letter-spacing: 1.4px; }
  h2 { margin: 3px 0 0; color: #15283f; font-size: 17pt; }
  .option-total { min-width: 42mm; padding: 10px 12px; background: #15283f; color: white; border-radius: 6px; text-align: right; }
  .option-total span { display: block; font-size: 7.5pt; opacity: .8; }
  .option-total strong { display: block; margin-top: 2px; font-size: 16pt; }
  .section-kicker { margin: 14px 0 7px; color: #15283f; font-size: 8.5pt; font-weight: 800; letter-spacing: 1.1px; }
  .proposal-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; page-break-inside: avoid; }
  .proposal-table th { background: #eef3f8; color: #15283f; text-align: left; font-size: 8pt; padding: 7px 8px; border-bottom: 1px solid #ccd5de; }
  .proposal-table td { padding: 7px 8px; border-bottom: 1px solid #e3e7eb; vertical-align: top; font-size: 9pt; }
  .proposal-table th:not(:first-child), .proposal-table td:not(:first-child) { text-align: right; white-space: nowrap; }
  .services-table th:first-child, .services-table td:first-child { width: 24%; }
  .services-table th:nth-child(2), .services-table td:nth-child(2) { width: 30%; }
  .visit-heading { margin: 11px 0 5px; font-size: 9.5pt; font-weight: 800; color: #1f5eff; }
  .payment-section { margin-top: 14px; }
  .visit-summary { display: inline-block; vertical-align: top; width: 48.5%; margin: 0 1% 8px 0; padding: 10px 11px; border: 1px solid #dce2e8; border-radius: 5px; page-break-inside: avoid; }
  .visit-summary:nth-child(2n) { margin-right: 0; }
  .visit-summary-title { color: #15283f; font-weight: 800; font-size: 9pt; margin-bottom: 5px; }
  .visit-line, .visit-total { display: flex; justify-content: space-between; gap: 10px; }
  .visit-line { color: #596572; font-size: 8.5pt; margin-top: 2px; }
  .visit-total { margin-top: 6px; padding-top: 6px; border-top: 1px solid #e0e5ea; font-weight: 800; color: #15283f; }
  .grand-total { margin-top: 8px; padding: 12px 14px; background: #f4f7fa; display: flex; justify-content: space-between; align-items: center; border-radius: 5px; }
  .grand-total span { font-weight: 700; color: #15283f; }
  .grand-total strong { font-size: 16pt; color: #e43b3b; }
  .installment-box { margin-top: 14px; padding: 12px 14px; border: 1px solid #ccd8e6; border-left: 5px solid #1f5eff; border-radius: 5px; background: #f7faff; page-break-inside: avoid; }
  .installment-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }
  .installment-grid div { padding: 8px; background: white; border: 1px solid #e1e7ee; border-radius: 4px; }
  .installment-grid span { display: block; font-size: 7.5pt; color: #66727e; }
  .installment-grid strong { display: block; margin-top: 3px; color: #15283f; }
  .closing { margin-top: 20px; page-break-inside: avoid; }
  .important { padding: 13px 14px; background: #fff8f8; border-left: 5px solid #e43b3b; border-radius: 4px; }
  .important-title { color: #e43b3b; font-weight: 800; letter-spacing: .8px; margin-bottom: 5px; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 2px solid #15283f; color: #596572; font-size: 8pt; }
  .footer strong { color: #15283f; }
  .print-note { margin: 12px 0; padding: 9px 11px; background: #fffbe8; border: 1px solid #eadb91; font-size: 9pt; }
  @media print { .print-note { display: none; } a { color: inherit; text-decoration: none; } }
</style>
</head>
<body>
<div class="page">
  <div class="print-note">${language === 'Russian' ? 'В окне печати выберите «Сохранить как PDF».' : 'In the print dialog, choose “Save as PDF”.'}</div>

  <header class="brand-bar">
    <div class="brand">Duty Clinic</div>
    <div class="brand-meta"><strong>Istanbul • Türkiye</strong> | Professional Dental Care with International Standards.</div>
    <div class="brand-meta">Duty Clinic Istanbul | +90 536 779 07 91 | dutyclinic.com | info@dutyclinic.com</div>
  </header>

  <h1 class="title">${pdfEsc(labels.proposal)}</h1>
  <div class="subtitle">${pdfEsc(labels.date)}: ${pdfEsc(generatedDate)}</div>

  <div class="patient-card">
    <div class="patient-name">${pdfEsc(patientName)}</div>
    <div class="patient-meta">${pdfEsc(labels.preparedFor)} ${pdfEsc(patientName)} · ${quotation.options.length} ${quotation.options.length === 1 ? 'option' : 'options'}</div>
  </div>

  <div class="intro">${pdfEsc(labels.intro)}</div>

  ${diagnosis ? `<div class="section-kicker">${pdfEsc(labels.treatmentPlan)}</div><div class="diagnosis">${pdfEsc(diagnosis)}</div>` : ''}

  ${optionsHtml}

  <section class="closing">
    <div class="important">
      <div class="important-title">${pdfEsc(labels.important)}</div>
      <div>${pdfEsc(labels.disclaimer)}</div>
    </div>
  </section>

  <footer class="footer">
    <strong>Duty Clinic Istanbul</strong> | Istanbul, Türkiye | +90 536 779 07 91 | dutyclinic.com | info@dutyclinic.com
    <br>${pdfEsc(labels.generated)}
  </footer>
</div>
<script>
  window.addEventListener('load', () => {
    setTimeout(() => window.print(), 350);
  });
</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=1000,height=800');

  if(!printWindow){
    alert('Please allow pop-ups for Duty AI to generate the PDF.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

if(typeof window !== 'undefined'){
  window.generateQuotationPdf = generateQuotationPdf;
}
