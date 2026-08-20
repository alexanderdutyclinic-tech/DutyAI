/* Manual pricing currency safety layer.
   Coordinator manual product/service prices are entered in USD. The quotation
   display currency may be EUR, but that must never change the entered USD value. */
(function () {
  const originalCalculateOption = window.calculateOption;
  if (typeof originalCalculateOption !== 'function') return;

  window.calculateOption = function (card) {
    const currencySelect = document.getElementById('quoteCurrency');
    const currency = currencySelect?.value || 'USD';
    if (currency !== 'EUR') return originalCalculateOption(card);

    currencySelect.value = 'USD';
    let result;
    try {
      result = originalCalculateOption(card);
    } finally {
      currencySelect.value = 'EUR';
    }

    if (result && typeof window.money === 'function') {
      const subtotal = card.querySelector('.option-subtotal');
      if (subtotal) subtotal.textContent = window.money(result.subtotal);
    }
    return result;
  };
})();