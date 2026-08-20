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
    if (typeof window.money !== 'function') return 1;
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

  function usdToDisplay(value) {
    const currency = document.getElementById('quoteCurrency')?.value || 'USD';
    return currency === 'EUR' ? roundCurrency(Number(value) * selectedRate()) : roundCurrency(value);
  }

  window.roundCurrency = roundCurrency;

  function numberOrNull(input) {
    if (!input || input.value === '') return null;
    const value = Number(input.value);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  function addPriceField(parent, className, label, value = '') {
    if (!parent || parent.querySelector(`.${className}`)) return;
    const wrap = document.createElement('div');
    wrap.className = 'manual-price-field';
    wrap.innerHTML = `
      <label>${label}</label>
      <input class="${className}" type="number" min="0" step="0.01" placeholder="Use standard price" value="${value}">
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
      wrapper.innerHTML = `
        <input class="${type}-final-price" type="number" min="0" step="0.01" placeholder="Use standard price">
      `;
      const input = wrapper.querySelector('input');
      input.addEventListener('input', () => window.recalculateQuotation());
      input.addEventListener('change', () => window.recalculateQuotation());
    }

    if (guidance) {
      guidance.textContent = 'Enter the exact final unit price. Leave empty to use the standard price.';
    }

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
      input.addEventListener('input', () => {
        if (input.value === '') delete choice.dataset.finalPrice;
        else choice.dataset.finalPrice = String(roundCurrency(input.value));
        window.recalculateQuotation();
      });
      input.addEventListener('change', () => {
        if (input.value === '') delete choice.dataset.finalPrice;
        else choice.dataset.finalPrice = String(roundCurrency(input.value));
        window.recalculateQuotation();
      });
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
      const firstSection = two.querySelector('.visit1-nights')?.parentElement;
      const secondNights = two.querySelector('.visit2-nights');

      if (firstSection) {
        addPriceField(two, 'visit1-hotel-price', 'Visit 1 — final hotel price / night (USD)');
        addPriceField(two, 'visit1-transfer-price', 'Visit 1 — final VIP transfer price (USD)');
        addPriceField(two, 'visit1-prosthesis-price', 'Visit 1 — final dental prosthesis price (USD)');
      }

      if (secondNights && !two.querySelector('.visit2-stage-prices')) {
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
    if (!card || card.dataset.manualPricingEnhanced === 'true') return;
    card.dataset.manualPricingEnhanced = 'true';
    replaceMarkupControl(card, 'implant');
    replaceMarkupControl(card, 'crown');
    enhanceProcedurePrices(card);
    enhanceStagePrices(card);

    const visitPlan = card.querySelector('.visit-plan');
    visitPlan?.addEventListener('change', () => {
      setTimeout(() => {
        enhanceStagePrices(card);
        window.recalculateQuotation();
      }, 0);
    });
  }

  function applyManualPrices(card, result) {
    const implant = window.DUTY_PRICING?.implants?.find(item => item.id === card.querySelector('.implant-brand')?.value);
    const crown = window.DUTY_PRICING?.crowns?.find(item => item.id === card.querySelector('.crown-brand')?.value);

    const implantInput = card.querySelector('.implant-final-price');
    const crownInput = card.querySelector('.crown-final-price');

    const implantManualDisplay = numberOrNull(implantInput);
    const crownManualDisplay = numberOrNull(crownInput);

    const implantManualUsd = implantManualDisplay == null ? null : displayToUsd(implantManualDisplay);
    const crownManualUsd = crownManualDisplay == null ? null : displayToUsd(crownManualDisplay);

    if (implantManualUsd != null && implant) {
      result.implantUnitPrice = roundCurrency(implantManualUsd);
      result.visit1Dental = roundCurrency(result.visit1Dental - (result.totalImplants * (implant.price * (1 + numberOrNull(card.querySelector('.implant-markup')) / 100))) + (result.totalImplants * result.implantUnitPrice));
    }

    if (crownManualUsd != null && crown) {
      const newUnit = roundCurrency(crownManualUsd);
      const oldTotal = result.visit1Crowns * result.crownUnitPrice + result.visit2Crowns * result.crownUnitPrice;
      const newV1 = roundCurrency(result.visit1Crowns * newUnit);
      const newV2 = roundCurrency(result.visit2Crowns * newUnit);
      result.crownUnitPrice = newUnit;
      result.visit1CrownTotal = newV1;
      result.visit2CrownTotal = newV2;
      result.visit1Dental = roundCurrency(result.visit1Dental - (result.visit1Crowns * (result.crownUnitPrice || 0)) + newV1);
      result.visit2Dental = roundCurrency(result.visit2Dental - (result.visit2Crowns * (result.crownUnitPrice || 0)) + newV2);
      if (!Number.isFinite(oldTotal)) result.crownUnitPrice = newUnit;
    }

    const procedureRows = [...card.querySelectorAll('.procedure-choice:checked')];
    if (procedureRows.length) {
      // Re-run the underlying calculator with manual procedure unit prices by
      // temporarily replacing data-price. This preserves all existing quantity logic.
      procedureRows.forEach(choice => {
        if (choice.dataset.finalPrice != null) choice.dataset.price = choice.dataset.finalPrice;
      });
    }

    const visit1Hotel = numberOrNull(card.querySelector(result.visits === 1 ? '.one-visit-hotel-price' : '.visit1-hotel-price'));
    const visit2Hotel = numberOrNull(card.querySelector('.visit2-hotel-price'));
    const hotel1ManualUsd = visit1Hotel == null ? null : displayToUsd(visit1Hotel);
    const hotel2ManualUsd = visit2Hotel == null ? null : displayToUsd(visit2Hotel);

    if (hotel1ManualUsd != null) {
      const nights = result.visits === 1
        ? Number(card.querySelector('.one-visit-nights')?.value || 0)
        : Number(card.querySelector('.visit1-nights')?.value || 0);
      const newHotel = roundCurrency(hotel1ManualUsd * nights);
      result.visit1Services = roundCurrency(result.visit1Services - result.visit1Hotel + newHotel);
      result.visit1Hotel = newHotel;
    }

    if (hotel2ManualUsd != null && result.visits === 2) {
      const nights = Number(card.querySelector('.visit2-nights')?.value || 0);
      const newHotel = roundCurrency(hotel2ManualUsd * nights);
      result.visit2Services = roundCurrency(result.visit2Services - result.visit2Hotel + newHotel);
      result.visit2Hotel = newHotel;
    }

    const v1Transfer = numberOrNull(card.querySelector(result.visits === 1 ? '.transfer-price' : '.visit1-transfer-price'));
    const v2Transfer = numberOrNull(card.querySelector('.visit2-transfer-price'));
    const v1Prosthesis = numberOrNull(card.querySelector(result.visits === 1 ? '.prosthesis-price' : '.visit1-prosthesis-price'));
    const v2Prosthesis = numberOrNull(card.querySelector('.visit2-prosthesis-price'));

    if (v1Transfer != null) result.visit1Transfer = displayToUsd(v1Transfer);
    if (v2Transfer != null && result.visits === 2) result.visit2Transfer = displayToUsd(v2Transfer);
    if (v1Prosthesis != null) result.visit1Prosthesis = displayToUsd(v1Prosthesis);
    if (v2Prosthesis != null && result.visits === 2) result.visit2Prosthesis = displayToUsd(v2Prosthesis);

    result.visit1Services = roundCurrency(result.visit1Hotel + result.visit1Transfer + result.visit1Prosthesis);
    result.visit2Services = roundCurrency(result.visit2Hotel + result.visit2Transfer + result.visit2Prosthesis);
    result.visit1Total = roundCurrency(result.visit1Dental + result.visit1Services);
    result.visit2Total = roundCurrency(result.visit2Dental + result.visit2Services);
    result.subtotal = roundCurrency(result.visit1Total + result.visit2Total);

    return result;
  }

  window.calculateOption = function (card) {
    enhanceCard(card);

    // Apply manual procedure prices before the original calculator runs.
    card.querySelectorAll('.procedure-choice').forEach(choice => {
      if (choice.dataset.finalPrice != null) choice.dataset.price = choice.dataset.finalPrice;
    });

    const result = originalCalculateOption(card);
    const final = applyManualPrices(card, result);

    const subtotalElement = card.querySelector('.option-subtotal');
    if (subtotalElement && typeof window.money === 'function') {
      subtotalElement.textContent = window.money(roundCurrency(final.subtotal));
    }

    return final;
  };

  function updateManualInputDisplay() {
    document.querySelectorAll('.manual-price-field input').forEach(input => {
      if (input.value !== '') input.value = roundCurrency(input.value).toFixed(2);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.quotation-option').forEach(enhanceCard);

    const currency = document.getElementById('quoteCurrency');
    currency?.addEventListener('change', () => {
      updateManualInputDisplay();
      document.querySelectorAll('.quotation-option').forEach(card => enhanceCard(card));
      window.recalculateQuotation?.();
    });

    document.getElementById('eurRate')?.addEventListener('input', () => {
      document.querySelectorAll('.quotation-option').forEach(card => enhanceCard(card));
      window.recalculateQuotation?.();
    });
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