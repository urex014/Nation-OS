export type Jurisdiction = {
  id: string;
  name: string;
  zone: string;
  population: number | null;
};

/** Names and zones only. Population is not loaded; no census series is in the cited files. */
export const JURISDICTIONS: Jurisdiction[] = [
  { id: "NG-AB", name: "Abia", zone: "South East", population: null },
  { id: "NG-AD", name: "Adamawa", zone: "North East", population: null },
  { id: "NG-AK", name: "Akwa Ibom", zone: "South South", population: null },
  { id: "NG-AN", name: "Anambra", zone: "South East", population: null },
  { id: "NG-BA", name: "Bauchi", zone: "North East", population: null },
  { id: "NG-BY", name: "Bayelsa", zone: "South South", population: null },
  { id: "NG-BE", name: "Benue", zone: "North Central", population: null },
  { id: "NG-BO", name: "Borno", zone: "North East", population: null },
  { id: "NG-CR", name: "Cross River", zone: "South South", population: null },
  { id: "NG-DE", name: "Delta", zone: "South South", population: null },
  { id: "NG-EB", name: "Ebonyi", zone: "South East", population: null },
  { id: "NG-ED", name: "Edo", zone: "South South", population: null },
  { id: "NG-EK", name: "Ekiti", zone: "South West", population: null },
  { id: "NG-EN", name: "Enugu", zone: "South East", population: null },
  { id: "NG-FC", name: "FCT", zone: "North Central", population: null },
  { id: "NG-GO", name: "Gombe", zone: "North East", population: null },
  { id: "NG-IM", name: "Imo", zone: "South East", population: null },
  { id: "NG-JI", name: "Jigawa", zone: "North West", population: null },
  { id: "NG-KD", name: "Kaduna", zone: "North West", population: null },
  { id: "NG-KN", name: "Kano", zone: "North West", population: null },
  { id: "NG-KT", name: "Katsina", zone: "North West", population: null },
  { id: "NG-KE", name: "Kebbi", zone: "North West", population: null },
  { id: "NG-KO", name: "Kogi", zone: "North Central", population: null },
  { id: "NG-KW", name: "Kwara", zone: "North Central", population: null },
  { id: "NG-LA", name: "Lagos", zone: "South West", population: null },
  { id: "NG-NA", name: "Nasarawa", zone: "North Central", population: null },
  { id: "NG-NI", name: "Niger", zone: "North Central", population: null },
  { id: "NG-OG", name: "Ogun", zone: "South West", population: null },
  { id: "NG-ON", name: "Ondo", zone: "South West", population: null },
  { id: "NG-OS", name: "Osun", zone: "South West", population: null },
  { id: "NG-OY", name: "Oyo", zone: "South West", population: null },
  { id: "NG-PL", name: "Plateau", zone: "North Central", population: null },
  { id: "NG-RI", name: "Rivers", zone: "South South", population: null },
  { id: "NG-SO", name: "Sokoto", zone: "North West", population: null },
  { id: "NG-TA", name: "Taraba", zone: "North East", population: null },
  { id: "NG-YO", name: "Yobe", zone: "North East", population: null },
  { id: "NG-ZA", name: "Zamfara", zone: "North West", population: null },
];
