const $ = (id) => document.getElementById(id);

const steps = [$('step1'), $('step2'), $('step3'), $('step4')];
const stepNumber = $('stepNumber');
let optionCount = 0;
let confirmedTreatmentData = null;
function showStep(index){
  steps.forEach((step,i)=>step.classList.toggle('hidden',i!==index));
  stepNumber.textContent = index + 1;
}

$('toDiagnosis').addEventListener('click',()=>{
  if(!$('patientName').value.trim()){
    $('patientName').focus();
    return;
  }
  showStep(1);
});

$('backToPatient').addEventListener('click',()=>showStep(0));
$('backToDiagnosis').addEventListener('click',()=>showStep(1));
$('backToConfirmation').addEventListener('click',()=>showStep(2));

$('parseDiagnosis').addEventListener('click',()=>{
  const text = $('diagnosis').value.trim();

  if(!text){
    $('diagnosis').focus();
    return;
  }

  const data = {
    patient: $('patientName').value.trim(),
    language: $('language').value,
    source: 'Diagnosis Copy-past',
    rawDiagnosis: text
  };
confirmedTreatmentData = parseTreatmentData(data.rawDiagnosis);

  $('confirmedPatient').textContent = data.patient;
  $('confirmedLanguage').textContent = data.language;
  $('confirmedDiagnosis').value = data.rawDiagnosis;

  $('confirmTreatment').checked = false;
  $('continueToOptions').disabled = true;

  showStep(2);
});
function parseTreatmentData(text){
  const data = {
    upperImplants: null,
    lowerImplantsMin: null,
    lowerImplantsMax: null,
    crowns: null,
    crownMaterial: null
  };

  const upperMatch = text.match(
    /(\d+)\s*implants?\s*(?:for|in)\s*the\s*upper\s*jaw/i
  );

  if(upperMatch){
    data.upperImplants = Number(upperMatch[1]);
  }

  const lowerMatch = text.match(
    /(\d+)\s*-\s*(\d+)\s*implants?\s*(?:for|in)\s*the\s*lower\s*jaw/i
  );

  if(lowerMatch){
    data.lowerImplantsMin = Number(lowerMatch[1]);
    data.lowerImplantsMax = Number(lowerMatch[2]);
  } else {
    const singleLowerMatch = text.match(
      /(\d+)\s*implants?\s*(?:for|in)\s*the\s*lower\s*jaw/i
    );

    if(singleLowerMatch){
      data.lowerImplantsMin = Number(singleLowerMatch[1]);
      data.lowerImplantsMax = Number(singleLowerMatch[1]);
    }
  }

  const crownMatch = text.match(
    /\+?\s*(\d+)\s*(?:zirconia\s*)?crowns?/i
  );

  if(crownMatch){
    data.crowns = Number(crownMatch[1]);
  }

  if(/zirconia/i.test(text)){
    data.crownMaterial = 'zirconia';
  }

  return data;
}
$('confirmTreatment').addEventListener('change',(e)=>{
  $('continueToOptions').disabled = !e.target.checked;
});

$('continueToOptions').addEventListener('click',()=>{
  const editedDiagnosis = $('confirmedDiagnosis').value.trim();

  if(!editedDiagnosis){
    $('confirmedDiagnosis').focus();
    return;
  }

  confirmedTreatmentData = parseTreatmentData(editedDiagnosis);

  if(!$('quotationOptions').children.length){
    addQuotationOption(confirmedTreatmentData);
  }

  showStep(3);
  recalculateQuotation();
});

$('addOption').addEventListener('click',()=>addQuotationOption());
$('refreshQuotation').addEventListener('click',recalculateQuotation);
$('patientCountry').addEventListener('change',recalculateQuotation);
$('paymentMethod').addEventListener('change',recalculateQuotation);


function addQuotationOption(treatmentData = confirmedTreatmentData){

  optionCount =
    document.querySelectorAll('.quotation-option').length + 1;

  const optionId = `option-${optionCount}`;

  // =========================================
  // PRICING OPTIONS
  // =========================================

  const implantOptions =
    DUTY_PRICING.implants
      .map(item =>
        `<option value="${item.id}">
          ${escapeHtml(item.displayName || item.name)} — $${item.price}
        </option>`
      )
      .join('');

  const crownOptions =
    DUTY_PRICING.crowns
      .filter(item => item.id !== 'veneers')
      .map(item =>
        `<option value="${item.id}">
          ${escapeHtml(item.displayName || item.name)} — $${item.price}
        </option>`
      )
      .join('');

 const procedureOptions =
  DUTY_PRICING.procedures
    .map(item => {

      const unit =
        item.unit || '';

      const quantityBased =
        Boolean(unit);

      return `
        <div class="procedure-item">

          <label class="check-item">

            <input
              type="checkbox"
              class="procedure-choice"
              data-price="${item.price}"
              data-unit="${escapeHtml(unit)}"
              value="${item.id}"
            >

            ${escapeHtml(item.name)}
            ${
              unit
                ? ` — ${money(item.price)} / ${escapeHtml(unit)}`
                : ` — ${money(item.price)}`
            }

          </label>

          ${
            quantityBased
              ? `
                <div class="procedure-quantity hidden">

                  <label>
                    Quantity (${escapeHtml(unit)})
                  </label>

                  <input
                    type="number"
                    class="procedure-quantity-input"
                    data-procedure-id="${item.id}"
                    min="0"
                    step="0.5"
                    value="1"
                  >

                </div>
              `
              : ''
          }

        </div>
      `;

    })
    .join('');
  // =========================================
  // HOTEL OPTIONS
  // =========================================

  const hotelOptions =
    DUTY_PRICING.hotels
      .map(hotel =>
        `<option value="${hotel.id}">
          ${escapeHtml(hotel.name)}
        </option>`
      )
      .join('');

  // =========================================
  // CREATE OPTION
  // =========================================

  const card = document.createElement('article');

  card.className = 'quotation-option';
  card.dataset.optionId = optionId;

  card.innerHTML = `

    <div class="option-header">
      <h3>Option ${optionCount}</h3>

      <button
        type="button"
        class="remove-option secondary"
      >
        Remove
      </button>
    </div>


    <!-- OPTION NAME -->

    <label>Option name</label>

    <input
      class="option-name"
      value="Option ${optionCount}"
      placeholder="e.g. Medentika + Ivoclar Zirconia"
    >


    <!-- =====================================
         TREATMENT
         ===================================== -->

    <div class="grid-2">

      <!-- IMPLANTS -->

      <div>

        <h4>Implants</h4>

        <label>Total implants</label>

        <input
          class="implant-count"
          type="number"
          min="0"
          step="1"
          value="${
            (treatmentData?.upperImplants ?? 0) +
            (treatmentData?.lowerImplantsMin ?? 0)
          }"
        >

        <label>Implant system</label>

        <select
          class="implant-brand"
          required
        >
          <option value="">
            Select implant
          </option>

          ${implantOptions}
        </select>

        <label>Implant markup (internal)</label>

<div class="percentage-input">
  <input
    class="implant-markup"
    type="number"
    min="0"
    max="100"
    step="1"
    value="25"
  >
  <span>%</span>
</div>

<small class="warning-text implant-markup-guidance">
  Coordinator can adjust the markup from 0% to 100%.
</small>
      </div>


      <!-- CROWNS -->

      <div>

        <h4>Crowns</h4>

        <label>Total crowns</label>

        <input
          class="crown-count"
          type="number"
          min="0"
          step="1"
          value="${treatmentData?.crowns ?? 0}"
        >

        <label>Crown system / material</label>

        <select class="crown-brand">

          <option value="">
            Select crown material
          </option>

          ${crownOptions}

        </select>

       <label>Crown markup (internal)</label>

<div class="percentage-input">
  <input
    class="crown-markup"
    type="number"
    min="0"
    max="100"
    step="1"
    value="25"
  >
  <span>%</span>
</div>

<small class="warning-text crown-markup-guidance">
  Coordinator can adjust the markup from 0% to 100%.
</small>

      </div>

    </div>


    <!-- =====================================
         ADDITIONAL PROCEDURES
         ===================================== -->

    <h4>Additional procedures</h4>

    <div class="procedure-list">
      ${procedureOptions}
    </div>


    <!-- =====================================
         VISIT PLAN
         ===================================== -->

    <h4>Visit plan</h4>

    <label>Number of visits</label>

    <select class="visit-plan">

      <option value="2">
        2 visits
      </option>

      <option value="1">
        1 visit
      </option>

    </select>


    <!-- =====================================
         ONE VISIT
         ===================================== -->

    <div class="visit-template visit-template-1 hidden">

      <h4>1-visit plan</h4>

      <label>Planned stay</label>

      <input
        class="one-visit-duration"
        value="15 days"
        placeholder="e.g. 15 days"
      >

      <label>Hotel</label>

      <select class="one-visit-hotel">
        <option value="">
          Select hotel
        </option>

        ${hotelOptions}

      </select>

      <label>Room type</label>

      <select class="one-visit-room">
        <option value="single">Single</option>
        <option value="double">Double</option>
        <option value="triple">Triple</option>
      </select>

      <label>Number of nights</label>

      <input
        class="one-visit-nights"
        type="number"
        min="0"
        step="1"
        value="15"
      >

      <div class="visit-template-note">
        One-visit treatment requires explicit coordinator confirmation.
      </div>

    </div>


    <!-- =====================================
         TWO VISITS
         ===================================== -->

    <div class="visit-template visit-template-2">

      <h4>First visit</h4>

      <label>Crowns completed in Visit 1</label>

      <input
        class="visit1-crown-count"
        type="number"
        min="0"
        step="1"
        value="0"
      >

      <small class="warning-text">
        Remaining crowns will automatically be assigned to Visit 2.
      </small>


      <label>Hotel</label>

      <select class="visit1-hotel">

        <option value="">
          Select hotel
        </option>

        ${hotelOptions}

      </select>


      <label>Room type</label>

      <select class="visit1-room">

        <option value="single">
          Single
        </option>

        <option value="double">
          Double
        </option>

        <option value="triple">
          Triple
        </option>

      </select>


      <label>Number of nights</label>

      <input
        class="visit1-nights"
        type="number"
        min="0"
        step="1"
        value="4"
      >


      <h4>Second visit</h4>

      <label>Hotel</label>

      <select class="visit2-hotel">

        <option value="">
          Select hotel
        </option>

        ${hotelOptions}

      </select>


      <label>Room type</label>

      <select class="visit2-room">

        <option value="single">
          Single
        </option>

        <option value="double">
          Double
        </option>

        <option value="triple">
          Triple
        </option>

      </select>


      <label>Number of nights</label>

      <input
        class="visit2-nights"
        type="number"
        min="0"
        step="1"
        value="7"
      >

    </div>


    <!-- =====================================
         SERVICES
         ===================================== -->

    <h4>Additional services</h4>

    <div class="visit-services">

      <label>VIP transfer</label>

      <select class="transfer-option">

        <option value="0">
          Free
        </option>

        <option value="100">
          $100
        </option>

      </select>


      <label>Dental prosthesis</label>

      <select class="prosthesis-option">

        <option value="0">
          Not offered
        </option>

        <option value="200">
          $200
        </option>

      </select>


      <label>Translator</label>

      <input
        value="Included — Free"
        readonly
      >

    </div>


    <!-- =====================================
         TOTAL
         ===================================== -->

    <div class="option-total">

      <span>
        Option subtotal
      </span>

      <strong class="option-subtotal">
        $0
      </strong>

    </div>

  `;

  $('quotationOptions').appendChild(card);

  bindOptionEvents(card);

  recalculateQuotation();
}

function renumberQuotationOptions(){
  const cards = [...document.querySelectorAll('.quotation-option')];
  optionCount = cards.length;

  cards.forEach((card, index)=>{
    const number = index + 1;
    card.dataset.optionId = `option-${number}`;

    const heading = card.querySelector('.option-header h3');
    if(heading) heading.textContent = `Option ${number}`;

    const nameInput = card.querySelector('.option-name');
    if(nameInput && /^Option \d+$/.test(nameInput.value.trim())){
      nameInput.value = `Option ${number}`;
    }
  });
}

function bindOptionEvents(card){

  // =========================================
  // REMOVE OPTION
  // =========================================

  const removeButton =
    card.querySelector('.remove-option');

  if(removeButton){

    removeButton.addEventListener('click', () => {

      card.remove();

      recalculateQuotation();

    });

  }


  // =========================================
  // VISIT PLAN
  // =========================================

  const visitPlan =
    card.querySelector('.visit-plan');

  const visitTemplate1 =
    card.querySelector('.visit-template-1');

  const visitTemplate2 =
    card.querySelector('.visit-template-2');


  function updateVisitPlan(){

    if(!visitPlan){
      return;
    }

    const visits =
      visitPlan.value;


    if(visitTemplate1){

      visitTemplate1.classList.toggle(
        'hidden',
        visits !== '1'
      );

    }


    if(visitTemplate2){

      visitTemplate2.classList.toggle(
        'hidden',
        visits !== '2'
      );

    }


    recalculateQuotation();

  }


  if(visitPlan){

    visitPlan.addEventListener(
      'change',
      updateVisitPlan
    );

  }


  // =========================================
  // IMPLANT SYSTEM
  // =========================================

  const implantSelect =
    card.querySelector('.implant-brand');

  const implantMarkupInput =
    card.querySelector('.implant-markup');

  const implantMarkupGuidance =
    card.querySelector(
      '.implant-markup-guidance'
    );


  if(implantSelect){

    implantSelect.addEventListener(
      'change',
      () => {

        const implant =
          getSelected(
            DUTY_PRICING.implants,
            implantSelect.value
          );


        if(!implant){

          if(implantMarkupGuidance){

            implantMarkupGuidance.textContent =
              'Select an implant system to see its base price.';

          }

          recalculateQuotation();

          return;

        }


        if(implantMarkupGuidance){

          implantMarkupGuidance.textContent =
            `Base price: ${money(implant.price)} per implant. ` +
            `Coordinator markup: editable.`;

        }


        recalculateQuotation();

      }
    );

  }


  // =========================================
  // IMPLANT MARKUP
  // =========================================

  if(implantMarkupInput){

    implantMarkupInput.addEventListener(
      'input',
      recalculateQuotation
    );

    implantMarkupInput.addEventListener(
      'change',
      recalculateQuotation
    );

  }


  // =========================================
  // CROWN SYSTEM
  // =========================================

  const crownSelect =
    card.querySelector('.crown-brand');

  const crownMarkupInput =
    card.querySelector('.crown-markup');

  const crownMarkupGuidance =
    card.querySelector(
      '.crown-markup-guidance'
    );


  if(crownSelect){

    crownSelect.addEventListener(
      'change',
      () => {

        const crown =
          getSelected(
            DUTY_PRICING.crowns,
            crownSelect.value
          );


        if(!crown){

          if(crownMarkupGuidance){

            crownMarkupGuidance.textContent =
              'Select a crown material to see its base price.';

          }

          recalculateQuotation();

          return;

        }


        if(crownMarkupGuidance){

          crownMarkupGuidance.textContent =
            `Base price: ${money(crown.price)} per crown. ` +
            `Coordinator markup: editable.`;

        }


        recalculateQuotation();

      }
    );

  }


  // =========================================
  // CROWN MARKUP
  // =========================================

  if(crownMarkupInput){

    crownMarkupInput.addEventListener(
      'input',
      recalculateQuotation
    );

    crownMarkupInput.addEventListener(
      'change',
      recalculateQuotation
    );

  }


  // =========================================
  // BONE GRAFTING / PROCEDURE QUANTITY
  // =========================================

  card
    .querySelectorAll('.procedure-choice')
    .forEach(choice => {

      choice.addEventListener(
        'change',
        () => {

          const procedureItem =
            choice.closest(
              '.procedure-item'
            );


          if(!procedureItem){
            return;
          }


          const quantityBox =
            procedureItem.querySelector(
              '.procedure-quantity'
            );


          if(!quantityBox){
            return;
          }


          quantityBox.classList.toggle(
            'hidden',
            !choice.checked
          );


          recalculateQuotation();

        }
      );

    });


  // =========================================
  // INITIAL PROCEDURE QUANTITY VISIBILITY
  // =========================================

  card
    .querySelectorAll('.procedure-choice')
    .forEach(choice => {

      const procedureItem =
        choice.closest(
          '.procedure-item'
        );


      if(!procedureItem){
        return;
      }


      const quantityBox =
        procedureItem.querySelector(
          '.procedure-quantity'
        );


      if(quantityBox){

        quantityBox.classList.toggle(
          'hidden',
          !choice.checked
        );

      }

    });


  // =========================================
  // ALL OTHER INPUTS / SELECTS
  // =========================================

  card
    .querySelectorAll('input, select')
    .forEach(input => {

      input.addEventListener(
        'input',
        recalculateQuotation
      );

      input.addEventListener(
        'change',
        recalculateQuotation
      );

    });


  // =========================================
  // INITIALIZE VISIT TEMPLATE
  // =========================================

  updateVisitPlan();

}


function updateVisitFields(card){
  const oneVisit = card.querySelector('.one-visit-confirm').checked;
  const count = card.querySelector('.visit-count');
  const duration = card.querySelector('.visit-duration');
  count.value = oneVisit ? 1 : 2;
  duration.placeholder = oneVisit ? 'Approximately 15 days' : 'e.g. 5 days + 7 days';
  if(oneVisit && duration.value === 'To be confirmed') duration.value = 'Approximately 15 days';
  if(!oneVisit && duration.value === 'Approximately 15 days') duration.value = 'To be confirmed';
}

function getUnitMarkupOptions(price){
  if(price >= 50 && price <= 350){
    return [20, 25, 30, 35];
  }

  if(price > 350 && price <= 750){
    return [10, 12, 15];
  }

  if(price > 750){
    return [5, 7];
  }

  return [0];
}

function getSelected(items, id){
  return items.find(item=>item.id===id);
}

function calculateOption(card){
  // =========================================
  // BASIC DATA
  // =========================================

  const implantCount = numberValue(
    card.querySelector('.implant-count')?.value
  );

  const crownCount = numberValue(
    card.querySelector('.crown-count')?.value
  );

  const visits = Number(
    card.querySelector('.visit-plan')?.value || 2
  );


  // =========================================
  // IMPLANT PRICE
  // =========================================

  const implant = getSelected(
    DUTY_PRICING.implants,
    card.querySelector('.implant-brand')?.value
  );

  const implantMarkup = numberValue(
    card.querySelector('.implant-markup')?.value
  );

  const implantUnitPrice = implant
    ? implant.price * (1 + implantMarkup / 100)
    : 0;

  const implantTotal =
    implantCount * implantUnitPrice;


  // =========================================
  // CROWN PRICE
  // =========================================

  const crown = getSelected(
    DUTY_PRICING.crowns,
    card.querySelector('.crown-brand')?.value
  );

  const crownMarkup = numberValue(
    card.querySelector('.crown-markup')?.value
  );

  const crownUnitPrice = crown
    ? crown.price * (1 + crownMarkup / 100)
    : 0;


  // =========================================
  // CROWNS BY VISIT
  // =========================================

  let visit1Crowns = crownCount;
  let visit2Crowns = 0;

  if(visits === 2){

    visit1Crowns = Math.min(
      numberValue(
        card.querySelector('.visit1-crown-count')?.value
      ),
      crownCount
    );

    visit2Crowns =
      crownCount - visit1Crowns;
  }


  const visit1CrownTotal =
    visit1Crowns * crownUnitPrice;

  const visit2CrownTotal =
    visit2Crowns * crownUnitPrice;


 // =========================================
// ADDITIONAL PROCEDURES
// =========================================

let proceduresTotal = 0;

card
  .querySelectorAll('.procedure-choice:checked')
  .forEach(choice => {

    const basePrice =
      numberValue(choice.dataset.price);

    const unit =
      choice.dataset.unit || '';

    // Procedures with a unit are quantity-based.
    // Example:
    // Bone Grafting = $400 / cc
    if(unit){

      const quantityInput =
        card.querySelector(
          `.procedure-quantity-input[data-procedure-id="${choice.value}"]`
        );

      const quantity =
        Math.max(
          0,
          numberValue(quantityInput?.value || 1)
        );

      proceduresTotal +=
        basePrice * quantity;

    } else {

      // Normal procedures remain fixed-price.
      proceduresTotal += basePrice;

    }

  });


// Procedures are currently assigned to Visit 1.
const visit1Procedures =
  proceduresTotal;

const visit2Procedures = 0;

  // =========================================
  // BRIDGE
  // =========================================

  const bridgeField =
    card.querySelector('.bridge-price');

  const bridgePrice =
    bridgeField && bridgeField.value !== ''
      ? numberValue(bridgeField.value)
      : 0;

  // Bridge is currently assigned to Visit 1.
  const visit1Bridge =
    bridgePrice;

  const visit2Bridge = 0;


  // =========================================
  // HOTEL CALCULATOR
  // =========================================

  function calculateHotel(
    hotelId,
    roomType,
    nights
  ){

    if(!hotelId || nights <= 0){
      return 0;
    }

    const hotel =
      DUTY_PRICING.hotels.find(
        item => item.id === hotelId
      );

    if(!hotel){
      return 0;
    }


    let nightlyPrice = null;


    // Hotels with special room structures
    if(hotel.roomOptions){

      const room =
        hotel.roomOptions.find(item => {

          const name =
            item.name.toLowerCase();

          return name.includes(
            roomType.toLowerCase()
          );
        });

      if(room){
        nightlyPrice =
          Number(room.price);
      }

    } else {

      nightlyPrice =
        Number(hotel[roomType]);

    }


    if(
      !Number.isFinite(nightlyPrice) ||
      nightlyPrice < 0
    ){
      return 0;
    }

    return nightlyPrice * nights;
  }


  // =========================================
  // HOTEL BY VISIT
  // =========================================

  let visit1Hotel = 0;
  let visit2Hotel = 0;


  if(visits === 1){

    visit1Hotel =
      calculateHotel(
        card.querySelector(
          '.one-visit-hotel'
        )?.value,

        card.querySelector(
          '.one-visit-room'
        )?.value || 'single',

        numberValue(
          card.querySelector(
            '.one-visit-nights'
          )?.value
        )
      );

  } else {

    visit1Hotel =
      calculateHotel(
        card.querySelector(
          '.visit1-hotel'
        )?.value,

        card.querySelector(
          '.visit1-room'
        )?.value || 'single',

        numberValue(
          card.querySelector(
            '.visit1-nights'
          )?.value
        )
      );


    visit2Hotel =
      calculateHotel(
        card.querySelector(
          '.visit2-hotel'
        )?.value,

        card.querySelector(
          '.visit2-room'
        )?.value || 'single',

        numberValue(
          card.querySelector(
            '.visit2-nights'
          )?.value
        )
      );
  }


  // =========================================
  // VIP TRANSFER
  // =========================================

  const transfer =
    numberValue(
      card.querySelector(
        '.transfer-option'
      )?.value
    );

  // Transfer is currently Visit 1.
  const visit1Transfer =
    transfer;

  const visit2Transfer = 0;


  // =========================================
  // DENTAL PROSTHESIS
  // =========================================

  const prosthesis =
    numberValue(
      card.querySelector(
        '.prosthesis-option'
      )?.value
    );

  // Prosthesis is currently Visit 1.
  const visit1Prosthesis =
    prosthesis;

  const visit2Prosthesis = 0;


  // =========================================
  // TRANSLATOR
  // =========================================

  // Always included and free.
  const translator = 0;


  // =========================================
  // DENTAL TOTAL BY VISIT
  // =========================================

  const visit1Dental =
    implantTotal +
    visit1CrownTotal +
    visit1Procedures +
    visit1Bridge;

  const visit2Dental =
    visit2CrownTotal +
    visit2Procedures +
    visit2Bridge;


  // =========================================
  // SERVICES BY VISIT
  // =========================================

  const visit1Services =
    visit1Hotel +
    visit1Transfer +
    visit1Prosthesis;

  const visit2Services =
    visit2Hotel +
    visit2Transfer +
    visit2Prosthesis;


  // =========================================
  // FINAL VISIT TOTALS
  // =========================================

  const visit1Total =
    visit1Dental +
    visit1Services;

  const visit2Total =
    visit2Dental +
    visit2Services;


  // =========================================
  // OPTION TOTAL
  // =========================================

  const subtotal =
    visit1Total +
    visit2Total;


  // =========================================
  // DISPLAY OPTION SUBTOTAL
  // =========================================

  const subtotalElement =
    card.querySelector(
      '.option-subtotal'
    );

  if(subtotalElement){

    subtotalElement.textContent =
      money(subtotal);

  }


  // =========================================
  // RETURN COMPLETE BREAKDOWN
  // =========================================

  return {

    subtotal,

    hasImplants:
      implantCount > 0,

    totalImplants:
      implantCount,

    totalCrowns:
      crownCount,

    visits,

    // Dental
    visit1Dental,
    visit2Dental,

    // Treatment quantities
    visit1Implants:
      implantCount,

    visit2Implants:
      0,

    visit1Crowns,
    visit2Crowns,

    // Services
    visit1Hotel,
    visit2Hotel,

    visit1Transfer,
    visit2Transfer,

    visit1Prosthesis,
    visit2Prosthesis,

    translator,

    // Combined
    visit1Services,
    visit2Services,

    visit1Total,
    visit2Total,

    // Unit prices
    implantUnitPrice,
    crownUnitPrice

  };
}

function updateMarkupOptions(baseTotal){

  const markupSelect =
    $('markupPercent');

  if(!markupSelect){
    return;
  }

  const price =
    Number(baseTotal) || 0;

  let options = [];

  if(price <= 350){

    options = [20, 25, 30, 35];

  } else if(price <= 750){

    options = [10, 12, 15];

  } else {

    options = [5, 7];

  }

  const currentValue =
    markupSelect.value;

  markupSelect.innerHTML =
    options
      .map(
        value =>
          `<option value="${value}">
            ${value}%
          </option>`
      )
      .join('');

  if(
    options.includes(
      Number(currentValue)
    )
  ){

    markupSelect.value =
      currentValue;

  } else {

    markupSelect.value =
      String(options[0]);

  }
}

function recalculateQuotation(){

  const cards = [
    ...document.querySelectorAll('.quotation-option')
  ];

  const country =
    $('patientCountry')?.value || 'Other';

  const paymentMethod =
    $('paymentMethod')?.value || 'visit-payments';

  const installmentEligible =
    paymentMethod === 'installments' &&
    DUTY_PRICING.financing.eligibleCountries.includes(country);

  let html = '';

  // =========================================
  // NO OPTIONS
  // =========================================

  if(!cards.length){

    $('summaryLines').innerHTML =
      '<p>No quotation options added yet.</p>';

    return;
  }


  // =========================================
  // EACH OPTION IS INDEPENDENT
  // =========================================

  cards.forEach((card, index) => {

    const result =
      calculateOption(card);

    const optionName =
      card.querySelector('.option-name')?.value
      || `Option ${index + 1}`;


    html += `

      <div class="quotation-summary-option">

        <h3>
          ${escapeHtml(optionName)}
        </h3>

        <div class="summary-row">
          <span>
            Option total
          </span>

          <strong>
            ${money(result.subtotal)}
          </strong>
        </div>

    `;


        // =======================================
    // PAYMENT BY VISIT
    // ALWAYS DISPLAYED
    // =======================================

    if(result.visits === 1){

      html += `

        <div class="payment-breakdown">

          <h4>Payment — 1 visit</h4>

          <div class="summary-row">

            <span>
              Visit 1
            </span>

            <strong>
              ${money(result.visit1Total)}
            </strong>

          </div>

        </div>

      `;

    } else {

      html += `

        <div class="payment-breakdown">

          <h4>Payment by visit</h4>

          <div class="summary-row">

            <span>
              Visit 1
            </span>

            <strong>
              ${money(result.visit1Total)}
            </strong>

          </div>

          <div class="summary-row">

            <span>
              Visit 2
            </span>

            <strong>
              ${money(result.visit2Total)}
            </strong>

          </div>

          <div class="summary-row">

            <span>
              Visit 1 + Visit 2
            </span>

            <strong>
              ${money(result.subtotal)}
            </strong>

          </div>

        </div>

      `;

    }
    // =======================================
    // US / CANADA INSTALLMENTS
    // =======================================

    if(installmentEligible){

      const financedPackage =
        result.subtotal *
        (
          1 +
          DUTY_PRICING.financing.markupPercent / 100
        );


      const installment =
        Math.min(
          DUTY_PRICING.financing.installmentAmount,
          financedPackage
        );


      const cashRemaining =
        Math.max(
          0,
          financedPackage - installment
        );


      const cashPerVisit =
        result.visits > 1
          ? cashRemaining / result.visits
          : cashRemaining;


      html += `

        <div class="financing-box">

          <h4>
            US / Canada installment plan
          </h4>

          <div class="summary-row">

            <span>
              Package + ${DUTY_PRICING.financing.markupPercent}%
            </span>

            <strong>
              ${money(financedPackage)}
            </strong>

          </div>

          <div class="summary-row">

            <span>
              Installment
            </span>

            <strong>
              ${money(installment)}
            </strong>

          </div>

          <div class="summary-row">

            <span>
              Maximum term
            </span>

            <strong>
              ${DUTY_PRICING.financing.maximumTermMonths}
              months
            </strong>

          </div>

          <div class="summary-row">

            <span>
              Remaining cash
            </span>

            <strong>
              ${money(cashRemaining)}
            </strong>

          </div>

          <div class="summary-row">

            <span>
              Cash per visit
            </span>

            <strong>
              ${money(cashPerVisit)}
            </strong>

          </div>

        </div>

      `;

    }


    // =======================================
    // INSTALLMENTS SELECTED BUT NOT ELIGIBLE
    // =======================================

    if(
      paymentMethod === 'installments' &&
      !installmentEligible
    ){

      html += `

        <div class="rule-note">

          Installment plans are available only
          for patients from the United States
          or Canada.

        </div>

      `;

    }


    // =======================================
    // IMPLANT NOTE
    // =======================================

    if(result.hasImplants){

      html += `

        <div class="rule-note">

          Implant case: default is 2 visits.
          A 1-visit plan requires explicit
          coordinator confirmation.

        </div>

      `;

    }


    // =======================================
    // CLOSE OPTION
    // =======================================

    html += `

      </div>

    `;

  });


  // =========================================
  // DISPLAY
  // =========================================

  $('summaryLines').innerHTML =
    html;
}

function numberValue(value){
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function money(value){
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
