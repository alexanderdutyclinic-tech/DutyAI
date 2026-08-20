/* DutyAI coordinator manual pricing layer.
   Replaces percentage-only controls with explicit final prices and supports
   manual pricing for products/services/hotel at the visit stage level.
   Pricing is entered in USD; display currency remains a presentation setting. */
(function () {
  const originalCalculateOption = window.calculateOption;
  const originalAddQuotationOption = window.addQuotationOption;

  function roundCurrency(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function selectedRate() {
    const currency = document.getElementById('quoteCurrency')?.value || 'USD';
    if (currency !== 'EUR') return 1;
    const rate = Number(document.getElementById('eurRate')?.value);
    return rate > 0 ? rate : (1 / 1.1567);
  }

  function displayToUsd(value) {
    const currency = document.getElementById('quoteCurrency')?.value || 'USD';
    if (currency !== 'EUR') return roundCurrency(value);
    return roundCurrency(Number(value) / selectedRate());
  }

  function formatRoundedMoney(value) {
    const currency = document.getElementById('quoteCurrency')?.value || 'USD';
    const amount = currency === 'EUR'
      ? roundCurrency(Number(value) * selectedRate())
      : roundCurrency(value);
    const symbol = currency === 'EUR' ? '€' : '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  }

  window.roundCurrency = roundCurrency;
  window.money = formatRoundedMoney;
  window.pdfMoney = formatRoundedMoney;
  window.premiumMoney = formatRoundedMoney;

  function numberOrNull(input) {
    if (!input || input.value === '') return null;
    const value = Number(input.value);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  function addPriceField(parent, className, label) {
    if (!parent || parent.querySelector(`.${className}`)) return;
    const wrap = document.createElement('div');
    wrap.className = 'manual-price-field';
    wrap.innerHTML = `
      <label>${label}</label>
      <input class="${className}" type="number" min="0" step="0.01" placeholder="Use standard price">
      <small>USD • leave empty to use the standard price.</small>
    `;
    parent.appendChild(wrap);
    const input = wrap.querySelector('input');
    input.addEventListener('input', () => window.recalculateQuotation());
    input.addEventListener('change', () => window.recalculateQuotation());
  }

  function replaceMarkupControl(card, type) {
    const markup = card.querySelector(`.${type}-markup`);
    if (!markup || markup.dataset.replaced === 'true') return;

    const wrapper = markup.closest('.percentage-input');
    const guidance = card.querySelector(`.${type}-markup-guidance`);
    const label = wrapper?.previousElementSibling;

    if (label?.tagName === 'LABEL') {
      label.textContent = `${type === 'implant' ? 'Implant' : 'Crown'} final unit price (USD)`;
    }

    if (wrapper) {
      wrapper.innerHTML = `<input class="${type}-final-price" type="number" min="0" step="0.01" placeholder="Use standard price">`;
      const input = wrapper.querySelector('input');
      input.addEventListener('input', () => window.recalculateQuotation());
      input.addEventListener('change', () => window.recalculateQuotation());
    }

    if (guidance) guidance.textContent = 'Enter the exact final unit price. Leave empty to use the standard price.';
    markup.dataset.replaced = 'true';
  }

  function enhanceProcedurePrices(card) {
    card.querySelectorAll('.selected-procedure').forEach(row => {
      if (row.querySelector('.procedure-final-price')) return;
      const choice = row.querySelector('.procedure-choice');
      if (!choice) return;

      const procedure = (typeof procedureSource === 'function' ? procedureSource() : []).find(p => p.id === choice.value)
        || window.DUTY_PRICING?.procedures?.find(p => p.id === choice.value);
      const base = Number(procedure?.price ?? choice.dataset.price) || 0;

      const wrap = document.createElement('div');
      wrap.className = 'manual-price-field procedure-manual-price';
      wrap.innerHTML = `
        <label>Final price${procedure?.unit ? ` / ${procedure.unit}` : ''} (USD)</label>
        <input class="procedure-final-price" type="number" min="0" step="0.01" placeholder="${base.toFixed(2)}">
        <small>Leave empty to use ${base.toFixed(2)} USD.</small>
      `;
      row.appendChild(wrap);

      const input = wrap.querySelector('input');
      const sync = () => {
        if (input.value === '') delete choice.dataset.finalPrice;
        else choice.dataset.finalPrice = String(roundCurrency(input.value));
        window.recalculateQuotation();
      };
      input.addEventListener('input', sync);
      input.addEventListener('change', sync);
    });
  }

  function enhanceStagePrices(card) {
    const visitPlan = card.querySelector('.visit-plan')?.value || '2';
    const one = card.querySelector('.visit-template-1');
    const two = card.querySelector('.visit-template-2');

    if (visitPlan === '1' && one) {
      addPriceField(one, 'one-visit-hotel-price', 'Final hotel price / night (USD)');
      addPriceField(one, 'transfer-price', 'Final VIP transfer price (USD)');
      addPriceField(one, 'prosthesis-price', 'Final dental prosthesis price (USD)');
    }

    if (visitPlan === '2' && two) {
      addPriceField(two, 'visit1-hotel-price', 'Visit 1 — final hotel price / night (USD)');
      addPriceField(two, 'visit1-transfer-price', 'Visit 1 — final VIP transfer price (USD)');
      addPriceField(two, 'visit1-prosthesis-price', 'Visit 1 — final dental prosthesis price (USD)');

      if (!two.querySelector('.visit2-stage-prices')) {
        const section = document.createElement('div');
        section.className = 'visit2-stage-prices';
        two.appendChild(section);
        addPriceField(section, 'visit2-hotel-price', 'Visit 2 — final hotel price / night (USD)');
        addPriceField(section, 'visit2-transfer-price', 'Visit 2 — final VIP transfer price (USD)');
        addPriceField(section, 'visit2-prosthesis-price', 'Visit 2 — final dental prosthesis price (USD)');
      }
    }
  }

  function enhanceCard(card) {
    if (!card) return;
    replaceMarkupControl(card, 'implant');
    replaceMarkupControl(card, 'crown');
    enhanceProcedurePrices(card);
    enhanceStagePrices(card);
    if (card.dataset.manualPricingBound !== 'true') {
      card.dataset.manualPricingBound = 'true';
      card.querySelector('.visit-plan')?.addEventListener('change', () => {
        setTimeout(() => {
          enhanceStagePrices(card);
          window.recalculateQuotation();
        }, 0);
      });
    }
  }

  function applyManualPrices(card, result) {
    const implant = window.DUTY_PRICING?.implants?.find(item => item.id === card.querySelector('.implant-brand')?.value);
    const crown = window.DUTY_PRICING?.crowns?.find(item => item.id === card.querySelector('.crown-brand')?.value);

    const implantManualDisplay = numberOrNull(card.querySelector('.implant-final-price'));
    const crownManualDisplay = numberOrNull(card.querySelector('.crown-final-price'));
    const implantManualUsd = implantManualDisplay == null ? null : displayToUsd(implantManualDisplay);
    const crownManualUsd = crownManualDisplay == null ? null : displayToUsd(crownManualDisplay);

    if (implantManualUsd != null && implant) {
      const oldUnit = Number(result.implantUnitPrice) || 0;
      const newUnit = roundCurrency(implantManualUsd);
      result.implantUnitPrice = newUnit;
      result.visit1Dental = roundCurrency(result.visit1Dental - (result.totalImplants * oldUnit) + (result.totalImplants * newUnit));
    }

    if (crownManualUsd != null && crown) {
      const oldUnit = Number(result.crownUnitPrice) || 0;
      const newUnit = roundCurrency(crownManualUsd);
      const newV1 = roundCurrency(result.visit1Crowns * newUnit);
      const newV2 = roundCurrency(result.visit2Crowns * newUnit);
      result.crownUnitPrice = newUnit;
      result.visit1CrownTotal = newV1;
      result.visit2CrownTotal = newV2;
      result.visit1Dental = roundCurrency(result.visit1Dental - (result.visit1Crowns * oldUnit) + newV1);
      result.visit2Dental = roundCurrency(result.visit2Dental - (result.visit2Crowns * oldUnit) + newV2);
    }

    const visit1Hotel = numberOrNull(card.querySelector(result.visits === 1 ? '.one-visit-hotel-price' : '.visit1-hotel-price'));
    const visit2Hotel = numberOrNull(card.querySelector('.visit2-hotel-price'));
    const hotel1ManualUsd = visit1Hotel == null ? null : displayToUsd(visit1Hotel);
    const hotel2ManualUsd = visit2Hotel == null ? null : displayToUsd(visit2Hotel);

    if (hotel1ManualUsd != null) {
      const nights = result.visits === 1 ? Number(card.querySelector('.one-visit-nights')?.value || 0) : Number(card.querySelector('.visit1-nights')?.value || 0);
      const newHotel = roundCurrency(hotel1ManualUsd * nights);
      result.visit1Hotel = newHotel;
    }

    if (hotel2ManualUsd != null && result.visits === 2) {
      const nights = Number(card.querySelector('.visit2-nights')?.value || 0);
      result.visit2Hotel = roundCurrency(hotel2ManualUsd * nights);
    }

    const v1Transfer = numberOrNull(card.querySelector(result.visits === 1 ? '.transfer-price' : '.visit1-transfer-price'));
    const v2Transfer = numberOrNull(card.querySelector('.visit2-transfer-price'));
    const v1Prosthesis = numberOrNull(card.querySelector(result.visits === 1 ? '.prosthesis-price' : '.visit1-prosthesis-price'));
    const v2Prosthesis = numberOrNull(card.querySelector('.visit2-prosthesis-price'));

    if (v1Transfer != null) result.visit1Transfer = displayToUsd(v1Transfer);
    if (v2Transfer != null && result.visits === 2) result.visit2Transfer = displayToUsd(v2Transfer);
    if (v1Prosthesis != null) result.visit1Prosthesis = displayToUsd(v1Prosthesis);
    if (v2Prosthesis != null && result.visits === 2) result.visit2Prosthesis = displayToUsd(v2Prosthesis);

    result.visit1Dental = roundCurrency(result.visit1Dental);
    result.visit2Dental = roundCurrency(result.visit2Dental);
    result.visit1Services = roundCurrency(result.visit1Hotel + result.visit1Transfer + result.visit1Prosthesis);
    result.visit2Services = roundCurrency(result.visit2Hotel + result.visit2Transfer + result.visit2Prosthesis);
    result.visit1Total = roundCurrency(result.visit1Dental + result.visit1Services);
    result.visit2Total = roundCurrency(result.visit2Dental + result.visit2Services);
    result.subtotal = roundCurrency(result.visit1Total + result.visit2Total);
    return result;
  }

  window.calculateOption = function (card) {
    enhanceCard(card);

    card.querySelectorAll('.procedure-choice').forEach(choice => {
      if (choice.dataset.finalPrice != null) choice.dataset.price = choice.dataset.finalPrice;
    });

    const result = originalCalculateOption(card);
    const final = applyManualPrices(card, result);
    const subtotalElement = card.querySelector('.option-subtotal');
    if (subtotalElement) subtotalElement.textContent = formatRoundedMoney(final.subtotal);
    return final;
  };

  function patchSimplePdfVisibility() {
    const originalSimplePdf = window.generateQuotationPdf;
    if (typeof originalSimplePdf !== 'function' || originalSimplePdf.__dutyAiPatched) return;

    const patched = function () {
      const originalOpen = window.open;
      let printWindow = null;

      window.open = function (...args) {
        printWindow = originalOpen.apply(window, args);
        return printWindow;
      };

      try {
        originalSimplePdf();
      } finally {
        window.open = originalOpen;
      }

      if (!printWindow) return;

      const inject = () => {
        try {
          const showProducts = document.getElementById('showProductPrices')?.checked !== false;
          const showHotels = document.getElementById('showHotelPrices')?.checked !== false;
          const doc = printWindow.document;

          if (!showProducts) {
            doc.querySelectorAll('.proposal-table').forEach(table => {
              const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.toLowerCase());
              if (headers.includes('unit price')) {
                const unitIndex = headers.indexOf('unit price');
                const totalIndex = headers.indexOf('total');
                table.querySelectorAll('tr').forEach(row => {
                  if (row.children[unitIndex]) row.children[unitIndex].textContent = 'Included';
                  if (row.children[totalIndex]) row.children[totalIndex].textContent = 'Included';
                });
              }
            });
            doc.querySelectorAll('.visit-summary .visit-line').forEach(row => {
              const label = row.querySelector('span')?.textContent?.toLowerCase() || '';
              if (label.includes('treatment') && row.querySelector('strong')) row.querySelector('strong').textContent = 'Included';
            });
          }

          if (!showHotels) {
            doc.querySelectorAll('.proposal-table').forEach(table => {
              const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.toLowerCase());
              if (headers.includes('price / night')) {
                const nightIndex = headers.indexOf('price / night');
                const totalIndex = headers.indexOf('total');
                table.querySelectorAll('tbody tr').forEach(row => {
                  if (row.children[nightIndex]) row.children[nightIndex].textContent = 'Included';
                  if (row.children[totalIndex]) row.children[totalIndex].textContent = 'Included';
                });
              }
            });
            doc.querySelectorAll('.visit-summary .visit-line').forEach(row => {
              const label = row.querySelector('span')?.textContent?.toLowerCase() || '';
              if (label.includes('services') && row.querySelector('strong')) row.querySelector('strong').textContent = 'Included';
            });
          }

          const style = doc.createElement('style');
          style.textContent = `
            .manual-price-field { margin-top: 8px; padding: 8px 10px; border: 1px dashed #cfd7e1; border-radius: 5px; background: #fafbfd; }
            .manual-price-field label { display:block; font-weight:600; margin-bottom:4px; }
            .manual-price-field input { width:100%; box-sizing:border-box; }
            .manual-price-field small { display:block; margin-top:3px; color:#6d7783; font-size:11px; }
            .procedure-manual-price { margin-top:6px; }
            .visit2-stage-prices { margin-top:10px; padding-top:10px; border-top:1px solid #dfe4ea; }
          `;
          doc.head.appendChild(style);
        } catch (_) {}
      };

      try { printWindow.addEventListener('load', inject, { once: true }); } catch (_) {}
      setTimeout(inject, 250);
    };

    patched.__dutyAiPatched = true;
    window.generateQuotationPdf = patched;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.quotation-option').forEach(enhanceCard);
    patchSimplePdfVisibility();

    document.getElementById('quoteCurrency')?.addEventListener('change', () => {
      document.querySelectorAll('.quotation-option').forEach(enhanceCard);
      window.recalculateQuotation?.();
    });
    document.getElementById('eurRate')?.addEventListener('input', () => window.recalculateQuotation?.());
  });

  if (typeof originalAddQuotationOption === 'function') {
    window.addQuotationOption = function (...args) {
      const before = new Set(document.querySelectorAll('.quotation-option'));
      const result = originalAddQuotationOption.apply(this, args);
      document.querySelectorAll('.quotation-option').forEach(card => {
        if (!before.has(card)) enhanceCard(card);
      });
      return result;
    };
  }
})();