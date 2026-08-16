// Duty Clinic PDF design system.
// Single source of truth for colors, spacing and type scale used by
// pdf-generator.js and pdf-generator-ar.js. Positioning: premium
// international medical proposal — not an invoice or a price list.

const DUTY_DESIGN = {
  colors: {
    navy: '#0B1F3A',      // primary — trust, medicine, professionalism
    blue: '#1D6FA5',      // secondary — technology, cleanliness
    gold: '#B89B5E',      // accent — premium, used sparingly
    grey: '#666666',      // body copy / secondary text
    greySoft: '#E4E7EC',  // hairline separators
    white: '#FFFFFF',
    background: '#FFFFFF',
    surface: '#F7F8FA'    // soft panel backgrounds (cards, tables)
  },

  spacing: {
    page: 12,     // mm, outer page margin
    section: 20,  // px, gap between major sections
    row: 10       // px, gap between rows inside a section
  },

  radius: {
    card: 6,
    pill: 999
  },

  type: {
    // Cover / patient title
    coverEyebrow: { size: '10pt', weight: 700, letterSpacing: '1.5px', color: 'gold' },
    coverTitle:   { size: '20pt', weight: 800, color: 'navy' },

    // Section titles (TREATMENT PLAN, OPTION 1, ACCOMMODATION, PAYMENT SUMMARY)
    sectionTitle: { size: '9pt', weight: 800, letterSpacing: '1px', color: 'navy' },

    // Option card header
    optionKicker: { size: '8pt', weight: 800, letterSpacing: '1.3px', color: 'gold' },
    optionTitle:  { size: '15pt', weight: 800, color: 'navy' },
    optionSub:    { size: '8.5pt', weight: 400, color: 'grey' },

    // Body
    body:  { size: '9pt', weight: 400, color: '#18202B' },
    label: { size: '7.5pt', weight: 700, color: 'grey' },

    // Totals
    totalLabel: { size: '8pt', weight: 700, letterSpacing: '.5px', color: 'navy' },
    totalValue: { size: '18pt', weight: 800, color: 'gold' }
  }
};

if (typeof window !== 'undefined') window.DUTY_DESIGN = DUTY_DESIGN;
