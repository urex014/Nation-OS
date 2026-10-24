/** Labels and units are explicit: national observations cannot be assigned to individual states. */
export const INDICATORS = {
  "SP.POP.TOTL": {
    label: "Population",
    unit: "people",
    note: "World Bank estimate for Nigeria. Not a state census.",
  },
  "NY.GDP.MKTP.CD": {
    label: "GDP",
    unit: "current US$",
    note: "The size of the economy in current US dollars. Not money the government collected.",
  },
  "NY.GDP.MKTP.KD.ZG": {
    label: "Real GDP growth",
    unit: "%",
    note: "Yearly growth after inflation. The series can be revised.",
  },
  "FP.CPI.TOTL.ZG": {
    label: "Consumer inflation",
    unit: "%",
    note: "How much consumer prices rose that year. Not a guess about the future.",
  },
  "SL.UEM.TOTL.ZS": {
    label: "Unemployment",
    unit: "%",
    note: "An ILO estimate. Some Nigerian series define unemployment differently.",
  },
  "EG.ELC.ACCS.ZS": {
    label: "Electricity access",
    unit: "% of population",
    note: "This is access, not how reliable the supply is or how many hours it runs.",
  },
  "SE.PRM.ENRR": {
    label: "Primary enrolment",
    unit: "gross %",
    note: "Gross enrolment can pass 100%. It is not attendance or a measure of learning.",
  },
  "SH.H2O.BASW.ZS": {
    label: "Basic drinking water",
    unit: "% of population",
    note: "At least a basic service. Not the same as safely managed water.",
  },
  "SH.DYN.MORT": {
    label: "Under-five mortality",
    unit: "per 1,000 live births",
    note: "Estimated deaths before age five. Not a measure of access to healthcare.",
  },
  "SH.XPD.CHEX.GD.ZS": {
    label: "Health expenditure",
    unit: "% of GDP",
    note: "Health spending from all sources, not only the government budget.",
  },
  "NY.GDP.TOTL.RT.ZS": {
    label: "Natural-resource rents",
    unit: "% of GDP",
    note: "An estimate of resource rents. Not reserves, and not what government received.",
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
