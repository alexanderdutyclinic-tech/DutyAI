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

// Load the manual coordinator pricing layer after coordinator-updates.js has
// executed, but before DOMContentLoaded initializes the quotation UI.
setTimeout(() => {
  if (document.querySelector('script[src="/Frontend/coordinator-manual-pricing.js"]')) return;
  const script = document.createElement('script');
  script.src = '/Frontend/coordinator-manual-pricing.js';
  script.onload = () => {
    if (document.querySelector('script[src="/Frontend/coordinator-manual-currency-fix.js"]')) return;
    const fix = document.createElement('script');
    fix.src = '/Frontend/coordinator-manual-currency-fix.js';
    document.head.appendChild(fix);
  };
  document.head.appendChild(script);
}, 0);
