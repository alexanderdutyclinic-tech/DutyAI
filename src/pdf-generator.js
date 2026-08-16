// DutyAI patient-facing quotation PDF renderer.
// Browser print engine: no PDF API/server generation cost.
// All amounts come from the existing quotation calculator.

function pdfMoney(value){
  const amount = Number(value) || 0;
  return `$${amount.toLocaleString('en-US',{minimumFractionDigits:amount%1?2:0,maximumFractionDigits:2})}`;
}

function pdfEsc(value){
  return String(value ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function pdfDate(iso,language){
  const date=new Date(iso);
  if(Number.isNaN(date.getTime())) return '';
  return language==='Russian' ? date.toLocaleDateString('ru-RU') : date.toLocaleDateString('en-GB');
}

function pdfLabels(language){
  const dictionaries={
    Russian:{
      proposal:'ПЕРСОНАЛЬНЫЙ ПЛАН ЛЕЧЕНИЯ',preparedFor:'Подготовлено для',date:'Дата',treatmentPlan:'ПЛАН ЛЕЧЕНИЯ',
      treatment:'Лечение',quantity:'Кол-во',unitPrice:'Цена за единицу',total:'Стоимость',implants:'Импланты',crowns:'Коронки',
      procedures:'Дополнительные процедуры',accommodation:'ПРОЖИВАНИЕ И УСЛУГИ',visit1:'ПЕРВЫЙ ВИЗИТ',visit2:'ВТОРОЙ ВИЗИТ',
      hotel:'Отель',room:'Номер',nights:'Ночей',perNight:'Цена за ночь',services:'Услуги',details:'Детали',included:'Включено',
      transfer:'VIP-трансфер',prosthesis:'Зубной протез',translator:'Переводчик',paymentByVisit:'Оплата по визитам',optionTotal:'Стоимость варианта',
      visit:'Визит',oneVisit:'1 визит',twoVisits:'2 визита',important:'ВАЖНО',generated:'Документ сформирован автоматически на основании выбранного варианта лечения.',
      disclaimer:'Окончательный план лечения и объём процедур подтверждаются врачом после клинического осмотра и необходимых диагностических исследований.',
      intro:'Предлагаем индивидуальный план лечения, подготовленный на основании предоставленной информации. Ниже представлены выбранные варианты лечения, проживание, услуги и порядок оплаты.',
      installment:'РАССРОЧКА ДЛЯ США / КАНАДЫ',package:'Пакет +',installmentAmount:'Сумма рассрочки',remainingCash:'Оставшаяся сумма',cashPerVisit:'Оплата наличными по визитам',
      option:'ВАРИАНТ',translationNotice:'Перевод плана лечения выполнен на основании подтверждённых данных врача.'
    },
    English:{
      proposal:'PERSONALIZED TREATMENT PROPOSAL',preparedFor:'Prepared for',date:'Date',treatmentPlan:'TREATMENT PLAN',treatment:'Treatment',quantity:'Qty.',unitPrice:'Unit price',total:'Total',
      implants:'Implants',crowns:'Crowns',procedures:'Additional procedures',accommodation:'ACCOMMODATION & SERVICES',visit1:'VISIT 1',visit2:'VISIT 2',hotel:'Hotel',room:'Room',nights:'Nights',perNight:'Price / night',services:'Services',details:'Details',included:'Included',
      transfer:'VIP transfer',prosthesis:'Dental prosthesis',translator:'Translator',paymentByVisit:'Payment by visit',optionTotal:'Option total',visit:'Visit',oneVisit:'1 visit',twoVisits:'2 visits',important:'IMPORTANT',
      generated:'This document was generated automatically from the selected treatment option.',disclaimer:'The final treatment plan and procedure scope are confirmed by the doctor after clinical examination and required diagnostic assessment.',
      intro:'We are pleased to provide your personalized treatment proposal based on the information provided. The following pages summarize the selected treatment, accommodation, services and payment plan.',
      installment:'US / CANADA INSTALLMENT PLAN',package:'Package +',installmentAmount:'Installment amount',remainingCash:'Remaining cash',cashPerVisit:'Cash per visit',option:'OPTION',translationNotice:'Treatment plan translated from the confirmed doctor data.'
    },
    French:{
      proposal:'PLAN DE TRAITEMENT PERSONNALISÉ',preparedFor:'Préparé pour',date:'Date',treatmentPlan:'PLAN DE TRAITEMENT',treatment:'Traitement',quantity:'Qté.',unitPrice:'Prix unitaire',total:'Total',
      implants:'Implants',crowns:'Couronnes',procedures:'Procédures supplémentaires',accommodation:'HÉBERGEMENT ET SERVICES',visit1:'PREMIÈRE VISITE',visit2:'DEUXIÈME VISITE',hotel:'Hôtel',room:'Chambre',nights:'Nuits',perNight:'Prix / nuit',services:'Services',details:'Détails',included:'Inclus',
      transfer:'Transfert VIP',prosthesis:'Prothèse dentaire',translator:'Interprète',paymentByVisit:'Paiement par visite',optionTotal:'Total de l’option',visit:'Visite',oneVisit:'1 visite',twoVisits:'2 visites',important:'IMPORTANT',
      generated:'Ce document a été généré automatiquement à partir de l’option de traitement sélectionnée.',disclaimer:'Le plan de traitement final et le volume des procédures sont confirmés par le médecin après l’examen clinique et les examens diagnostiques nécessaires.',
      intro:'Nous vous proposons un plan de traitement personnalisé basé sur les informations fournies. Les pages suivantes résument le traitement sélectionné, l’hébergement, les services et les modalités de paiement.',
      installment:'PLAN DE PAIEMENT POUR LES ÉTATS-UNIS / CANADA',package:'Forfait +',installmentAmount:'Montant du financement',remainingCash:'Solde restant',cashPerVisit:'Paiement comptant par visite',option:'OPTION',translationNotice:'Plan de traitement traduit à partir des données confirmées du médecin.'
    },
    Spanish:{
      proposal:'PLAN DE TRATAMIENTO PERSONALIZADO',preparedFor:'Preparado para',date:'Fecha',treatmentPlan:'PLAN DE TRATAMIENTO',treatment:'Tratamiento',quantity:'Cant.',unitPrice:'Precio unitario',total:'Total',
      implants:'Implantes',crowns:'Coronas',procedures:'Procedimientos adicionales',accommodation:'ALOJAMIENTO Y SERVICIOS',visit1:'PRIMERA VISITA',visit2:'SEGUNDA VISITA',hotel:'Hotel',room:'Habitación',nights:'Noches',perNight:'Precio / noche',services:'Servicios',details:'Detalles',included:'Incluido',
      transfer:'Traslado VIP',prosthesis:'Prótesis dental',translator:'Intérprete',paymentByVisit:'Pago por visita',optionTotal:'Total de la opción',visit:'Visita',oneVisit:'1 visita',twoVisits:'2 visitas',important:'IMPORTANTE',
      generated:'Este documento se generó automáticamente a partir de la opción de tratamiento seleccionada.',disclaimer:'El plan de tratamiento final y el alcance de los procedimientos serán confirmados por el médico después del examen clínico y las pruebas diagnósticas necesarias.',
      intro:'Le ofrecemos un plan de tratamiento personalizado basado en la información proporcionada. Las siguientes páginas resumen el tratamiento seleccionado, alojamiento, servicios y forma de pago.',
      installment:'PLAN DE CUOTAS PARA EE. UU. / CANADÁ',package:'Paquete +',installmentAmount:'Importe financiado',remainingCash:'Saldo restante',cashPerVisit:'Pago en efectivo por visita',option:'OPCIÓN',translationNotice:'Plan de tratamiento traducido a partir de los datos confirmados por el médico.'
    },
    Arabic:{
      proposal:'خطة علاج شخصية',preparedFor:'مُعدّة لـ',date:'التاريخ',treatmentPlan:'خطة العلاج',treatment:'العلاج',quantity:'الكمية',unitPrice:'سعر الوحدة',total:'الإجمالي',
      implants:'زراعة الأسنان',crowns:'التيجان',procedures:'إجراءات إضافية',accommodation:'الإقامة والخدمات',visit1:'الزيارة الأولى',visit2:'الزيارة الثانية',hotel:'الفندق',room:'الغرفة',nights:'الليالي',perNight:'السعر / الليلة',services:'الخدمات',details:'التفاصيل',included:'مشمول',
      transfer:'النقل VIP',prosthesis:'تركيبة الأسنان',translator:'مترجم',paymentByVisit:'الدفع حسب الزيارة',optionTotal:'إجمالي الخيار',visit:'الزيارة',oneVisit:'زيارة واحدة',twoVisits:'زيارتان',important:'مهم',
      generated:'تم إنشاء هذا المستند تلقائياً بناءً على خيار العلاج المحدد.',disclaimer:'يتم تأكيد خطة العلاج النهائية ونطاق الإجراءات من قبل الطبيب بعد الفحص السريري والفحوصات التشخيصية اللازمة.',
      intro:'نقدم لكم خطة علاج شخصية بناءً على المعلومات المقدمة. تلخص الصفحات التالية العلاج المختار والإقامة والخدمات وخطة الدفع.',
      installment:'خطة التقسيط للولايات المتحدة / كندا',package:'الباقة +',installmentAmount:'مبلغ التقسيط',remainingCash:'المبلغ المتبقي',cashPerVisit:'الدفع النقدي لكل زيارة',option:'الخيار',translationNotice:'تمت ترجمة خطة العلاج بناءً على بيانات الطبيب المؤكدة.'
    }
  };
  return dictionaries[language] || dictionaries.English;
}

function pdfServiceLabel(name,labels){
  const key=String(name||'').toLowerCase();
  if(key.includes('vip')) return labels.transfer;
  if(key.includes('prosthesis')) return labels.prosthesis;
  if(key.includes('translator')) return labels.translator;
  return name || labels.services;
}

function pdfProcedureLabel(name,language){
  const key=String(name||'').toLowerCase();
  const maps={
    Russian:{'bone grafting':'Костная пластика'},
    French:{'bone grafting':'Greffe osseuse'},
    Spanish:{'bone grafting':'Injerto óseo'},
    Arabic:{'bone grafting':'تطعيم العظم'},
    English:{'bone grafting':'Bone grafting'}
  };
  return maps[language]?.[key] || name;
}

function pdfTranslateTreatmentPlan(quotation,language){
  const d=quotation.patient?.treatmentData;
  if(!d) return quotation.patient?.diagnosis || '';

  const upper=d.upperImplants;
  const lowerMin=d.lowerImplantsMin;
  const lowerMax=d.lowerImplantsMax;
  const crowns=d.crowns;
  const material=d.crownMaterial;
  const crownWord={Russian:'циркониевые коронки',French:'couronnes en zircone',Spanish:'coronas de zirconio',Arabic:'تيجان الزركونيا',English:'zirconia crowns'}[language] || 'zirconia crowns';
  const lines=[];

  if(language==='Russian'){
    if(upper) lines.push(`• ${upper} ${upper===1?'имплант':'импланта'} на верхнюю челюсть.`);
    if(lowerMin) lines.push(`• ${lowerMin}${lowerMax&&lowerMax!==lowerMin?`–${lowerMax}`:''} ${lowerMax&&lowerMax!==lowerMin?'импланта':'имплант'} на нижнюю челюсть в переднем отделе по результатам клинического обследования.`);
    if(crowns) lines.push(`• ${crowns} ${crownWord}.`);
  } else if(language==='French'){
    if(upper) lines.push(`• ${upper} implant${upper>1?'s':''} pour le maxillaire supérieur.`);
    if(lowerMin) lines.push(`• ${lowerMin}${lowerMax&&lowerMax!==lowerMin?`–${lowerMax}`:''} implant${lowerMax&&lowerMax!==lowerMin?'s':''} pour la mandibule, dans le secteur antérieur, selon l’examen clinique.`);
    if(crowns) lines.push(`• ${crowns} ${crownWord}.`);
  } else if(language==='Spanish'){
    if(upper) lines.push(`• ${upper} implante${upper>1?'s':''} para el maxilar superior.`);
    if(lowerMin) lines.push(`• ${lowerMin}${lowerMax&&lowerMax!==lowerMin?`–${lowerMax}`:''} implante${lowerMax&&lowerMax!==lowerMin?'s':''} para la mandíbula, en el sector anterior, según el examen clínico.`);
    if(crowns) lines.push(`• ${crowns} ${crownWord}.`);
  } else if(language==='Arabic'){
    if(upper) lines.push(`• ${upper} زرعة في الفك العلوي.`);
    if(lowerMin) lines.push(`• ${lowerMin}${lowerMax&&lowerMax!==lowerMin?`–${lowerMax}`:''} زرعة في الفك السفلي في المنطقة الأمامية، وفقاً للفحص السريري.`);
    if(crowns) lines.push(`• ${crowns} ${crownWord}.`);
  } else {
    if(upper) lines.push(`• ${upper} implant${upper>1?'s':''} for the upper jaw.`);
    if(lowerMin) lines.push(`• ${lowerMin}${lowerMax&&lowerMax!==lowerMin?`–${lowerMax}`:''} implant${lowerMax&&lowerMax!==lowerMin?'s':''} for the lower jaw, in the anterior region, according to clinical examination.`);
    if(crowns) lines.push(`• ${crowns} ${crownWord}.`);
  }

  return lines.join('\n') || quotation.patient?.diagnosis || '';
}

function pdfPatientName(name,language){
  if(language!=='Russian') return name || 'Patient';
  const known={
    rachid:'Рашид',dmitry:'Дмитрий',dmitri:'Дмитрий',alexander:'Александр',alexandr:'Александр',mohamed:'Мохамед',muhammad:'Мухаммад',ahmed:'Ахмед',karim:'Карим'
  };
  const trimmed=String(name||'Patient').trim();
  if(/[А-Яа-яЁё]/.test(trimmed)) return trimmed;
  const exact=known[trimmed.toLowerCase()];
  if(exact) return exact;

  const map=[['shch','щ'],['sch','щ'],['zh','ж'],['kh','х'],['ts','ц'],['ch','ч'],['sh','ш'],['yu','ю'],['ya','я'],['ye','е'],['yo','ё'],['ph','ф'],['th','т'],['j','дж'],['q','к'],['w','в'],['x','кс'],['a','а'],['b','б'],['c','к'],['d','д'],['e','е'],['f','ф'],['g','г'],['h','х'],['i','и'],['k','к'],['l','л'],['m','м'],['n','н'],['o','о'],['p','п'],['r','р'],['s','с'],['t','т'],['u','у'],['v','в'],['y','й'],['z','з']];
  let result=trimmed.toLowerCase();
  for(const [from,to] of map) result=result.split(from).join(to);
  return result.split(/\s+/).map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ');
}

function pdfTreatmentRows(option,labels,language){
  const rows=[];
  const implants=option.treatment?.implants;
  const crowns=option.treatment?.crowns;
  if(implants?.quantity>0) rows.push(`<tr><td>${pdfEsc(labels.implants)} — ${pdfEsc(implants.name||'')}</td><td>${implants.quantity}</td><td>${pdfMoney(implants.finalUnitPrice)}</td><td>${pdfMoney(implants.total)}</td></tr>`);
  if(crowns?.quantity>0) rows.push(`<tr><td>${pdfEsc(labels.crowns)} — ${pdfEsc(crowns.name||'')}</td><td>${crowns.quantity}</td><td>${pdfMoney(crowns.finalUnitPrice)}</td><td>${pdfMoney(crowns.total)}</td></tr>`);
  for(const p of (option.treatment?.procedures||[])){
    const unit=p.unit?` / ${pdfEsc(p.unit)}`:'';
    rows.push(`<tr><td>${pdfEsc(pdfProcedureLabel(p.name,language))}</td><td>${p.quantity}${unit}</td><td>${pdfMoney(p.unitPrice)}</td><td>${pdfMoney(p.total)}</td></tr>`);
  }
  return rows.length?rows.join(''):'<tr><td colspan="4">—</td></tr>';
}

function pdfHotelRows(visit,labels){
  const rows=[];
  const hotel=visit?.hotel;
  if(hotel) rows.push(`<tr><td>${pdfEsc(labels.hotel)}</td><td>${pdfEsc(hotel.name)}</td><td>${hotel.nights}</td><td>${pdfMoney(hotel.nightlyPrice)}</td><td>${pdfMoney(hotel.total)}</td></tr>`);
  const services=visit?.services||{};
  for(const service of [services.transfer,services.prosthesis,services.translator].filter(Boolean)){
    rows.push(`<tr><td>${pdfEsc(pdfServiceLabel(service.name,labels))}</td><td>${service.included?pdfEsc(labels.included):'—'}</td><td>—</td><td>—</td><td>${service.total?pdfMoney(service.total):pdfEsc(labels.included)}</td></tr>`);
  }
  return rows.length?rows.join(''):'<tr><td colspan="5">—</td></tr>';
}

function pdfVisitSummary(option,labels){
  const rows=[];
  const v1=option.visits?.visit1,v2=option.visits?.visit2;
  if(v1) rows.push(`<div class="visit-summary"><div class="visit-summary-title">${pdfEsc(labels.visit1)}</div><div class="visit-line"><span>${pdfEsc(labels.treatment)}</span><strong>${pdfMoney(v1.dentalTotal)}</strong></div><div class="visit-line"><span>${pdfEsc(labels.services)}</span><strong>${pdfMoney(v1.servicesTotal)}</strong></div><div class="visit-total"><span>${pdfEsc(labels.visit)} 1</span><strong>${pdfMoney(v1.total)}</strong></div></div>`);
  if(v2) rows.push(`<div class="visit-summary"><div class="visit-summary-title">${pdfEsc(labels.visit2)}</div><div class="visit-line"><span>${pdfEsc(labels.treatment)}</span><strong>${pdfMoney(v2.dentalTotal)}</strong></div><div class="visit-line"><span>${pdfEsc(labels.services)}</span><strong>${pdfMoney(v2.servicesTotal)}</strong></div><div class="visit-total"><span>${pdfEsc(labels.visit)} 2</span><strong>${pdfMoney(v2.total)}</strong></div></div>`);
  return rows.join('');
}

function pdfInstallmentBlock(quotation,option,labels){
  if(!quotation.payment?.installmentEligible||!quotation.payment?.financing) return '';
  const f=quotation.payment.financing;
  const financedPackage=option.totals.total*(1+f.markupPercent/100);
  const installment=Math.min(f.installmentAmount,financedPackage);
  const remaining=Math.max(0,financedPackage-installment);
  const perVisit=option.visits.count>1?remaining/option.visits.count:remaining;
  return `<section class="installment-box"><div class="section-kicker">${pdfEsc(labels.installment)}</div><div class="installment-grid"><div><span>${pdfEsc(labels.package)} ${f.markupPercent}%</span><strong>${pdfMoney(financedPackage)}</strong></div><div><span>${pdfEsc(labels.installmentAmount)}</span><strong>${pdfMoney(installment)}</strong></div><div><span>${pdfEsc(labels.remainingCash)}</span><strong>${pdfMoney(remaining)}</strong></div><div><span>${pdfEsc(labels.cashPerVisit)}</span><strong>${pdfMoney(perVisit)}</strong></div></div></section>`;
}

function pdfOption(option,quotation,labels,index,language){
  const v1=option.visits?.visit1,v2=option.visits?.visit2,visitCount=option.visits?.count||1;
  return `<section class="option-block"><div class="option-title-row"><div><div class="option-number">${pdfEsc(labels.option)} ${index+1}</div><h2>${pdfEsc(option.name)}</h2></div><div class="option-total"><span>${pdfEsc(labels.optionTotal)}</span><strong>${pdfMoney(option.totals.total)}</strong></div></div>
  <div class="section-kicker">${pdfEsc(labels.treatmentPlan)}</div><table class="proposal-table"><thead><tr><th>${pdfEsc(labels.treatment)}</th><th>${pdfEsc(labels.quantity)}</th><th>${pdfEsc(labels.unitPrice)}</th><th>${pdfEsc(labels.total)}</th></tr></thead><tbody>${pdfTreatmentRows(option,labels,language)}</tbody></table>
  <div class="section-kicker">${pdfEsc(labels.accommodation)} — ${visitCount===1?pdfEsc(labels.oneVisit):pdfEsc(labels.twoVisits)}</div>
  ${v1?`<div class="visit-heading">${pdfEsc(labels.visit1)}</div><table class="proposal-table services-table"><thead><tr><th>${pdfEsc(labels.services)}</th><th>${pdfEsc(labels.details)}</th><th>${pdfEsc(labels.nights)}</th><th>${pdfEsc(labels.perNight)}</th><th>${pdfEsc(labels.total)}</th></tr></thead><tbody>${pdfHotelRows(v1,labels)}</tbody></table>`:''}
  ${v2?`<div class="visit-heading">${pdfEsc(labels.visit2)}</div><table class="proposal-table services-table"><thead><tr><th>${pdfEsc(labels.services)}</th><th>${pdfEsc(labels.details)}</th><th>${pdfEsc(labels.nights)}</th><th>${pdfEsc(labels.perNight)}</th><th>${pdfEsc(labels.total)}</th></tr></thead><tbody>${pdfHotelRows(v2,labels)}</tbody></table>`:''}
  <div class="payment-section"><div class="section-kicker">${pdfEsc(labels.paymentByVisit)}</div>${pdfVisitSummary(option,labels)}<div class="grand-total"><span>${pdfEsc(labels.total)}</span><strong>${pdfMoney(option.totals.total)}</strong></div></div>
  ${pdfInstallmentBlock(quotation,option,labels)}</section>`;
}

function generateQuotationPdf(){
  if(typeof buildQuotationData!=='function'){alert('Quotation data is not available yet.');return;}
  const quotation=buildQuotationData();
  const language=quotation.patient.language||'English';
  const labels=pdfLabels(language);
  const patientName=pdfPatientName(quotation.patient.name,language);
  const generatedDate=pdfDate(quotation.generatedAt,language);
  const translatedPlan=pdfTranslateTreatmentPlan(quotation,language);
  const optionsHtml=quotation.options.length?quotation.options.map((o,i)=>pdfOption(o,quotation,labels,i,language)).join(''):'<p>No quotation options were added.</p>';

  const html=`<!doctype html><html lang="${language==='Russian'?'ru':language==='Arabic'?'ar':language==='French'?'fr':language==='Spanish'?'es':'en'}"><head><meta charset="utf-8"><title>Duty Clinic — ${pdfEsc(patientName)}</title><style>
  @page{size:A4;margin:10mm 12mm 12mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#18202b;background:#fff;font-size:10pt;line-height:1.34}.page{max-width:190mm;margin:0 auto}.brand-bar{border-bottom:4px solid #e43b3b;padding:0 0 9px;margin-bottom:12px}.brand{font-size:26pt;font-weight:800;letter-spacing:-1px;color:#15283f}.brand-meta{margin-top:3px;font-size:8pt;color:#56616d}.brand-meta strong{color:#15283f}.title{margin:10px 0 4px;color:#15283f;font-size:18pt;letter-spacing:.2px}.subtitle{color:#596572;font-size:9pt}.patient-card{margin:12px 0 13px;padding:11px 14px;background:#f4f7fa;border-left:5px solid #1f5eff;border-radius:5px}.patient-name{font-size:15pt;font-weight:700;color:#15283f}.patient-meta{margin-top:3px;color:#596572}.intro{margin:11px 0 12px}.diagnosis{padding:9px 11px;background:#fafafa;border:1px solid #e2e6ea;border-radius:5px;white-space:pre-wrap;font-size:9pt}.translation-note{margin-top:5px;color:#7b8792;font-size:7.5pt}.option-block{margin:14px 0 16px;padding:0 0 13px;border-bottom:1px solid #d9dfe5;break-inside:auto;page-break-inside:auto}.option-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:9px}.option-number{color:#e43b3b;font-size:8pt;font-weight:800;letter-spacing:1.3px}h2{margin:2px 0 0;color:#15283f;font-size:16pt}.option-total{min-width:39mm;padding:8px 10px;background:#15283f;color:#fff;border-radius:6px;text-align:right}.option-total span{display:block;font-size:7pt;opacity:.8}.option-total strong{display:block;margin-top:1px;font-size:15pt}.section-kicker{margin:10px 0 5px;color:#15283f;font-size:8pt;font-weight:800;letter-spacing:1px}.proposal-table{width:100%;border-collapse:collapse;margin-bottom:7px;break-inside:auto}.proposal-table th{background:#eef3f8;color:#15283f;text-align:left;font-size:7.5pt;padding:5px 7px;border-bottom:1px solid #ccd5de}.proposal-table td{padding:5px 7px;border-bottom:1px solid #e3e7eb;vertical-align:top;font-size:8.5pt}.proposal-table th:not(:first-child),.proposal-table td:not(:first-child){text-align:right;white-space:nowrap}.services-table th:first-child,.services-table td:first-child{width:24%}.services-table th:nth-child(2),.services-table td:nth-child(2){width:30%}.visit-heading{margin:8px 0 3px;font-size:9pt;font-weight:800;color:#1f5eff}.payment-section{margin-top:10px}.visit-summary{display:inline-block;vertical-align:top;width:48.5%;margin:0 1% 6px 0;padding:8px 10px;border:1px solid #dce2e8;border-radius:5px;break-inside:avoid}.visit-summary:nth-child(2n){margin-right:0}.visit-summary-title{color:#15283f;font-weight:800;font-size:8.5pt;margin-bottom:3px}.visit-line,.visit-total{display:flex;justify-content:space-between;gap:10px}.visit-line{color:#596572;font-size:8pt;margin-top:1px}.visit-total{margin-top:4px;padding-top:4px;border-top:1px solid #e0e5ea;font-weight:800;color:#15283f}.grand-total{margin-top:6px;padding:9px 12px;background:#f4f7fa;display:flex;justify-content:space-between;align-items:center;border-radius:5px}.grand-total span{font-weight:700;color:#15283f}.grand-total strong{font-size:15pt;color:#e43b3b}.installment-box{margin-top:9px;padding:9px 11px;border:1px solid #ccd8e6;border-left:5px solid #1f5eff;border-radius:5px;background:#f7faff;break-inside:avoid}.installment-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.installment-grid div{padding:6px;background:#fff;border:1px solid #e1e7ee;border-radius:4px}.installment-grid span{display:block;font-size:7pt;color:#66727e}.installment-grid strong{display:block;margin-top:2px;color:#15283f;font-size:8.5pt}.closing{margin-top:10px;break-inside:avoid;page-break-inside:avoid}.important{padding:9px 11px;background:#fff8f8;border-left:5px solid #e43b3b;border-radius:4px}.important-title{color:#e43b3b;font-weight:800;letter-spacing:.7px;margin-bottom:3px}.footer{margin-top:10px;padding-top:7px;border-top:2px solid #15283f;color:#596572;font-size:7pt}.footer strong{color:#15283f}.print-note{margin:8px 0;padding:7px 9px;background:#fffbe8;border:1px solid #eadb91;font-size:8pt}@media print{.print-note{display:none}a{color:inherit;text-decoration:none}.page{max-width:none}body{font-size:9.5pt}}
</style></head><body><div class="page"><div class="print-note">${language==='Russian'?'В окне печати выберите «Сохранить как PDF».':'In the print dialog, choose “Save as PDF”.'}</div>
<header class="brand-bar"><div class="brand">Duty Clinic</div><div class="brand-meta"><strong>Istanbul • Türkiye</strong> | Professional Dental Care with International Standards.</div><div class="brand-meta">Duty Clinic Istanbul | +90 536 779 07 91 | dutyclinic.com | info@dutyclinic.com</div></header>
<h1 class="title">${pdfEsc(labels.proposal)}</h1><div class="subtitle">${pdfEsc(labels.date)}: ${pdfEsc(generatedDate)}</div>
<div class="patient-card"><div class="patient-name">${pdfEsc(patientName)}</div><div class="patient-meta">${pdfEsc(labels.preparedFor)} ${pdfEsc(patientName)} · ${quotation.options.length} ${quotation.options.length===1?'option':'options'}</div></div>
<div class="intro">${pdfEsc(labels.intro)}</div>
${translatedPlan?`<div class="section-kicker">${pdfEsc(labels.treatmentPlan)}</div><div class="diagnosis">${pdfEsc(translatedPlan)}</div><div class="translation-note">${pdfEsc(labels.translationNotice)}</div>`:''}
${optionsHtml}
<section class="closing"><div class="important"><div class="important-title">${pdfEsc(labels.important)}</div><div>${pdfEsc(labels.disclaimer)}</div></div></section>
<footer class="footer"><strong>Duty Clinic Istanbul</strong> | Istanbul, Türkiye | +90 536 779 07 91 | dutyclinic.com | info@dutyclinic.com<br>${pdfEsc(labels.generated)}</footer></div>
<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350));</script></body></html>`;

  const printWindow=window.open('','_blank','width=1000,height=800');
  if(!printWindow){alert('Please allow pop-ups for Duty AI to generate the PDF.');return;}
  printWindow.document.open();printWindow.document.write(html);printWindow.document.close();
}

if(typeof window!=='undefined') window.generateQuotationPdf=generateQuotationPdf;
