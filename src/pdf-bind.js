document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('generatePdf');

  if(button && typeof generateQuotationPdf === 'function'){
    button.addEventListener('click', () => {
      const originalOpen = window.open;
      let printWindow = null;

      window.open = function(...args){
        printWindow = originalOpen.apply(window,args);
        if(printWindow){
          printWindow.addEventListener('load', () => {
            const style = printWindow.document.createElement('style');
            style.textContent = `
              .payment-section {
                break-before: page !important;
                page-break-before: always !important;
              }
            `;
            printWindow.document.head.appendChild(style);
          });
        }
        return printWindow;
      };

      try {
        generateQuotationPdf();
      } finally {
        window.open = originalOpen;
      }
    });
  }
});
