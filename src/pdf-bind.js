document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('generatePdf');

  if(button && typeof generateQuotationPdf === 'function'){
    button.addEventListener('click', generateQuotationPdf);
  }
});
