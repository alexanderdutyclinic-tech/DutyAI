/* DutyAI coordinator UI extensions.
   Keeps the existing treatment/pricing engine intact and adds coordinator-only display controls. */
(function () {
  const CURRENCIES = {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 1 / 1.1567 }
  };

  let selectedCurrency = 'USD';
  let eurRate = CURRENCIES.EUR.rate;
  let showProductPrices = true;
  let showHotelPrices = true;

  const originalCalculateOption = window.calculateOption;
  const originalBuildQuotationData = window.buildQuotationData;
  const originalPremiumTreatmentRows = window.premiumTreatmentRows;
  const originalPremiumVisitCard = window.premiumVisitCard;
  const originalAddQuotationOption = window.addQuotationOption;

  function currencyRate() {
    return selectedCurrency === 'EUR' ? (Number(eurRate) || CURRENCIES.EUR.rate) : 1;
  }

  function formatMoney(value) {
    const amount = (Number(value) || 0) * currencyRate();
    const cfg = CURRENCIES[selectedCurrency];
    return `${cfg.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  }

  function displayToUsd(value) {
    const rate = currencyRate();
    return rate > 0 ? (Number(value) || 0) / rate : 0;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  }

  function procedureSource() {
    const base = Array.isArray(window.DUTY_PRICING?.procedures) ? window.DUTY_PRICING.procedures : [];
    const required = [
      { id: 'general-anesthesia', name: 'General Anesthesia', price: 1500 },
      { id: 'hiv-protocol', name: 'HIV Protocol for a patient with HIV', price: 1500 }
    ];
    required.forEach(item => {
      if (!base.some(p => p.id === item.id)) base.push(item);
    });
    return base;
  }

  function updatePriceLabels() {
    document.querySelectorAll('.quotation-option').forEach(card => {
      const implantSelect = card.querySelector('.implant-brand');
      if (implantSelect) {
        [...implantSelect.options].forEach(option => {
          if (!option.value) return;
          const item = window.DUTY_PRICING.implants.find(p => p.id === option.value);
          if (item) option.textContent = `${item.displayName || item.name} — ${formatMoney(item.price)}`;
        });
      }

      const procedureSelects = card.querySelectorAll('.procedure-select');
      procedureSelects.forEach(select => {
        [...select.options].forEach(option => {
          if (!option.value) return;
          const item = procedureSource().find(p => p.id === option.value);
          if (item) option.textContent = `${item.name} — ${formatMoney(item.price)}${item.unit ? ` / ${item.unit}` : ''}`;
        });
      });

      card.querySelectorAll('.selected-procedure').forEach(row => {
        const choice = row.querySelector('.procedure-choice');
        const item = choice && procedureSource().find(p => p.id === choice.value);
        const label = row.querySelector('.check-item');
        if (item && label) {
          const remove = label.querySelector('.remove-procedure');
          label.childNodes.forEach(node => { if (node.nodeType === Node.TEXT_NODE) node.remove(); });
          const priceText = document.createTextNode(` ${item.name} — ${formatMoney(item.price)}${item.unit ? ` / ${item.unit}` : ''} `);
          label.insertBefore(priceText, remove);
        }
      });

      const crownSelect = card.querySelector('.crown-brand');
      if (crownSelect) {
        [...crownSelect.options].forEach(option => {
          if (!option.value) return;
          const item = window.DUTY_PRICING.crowns.find(p => p.id === option.value);
          if (item) option.textContent = `${item.displayName || item.name} — ${formatMoney(item.price)}`;
        });
      }

      const transfer = card.querySelector('.transfer-option');
      if (transfer) {
        [...transfer.options].forEach(option => {
          const value = Number(option.value) || 0;
          option.textContent = value ? formatMoney(value) : 'Free';
        });
      }

      const prosthesis = card.querySelector('.prosthesis-option');
      if (prosthesis) {
        [...prosthesis.options].forEach(option => {
          const value = Number(option.value) || 0;
          option.textContent = value ? formatMoney(value) : 'Not offered';
        });
      }
    });
  }

  function addControls() {
    const toolbar = document.querySelector('.option-toolbar');
    if (!toolbar || document.getElementById('quoteCurrency')) return;

    const currencyWrap = document.createElement('div');
    currencyWrap.className = 'coordinator-control';
    currencyWrap.innerHTML = `
      <label for="quoteCurrency">Display currency</label>
      <select id="quoteCurrency">
        <option value="USD">USD — US Dollar</option>
        <option value="EUR">EUR — Euro</option>
      </select>
      <div id="eurRateWrap" class="eur-rate-wrap hidden">
        <label for="eurRate">1 USD = EUR</label>
        <input id="eurRate" type="number" min="0.0001" step="0.0001" value="${eurRate.toFixed(4)}">
        <small>Reference rate; coordinator can adjust it before issuing the quotation.</small>
      </div>
    `;
    toolbar.appendChild(currencyWrap);

    const visibility = document.createElement('div');
    visibility.className = 'coordinator-visibility';
    visibility.innerHTML = `
      <strong>Patient PDF price details</strong>
      <label class="inline-check"><input type="checkbox" id="showProductPrices" checked> Show product / treatment price details</label>
      <label class="inline-check"><input type="checkbox" id="showHotelPrices" checked> Show hotel price details</label>
    `;
    toolbar.parentNode.insertBefore(visibility, document.getElementById('quotationOptions'));

    document.getElementById('quoteCurrency').addEventListener('change', e => {
      selectedCurrency = e.target.value;
      document.getElementById('eurRateWrap').classList.toggle('hidden', selectedCurrency !== 'EUR');
      updatePriceLabels();
      if (typeof window.recalculateQuotation === 'function') window.recalculateQuotation();
    });

    document.getElementById('eurRate').addEventListener('input', e => {
      eurRate = Number(e.target.value) || 0;
      updatePriceLabels();
      if (typeof window.recalculateQuotation === 'function') window.recalculateQuotation();
    });

    document.getElementById('showProductPrices').addEventListener('change', e => {
      showProductPrices = e.target.checked;
    });
    document.getElementById('showHotelPrices').addEventListener('change', e => {
      showHotelPrices = e.target.checked;
    });
  }

  function enhanceProcedureDropdown(card) {
    const list = card.querySelector('.procedure-list');
    if (!list || list.dataset.enhanced === 'true') return;
    list.dataset.enhanced = 'true';

    const procedures = procedureSource();
    list.innerHTML = `
      <div class="procedure-picker">
        <select class="procedure-select">
          <option value="">Select additional procedure</option>
          ${procedures.map(item => `<option value="${esc(item.id)}">${esc(item.name)} — ${formatMoney(item.price)}${item.unit ? ` / ${esc(item.unit)}` : ''}</option>`).join('')}
        </select>
        <button type="button" class="secondary add-procedure">+ Add</button>
      </div>
      <div class="selected-procedures"></div>
    `;

    const select = list.querySelector('.procedure-select');
    const add = list.querySelector('.add-procedure');
    const selected = list.querySelector('.selected-procedures');

    function renderSelected() {
      selected.querySelectorAll('.procedure-choice').forEach(choice => {
        const qtyBox = choice.closest('.procedure-item')?.querySelector('.procedure-quantity');
        if (qtyBox) qtyBox.classList.toggle('hidden', !choice.checked);
      });
      if (typeof window.recalculateQuotation === 'function') window.recalculateQuotation();
    }

    add.addEventListener('click', () => {
      const id = select.value;
      if (!id || selected.querySelector(`.procedure-choice[value="${CSS.escape(id)}"]`)) return;
      const item = procedures.find(p => p.id === id);
      if (!item) return;
      const unit = item.unit || '';
      const row = document.createElement('div');
      row.className = 'procedure-item selected-procedure';
      row.innerHTML = `
        <label class="check-item">
          <input type="checkbox" class="procedure-choice" data-price="${item.price}" data-unit="${esc(unit)}" value="${esc(item.id)}" checked>
          ${esc(item.name)} — ${formatMoney(item.price)}${unit ? ` / ${unit}` : ''}
          <button type="button" class="remove-procedure" aria-label="Remove">Remove</button>
        </label>
        ${unit ? `<div class="procedure-quantity"><label>Quantity (${esc(unit)})</label><input type="number" class="procedure-quantity-input" data-procedure-id="${esc(item.id)}" min="0" step="0.5" value="1"></div>` : ''}
      `;
      selected.appendChild(row);
      row.querySelector('.procedure-choice').addEventListener('change', renderSelected);
      row.querySelector('.procedure-quantity-input')?.addEventListener('input', () => window.recalculateQuotation());
      row.querySelector('.remove-procedure').addEventListener('click', () => { row.remove(); window.recalculateQuotation(); });
      select.value = '';
      renderSelected();
    });
  }

  function addManualPriceControl(card) {
    if (card.querySelector('.manual-final-price')) return;
    const total = card.querySelector('.option-total');
    if (!total) return;
    const block = document.createElement('div');
    block.className = 'manual-final-price';
    block.innerHTML = `
      <label>Final price — manual override</label>
      <input class="manual-final-price-input" type="number" min="0" step="1" placeholder="Auto-calculated">
      <small>Leave empty to use the calculated total. Enter the final patient-facing price in the selected currency.</small>
    `;
    total.parentNode.insertBefore(block, total);
    block.querySelector('input').addEventListener('input', () => window.recalculateQuotation());
  }

  function enhanceCard(card) {
    if (!card) return;
    enhanceProcedureDropdown(card);
    addManualPriceControl(card);
    updatePriceLabels();
  }

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

  window.money = formatMoney;

  window.calculateOption = function (card) {
    const result = originalCalculateOption(card);
    const manual = Number(card.querySelector('.manual-final-price-input')?.value);
    if (Number.isFinite(manual) && manual > 0) {
      const targetUsd = displayToUsd(manual);
      const base = Number(result.subtotal) || 0;
      if (base > 0) {
        const ratio = targetUsd / base;
        result.visit1Total *= ratio;
        result.visit2Total *= ratio;
        result.visit1Dental *= ratio;
        result.visit2Dental *= ratio;
        result.visit1Services *= ratio;
        result.visit2Services *= ratio;
        result.subtotal = targetUsd;
      } else {
        result.subtotal = targetUsd;
        result.visit1Total = targetUsd;
        result.visit2Total = 0;
      }
    }
    const subtotalElement = card.querySelector('.option-subtotal');
    if (subtotalElement) subtotalElement.textContent = formatMoney(result.subtotal);
    return result;
  };

  window.buildQuotationData = function () {
    const data = originalBuildQuotationData();
    data.display = {
      currency: selectedCurrency,
      usdToCurrencyRate: currencyRate(),
      showProductPrices,
      showHotelPrices
    };
    data.options = (data.options || []).map((option, index) => {
      const card = document.querySelectorAll('.quotation-option')[index];
      const manual = Number(card?.querySelector('.manual-final-price-input')?.value);
      if (Number.isFinite(manual) && manual > 0) option.manualFinalPrice = manual;
      option.displayCurrency = selectedCurrency;
      return option;
    });
    return data;
  };

  function installPdfCurrency() {
    window.premiumMoney = function (value) { return formatMoney(value); };
    window.pdfMoney = function (value) { return formatMoney(value); };

    if (typeof originalPremiumTreatmentRows === 'function') {
      window.premiumTreatmentRows = function (option) {
        let html = originalPremiumTreatmentRows(option);
        if (!showProductPrices) {
          const holder = document.createElement('div');
          holder.innerHTML = html;
          holder.querySelectorAll('.treatment-row').forEach(row => row.lastElementChild?.remove());
          html = holder.innerHTML;
        }
        return html;
      };
    }

    if (typeof originalPremiumVisitCard === 'function') {
      window.premiumVisitCard = function (visit, label) {
        let html = originalPremiumVisitCard(visit, label);
        if (!showHotelPrices) {
          const holder = document.createElement('div');
          holder.innerHTML = html;
          holder.querySelectorAll('.visit-line > strong').forEach(el => el.remove());
          html = holder.innerHTML;
        }
        return html;
      };
    }
  }

  function installPdfVisibilityCss() {
    const originalOpen = window.open;
    if (!originalOpen || originalOpen.__dutyAiPatched) return;
    function patchedOpen(...args) {
      const win = originalOpen.apply(window, args);
      if (win) {
        const inject = () => {
          try {
            const style = win.document.createElement('style');
            style.textContent = `
              ${showProductPrices ? '' : '.treatment-row > strong:last-child, .treatment-table .total, .unit-price, .price-column { display:none !important; }'}
              ${showHotelPrices ? '' : '.visit-line > strong:last-child, .hotel-price, .per-night { display:none !important; }'}
            `;
            win.document.head.appendChild(style);
          } catch (_) {}
        };
        try { win.addEventListener('load', inject); } catch (_) {}
        setTimeout(inject, 250);
      }
      return win;
    }
    patchedOpen.__dutyAiPatched = true;
    window.open = patchedOpen;
  }

  document.addEventListener('DOMContentLoaded', () => {
    procedureSource();
    addControls();
    document.querySelectorAll('.quotation-option').forEach(enhanceCard);
    installPdfCurrency();
    installPdfVisibilityCss();
  });
})();

/* DutyAI PDF control fix.
   The Premium renderer calls its internal functions directly, so changing only
   window.premiumTreatmentRows/window.premiumVisitCard is not enough. This
   wrapper calls the public HTML generator after coordinator state is captured,
   then prints the resulting document. */
(function () {
  function moneyInCurrency(value, currency, rate) {
    const amount = (Number(value) || 0) * (Number(rate) || 1);
    const symbol = currency === 'EUR' ? '€' : '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  }

  const originalPremiumPdf = window.generatePremiumQuotationPdf;

  window.generatePremiumQuotationPdf = function () {
    if (typeof window.buildQuotationData !== 'function' || typeof window.generatePremiumQuotationHtml !== 'function') {
      if (typeof originalPremiumPdf === 'function') return originalPremiumPdf();
      alert('Premium Proposal is not available. Please refresh the page.');
      return;
    }

    const quotation = window.buildQuotationData();
    let html = window.generatePremiumQuotationHtml(quotation);
    const currency = quotation.display?.currency || 'USD';
    const rate = Number(quotation.display?.usdToCurrencyRate) || 1;
    const showProducts = quotation.display?.showProductPrices !== false;
    const showHotels = quotation.display?.showHotelPrices !== false;

    if (currency === 'EUR') {
      html = html.replace(/\$([\d,]+(?:\.\d+)?)/g, (_, value) =>
        moneyInCurrency(value.replace(/,/g, ''), currency, rate)
      );
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!showProducts) {
      doc.querySelectorAll('.treatment-row').forEach(row => {
        const cells = row.children;
        if (cells.length >= 3) {
          cells[cells.length - 1].textContent = 'Included';
        }
      });
    }

    if (!showHotels) {
      doc.querySelectorAll('.visit-line').forEach(row => {
        const price = row.querySelector(':scope > strong:last-child');
        if (price) price.textContent = 'Included';
      });
    }

    html = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Please allow pop-ups for DutyAI to generate the Premium Proposal.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    const printWhenReady = () => {
      const images = Array.from(printWindow.document.images || []);
      const waits = images.map(image => {
        if (image.complete) return Promise.resolve();
        return new Promise(resolve => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      });
      Promise.all(waits).then(() => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 250);
      });
    };

    if (printWindow.document.readyState === 'complete') {
      printWhenReady();
    } else {
      printWindow.addEventListener('load', printWhenReady, { once: true });
    }
  };
})();
