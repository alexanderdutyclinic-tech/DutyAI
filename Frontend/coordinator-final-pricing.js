/* DutyAI coordinator pricing controls.
   Manual overrides: implants, crowns, additional procedures, VIP transfer, final quotation, Visit 1, Visit 2.
   Fixed: dental prosthesis $200 once when selected; hotels always standard clinic pricing; translator included.
   Manual values are entered in selected currency and stored internally as USD.
*/
(function () {
  const CURRENCIES={USD:{symbol:'$',rate:1},EUR:{symbol:'€',rate:1/1.1567}};
  const TRANSFER_USD=150, PROSTHESIS_USD=200;
  const currency=()=>document.getElementById('quoteCurrency')?.value||'USD';
  const rate=()=>currency()==='EUR'?(Number(document.getElementById('eurRate')?.value)>0?Number(document.getElementById('eurRate').value):CURRENCIES.EUR.rate):1;
  const round=v=>Math.round((Number(v)+Number.EPSILON)*100)/100;
  const toDisplay=usd=>round(Number(usd||0)*rate());
  const toUsd=value=>round(Number(value||0)/rate());
  const money=usd=>{const a=toDisplay(usd),s=CURRENCIES[currency()]?.symbol||'$';return `${s}${a.toLocaleString('en-US',{minimumFractionDigits:a%1?2:0,maximumFractionDigits:2})}`;};
  window.money=money;window.pdfMoney=money;window.premiumMoney=money;window.roundCurrency=round;

  function manualUsd(input){
    if(!input||input.value==='')return null;
    const stored=Number(input.dataset.usdValue);
    if(Number.isFinite(stored)&&stored>=0)return round(stored);
    const v=Number(input.value);return Number.isFinite(v)&&v>=0?toUsd(v):null;
  }
  function bind(input){
    if(!input||input.dataset.bound==='1')return;
    input.dataset.bound='1';
    input.addEventListener('input',()=>{input.dataset.usdValue=input.value===''?'':String(toUsd(input.value));window.recalculateQuotation?.();});
    input.addEventListener('change',()=>window.recalculateQuotation?.());
  }
  function addField(parent,cls,label,help){
    if(!parent)return null;
    const old=parent.querySelector('.'+cls);if(old)return old;
    const w=document.createElement('div');w.className='duty-manual-field';
    w.innerHTML=`<label>${label}</label><input class="${cls}" type="number" min="0" step="0.01" placeholder="Use standard price (${currency()})"><small>${help||''}</small>`;
    parent.appendChild(w);const input=w.querySelector('input');bind(input);return input;
  }
  function convertFields(card){
    card.querySelectorAll('.implant-final-price,.crown-final-price,.procedure-final-price,.transfer-final-price,.final-quotation-price,.visit1-final-price,.visit2-final-price').forEach(i=>{const u=manualUsd(i);if(u!=null)i.value=String(toDisplay(u));i.placeholder=`Use standard price (${currency()})`;});
    card.querySelectorAll('.duty-manual-field label').forEach(l=>{
      const row=l.closest('.procedure-item'),unit=row?.querySelector('.procedure-choice')?.dataset.unit||'';
      if(row)l.textContent=`Final price${unit?` / ${unit}`:''} (${currency()})`;
    });
    card.querySelector('.implant-final-price')?.closest('.duty-manual-field')?.querySelector('label')&&(card.querySelector('.implant-final-price').closest('.duty-manual-field').querySelector('label').textContent=`Implant final unit price (${currency()})`);
    card.querySelector('.crown-final-price')?.closest('.duty-manual-field')?.querySelector('label')&&(card.querySelector('.crown-final-price').closest('.duty-manual-field').querySelector('label').textContent=`Crown final unit price (${currency()})`);
    card.querySelector('.transfer-final-price')?.closest('.duty-manual-field')?.querySelector('label')&&(card.querySelector('.transfer-final-price').closest('.duty-manual-field').querySelector('label').textContent=`VIP transfer final price (${currency()})`);
    card.querySelector('.final-quotation-price')?.closest('.duty-visit-pricing')?.querySelector('label')&&(card.querySelector('.final-quotation-price').closest('.duty-visit-pricing').querySelectorAll('label')[0].textContent=`Final quotation price (${currency()})`);
    card.querySelector('.visit1-final-price')?.closest('.duty-visit-pricing')?.querySelectorAll('label')[1]&&(card.querySelector('.visit1-final-price').closest('.duty-visit-pricing').querySelectorAll('label')[1].textContent=`Visit 1 final price (${currency()})`);
    card.querySelector('.visit2-final-price')?.closest('.duty-visit-pricing')?.querySelectorAll('label')[2]&&(card.querySelector('.visit2-final-price').closest('.duty-visit-pricing').querySelectorAll('label')[2].textContent=`Visit 2 final price (${currency()})`);
  }

  function addToolbar(){
    const toolbar=document.querySelector('.option-toolbar');if(!toolbar||document.getElementById('quoteCurrency'))return;
    const w=document.createElement('div');w.innerHTML=`<label>Display currency</label><select id="quoteCurrency"><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option></select><div id="eurRateWrap" class="hidden"><label>1 USD = EUR</label><input id="eurRate" type="number" min="0.0001" step="0.0001" value="${CURRENCIES.EUR.rate.toFixed(4)}"><small>Coordinator-controlled reference rate.</small></div>`;toolbar.appendChild(w);
    document.getElementById('quoteCurrency').addEventListener('change',()=>{document.getElementById('eurRateWrap').classList.toggle('hidden',currency()!=='EUR');document.querySelectorAll('.quotation-option').forEach(convertFields);window.recalculateQuotation?.();});
    document.getElementById('eurRate').addEventListener('input',()=>{document.querySelectorAll('.quotation-option').forEach(convertFields);window.recalculateQuotation?.();});
  }
  function addVisibility(){
    if(document.getElementById('showProductPrices'))return;const anchor=document.getElementById('quotationOptions');if(!anchor)return;
    const b=document.createElement('div');b.className='coordinator-visibility';b.innerHTML='<strong>Patient PDF price details</strong><label><input type="checkbox" id="showProductPrices" checked> Show product / treatment price details</label><label><input type="checkbox" id="showHotelPrices" checked> Show hotel price details</label>';anchor.parentNode.insertBefore(b,anchor);
  }
  function enhanceProducts(card){
    card.querySelectorAll('.implant-markup,.crown-markup').forEach(i=>{i.closest('.percentage-input')?.classList.add('hidden');i.closest('.percentage-input')?.previousElementSibling?.classList.add('hidden');});
    const is=card.querySelector('.implant-brand'),cs=card.querySelector('.crown-brand');
    if(is)addField(is.parentElement,'implant-final-price',`Implant final unit price (${currency()})`,'Leave empty to use the standard implant price.');
    if(cs)addField(cs.parentElement,'crown-final-price',`Crown final unit price (${currency()})`,'Leave empty to use the standard crown price.');
  }
  function enhanceProcedures(card){
    card.querySelectorAll('.procedure-item').forEach(row=>{const c=row.querySelector('.procedure-choice');if(!c)return;const input=addField(row,'procedure-final-price',`Final price${c.dataset.unit?` / ${c.dataset.unit}`:''} (${currency()})`,'Leave empty to use the standard procedure price.');if(!input)return;input.closest('.duty-manual-field').classList.toggle('hidden',!c.checked);if(c.dataset.dutyBound!=='1'){c.dataset.dutyBound='1';c.addEventListener('change',()=>{input.closest('.duty-manual-field').classList.toggle('hidden',!c.checked);window.recalculateQuotation?.();});}});
  }
  function enhanceServices(card){
    const t=card.querySelector('.transfer-option');
    if(t){t.disabled=false;t.innerHTML=`<option value="0">Free</option><option value="${TRANSFER_USD}">${money(TRANSFER_USD)}</option>`;if(![...t.options].some(o=>o.value===t.value))t.value=String(TRANSFER_USD);addField(t.parentElement,'transfer-final-price',`VIP transfer final price (${currency()})`,'Leave empty to use Free or the standard $150 transfer.');}
    const p=card.querySelector('.prosthesis-option');
    if(p){p.disabled=true;p.innerHTML=`<option value="${PROSTHESIS_USD}">${money(PROSTHESIS_USD)}</option>`;p.value=String(PROSTHESIS_USD);}
  }
  function enhanceVisits(card){
    if(card.querySelector('.duty-visit-pricing'))return;const total=card.querySelector('.option-total');if(!total)return;
    const b=document.createElement('div');b.className='duty-visit-pricing';b.innerHTML=`<h4>Coordinator final pricing</h4><label>Final quotation price (${currency()})</label><input class="final-quotation-price" type="number" min="0" step="0.01" placeholder="Use automatic total (${currency()})"><small>Optional master total. Visit prices will be allocated from this total.</small><label>Visit 1 final price (${currency()})</label><input class="visit1-final-price" type="number" min="0" step="0.01" placeholder="Use automatic Visit 1 (${currency()})"><small>If entered, Visit 2 becomes the remaining amount.</small><label>Visit 2 final price (${currency()})</label><input class="visit2-final-price" type="number" min="0" step="0.01" placeholder="Use automatic Visit 2 (${currency()})"><small>If entered, Visit 1 becomes the remaining amount.</small><div class="duty-visit-pricing-status"></div>`;total.parentNode.insertBefore(b,total);b.querySelectorAll('input').forEach(bind);
  }
  function enhance(card){enhanceProducts(card);enhanceProcedures(card);enhanceServices(card);enhanceVisits(card);convertFields(card);}

  const originalCalculateOption=window.calculateOption;
  window.calculateOption=function(card){
    enhance(card);const r=originalCalculateOption(card);if(!r)return r;
    let baseProc=0,finalProc=0;
    card.querySelectorAll('.procedure-choice:checked').forEach(c=>{const base=Number(c.dataset.price)||0,unit=c.dataset.unit||'';const q=unit?Math.max(0,Number(card.querySelector(`.procedure-quantity-input[data-procedure-id="${CSS.escape(c.value)}"]`)?.value||1)):1;const m=manualUsd(c.closest('.procedure-item')?.querySelector('.procedure-final-price'));baseProc+=base*q;finalProc+=(m==null?base:m)*q;if(m!=null)c.dataset.finalPrice=String(m);else delete c.dataset.finalPrice;});
    r.visit1Dental=round(r.visit1Dental-baseProc+finalProc);
    const im=manualUsd(card.querySelector('.implant-final-price')),cr=manualUsd(card.querySelector('.crown-final-price'));
    if(im!=null){const old=Number(r.implantUnitPrice)||0;r.implantUnitPrice=im;r.visit1Dental=round(r.visit1Dental-r.totalImplants*old+r.totalImplants*im);}
    if(cr!=null){const old=Number(r.crownUnitPrice)||0;r.crownUnitPrice=cr;r.visit1CrownTotal=round(r.visit1Crowns*cr);r.visit2CrownTotal=round(r.visit2Crowns*cr);r.visit1Dental=round(r.visit1Dental-r.visit1Crowns*old+r.visit1CrownTotal);r.visit2Dental=round(r.visit2Dental-r.visit2Crowns*old+r.visit2CrownTotal);}
    const transferManual=manualUsd(card.querySelector('.transfer-final-price'));const selectedTransfer=Number(card.querySelector('.transfer-option')?.value||0);r.visit1Transfer=transferManual==null?selectedTransfer:transferManual;r.visit2Transfer=0;r.visit1Prosthesis=PROSTHESIS_USD;r.visit2Prosthesis=0;
    r.visit1Services=round((r.visit1Hotel||0)+r.visit1Transfer+r.visit1Prosthesis);r.visit2Services=round((r.visit2Hotel||0)+r.visit2Transfer+r.visit2Prosthesis);r.visit1Total=round(r.visit1Dental+r.visit1Services);r.visit2Total=round(r.visit2Dental+r.visit2Services);
    const autoTotal=round(r.visit1Total+r.visit2Total);const fi=manualUsd(card.querySelector('.final-quotation-price')),v1i=manualUsd(card.querySelector('.visit1-final-price')),v2i=manualUsd(card.querySelector('.visit2-final-price'));const target=fi==null?autoTotal:fi;let v1=r.visit1Total,v2=r.visit2Total;const status=card.querySelector('.duty-visit-pricing-status');
    if(v1i!=null&&v2i==null){v1=v1i;v2=round(target-v1);}else if(v2i!=null&&v1i==null){v2=v2i;v1=round(target-v2);}else if(v1i!=null&&v2i!=null){v1=v1i;v2=v2i;}else{v1=r.visit1Total;v2=round(target-v1);}
    if(v2<0){v2=0;v1=target;if(status)status.textContent='Warning: the selected total is below the selected Visit 1 price.';}else if(status)status.textContent=`Final: ${money(target)} • Visit 1: ${money(v1)} • Visit 2: ${money(v2)}`;
    r.visit1Total=round(v1);r.visit2Total=round(v2);r.subtotal=(v1i!=null&&v2i!=null)?round(v1+v2):round(target);
    card.querySelector('.option-subtotal')?.replaceChildren(document.createTextNode(money(r.subtotal)));return r;
  };

  const originalBuildQuotationData=window.buildQuotationData;
  window.buildQuotationData=function(){const data=originalBuildQuotationData?.();if(!data)return data;data.display||={};data.display.currency=currency();data.display.usdToCurrencyRate=rate();data.options?.forEach((o,i)=>{const c=document.querySelectorAll('.quotation-option')[i];if(!c)return;o.coordinatorPricing={finalQuotationPriceUsd:manualUsd(c.querySelector('.final-quotation-price')),visit1FinalPriceUsd:manualUsd(c.querySelector('.visit1-final-price')),visit2FinalPriceUsd:manualUsd(c.querySelector('.visit2-final-price')),transferManualUsd:manualUsd(c.querySelector('.transfer-final-price'))};o.displayCurrency=currency();if(o.visits?.visit1)o.visits.visit1.total=calculateOption(c).visit1Total;if(o.visits?.visit2)o.visits.visit2.total=calculateOption(c).visit2Total;if(o.totals)o.totals.total=calculateOption(c).subtotal;[o.visits?.visit1?.hotel,o.visits?.visit2?.hotel].forEach(h=>{if(h)h.manualNightlyPrice=null;});if(o.visits?.visit1?.services?.prosthesis)o.visits.visit1.services.prosthesis.total=PROSTHESIS_USD;});return data;};

  function init(){addToolbar();addVisibility();document.querySelectorAll('.quotation-option').forEach(enhance);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  new MutationObserver(()=>document.querySelectorAll('.quotation-option').forEach(enhance)).observe(document.body,{childList:true,subtree:true});
})();