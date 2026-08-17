document.addEventListener('DOMContentLoaded', () => {
  const simpleButton = document.getElementById('generatePdf');
  const premiumButton = document.getElementById('generatePremiumPdf');

  if (simpleButton && typeof generateQuotationPdf === 'function') {
    simpleButton.addEventListener('click', () => {
      const originalOpen = window.open;
      let printWindow = null;

      window.open = function (...args) {
        printWindow = originalOpen.apply(window, args);

        if (printWindow) {
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

  if (premiumButton && typeof generatePremiumQuotationPdf === 'function') {
    premiumButton.addEventListener('click', () => {
      generatePremiumQuotationPdf();
    });
  }
});
