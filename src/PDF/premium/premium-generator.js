// DutyAI Premium Proposal renderer.
// This layer ONLY formats already-calculated quotation data for the patient.
// It does not calculate treatment prices or make clinical decisions.

function premiumMoney(value) {
  const amount = Number(value) || 0;
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
}

function premiumEsc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function premiumDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB');
}

function premiumLabels(language) {
  const labels = {
    English: {
      proposal: 'PERSONALIZED DENTAL TREATMENT PROPOSAL',
      prepared: 'Prepared exclusively for',
      treatment: 'Your Treatment Plan',
      confirmed: 'Doctor-confirmed treatment information',
      options: 'Treatment Options',
      treatmentCost: 'Treatment',
      services: 'Services',
      total: 'Total',
      accommodation: 'Accommodation & Services',
      visit1: 'Visit 1',
      visit2: 'Visit 2',
      nights: 'nights',
      team: 'Your Dental Team',
      experience: 'Your Istanbul Experience',
      investment: 'Your Investment',
      payment: 'Payment by Visit',
      important: 'IMPORTANT',
      disclaimer: 'The final treatment plan and procedure scope are confirmed by the doctor after clinical examination and required diagnostic assessment.',
      closing: 'We look forward to welcoming you to Duty Clinic Istanbul.',
      generated: 'Prepared automatically from the coordinator-approved quotation.'
    },
    Russian: {
      proposal: 'ПЕРСОНАЛЬНЫЙ ПЛАН ЛЕЧЕНИЯ', prepared: 'Подготовлено специально для', treatment: 'Ваш план лечения', confirmed: 'Подтверждённая врачом информация', options: 'Варианты лечения', treatmentCost: 'Лечение', services: 'Услуги', total: 'Итого', accommodation: 'Проживание и услуги', visit1: 'Первый визит', visit2: 'Второй визит', nights: 'ночей', team: 'Ваша стоматологическая команда', experience: 'Ваше пребывание в Стамбуле', investment: 'Стоимость лечения', payment: 'Оплата по визитам', important: 'ВАЖНО', disclaimer: 'Окончательный план лечения и объём процедур подтверждаются врачом после клинического осмотра и необходимых диагностических исследований.', closing: 'Будем рады приветствовать вас в Duty Clinic Istanbul.', generated: 'Документ сформирован автоматически на основании подтверждённого варианта лечения.'
    },
    French: {
      proposal: 'PLAN DE TRAITEMENT DENTAIRE PERSONNALISÉ', prepared: 'Préparé spécialement pour', treatment: 'Votre plan de traitement', confirmed: 'Informations confirmées par le médecin', options: 'Options de traitement', treatmentCost: 'Traitement', services: 'Services', total: 'Total', accommodation: 'Hébergement et services', visit1: 'Première visite', visit2: 'Deuxième visite', nights: 'nuits', team: 'Votre équipe dentaire', experience: 'Votre expérience à Istanbul', investment: 'Votre investissement', payment: 'Paiement par visite', important: 'IMPORTANT', disclaimer: 'Le plan de traitement final et le volume des procédures sont confirmés par le médecin après l’examen clinique et les examens diagnostiques nécessaires.', closing: 'Nous serons heureux de vous accueillir à Duty Clinic Istanbul.', generated: 'Document généré automatiquement à partir du devis approuvé.'
    },
    Spanish: {
      proposal: 'PROPUESTA PERSONALIZADA DE TRATAMIENTO DENTAL', prepared: 'Preparado especialmente para', treatment: 'Su plan de tratamiento', confirmed: 'Información confirmada por el médico', options: 'Opciones de tratamiento', treatmentCost: 'Tratamiento', services: 'Servicios', total: 'Total', accommodation: 'Alojamiento y servicios', visit1: 'Primera visita', visit2: 'Segunda visita', nights: 'noches', team: 'Su equipo dental', experience: 'Su experiencia en Estambul', investment: 'Su inversión', payment: 'Pago por visita', important: 'IMPORTANTE', disclaimer: 'El plan de tratamiento final y el alcance de los procedimientos serán confirmados por el médico después del examen clínico y las pruebas diagnósticas necesarias.', closing: 'Esperamos darle la bienvenida a Duty Clinic Istanbul.', generated: 'Documento generado automáticamente a partir de la cotización aprobada.'
    }
  };

  return labels[language] || labels.English;
}

function premiumTreatmentSummary(quotation) {
  const data = quotation.patient?.treatmentData;
  if (!data) return premiumEsc(quotation.patient?.diagnosis || '');

  const lines = [];

  if (data.upperImplants) {
    lines.push(`${data.upperImplants} implant${data.upperImplants > 1 ? 's' : ''} for the upper jaw`);
  }

  if (data.lowerImplantsMin) {
    const lower = data.lowerImplantsMax && data.lowerImplantsMax !== data.lowerImplantsMin
      ? `${data.lowerImplantsMin}–${data.lowerImplantsMax}`
      : `${data.lowerImplantsMin}`;
    lines.push(`${lower} implant${data.lowerImplantsMax !== data.lowerImplantsMin ? 's' : ''} for the lower jaw according to clinical examination`);
  }

  if (data.crowns) {
    const material = data.crownMaterial === 'zirconia' ? 'zirconia ' : '';
    lines.push(`${data.crowns} ${material}crowns`);
  }

  if (!lines.length && quotation.patient?.diagnosis) {
    lines.push(quotation.patient.diagnosis);
  }

  return lines.map(line => `<li>${premiumEsc(line)}</li>`).join('');
}

function premiumTreatmentRows(option) {
  const rows = [];
  const treatment = option.treatment || {};

  if (treatment.implants?.quantity) {
    rows.push(`
      <div class="treatment-row">
        <div><strong>Dental implants</strong><span>${premiumEsc(treatment.implants.name || '')}</span></div>
        <strong>${treatment.implants.quantity}</strong>
        <strong>${premiumMoney(treatment.implants.total)}</strong>
      </div>
    `);
  }

  if (treatment.crowns?.quantity) {
    rows.push(`
      <div class="treatment-row">
        <div><strong>Dental crowns</strong><span>${premiumEsc(treatment.crowns.name || '')}</span></div>
        <strong>${treatment.crowns.quantity}</strong>
        <strong>${premiumMoney(treatment.crowns.total)}</strong>
      </div>
    `);
  }

  (treatment.procedures || []).forEach(procedure => {
    rows.push(`
      <div class="treatment-row">
        <div><strong>${premiumEsc(procedure.name)}</strong><span>${procedure.unit ? `${procedure.quantity} ${premiumEsc(procedure.unit)}` : ''}</span></div>
        <strong>${procedure.quantity}</strong>
        <strong>${premiumMoney(procedure.total)}</strong>
      </div>
    `);
  });

  return rows.join('');
}

function premiumVisitCard(visit, label) {
  if (!visit) return '';

  const hotel = visit.hotel;
  const services = visit.services || {};
  const serviceRows = [];

  if (services.transfer) serviceRows.push(`<div><span>${premiumEsc(services.transfer.name)}</span><strong>${services.transfer.total ? premiumMoney(services.transfer.total) : 'Included'}</strong></div>`);
  if (services.prosthesis) serviceRows.push(`<div><span>${premiumEsc(services.prosthesis.name)}</span><strong>${services.prosthesis.total ? premiumMoney(services.prosthesis.total) : 'Included'}</strong></div>`);
  if (services.translator) serviceRows.push(`<div><span>Translator</span><strong>Included</strong></div>`);

  return `
    <div class="visit-card">
      <div class="visit-title"><span>${label}</span><strong>${premiumMoney(visit.total)}</strong></div>
      ${hotel ? `
        <div class="visit-line">
          <span><strong>${premiumEsc(hotel.name)}</strong><br>${premiumEsc(hotel.roomLabel || hotel.roomType)} • ${hotel.nights} nights</span>
          <strong>${premiumMoney(hotel.total)}</strong>
        </div>
      ` : ''}
      <div class="service-list">${serviceRows.join('')}</div>
    </div>
  `;
}

function premiumDoctorCards() {
  const list = typeof doctors !== 'undefined' && Array.isArray(doctors) ? doctors : [];
  const images = {
    1: '/assets/doctors/Dr. Murat.jpg',
    2: '/assets/doctors/Dr. Vahap Çin.jpg',
    3: '/assets/doctors/Elvin Guliyev - Better by MTA.jpg',
    4: '/assets/doctors/DR.Vail Aksoy.jpg'
  };

  return list.slice(0, 4).map(doctor => `
    <div class="doctor-card">
      <img src="${images[doctor.id] || ''}" alt="">
      <div>
        <h3>${premiumEsc(doctor.name)}</h3>
        <p class="doctor-specialty">${premiumEsc(doctor.specialty || 'Dentistry')}</p>
        <p>${premiumEsc((doctor.expertise || doctor.treatments || []).slice(0, 4).join(' • '))}</p>
      </div>
    </div>
  `).join('');
}

function generatePremiumQuotationHtml(quotation) {
  const language = quotation.patient?.language || 'English';
  const labels = premiumLabels(language);
  const patientName = quotation.patient?.name || 'Patient';
  const date = premiumDate(quotation.generatedAt);
  const options = quotation.options || [];

  const optionBlocks = options.map((option, index) => {
    const visitCount = option.visits?.count || 1;
    const visits = option.visits || {};

    return `
      <section class="page option-page">
        <div class="page-header">
          <span>${labels.options}</span>
          <strong>${premiumEsc(patientName)}</strong>
        </div>

        <div class="option-kicker">OPTION ${index + 1}</div>
        <h2>${premiumEsc(option.name || `Option ${index + 1}`)}</h2>

        <div class="treatment-table">
          <div class="treatment-head"><span>Procedure</span><span>Qty.</span><span>Total</span></div>
          ${premiumTreatmentRows(option)}
        </div>

        <div class="section-label">${labels.accommodation} — ${visitCount} ${visitCount === 1 ? 'visit' : 'visits'}</div>
        <div class="visit-grid">
          ${premiumVisitCard(visits.visit1, labels.visit1)}
          ${premiumVisitCard(visits.visit2, labels.visit2)}
        </div>

        <div class="option-total-box">
          <span>${labels.total}</span>
          <strong>${premiumMoney(option.totals?.total)}</strong>
        </div>
      </section>
    `;
  }).join('');

  const selected = options[0];
  const visit1 = selected?.visits?.visit1;
  const visit2 = selected?.visits?.visit2;
  const paymentVisits = [];
  if (visit1) paymentVisits.push(`<div><span>Visit 1</span><strong>${premiumMoney(visit1.total)}</strong></div>`);
  if (visit2) paymentVisits.push(`<div><span>Visit 2</span><strong>${premiumMoney(visit2.total)}</strong></div>`);

  const financing = quotation.payment?.installmentEligible && selected
    ? (() => {
        const markup = Number(quotation.payment.financing?.markupPercent) || 0;
        const packageTotal = (Number(selected.totals?.total) || 0) * (1 + markup / 100);
        const installmentAmount = Number(quotation.payment.financing?.installmentAmount) || 0;
        const remaining = Math.max(0, packageTotal - installmentAmount);
        const visitCount = Number(selected.visits?.count) || 1;
        return `
          <div class="finance-box">
            <div><span>Package + ${markup}%</span><strong>${premiumMoney(packageTotal)}</strong></div>
            <div><span>Installment amount</span><strong>${premiumMoney(installmentAmount)}</strong></div>
            <div><span>Remaining cash</span><strong>${premiumMoney(remaining)}</strong></div>
            <div><span>Cash per visit</span><strong>${premiumMoney(remaining / visitCount)}</strong></div>
          </div>
        `;
      })()
    : '';

  return `
<!DOCTYPE html>
<html lang="${language === 'Russian' ? 'ru' : 'en'}">
<head>
<meta charset="UTF-8">
<title>Duty Clinic — Premium Proposal — ${premiumEsc(patientName)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #18263d; background: #fff; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; padding: 18mm 17mm; position: relative; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
  .cover { color: #fff; background: linear-gradient(135deg, #061a3b 0%, #0c2d5f 62%, #071225 100%); padding: 0; }
  .cover-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .28; }
  .cover-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(3,13,31,.48), rgba(3,13,31,.88)); }
  .cover-content { position: relative; z-index: 2; min-height: 297mm; padding: 22mm 19mm; display: flex; flex-direction: column; justify-content: space-between; }
  .logo-card { display: inline-block; background: #fff; padding: 8px 14px; border-radius: 4px; width: fit-content; }
  .logo-card img { width: 56mm; display: block; }
  .cover-rule { width: 42mm; height: 2px; background: #d8232a; margin: 16mm 0 8mm; }
  .eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; opacity: .8; }
  .cover h1 { font-size: 31px; line-height: 1.08; letter-spacing: 1.5px; margin: 0; max-width: 150mm; }
  .cover-patient { margin-top: 14mm; border-left: 3px solid #d8232a; padding-left: 7mm; }
  .cover-patient small { display: block; text-transform: uppercase; letter-spacing: 2px; opacity: .72; }
  .cover-patient strong { display: block; font-size: 25px; margin-top: 3mm; }
  .cover-footer { font-size: 10px; line-height: 1.6; opacity: .85; }
  .cover-footer strong { color: #fff; }
  .page-header { display: flex; justify-content: space-between; border-bottom: 1px solid #dfe4ea; padding-bottom: 4mm; font-size: 9px; color: #6c7583; text-transform: uppercase; letter-spacing: 1.4px; }
  .page-header strong { color: #18263d; }
  .kicker, .option-kicker, .section-label { color: #d8232a; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
  .page h2 { font-size: 27px; margin: 5mm 0 8mm; color: #09234a; }
  .page h3 { color: #09234a; }
  .intro { font-size: 11px; line-height: 1.75; color: #5c6674; }
  .summary-box { margin-top: 10mm; background: #f5f7fa; border-left: 4px solid #d8232a; border-radius: 5px; padding: 7mm; }
  .summary-box ul { margin: 3mm 0 0 5mm; padding: 0; line-height: 1.8; }
  .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-top: 8mm; }
  .feature { border: 1px solid #e0e4e9; border-radius: 6px; padding: 6mm; }
  .feature strong { display: block; color: #09234a; margin-bottom: 2mm; }
  .feature span { font-size: 10px; color: #667080; line-height: 1.5; }
  .treatment-table { border: 1px solid #e1e5ea; border-radius: 6px; overflow: hidden; margin-top: 7mm; }
  .treatment-head, .treatment-row { display: grid; grid-template-columns: 1fr 25mm 34mm; gap: 4mm; padding: 4mm 5mm; align-items: center; }
  .treatment-head { background: #09234a; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
  .treatment-row { border-top: 1px solid #e8ebef; font-size: 10px; }
  .treatment-row div strong { display: block; color: #18263d; }
  .treatment-row div span { display: block; font-size: 8.5px; color: #7b8490; margin-top: 1mm; }
  .section-label { margin-top: 9mm; }
  .visit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-top: 4mm; }
  .visit-card { border: 1px solid #dfe4ea; border-radius: 6px; padding: 5mm; background: #fff; }
  .visit-title, .visit-line, .service-list div, .finance-box div { display: flex; justify-content: space-between; gap: 4mm; }
  .visit-title { padding-bottom: 3mm; border-bottom: 2px solid #d8232a; margin-bottom: 4mm; }
  .visit-title span { font-weight: 700; color: #09234a; }
  .visit-line { font-size: 9px; line-height: 1.5; }
  .service-list { margin-top: 4mm; border-top: 1px solid #edf0f3; padding-top: 3mm; }
  .service-list div { font-size: 8.5px; padding: 1.5mm 0; color: #687282; }
  .option-total-box { margin-top: 7mm; background: #09234a; color: #fff; border-radius: 6px; padding: 6mm; display: flex; justify-content: space-between; align-items: center; }
  .option-total-box strong { font-size: 20px; }
  .payment-box { margin-top: 8mm; border: 1px solid #dfe4ea; border-radius: 6px; padding: 6mm; }
  .payment-box h3 { margin: 0 0 4mm; }
  .payment-box > div { display: flex; justify-content: space-between; padding: 3mm 0; border-top: 1px solid #edf0f3; }
  .finance-box { margin-top: 6mm; display: grid; grid-template-columns: repeat(4,1fr); gap: 3mm; }
  .finance-box div { display: block; border: 1px solid #dfe4ea; border-radius: 5px; padding: 4mm; }
  .finance-box span { display: block; font-size: 8px; color: #737c89; }
  .finance-box strong { display: block; margin-top: 2mm; font-size: 12px; color: #09234a; }
  .doctor-card { display: grid; grid-template-columns: 38mm 1fr; gap: 5mm; border: 1px solid #e0e4e9; border-radius: 6px; padding: 4mm; margin-bottom: 4mm; min-height: 44mm; }
  .doctor-card img { width: 38mm; height: 44mm; object-fit: cover; border-radius: 4px; background: #eef1f5; }
  .doctor-card h3 { margin: 1mm 0 2mm; font-size: 15px; }
  .doctor-card p { margin: 1mm 0; font-size: 9px; color: #667080; line-height: 1.5; }
  .doctor-card .doctor-specialty { color: #d8232a; font-weight: 700; }
  .clinic-image { width: 100%; height: 78mm; object-fit: cover; border-radius: 7px; margin-top: 6mm; }
  .closing { min-height: 297mm; background: #071a3b; color: #fff; display: flex; align-items: center; justify-content: center; text-align: center; }
  .closing-inner { max-width: 145mm; }
  .closing h2 { color: #fff; font-size: 29px; }
  .closing p { color: rgba(255,255,255,.76); line-height: 1.8; font-size: 11px; }
  .important { margin-top: 12mm; border: 1px solid rgba(216,35,42,.7); border-radius: 6px; padding: 5mm; text-align: left; }
  .important strong { color: #ff6a70; font-size: 10px; letter-spacing: 1.5px; }
  .important p { margin: 2mm 0 0; font-size: 9px; }
  .contact { margin-top: 10mm; font-size: 9px; line-height: 1.8; }
  @media print { .page { box-shadow: none; } }
</style>
</head>
<body>

<section class="page cover">
  <img class="cover-image" src="/assets/patients/0002.jpg" alt="">
  <div class="cover-overlay"></div>
  <div class="cover-content">
    <div>
      <div class="logo-card"><img src="/assets/logo/Logo-main.png" alt="Duty Clinic"></div>
      <div class="cover-rule"></div>
      <div class="eyebrow">Duty Clinic Istanbul</div>
      <h1>${labels.proposal}</h1>
      <div class="cover-patient">
        <small>${labels.prepared}</small>
        <strong>${premiumEsc(patientName)}</strong>
      </div>
    </div>
    <div class="cover-footer">
      <strong>Istanbul, Türkiye</strong><br>
      +90 536 779 07 91 • dutyclinic.com • info@dutyclinic.com<br>
      ${premiumEsc(date)}
    </div>
  </div>
</section>

<section class="page">
  <div class="page-header"><span>${labels.treatment}</span><strong>${premiumEsc(patientName)}</strong></div>
  <div style="margin-top: 14mm">
    <div class="kicker">01</div>
    <h2>${labels.treatment}</h2>
    <p class="intro">${premiumEsc(labels.generated)}</p>
    <div class="summary-box">
      <strong>${labels.confirmed}</strong>
      <ul>${premiumTreatmentSummary(quotation)}</ul>
    </div>
    <div class="feature-grid">
      <div class="feature"><strong>Modern dentistry</strong><span>Personalized treatment planning based on the confirmed clinical information.</span></div>
      <div class="feature"><strong>International patient care</strong><span>Coordinated treatment, accommodation and patient support in Istanbul.</span></div>
      <div class="feature"><strong>Transparent quotation</strong><span>The investment shown in this proposal comes from the selected quotation option.</span></div>
      <div class="feature"><strong>Doctor-led decisions</strong><span>The treating doctor remains responsible for the final clinical plan and procedure scope.</span></div>
    </div>
  </div>
</section>

${optionBlocks}

<section class="page">
  <div class="page-header"><span>${labels.investment}</span><strong>${premiumEsc(patientName)}</strong></div>
  <div style="margin-top: 14mm">
    <div class="kicker">03</div>
    <h2>${labels.investment}</h2>
    ${selected ? `<div class="option-total-box"><span>${premiumEsc(selected.name || 'Selected option')}</span><strong>${premiumMoney(selected.totals?.total)}</strong></div>` : ''}
    <div class="payment-box">
      <h3>${labels.payment}</h3>
      ${paymentVisits.join('') || '<p class="intro">Payment schedule will be confirmed with the selected treatment option.</p>'}
    </div>
    ${financing}
  </div>
</section>

<section class="page">
  <div class="page-header"><span>${labels.team}</span><strong>${premiumEsc(patientName)}</strong></div>
  <div style="margin-top: 10mm">
    <div class="kicker">04</div>
    <h2>${labels.team}</h2>
    ${premiumDoctorCards() || '<p class="intro">The dental team profile will be added when doctor data is available.</p>'}
    <div class="section-label" style="margin-top: 8mm">${labels.experience}</div>
    <img class="clinic-image" src="/assets/clinic/Gemini_Generated_Image_eloxpveloxpvelox.png" alt="Duty Clinic Istanbul">
  </div>
</section>

<section class="page closing">
  <div class="closing-inner">
    <div class="logo-card"><img src="/assets/logo/Logo-main.png" alt="Duty Clinic"></div>
    <h2>${labels.closing}</h2>
    <p>Duty Clinic Istanbul<br>Professional dental care with international standards.</p>
    <div class="important">
      <strong>${labels.important}</strong>
      <p>${premiumEsc(labels.disclaimer)}</p>
    </div>
    <div class="contact">+90 536 779 07 91<br>dutyclinic.com<br>info@dutyclinic.com</div>
  </div>
</section>

</body>
</html>`;
}

function generatePremiumQuotationPdf() {
  if (typeof buildQuotationData !== 'function') {
    alert('Quotation data is not available. Please refresh the page and try again.');
    return;
  }

  const quotation = buildQuotationData();
  const html = generatePremiumQuotationHtml(quotation);
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow pop-ups for DutyAI to generate the Premium Proposal.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  const printWhenReady = () => {
    const images = Array.from(printWindow.document.images || []);
    const waitForImages = images.map(image => {
      if (image.complete) return Promise.resolve();
      return new Promise(resolve => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    });

    Promise.all(waitForImages).then(() => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    });
  };

  if (printWindow.document.readyState === 'complete') {
    printWhenReady();
  } else {
    printWindow.addEventListener('load', printWhenReady, { once: true });
  }
}

if (typeof window !== 'undefined') {
  window.generatePremiumQuotationPdf = generatePremiumQuotationPdf;
}
