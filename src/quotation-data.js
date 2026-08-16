// DutyAI quotation data layer.
// This layer prepares the already-calculated quotation for future PDF generation.
// It does not perform a second pricing calculation.

function getQuotationHotelDetails(hotelId, roomType, nights){
  if(!hotelId) return null;

  const hotel = DUTY_PRICING.hotels.find(item => item.id === hotelId);
  if(!hotel) return null;

  let nightlyPrice = null;
  let roomLabel = roomType;

  if(hotel.roomOptions){
    const room = hotel.roomOptions.find(item => item.name.toLowerCase().includes(roomType.toLowerCase()));
    if(room){
      nightlyPrice = Number(room.price);
      roomLabel = room.name;
    }
  } else {
    nightlyPrice = Number(hotel[roomType]);
  }

  if(!Number.isFinite(nightlyPrice) || nightlyPrice < 0) nightlyPrice = 0;

  return {
    id: hotel.id,
    name: hotel.name,
    roomType,
    roomLabel,
    nights: numberValue(nights),
    nightlyPrice,
    total: nightlyPrice * numberValue(nights),
    currency: hotel.currency || 'USD'
  };
}

function getQuotationProcedureDetails(card){
  return [...card.querySelectorAll('.procedure-choice:checked')]
    .map(choice => {
      const procedure = DUTY_PRICING.procedures.find(item => item.id === choice.value);
      if(!procedure) return null;

      const quantityInput = card.querySelector(
        `.procedure-quantity-input[data-procedure-id="${choice.value}"]`
      );

      const quantity = procedure.unit
        ? Math.max(0, numberValue(quantityInput?.value || 1))
        : 1;

      return {
        id: procedure.id,
        name: procedure.name,
        unit: procedure.unit || null,
        quantity,
        unitPrice: Number(procedure.price) || 0,
        total: (Number(procedure.price) || 0) * quantity
      };
    })
    .filter(Boolean);
}

function getQuotationOptionData(card, index){
  const result = calculateOption(card);

  const implant = getSelected(DUTY_PRICING.implants, card.querySelector('.implant-brand')?.value);
  const crown = getSelected(DUTY_PRICING.crowns, card.querySelector('.crown-brand')?.value);
  const implantMarkup = numberValue(card.querySelector('.implant-markup')?.value);
  const crownMarkup = numberValue(card.querySelector('.crown-markup')?.value);
  const visits = result.visits;

  const visit1HotelId = visits === 1
    ? card.querySelector('.one-visit-hotel')?.value
    : card.querySelector('.visit1-hotel')?.value;
  const visit1Room = visits === 1
    ? card.querySelector('.one-visit-room')?.value || 'single'
    : card.querySelector('.visit1-room')?.value || 'single';
  const visit1Nights = visits === 1
    ? card.querySelector('.one-visit-nights')?.value
    : card.querySelector('.visit1-nights')?.value;
  const visit2HotelId = visits === 2 ? card.querySelector('.visit2-hotel')?.value : '';
  const visit2Room = visits === 2 ? card.querySelector('.visit2-room')?.value || 'single' : 'single';
  const visit2Nights = visits === 2 ? card.querySelector('.visit2-nights')?.value : 0;
  const transferPrice = numberValue(card.querySelector('.transfer-option')?.value);
  const prosthesisPrice = numberValue(card.querySelector('.prosthesis-option')?.value);

  return {
    id: card.dataset.optionId || `option-${index + 1}`,
    name: card.querySelector('.option-name')?.value?.trim() || `Option ${index + 1}`,
    treatment: {
      implants: {
        id: implant?.id || null,
        name: implant?.displayName || implant?.name || null,
        quantity: result.totalImplants,
        baseUnitPrice: implant?.price || 0,
        markupPercent: implantMarkup,
        finalUnitPrice: result.implantUnitPrice,
        total: result.totalImplants * result.implantUnitPrice
      },
      crowns: {
        id: crown?.id || null,
        name: crown?.displayName || crown?.name || null,
        quantity: result.totalCrowns,
        baseUnitPrice: crown?.price || 0,
        markupPercent: crownMarkup,
        finalUnitPrice: result.crownUnitPrice,
        total: result.totalCrowns * result.crownUnitPrice
      },
      procedures: getQuotationProcedureDetails(card)
    },
    visits: {
      count: visits,
      visit1: {
        crowns: result.visit1Crowns,
        hotel: getQuotationHotelDetails(visit1HotelId, visit1Room, visit1Nights),
        services: {
          transfer: { name: 'VIP transfer', total: transferPrice },
          prosthesis: { name: 'Dental prosthesis', total: prosthesisPrice },
          translator: { name: 'Translator', total: 0, included: true }
        },
        dentalTotal: result.visit1Dental,
        servicesTotal: result.visit1Services,
        total: result.visit1Total
      },
      visit2: visits === 2 ? {
        crowns: result.visit2Crowns,
        hotel: getQuotationHotelDetails(visit2HotelId, visit2Room, visit2Nights),
        services: {
          transfer: { name: 'VIP transfer', total: result.visit2Transfer },
          prosthesis: { name: 'Dental prosthesis', total: result.visit2Prosthesis },
          translator: { name: 'Translator', total: 0, included: true }
        },
        dentalTotal: result.visit2Dental,
        servicesTotal: result.visit2Services,
        total: result.visit2Total
      } : null
    },
    totals: {
      treatmentAndServices: result.subtotal,
      visit1: result.visit1Total,
      visit2: result.visit2Total,
      total: result.subtotal
    }
  };
}

function buildQuotationData(){
  const country = $('patientCountry')?.value || 'Other';
  const paymentMethod = $('paymentMethod')?.value || 'visit-payments';
  const installmentEligible = paymentMethod === 'installments' && DUTY_PRICING.financing.eligibleCountries.includes(country);
  const options = [...document.querySelectorAll('.quotation-option')].map(getQuotationOptionData);

  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    patient: {
      name: $('patientName')?.value?.trim() || '',
      arabicName: $('patientNameArabic')?.value?.trim() || '',
      country,
      language: $('language')?.value || '',
      diagnosis: $('confirmedDiagnosis')?.value?.trim() || '',
      treatmentData: typeof confirmedTreatmentData !== 'undefined' ? confirmedTreatmentData : null
    },
    payment: {
      method: paymentMethod,
      installmentEligible,
      financing: installmentEligible ? {
        markupPercent: DUTY_PRICING.financing.markupPercent,
        installmentAmount: DUTY_PRICING.financing.installmentAmount,
        maximumTermMonths: DUTY_PRICING.financing.maximumTermMonths
      } : null
    },
    options
  };
}

if(typeof window !== 'undefined') window.buildQuotationData = buildQuotationData;
