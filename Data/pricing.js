// DutyAI official pricing data.
// Source: Duty Clinic - Sales Price List.xlsx
// Prices are official base prices in USD. Coordinator quotation markup is applied separately.

const PRICING = {
  crowns: [
    { id: 'ivoclar-zirconia', name: 'Zirconium Crowns Ivoclar German', price: 100 },
    { id: 'emax', name: 'Zirconium Crowns Emax', price: 150 },
    { id: 'monolithic', name: 'Zirconium Crowns Monolithic', price: 170 },
    { id: 'multilayer', name: 'Zirconium Crowns Multilayer', price: 170 },
    { id: 'straumann-zirconia', name: 'Zirconium Crowns Straumann', displayName: 'Straumann Zirconia', price: 170 },
    { id: 'veneers', name: 'Veneers', price: 150 }
  ],
  implants: [
    { id: 'medigma', name: 'German Implants Medigma', displayName: 'Medigma', price: 300 },
    { id: 'bego', name: 'German Implants Bego', displayName: 'BEGO', price: 370 },
    { id: 'hiossen', name: 'American Implants Hiossen', displayName: 'Hiossen', price: 500 },
    { id: 'zimmer', name: 'American Implants Zimmer', displayName: 'Zimmer', price: 650 },
    { id: 'neodent', name: 'Neodent by Straumann', price: 500 },
    { id: 'medentika', name: 'Medentika by Straumann', displayName: 'Medentika by Straumann Group', price: 650 },
    { id: 'nobel-biocare', name: 'Nobel Biocare', price: 600 },
    { id: 'megagen', name: 'Korean Implants Megagen', displayName: 'Megagen', price: 500 },
    { id: 'osstem', name: 'Korean Implants Osstem', displayName: 'Osstem', price: 500 },
    { id: 'straumann', name: 'Swiss Implants Straumann', displayName: 'Straumann', price: 600 },
    { id: 'straumann-blt', name: 'Swiss Implants Straumann BLT', displayName: 'Straumann BLT', price: 600 },
    { id: 'straumann-blx', name: 'Swiss Implants Straumann BLX', displayName: 'Straumann BLX', price: 750 },
    { id: 'venus', name: 'Turkish Implants Venus', displayName: 'Venus', price: 225 }
  ],
  procedures: [
    { id: 'bone-graft', name: 'Bone Grafting', price: 400, unit: '1 cc' },
    { id: 'sinus-1', name: 'Sinus Lifting with Bone Graft (1 Side)', price: 740, unit: 'one side' },
    { id: 'sinus-2', name: 'Sinus Lifting with Bone Graft (2 Sides)', price: 1400, unit: 'two sides' },
    { id: 'surgical-extraction', name: 'Surgical Extraction', price: 150 },
    { id: 'implant-removal', name: 'Implants Removal', price: 100 },
    { id: 'root-canal', name: 'Root Canal', price: 50 },
    { id: 'gingivectomy', name: 'Gingivectomy', price: 300, unit: 'per arch' },
    { id: 'fillings', name: 'Fillings', price: 75 }
  ],
  bridge: { id: 'bridge', name: 'Bridge', price: null, requiresConfirmedPrice: true },
  financing: {
    eligibleCountries: ['United States', 'Canada'],
    markupPercent: 20,
    installmentAmount: 3900,
    maximumTermMonths: 24
  },
  quotation: { defaultCoordinatorMarkupPercent: 0 }
};

if (typeof window !== 'undefined') window.DUTY_PRICING = PRICING;
