/** Labels and units are explicit: national observations cannot be assigned to individual states. */
export const INDICATORS = {
  "SP.POP.TOTL": {
    label: "Population",
    unit: "people",
    note: "World Bank population estimate; not a state census.",
  },
  "NY.GDP.MKTP.CD": {
    label: "GDP",
    unit: "current US$",
    note: "Economic output at current US-dollar prices; not government revenue.",
  },
  "NY.GDP.MKTP.KD.ZG": {
    label: "Real GDP growth",
    unit: "%",
    note: "Annual real growth; series can be revised and rebased.",
  },
  "FP.CPI.TOTL.ZG": {
    label: "Consumer inflation",
    unit: "%",
    note: "Annual consumer-price inflation, not a future assumption.",
  },
  "SL.UEM.TOTL.ZS": {
    label: "Unemployment",
    unit: "%",
    note: "Modelled ILO estimate; definitions differ from some national series.",
  },
  "EG.ELC.ACCS.ZS": {
    label: "Electricity access",
    unit: "% of population",
    note: "Access does not measure reliability or hours of supply.",
  },
  "SE.PRM.ENRR": {
    label: "Primary enrolment",
    unit: "gross %",
    note: "Gross enrolment can exceed 100%; it is not attendance or learning quality.",
  },
  "SH.H2O.BASW.ZS": {
    label: "Basic drinking water",
    unit: "% of population",
    note: "At least basic services; not the same as safely managed water.",
  },
  "SH.DYN.MORT": {
    label: "Under-five mortality",
    unit: "per 1,000 live births",
    note: "Estimated deaths before age five; not a healthcare-access rate.",
  },
  "SH.XPD.CHEX.GD.ZS": {
    label: "Health expenditure",
    unit: "% of GDP",
    note: "Current health expenditure across financing sources, not just government budgets.",
  },
  "NY.GDP.TOTL.RT.ZS": {
    label: "Natural-resource rents",
    unit: "% of GDP",
    note: "Estimated resource rents; not reserves or government resource receipts.",
  },
};
export const SECTORS = {
  education: "Education",
  health: "Healthcare",
  transport: "Transport",
  agriculture: "Agriculture & food",
  energy: "Energy",
  water: "Water & sanitation",
};
export const STRATEGIES = {
  balanced: { label: "Balanced starting point", weights: [1, 1, 1, 1, 1, 1] },
  social: { label: "Social services preference", weights: [3, 3, 1, 1, 1, 3] },
  infrastructure: { label: "Infrastructure preference", weights: [1, 1, 3, 1, 3, 2] },
};
export const STATUSES = ["Draft", "Under review", "Reviewed", "Rejected"];
