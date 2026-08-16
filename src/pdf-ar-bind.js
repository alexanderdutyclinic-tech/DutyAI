// Routes Arabic quotations to the dedicated Arabic PDF renderer.
(function(){
  if(typeof window === 'undefined' || typeof generateArabicQuotationPdf !== 'function') return;

  const genericGenerateQuotationPdf = window.generateQuotationPdf;

  window.generateQuotationPdf = function(){
    const language = document.getElementById('language')?.value || '';
    if(language === 'Arabic'){
      generateArabicQuotationPdf();
      return;
    }
    if(typeof genericGenerateQuotationPdf === 'function'){
      genericGenerateQuotationPdf();
    }
  };
})();
