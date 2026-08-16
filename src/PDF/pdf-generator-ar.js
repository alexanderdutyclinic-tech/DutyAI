// DutyAI Arabic quotation PDF renderer.
// Arabic has a dedicated RTL document structure; calculations come from buildQuotationData().

function arPdfEsc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function arPdfMoney(value) {
  const amount = Number(value) || 0;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 2
  });
  return `<bdi class="ltr-number">$${formatted}</bdi>`;
}

function arPdfDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ar-EG');
}

function arPdfLabels() {
  return {
    proposal: 'خطة العلاج الشخصية',
    preparedFor: 'مُعدّة لـ',
    date: 'التاريخ',
    treatmentPlan: 'خطة العلاج',
    treatment: 'العلاج',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    total: 'الإجمالي',
    implants: 'زراعة الأسنان',
    crowns: 'التيجان',
    procedures: 'إجراءات إضافية',
    accommodation: 'الإقامة والخدمات',
    visit1: 'الزيارة الأولى',
    visit2: 'الزيارة الثانية',
    hotel: 'الفندق',
    room: 'الغرفة',
    nights: 'الليالي',
    perNight: 'السعر / الليلة',
    services: 'الخدمات',
    details: 'التفاصيل',
    included: 'مشمول',
    transfer: 'نقل VIP',
    prosthesis: 'التركيبة المؤقتة للأسنان',
    translator: 'مترجم',
    paymentByVisit: 'الدفع حسب الزيارة',
    visit: 'الزيارة',
    oneVisit: 'زيارة واحدة',
    twoVisits: 'زيارتان',
    important: 'مهم',
    disclaimer: 'يتم تأكيد خطة العلاج النهائية ونطاق الإجراءات من قبل الطبيب بعد الفحص السريري والفحوصات التشخيصية اللازمة.',
    generated: 'تم إنشاء هذا المستند تلقائياً بناءً على خيار العلاج المحدد.',
    intro: 'نقدم لكم خطة علاج شخصية بناءً على المعلومات المقدمة. تلخص الصفحات التالية العلاج المختار والإقامة والخدمات وخطة الدفع.',
    installment: 'خطة التقسيط للولايات المتحدة / كندا',
    package: 'الباقة +',
    installmentAmount: 'مبلغ التقسيط',
    remainingCash: 'المبلغ المتبقي',
    cashPerVisit: 'الدفع النقدي لكل زيارة',
    option: 'الخيار',
    translationNotice: 'تمت ترجمة خطة العلاج بناءً على بيانات الطبيب المؤكدة.',
    roomSingle: 'مفردة',
    roomDouble: 'مزدوجة'
  };
}

function arPdfPatientName(name) {
  const value = String(name || '').trim();
  if (!value) return '';
  if (/[؀-ۿ]/.test(value)) return value;

  const known = {
    ahmed: 'أحمد',
    mohamed: 'محمد',
    muhammad: 'محمد',
    abdullah: 'عبدالله',
    abdallah: 'عبدالله',
    ali: 'علي',
    omar: 'عمر',
    youssef: 'يوسف',
    yusuf: 'يوسف',
    amir: 'أمير',
    asma: 'أسماء',
    samira: 'سميرة',
    rachid: 'رشيد',
    karim: 'كريم',
    fatima: 'فاطمة',
    sara: 'سارة',
    maryam: 'مريم'
  };

  const exact = known[value.toLowerCase()];
  return exact || value;
}

function arPdfOptionName(name) {
  const value = String(name || '').trim();
  const key = value.toLowerCase();
  const german = key === 'german' || key.includes('german');
  if (german) return `تركيب ${value.replace(/german/ig, '').trim() || 'ألماني'}`.replace(/تركيب\s*$/,'تركيب ألماني');
  return value;
}

function arPdfImplantName(name) {
  return String(name || '');
}

function arPdfCrownName(name) {
  const value = String(name || '').trim();
  if (!value) return '';
  return value.replace(/Zirconium Crowns/ig, 'تيجان الزركونيا')
    .replace(/German/ig, 'الألمانية')
    .replace(/\bIvoclar\b/ig, 'Ivoclar');
}

function arPdfRoomLabel(roomType, labels) {
  const key = String(roomType || '').toLowerCase();
  if (key.includes('single')) return labels.roomSingle;
  if (key.includes('double')) return labels.roomDouble;
  return roomType || '';
}

function arPdfProcedureName(name) {
  const key = String(name || '').toLowerCase();
  if (key.includes('bone graft')) return 'تطعيم العظم';
  return name || '';
}

function arPdfTreatmentPlan(quotation) {
  const d = quotation.patient?.treatmentData;
  if (!d) return quotation.patient?.diagnosis || '';

  const lines = [];
  if (d.upperImplants) {
    lines.push(`<li><bdi class="ltr-number">${d.upperImplants}</bdi> زرعة في الفك العلوي.</li>`);
  }
  if (d.lowerImplantsMin) {
    const range = d.lowerImplantsMax && d.lowerImplantsMax !== d.lowerImplantsMin
      ? `${d.lowerImplantsMin}–${d.lowerImplantsMax}`
      : `${d.lowerImplantsMin}`;
    lines.push(`<li><bdi class="ltr-number">${arPdfEsc(range)}</bdi> زرعة في الفك السفلي في المنطقة الأمامية، وفقاً للفحص السريري.</li>`);
  }
  if (d.crowns) {
    lines.push(`<li><bdi class="ltr-number">${d.crowns}</bdi> تيجان الزركونيا.</li>`);
  }
  return lines.join('');
}

function arPdfHotelRows(visit, labels) {
  const rows = [];
  const hotel = visit?.hotel;
  if (hotel) {
    rows.push(`<tr><td>${arPdfEsc(labels.hotel)}</td><td><bdi class="brand-name">${arPdfEsc(hotel.name)}</bdi></td><td><bdi class="ltr-number">${hotel.nights}</bdi></td><td>${arPdfMoney(hotel.nightlyPrice)}</td><td>${arPdfMoney(hotel.total)}</td></tr>`);
  }
  const services = visit?.services || {};
  for (const service of [services.transfer, services.prosthesis, services.translator].filter(Boolean)) {
    let label = service.name;
    const key = String(service.name || '').toLowerCase();
    if (key.includes('vip')) label = labels.transfer;
    else if (key.includes('prosthesis')) label = labels.prosthesis;
    else if (key.includes('translator')) label = labels.translator;
    rows.push(`<tr><td>${arPdfEsc(label)}</td><td>${service.included ? arPdfEsc(labels.included) : '—'}</td><td>—</td><td>—</td><td>${service.total ? arPdfMoney(service.total) : arPdfEsc(labels.included)}</td></tr>`);
  }
  return rows.join('');
}

function arPdfVisitSummary(option, labels) {
  const rows = [];
  const v1 = option.visits?.visit1;
  const v2 = option.visits?.visit2;
  if (v1) rows.push(`<div class="visit-summary"><div class="visit-title">${labels.visit1}</div><div class="visit-line"><span>${labels.treatment}</span><strong>${arPdfMoney(v1.dentalTotal)}</strong></div><div class="visit-line"><span>${labels.services}</span><strong>${arPdfMoney(v1.servicesTotal)}</strong></div><div class="visit-total"><span>${labels.visit} 1</span><strong>${arPdfMoney(v1.total)}</strong></div></div>`);
  if (v2) rows.push(`<div class="visit-summary"><div class="visit-title">${labels.visit2}</div><div class="visit-line"><span>${labels.treatment}</span><strong>${arPdfMoney(v2.dentalTotal)}</strong></div><div class="visit-line"><span>${labels.services}</span><strong>${arPdfMoney(v2.servicesTotal)}</strong></div><div class="visit-total"><span>${labels.visit} 2</span><strong>${arPdfMoney(v2.total)}</strong></div></div>`);
  return rows.join('');
}

function arPdfInstallment(quotation, option, labels) {
  if (!quotation.payment?.installmentEligible || !quotation.payment?.financing) return '';
  const f = quotation.payment.financing;
  const financed = option.totals.total * (1 + f.markupPercent / 100);
  const installment = Math.min(f.installmentAmount, financed);
  const remaining = Math.max(0, financed - installment);
  const perVisit = option.visits.count > 1 ? remaining / option.visits.count : remaining;
  return `<section class="installment-box"><div class="section-title">${labels.installment}</div><div class="installment-grid"><div><span>${labels.package} ${f.markupPercent}%</span><strong>${arPdfMoney(financed)}</strong></div><div><span>${labels.installmentAmount}</span><strong>${arPdfMoney(installment)}</strong></div><div><span>${labels.remainingCash}</span><strong>${arPdfMoney(remaining)}</strong></div><div><span>${labels.cashPerVisit}</span><strong>${arPdfMoney(perVisit)}</strong></div></div></section>`;
}

function generateArabicQuotationPdf() {
  if (typeof buildQuotationData !== 'function') { alert('Quotation data is not available yet.'); return; }
  const quotation = buildQuotationData();
  const labels = arPdfLabels();
  const patientName = arPdfPatientName(quotation.patient?.arabicName || quotation.patient?.name);
  const translatedPlan = arPdfTreatmentPlan(quotation);
  const optionCount = quotation.options.length;

  const optionsHtml = quotation.options.map((option, index) => {
    const v1 = option.visits?.visit1;
    const v2 = option.visits?.visit2;
    const visitCount = option.visits?.count || 1;
    const implant = option.treatment?.implants;
    const crown = option.treatment?.crowns;
    const procedures = option.treatment?.procedures || [];
    const rows = [];
    if (implant?.quantity > 0) rows.push(`<tr><td>${labels.implants} — <bdi class="brand-name">${arPdfEsc(arPdfImplantName(implant.name))}</bdi></td><td><bdi class="ltr-number">${implant.quantity}</bdi></td><td>${arPdfMoney(implant.finalUnitPrice)}</td><td>${arPdfMoney(implant.total)}</td></tr>`);
    if (crown?.quantity > 0) rows.push(`<tr><td>${labels.crowns} — <bdi class="mixed-label">${arPdfEsc(arPdfCrownName(crown.name))}</bdi></td><td><bdi class="ltr-number">${crown.quantity}</bdi></td><td>${arPdfMoney(crown.finalUnitPrice)}</td><td>${arPdfMoney(crown.total)}</td></tr>`);
    for (const p of procedures) rows.push(`<tr><td>${arPdfEsc(arPdfProcedureName(p.name))}</td><td><bdi class="ltr-number">${p.quantity}${p.unit ? ` / ${arPdfEsc(p.unit)}` : ''}</bdi></td><td>${arPdfMoney(p.unitPrice)}</td><td>${arPdfMoney(p.total)}</td></tr>`);

    return `<section class="option-block"><div class="option-header"><div><div class="option-number">${labels.option} ${index + 1}</div><h2>${arPdfEsc(arPdfOptionName(option.name))}</h2></div></div>
      <div class="section-title">${labels.treatmentPlan}</div>
      <table class="proposal-table"><thead><tr><th>${labels.treatment}</th><th>${labels.quantity}</th><th>${labels.unitPrice}</th><th>${labels.total}</th></tr></thead><tbody>${rows.join('')}</tbody></table>
      <div class="section-title">${labels.accommodation} — ${visitCount === 1 ? labels.oneVisit : labels.twoVisits}</div>
      ${v1 ? `<div class="visit-heading">${labels.visit1}</div><table class="proposal-table"><thead><tr><th>${labels.services}</th><th>${labels.details}</th><th>${labels.nights}</th><th>${labels.perNight}</th><th>${labels.total}</th></tr></thead><tbody>${arPdfHotelRows(v1, labels)}</tbody></table>` : ''}
      ${v2 ? `<div class="visit-heading">${labels.visit2}</div><table class="proposal-table"><thead><tr><th>${labels.services}</th><th>${labels.details}</th><th>${labels.nights}</th><th>${labels.perNight}</th><th>${labels.total}</th></tr></thead><tbody>${arPdfHotelRows(v2, labels)}</tbody></table>` : ''}
      <div class="payment-section"><div class="section-title">${labels.paymentByVisit}</div>${arPdfVisitSummary(option, labels)}<div class="grand-total"><span>${labels.total}</span><strong>${arPdfMoney(option.totals.total)}</strong></div></div>
      ${arPdfInstallment(quotation, option, labels)}</section>`;
  }).join('');

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>Duty Clinic — ${arPdfEsc(patientName)}</title><style>
    @page{size:A4;margin:10mm 12mm 12mm}
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;direction:rtl;background:#fff;color:#18202b;font-family:Arial,"Tahoma",sans-serif}
    body{font-size:10pt;line-height:1.45}
    .page{max-width:190mm;margin:0 auto}
    .brand-bar{border-bottom:4px solid #e43b3b;padding:0 0 9px;margin-bottom:12px;text-align:right}
    .brand{font-size:26pt;font-weight:800;letter-spacing:-1px;color:#15283f;direction:ltr;text-align:right}
    .brand-meta{margin-top:3px;font-size:8pt;color:#56616d}
    .brand-meta .ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}
    .title{margin:10px 0 4px;color:#15283f;font-size:18pt}
    .subtitle{color:#596572;font-size:9pt}
    .patient-card{margin:12px 0 13px;padding:11px 14px;background:#f4f7fa;border-right:5px solid #1f5eff;border-radius:5px}
    .patient-name{font-size:15pt;font-weight:700;color:#15283f}
    .patient-meta{margin-top:3px;color:#596572}
    .intro{margin:11px 0 12px}
    .diagnosis{padding:9px 11px;background:#fafafa;border:1px solid #e2e6ea;border-radius:5px;white-space:pre-wrap;font-size:9pt}
    .treatment-plan-list{margin:0;padding-right:20px}
    .treatment-plan-list li{margin:2px 0}
    .option-block{margin:14px 0 16px;padding-bottom:13px;border-bottom:1px solid #d9dfe5;break-inside:auto}
    .option-header{margin-bottom:9px}.option-number{color:#e43b3b;font-size:8pt;font-weight:800;letter-spacing:1px}h2{margin:2px 0;color:#15283f;font-size:16pt}
    .section-title{margin:10px 0 5px;color:#15283f;font-size:8pt;font-weight:800;letter-spacing:1px}
    .proposal-table{width:100%;border-collapse:collapse;margin-bottom:7px;direction:rtl}
    .proposal-table th{background:#eef3f8;color:#15283f;text-align:right;font-size:7.5pt;padding:5px 7px;border-bottom:1px solid #ccd5de}
    .proposal-table td{padding:5px 7px;border-bottom:1px solid #e3e7eb;vertical-align:top;font-size:8.5pt;text-align:right}
    .proposal-table th:not(:first-child),.proposal-table td:not(:first-child){text-align:left;white-space:nowrap}
    .visit-heading{margin:8px 0 3px;font-size:9pt;font-weight:800;color:#1f5eff}
    .payment-section{margin-top:10px;break-inside:avoid;page-break-inside:avoid}
    .visit-summary{display:inline-block;vertical-align:top;width:48.5%;margin:0 1% 6px 0;padding:8px 10px;border:1px solid #dce2e8;border-radius:5px;break-inside:avoid}
    .visit-summary:nth-child(2n){margin-right:0}
    .visit-title{font-weight:800;font-size:8.5pt;color:#15283f;margin-bottom:3px}
    .visit-line,.visit-total{display:flex;justify-content:space-between;gap:10px}
    .visit-line{font-size:8pt;color:#596572;margin-top:1px}.visit-total{margin-top:4px;padding-top:4px;border-top:1px solid #e0e5ea;font-weight:800;color:#15283f}
    .grand-total{margin-top:6px;padding:9px 12px;background:#f4f7fa;display:flex;justify-content:space-between;align-items:center;border-radius:5px}.grand-total span{font-weight:700}.grand-total strong{font-size:15pt;color:#e43b3b}
    .installment-box{margin-top:9px;padding:9px 11px;border:1px solid #ccd8e6;border-right:5px solid #1f5eff;border-radius:5px;background:#f7faff;break-inside:avoid}
    .installment-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.installment-grid div{padding:6px;background:#fff;border:1px solid #e1e7ee;border-radius:4px}.installment-grid span{display:block;font-size:7pt;color:#66727e}.installment-grid strong{display:block;margin-top:2px;color:#15283f;font-size:8.5pt}
    .closing{margin-top:10px;break-inside:avoid;page-break-inside:avoid}.important{padding:9px 11px;background:#fff8f8;border-right:5px solid #e43b3b;border-radius:4px}.important-title{color:#e43b3b;font-weight:800;margin-bottom:3px}
    .footer{margin-top:10px;padding-top:7px;border-top:2px solid #15283f;color:#596572;font-size:7pt}.footer strong{color:#15283f}
    .ltr-number,.brand-name{direction:ltr;unicode-bidi:isolate;display:inline-block}.mixed-label{unicode-bidi:isolate;direction:rtl}
    .print-note{margin:8px 0;padding:7px 9px;background:#fffbe8;border:1px solid #eadb91;font-size:8pt}
    @media print{.print-note{display:none}.page{max-width:none}body{font-size:9.5pt}}
  </style></head><body><div class="page"><div class="print-note">في نافذة الطباعة اختر «حفظ كملف PDF».</div>
    <header class="brand-bar"><div class="brand">Duty Clinic</div><div class="brand-meta"><span class="ltr">Istanbul • Türkiye</span> | الرعاية السنية الاحترافية وفق المعايير الدولية.</div><div class="brand-meta">Duty Clinic Istanbul | <span class="ltr">+90 536 779 07 91</span> | <span class="ltr">dutyclinic.com</span> | <span class="ltr">info@dutyclinic.com</span></div></header>
    <h1 class="title">${labels.proposal}</h1><div class="subtitle">${labels.date}: <bdi class="ltr-number">${arPdfEsc(arPdfDate(quotation.generatedAt))}</bdi></div>
    <div class="patient-card"><div class="patient-name">${arPdfEsc(patientName)}</div><div class="patient-meta">${labels.preparedFor} <bdi class="ltr-number">${arPdfEsc(patientName)}</bdi> · <bdi class="ltr-number">${optionCount}</bdi> خيار</div></div>
    <div class="intro">${labels.intro}</div>
    ${translatedPlan ? `<div class="section-title">${labels.treatmentPlan}</div><div class="diagnosis"><ul class="treatment-plan-list">${translatedPlan}</ul></div><div class="subtitle">${labels.translationNotice}</div>` : ''}
    ${optionsHtml}
    <section class="closing"><div class="important"><div class="important-title">${labels.important}</div><div>${labels.disclaimer}</div></div></section>
    <footer class="footer"><strong>Duty Clinic Istanbul</strong> | Istanbul, Türkiye | <span class="ltr">+90 536 779 07 91</span> | <span class="ltr">dutyclinic.com</span> | <span class="ltr">info@dutyclinic.com</span><br>${labels.generated}</footer>
  </div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350));</script></body></html>`;

  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) { alert('Please allow pop-ups for Duty AI to generate the PDF.'); return; }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

if (typeof window !== 'undefined') window.generateArabicQuotationPdf = generateArabicQuotationPdf;
