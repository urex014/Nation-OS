// Explicit topic aliases keep retrieval auditable; no model-generated SQL is executed.
export const topics = [
  ["SP.POP.TOTL", /\b(population|people|residents)\b/],
  ["NY.GDP.MKTP.KD.ZG", /\b(gdp growth|economic growth)\b/],
  ["NY.GDP.MKTP.CD", /\b(gdp|economic output)\b/],
  ["FP.CPI.TOTL.ZG", /\b(inflation|consumer prices|cost of living)\b/],
  ["SL.UEM.TOTL.ZS", /\b(unemployment|unemployed|jobs|employment)\b/],
  ["EG.ELC.ACCS.ZS", /\b(electricity|power|energy)\b/],
  ["SE.PRM.ENRR", /\b(education|school|schools|enrolment|enrollment)\b/],
  ["SH.H2O.BASW.ZS", /\b(water|sanitation)\b/],
  ["SH.DYN.MORT", /\b(mortality|child deaths)\b/],
  ["SH.XPD.CHEX.GD.ZS", /\b(health|healthcare|health expenditure)\b/],
  ["NY.GDP.TOTL.RT.ZS", /\b(resources|resource|oil|minerals)\b/],
];
export const prompts = [
  "Compare Lagos and Rivers revenue",
  "Which states collect the most IGR?",
  "How has Kano revenue changed since 2019?",
  "What does the data say about education?",
  "What is Nigeria's population?",
  "Model my current investment plan",
];
