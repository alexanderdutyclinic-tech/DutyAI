/* DutyAI coordinator final pricing rules.
   This layer is intentionally small and sits after the existing coordinator/pricing
   extensions. It defines the coordinator-facing rules without changing the clinic's
   base pricing data.

   Coordinator manual overrides:
   - Implant system: final unit price
   - Crown system/material: final unit price
   - Additional procedures: final unit price / unit
   - Dental prosthesis: final service price

   Not manually overridden:
   - Hotels: always use standard Duty Clinic hotel pricing
   - VIP transfer: fixed at $150 (converted for display currency)
   - Translator: included/free

   Manual values are entered/displayed in the coordinator-selected currency, while
   the calculation layer stores them in USD internally. Currency conversion is
   rounded to two decimals at every patient-facing currency boundary.
*/
(function () {
  const CURRENCIES = {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 1 / 1.1567 }
  };

  const FIXED_TRANSFER_USD = 150;

  function getCurrency() {
    return document.getElementById('quoteCurrency')?.value || 'USD';
  }

  function getRate() {
    if (getCurrency() !== 'EUR') return 1;
    const value = Number(document.getElementById('eurRate')?.value);
    return value > 0 ? value : CURRENCIES.EUR.rate;
  }

  function roundCurrency(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function usdToDisplay(value) {
    return roundCurrency(Number(value) * getRate());
  }

  function displayToUsd(value) {
    const rate = getRate();
    return roundCurrency(Number(value) / rate);
  }

  function symbol() {
    return CURRENCIES[getCurrency()]?.symbol || '$';
  }

  function money(value) {
    const amount = usdToDisplay(value);
    return `${symbol()}${amount.toLocaleString('en-US', {
      minimumFractionDigits: amount % 1 ? 2 : 0,
      maximumFractionDigits: 2
    })}`;
  }

  window.roundCurrency = roundCurrency;
  window.money = money;
  window.pdfMoney = money;
  window.premiumMoney = money;

  function setFieldDisplay(input, usdValue) {
    if (!input) return;
    input.value = usdValue == null ? '' : String(usdToDisplay(usdValue));
    input.dataset.usdValue = usdValue == null ? '' : String(roundCurrency(usdValue));
  }

  function getManualUsd(input) {
    if (!input) return null;
    if (input.dataset.usdValue !== undefined && input.value !== '') {
      const stored = Number(input.dataset.usdValue);
      if (Number.isFinite(stored) && stored >= 0) return roundCurrency(stored);
    }
    if (input.value === '') return null;
    const value = Number(input.value);
    return Number.isFinite(value) && value >= 0 ? displayToUsd(value) : null;
  }

  function makeManualField(parent, selector, label, help) {
    if (!parent || parent.querySelector(selector)) return parent.querySelector(selector);

    const wrap = document.createElement('div');
    wrap.className = 'duty-final-price-field';
    wrap.innerHTML = `
      <label>${label}</label>
      <input class="${selector.slice(1)}" type="number" min="0" step="0.01" placeholder="Use standard price">
      <small>${help || 'Leave empty to use the standard price.'}</small>
    `;
    parent.appendChild(wrap);

    const input = wrap.querySelector('input');
    input.addEventListener('input', () => {
      if (input.value === '') {
        input.dataset.usdValue = '';
      } else {
        const value = Number(input.value);
        if (Number.isFinite(value) && value >= 0) {
          input.dataset.usdValue = String(displayToUsd(value));
        }
      }
      window.recalculateQuotation?.();
    });
    input.addEventListener('change', () => window.recalculateQuotation?.());
    return input;
  }

  function convertExistingField(input) {
    if (!input) return;
    const usd = getManualUsd(input);
    if (usd != null) setFieldDisplay(input, usd);
  }

  function removeLegacyManualField(card, selectors) {
    selectors.forEach(selector => card.querySelectorAll(selector).forEach(el => {
      const wrap = el.closest('.manual-price-field');
      if (wrap) wrap.remove();
    }));
  }

  function normalizeTransfer(card) {
    const select = card.querySelector('.transfer-option');
    if (!select) return;

    select.innerHTML = `<option value="${FIXED_TRANSFER_USD}">${money(FIXED_TRANSFER_USD)}</option>`;
    select.value = String(FIXED_TRANSFER_USD);
    select.disabled = true;
    select.title = 'VIP transfer is fixed at $150 and only changes with the selected display currency.';
  }

  function normalizeProductLabels(card) {
    const implantMarkup = card.querySelector('.implant-markup');
    const crownMarkup = card.querySelector('.crown-markup');

    const implantLabel = implantMarkup?.closest('.percentage-input')?.previousElementSibling;
    const crownLabel = crownMarkup?.closest('.percentage-input')?.previousElementSibling;

    if (implantLabel?.tagName === 'LABEL') implantLabel.textContent = `Implant final unit price (${getCurrency()})`;
    if (crownLabel?.tagName === 'LABEL') crownLabel.textContent = `Crown final unit price (${getCurrency()})`;

    const implantGuidance = card.querySelector('.implant-markup-guidance');
    const crownGuidance = card.querySelector('.crown-markup-guidance');
    if (implantGuidance) implantGuidance.textContent = 'Enter the exact final unit price. Leave empty to use the standard price.';
    if (crownGuidance) crownGuidance.textContent = 'Enter the exact final unit price. Leave empty to use the standard price.';
  }

  function enhanceProductFields(card) {
    normalizeProductLabels(card);

    const implantInput = card.querySelector('.implant-final-price');
    const crownInput = card.querySelector('.crown-final-price');

    [implantInput, crownInput].forEach(input => {
      if (!input) return;
      input.placeholder = `Use standard price (${getCurrency()})`;
      input.dataset.currencyBound = 'true';
      if (!input.dataset.usdValue && input.value !== '') {
        input.dataset.usdValue = String(displayToUsd(input.value));
      }
    });
  }

  function enhanceProcedures(card) {
    card.querySelectorAll('.selected-procedure').forEach(row => {
      const input = row.querySelector('.procedure-final-price');
      const choice = row.querySelector('.procedure-choice');
      if (!input || !choice) return;

      input.closest('.procedure-manual-price')?.querySelector('label')?.replaceChildren(
        document.createTextNode(`Final price${choice.dataset.unit ? ` / ${choice.dataset.unit}` : ''} (${getCurrency()})`)
      );
      input.placeholder = `Use standard price (${getCurrency()})`;

      if (!input.dataset.usdValue && input.value !== '') {
        const oldValue = Number(input.value);
        if (Number.isFinite(oldValue)) input.dataset.usdValue = String(displayToUsd(oldValue));
      }

      if (input.dataset.finalCurrencyBound !== 'true') {
        input.dataset.finalCurrencyBound = 'true';
        input.addEventListener('input', () => {
          const value = Number(input.value);
          if (Number.isFinite(value) && value >= 0) {
            input.dataset.usdValue = String(displayToUsd(value));
            choice.dataset.finalPrice = input.dataset.usdValue;
          } else {
            input.dataset.usdValue = '';
            delete choice.dataset.finalPrice;
          }
          window.recalculateQuotation?.();
        });
      }

      if (input.dataset.usdValue !== '') {
        choice.dataset.finalPrice = input.dataset.usdValue;
      }
    });
  }

  function enhanceCard(card) {
    if (!card) return;

    // Hotels are standard/fixed. Remove the old manual hotel controls.
    removeLegacyManualField(card, [
      '.one-visit-hotel-price',
      '.visit1-hotel-price',
      '.visit2-hotel-price'
    ]);

    // VIP transfer is fixed at $150. Remove the old manual transfer controls.
    removeLegacyManualField(card, [
      '.transfer-price',
      '.visit1-transfer-price',
      '.visit2-transfer-price'
    ]);
    normalizeTransfer(card);

    // The old global final-price override is intentionally removed. Pricing is
    // controlled only at the permitted product/service level.
    card.querySelector('.manual-final-price')?.remove();

    // Dental prosthesis remains coordinator-overridable.
    const services = card.querySelector('.visit-services');
    const prosthesisSelect = card.querySelector('.prosthesis-option');
    if (services && prosthesisSelect) {
      let field = card.querySelector('.prosthesis-final-price');
      if (!field) {
        field = makeManualField(
          services,
          '.prosthesis-final-price',
          `Dental prosthesis final price (${getCurrency()})`,
          'Leave empty to use the selected standard prosthesis price.'
        );
      }
      field.placeholder = `Use standard price (${getCurrency()})`;
      if (field.dataset.usdValue === undefined && field.value !== '') {
        field.dataset.usdValue = String(displayToUsd(field.value));
      }
    }

    enhanceProductFields(card);
    enhanceProcedures(card);
  }

  function refreshCurrencyFields() {
    document.querySelectorAll('.quotation-option').forEach(card => {
      normalizeTransfer(card);
      normalizeProductLabels(card);

      card.querySelectorAll('.implant-final-price, .crown-final-price, .prosthesis-final-price, .procedure-final-price').forEach(input => {
        const usd = getManualUsd(input);
        if (usd != null) setFieldDisplay(input, usd);
        input.placeholder = `Use standard price (${getCurrency()})`;
      });

      enhanceProcedures(card);
    });
  }

  const previousCalculateOption = window.calculateOption;

  function applyExactOverrides(card, result) {
    if (!result) return result;

    const implantInput = card.querySelector('.implant-final-price');
    const crownInput = card.querySelector('.crown-final-price');
    const prosthesisInput = card.querySelector('.prosthesis-final-price');

    const implantUsd = getManualUsd(implantInput);
    const crownUsd = getManualUsd(crownInput);
    const prosthesisUsd = getManualUsd(prosthesisInput);

    // Rebuild dental totals from exact manual product prices.
    if (implantUsd != null) {
      const old = Number(result.implantUnitPrice) || 0;
      const unit = roundCurrency(implantUsd);
      result.implantUnitPrice = unit;
      result.visit1Dental = roundCurrency(result.visit1Dental - (result.totalImplants * old) + (result.totalImplants * unit));
    }

    if (crownUsd != null) {
      const old = Number(result.crownUnitPrice) || 0;
      const unit = roundCurrency(crownUsd);
      result.crownUnitPrice = unit;
      result.visit1CrownTotal = roundCurrency(result.visit1Crowns * unit);
      result.visit2CrownTotal = roundCurrency(result.visit2Crowns * unit);
      result.visit1Dental = roundCurrency(result.visit1Dental - (result.visit1Crowns * old) + result.visit1CrownTotal);
      result.visit2Dental = roundCurrency(result.visit2Dental - (result.visit2Crowns * old) + result.visit2CrownTotal);
    }

    // Procedures are stored as USD in data-price/finalPrice. The visible input
    // is in the selected currency.
    card.querySelectorAll('.selected-procedure').forEach(row => {
      const choice = row.querySelector('.procedure-choice');
      const input = row.querySelector('.procedure-final-price');
      if (choice && input) {
        const usd = getManualUsd(input);
        if (usd != null) choice.dataset.finalPrice = String(roundCurrency(usd));
        else delete choice.dataset.finalPrice;
      }
    });

    // Dental prosthesis is a service, while hotel and transfer remain standard.
    if (prosthesisUsd != null) {
      result.visit1Prosthesis = roundCurrency(prosthesisUsd);
    }

    // Transfer is always $150 internally.
    result.visit1Transfer = FIXED_TRANSFER_USD;
    if (result.visits === 2) result.visit2Transfer = 0;

    result.visit1Services = roundCurrency(
      (result.visit1Hotel || 0) +
      (result.visit1Transfer || 0) +
      (result.visit1Prosthesis || 0)
    );
    result.visit2Services = roundCurrency(
      (result.visit2Hotel || 0) +
      (result.visit2Transfer || 0) +
      (result.visit2Prosthesis || 0)
    );
    result.visit1Total = roundCurrency(result.visit1Dental + result.visit1Services);
    result.visit2Total = roundCurrency(result.visit2Dental + result.visit2Services);
    result.subtotal = roundCurrency(result.visit1Total + result.visit2Total);

    return result;
  }

  window.calculateOption = function (card) {
    enhanceCard(card);

    if (typeof previousCalculateOption !== 'function') return null;

    const result = previousCalculateOption(card);
    const final = applyExactOverrides(card, result);

    const subtotal = card.querySelector('.option-subtotal');
    if (subtotal && final) subtotal.textContent = money(final.subtotal);

    return final;
  };

  // Keep quotation data consistent with the exact manual values and prevent
  // hotels from being marked as manually overridden.
  const previousBuildQuotationData = window.buildQuotationData;
  window.buildQuotationData = function () {
    const data = typeof previousBuildQuotationData === 'function'
      ? previousBuildQuotationData()
      : null;
    if (!data) return data;

    data.options?.forEach((option, index) => {
      const card = document.querySelectorAll('.quotation-option')[index];
      if (!card) return;

      option.treatment ||= {};
      option.treatment.implants ||= {};
      option.treatment.crowns ||= {};

      const implantUsd = getManualUsd(card.querySelector('.implant-final-price'));
      const crownUsd = getManualUsd(card.querySelector('.crown-final-price'));
      const prosthesisUsd = getManualUsd(card.querySelector('.prosthesis-final-price'));

      if (implantUsd != null) {
        option.treatment.implants.manualUnitPrice = roundCurrency(implantUsd);
        option.treatment.implants.finalUnitPrice = roundCurrency(implantUsd);
        option.treatment.implants.total = roundCurrency(option.treatment.implants.quantity * implantUsd);
      }

      if (crownUsd != null) {
        option.treatment.crowns.manualUnitPrice = roundCurrency(crownUsd);
        option.treatment.crowns.finalUnitPrice = roundCurrency(crownUsd);
        option.treatment.crowns.total = roundCurrency(option.treatment.crowns.quantity * crownUsd);
      }

      option.treatment.procedures?.forEach(proc => {
        const input = card.querySelector(`.procedure-final-price`);
        if (input) {
          const usd = getManualUsd(input);
          if (usd != null) {
            proc.manualUnitPrice = roundCurrency(usd);
            proc.unitPrice = roundCurrency(usd);
            proc.total = roundCurrency(usd * (Number(proc.quantity) || 1));
          }
        }
      });

      if (prosthesisUsd != null) {
        option.visits?.visit1?.services && (option.visits.visit1.services.prosthesis.total = roundCurrency(prosthesisUsd));
      }

      // Explicitly mark hotels as standard pricing; no coordinator hotel override.
      [option.visits?.visit1?.hotel, option.visits?.visit2?.hotel].forEach(hotel => {
        if (hotel) hotel.manualNightlyPrice = null;
      });

      if (option.visits?.visit1?.services?.transfer) {
        option.visits.visit1.services.transfer.total = FIXED_TRANSFER_USD;
      }

      option.displayCurrency = getCurrency();
      option.displayRate = getRate();
    });

    return data;
  };

  function patchCoordinatorCurrencyControl() {
    const currency = document.getElementById('quoteCurrency');
    if (!currency || currency.dataset.finalPricingBound === 'true') return;
    currency.dataset.finalPricingBound = 'true';

    currency.addEventListener('change', () => {
      // Existing values are stored as USD in data-usd-value; only the display changes.
      setTimeout(refreshCurrencyFields, 0);
    });

    document.getElementById('eurRate')?.addEventListener('input', () => {
      setTimeout(refreshCurrencyFields, 0);
    });
  }

  function init() {
    document.querySelectorAll('.quotation-option').forEach(enhanceCard);
    patchCoordinatorCurrencyControl();
    refreshCurrencyFields();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 0);
  });
})();
