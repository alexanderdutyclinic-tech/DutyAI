// Small patient-facing PDF polish layer.
// Keeps the main renderer untouched while applying layout/localization refinements.
(function(){
  if(typeof window==='undefined' || typeof window.generateQuotationPdf!=='function') return;

  const originalGenerateQuotationPdf = window.generateQuotationPdf;

  function optionsLabel(language,count){
    if(language==='Russian'){
      if(count===1) return `${count} вариант`;
      if(count>=2 && count<=4) return `${count} варианта`;
      return `${count} вариантов`;
    }
    if(language==='French') return `${count} option${count===1?'':'s'}`;
    if(language==='Spanish') return `${count} opción${count===1?'':'es'}`;
    if(language==='Arabic') return count===1 ? `${count} خيار` : `${count} خيارات`;
    return `${count} option${count===1?'':'s'}`;
  }

  window.generateQuotationPdf = function(){
    const quotation = typeof buildQuotationData==='function' ? buildQuotationData() : null;
    const language = quotation?.patient?.language || 'English';
    const count = quotation?.options?.length || 0;
    const shouldSplitPayment = quotation?.options?.some(option => (option.visits?.count || 1) > 1);

    const originalOpen = window.open;
    window.open = function(...args){
      const printWindow = originalOpen.apply(window,args);
      if(!printWindow) return printWindow;

      const originalWrite = printWindow.document.write.bind(printWindow.document);
      printWindow.document.write = function(html){
        let refined = html;

        const optionPhrase = optionsLabel(language,count);
        refined = refined.replace(/·\s*\d+\s+options?/i, `· ${optionPhrase}`);

        if(shouldSplitPayment){
          refined = refined.replace('</style>', `
            .payment-section{break-before:page;page-break-before:always}
            .payment-section .section-kicker{margin-top:0}
          </style>`);
        }

        originalWrite(refined);
      };

      return printWindow;
    };

    try{
      originalGenerateQuotationPdf();
    } finally {
      window.open = originalOpen;
    }
  };
})();
