/** Pure, versioned citizen generation: stable numeric IDs create synthetic records without allocating millions of database rows. */
(function (root) {
  const version = "aderin-citizens-v2";
  // Repeatability only: this mixing function is not cryptography or a real demographic sampler.
  function random(seed, salt) {
    let x = Math.imul(seed + 1, 0x45d9f3b) ^ Math.imul(salt + 1, 0x27d4eb2d);
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  }
  function prepare(states) {
    let offset = 0;
    return states.map((s) => {
      const count = s.citizenCount;
      const r = { ...s, offset, count };
      offset += count;
      return r;
    });
  }
  function citizen(index, states) {
    const total = states.reduce((n, s) => n + s.count, 0);
    if (!Number.isInteger(index) || index < 0 || index >= total)
      throw new RangeError("Citizen index outside registry");
    const state = states.find((s) => index >= s.offset && index < s.offset + s.count),
      local = index - state.offset,
      household = Math.floor(local / 4),
      householdSeed = state.offset + household,
      member = local % 4;
    const age = Math.floor(random(index, 1) * 90),
      income = Math.round((18000 + random(householdSeed, 4) * 145000) / 100) * 100;
    const names = [
      "Amari",
      "Zina",
      "Dami",
      "Ete",
      "Neri",
      "Kemi",
      "Tari",
      "Sola",
      "Mira",
      "Lami",
      "Orin",
      "Sena",
      "Tomi",
      "Vera",
      "Ari",
      "Noma",
    ];
    const surnames = [
      "Talun",
      "Orava",
      "Belari",
      "Senari",
      "Kelora",
      "Navira",
      "Daran",
      "Lumari",
      "Moravi",
      "Solari",
      "Tavira",
      "Merani",
    ];
    const school = age >= 5 && age <= 18;
    return {
      id: `AD-C-${String(index + 1).padStart(8, "0")}`,
      synthetic: true,
      generatorVersion: version,
      populationVersion: state.populationVersion,
      name: `${names[Math.floor(random(index, 2) * names.length)]} ${surnames[Math.floor(random(householdSeed, 3) * surnames.length)]}`,
      age,
      referenceYear: 2026,
      stateId: state.id,
      state: state.name,
      zone: state.zone,
      settlement: random(householdSeed, 5) < 0.48 ? "Rural" : "Urban",
      householdId: `AD-H-${state.id}-${String(household + 1).padStart(7, "0")}`,
      householdSize: Math.min(4, state.count - household * 4),
      householdMember: member + 1,
      occupation:
        age < 5
          ? "Early childhood"
          : age < 19
            ? "Student-age"
            : age >= 65
              ? "Retired / older adult"
              : [
                  "Farmer",
                  "Trader",
                  "Teacher",
                  "Health worker",
                  "Transport worker",
                  "Service worker",
                  "Seeking work",
                ][Math.floor(random(index, 6) * 7)],
      householdMonthlyIncome: income,
      currency: "A₦",
      schoolAttendance: school ? random(index, 7) < state.education : null,
      electricityAccess: random(householdSeed, 8) < state.energy,
      safeWaterAccess: random(householdSeed, 9) < state.water,
      primaryCareAccess: random(householdSeed, 10) < state.health,
      essentialServiceJourneyMinutes: Math.max(
        5,
        Math.round(state.transport * (0.5 + random(householdSeed, 11))),
      ),
      foodPressure: random(householdSeed, 12) < state.food / 100,
      religion: ["Christian", "Muslim", "Traditional belief", "No religion", "Not stated"][
        Math.floor(random(index, 13) * 5)
      ],
      primaryLanguage: ["Aderi", "Korani", "Savari", "Coastal creole"][
        Math.floor(random(householdSeed, 14) * 4)
      ],
      disabilitySupportNeed:
        random(index, 15) < 0.12 ? "Accessibility support needed" : "No support need recorded",
      educationLevel:
        age < 6
          ? "Not school age"
          : age < 12
            ? "Primary-age"
            : age < 19
              ? "Secondary-age"
              : ["No formal qualification", "Primary", "Secondary", "Vocational", "Tertiary"][
                  Math.floor(random(index, 16) * 5)
                ],
      employmentStatus:
        age < 19
          ? "Not modelled: child or student-age"
          : age >= 65
            ? "Older adult"
            : random(index, 17) < 0.18
              ? "Seeking work"
              : "Working",
      digitalAccess: random(householdSeed, 18) < 0.62,
      healthcareJourneyMinutes: Math.max(
        5,
        Math.round(state.transport * (0.6 + random(householdSeed, 19))),
      ),
      housingTenure: ["Owned", "Rented", "Shared"][Math.floor(random(householdSeed, 20) * 3)],
      climateExposure: ["Lower", "Moderate", "Higher"][Math.floor(random(householdSeed, 21) * 3)],
    };
  }
  const api = { version, prepare, citizen };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CitizenData = api;
})(globalThis);
