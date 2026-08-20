/* Manual pricing currency safety layer.
   Coordinator manual product/service prices are entered in USD. The quotation
   display currency may be EUR, but that must never change the entered USD value. */
(function () {
  const originalCalculateOption = window.calculateOption;
  if (typeof originalCalculateOption !== 'function') return;

  window.calculateOption = function (card) {
    const currency = document.getElementById('quoteCurrency')?.value || 'USD';
    if (currency !== 'EUR') return originalCalculateOption(card);

    const currencySelect = document.getElementById('quoteCurrency');
    currencySelect.value = 'USD';
    try {
      return originalCalculateOption(card);
    } finally {
      currencySelect.value = 'EUR';
    }
  };
})();