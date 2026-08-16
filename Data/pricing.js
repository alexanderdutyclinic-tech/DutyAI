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
  { 
    id: 'medigma',
    name: 'German Implants Medigma',
    displayName: 'Medigma',
    origin: 'German',
    price: 300
  },

  { 
    id: 'bego',
    name: 'German Implants Bego',
    displayName: 'BEGO',
    origin: 'German',
    price: 370
  },

  { 
    id: 'hiossen',
    name: 'American Implants Hiossen',
    displayName: 'Hiossen',
    origin: 'American',
    price: 500
  },

  { 
    id: 'zimmer',
    name: 'American Implants Zimmer',
    displayName: 'Zimmer',
    origin: 'American',
    price: 650
  },

  {
    id: 'neodent',
    name: 'Neodent by Straumann',
    origin: 'Swiss',
    price: 500
  },

  {
    id: 'medentika',
    name: 'Medentika by Straumann',
    displayName: 'Medentika by Straumann Group',
    origin: 'Swiss',
    price: 650
  },

  {
    id: 'nobel-biocare',
    name: 'Nobel Biocare',
    origin: 'Other',
    price: 600
  },

  {
    id: 'megagen',
    name: 'Korean Implants Megagen',
    displayName: 'Megagen',
    origin: 'Korean',
    price: 500
  },

  {
    id: 'osstem',
    name: 'Korean Implants Osstem',
    displayName: 'Osstem',
    origin: 'Korean',
    price: 500
  },

  {
    id: 'straumann',
    name: 'Swiss Implants Straumann',
    displayName: 'Straumann',
    origin: 'Swiss',
    price: 600
  },

  {
    id: 'straumann-blt',
    name: 'Swiss Implants Straumann BLT',
    displayName: 'Straumann BLT',
    origin: 'Swiss',
    price: 600
  },

  {
    id: 'straumann-blx',
    name: 'Swiss Implants Straumann BLX',
    displayName: 'Straumann BLX',
    origin: 'Swiss',
    price: 750
  },

  {
    id: 'venus',
    name: 'Turkish Implants Venus',
    displayName: 'Venus',
    origin: 'Turkish',
    price: 225
  }
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
    hotels: [
    {
      id: 'tryp-wyndham-topkapi',
      name: 'Tryp by Wyndham Istanbul Topkapi',
      single: 65,
      double: 65,
      triple: 95,
      currency: 'USD'
    },
    {
      id: 'ibis-merter',
      name: 'IBIS Merter',
      single: 75,
      double: 75,
      triple: 105,
      currency: 'USD',
      validity: 'Until 30.8'
    },
    {
      id: 'hampton-merter',
      name: 'Hampton by Hilton Istanbul Merter',
      single: 65,
      double: 65,
      triple: 90,
      currency: 'USD',
      validity: 'Until 30.8'
    },
    {
      id: 'ramada-merter',
      name: 'Ramada Merter',
      single: 75,
      double: 75,
      triple: 95,
      currency: 'USD'
    },
    {
      id: 'rios-edition',
      name: 'Rios Edition Hotel',
      roomOptions: [
        { name: 'Single/Double — Standard', price: 55 },
        { name: 'Single/Double — Jacuzzi', price: 95 },
        { name: 'Triple — Standard', price: 75 }
      ],
      currency: 'USD'
    },
    {
      id: 'gunes-merter',
      name: 'Güneş Hotel Merter',
      single: 60,
      double: 60,
      triple: null,
      currency: 'USD',
      validity: 'Until 30.8'
    },
    {
      id: 'eresin-topkapi',
      name: 'Eresin Hotels Topkapı 5',
      single: 81.20,
      double: 92.80,
      triple: null,
      currency: 'USD',
      originalCurrency: 'EUR',
      originalPrices: {
        single: 70,
        double: 80
      },
      conversionRate: 1.16,
      validity: 'Until 30.8'
    },
    {
      id: 'novotel-zeytinburnu',
      name: 'Novotel Zeytinburnu',
      single: 87,
      double: 98.60,
      triple: null,
      currency: 'USD',
      originalCurrency: 'EUR',
      originalPrices: {
        single: 75,
        double: 85
      },
      conversionRate: 1.16,
      validity: 'Until 30.08'
    },
    {
      id: 'ottoperla',
      name: 'Ottoperla Hotel',
      single: 81.20,
      double: 92.80,
      triple: null,
      currency: 'USD',
      originalCurrency: 'EUR',
      originalPrices: {
        single: 70,
        double: 80
      },
      conversionRate: 1.16,
      validity: 'Until 1.09'
    },
    {
      id: 'business-life-bakirkoy',
      name: 'Business Life Hotel & SPA Bakırköy',
      single: 45,
      double: 50,
      triple: 65,
      currency: 'USD',
      validity: '31.8'
    },
    {
      id: 'holiday-inn-old-city-fatih',
      name: 'Holiday Inn Old City Fatih',
      single: 75,
      double: 75,
      triple: 115,
      currency: 'USD',
      validity: 'Until 30.07'
    },
    {
      id: 'akgun-istanbul',
      name: 'Akgün İstanbul Hotel',
      single: 75,
      double: 85,
      triple: 110,
      currency: 'USD',
      validity: '31.10'
    },
    {
      id: 'ottomans-life-deluxe',
      name: "Ottoman's Life Hotel Deluxe",
      single: 98.60,
      double: 110.20,
      triple: null,
      currency: 'USD',
      originalCurrency: 'EUR',
      originalPrices: {
        single: 85,
        double: 95
      },
      conversionRate: 1.16,
      validity: '31.10'
    }
  ],
  quotation: { defaultCoordinatorMarkupPercent: 0 }
};

if (typeof window !== 'undefined') window.DUTY_PRICING = PRICING;
