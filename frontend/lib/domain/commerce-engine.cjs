/** Generate business records and balanced banking/monetary snapshots. Turnover, GDP and money supply must remain separate measures. */
(function (root) {
  const version = "aderin-commerce-v1";
  const industries = [
    "Agriculture & fisheries",
    "Manufacturing",
    "Retail & wholesale",
    "Transport & logistics",
    "Digital services",
    "Construction",
    "Professional services",
  ];
  function random(seed, salt) {
    let x = Math.imul(seed + 1, 0x45d9f3b) ^ Math.imul(salt + 1, 0x27d4eb2d);
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  }
  function apportion(total, weights) {
    const sum = weights.reduce((a, b) => a + b, 0),
      raw = weights.map((w) => (w / sum) * total),
      counts = raw.map(Math.floor),
      remaining = total - counts.reduce((a, b) => a + b, 0);
    raw
      .map((x, i) => ({ i, f: x - counts[i] }))
      .sort((a, b) => b.f - a.f || a.i - b.i)
      .slice(0, remaining)
      .forEach((r) => counts[r.i]++);
    return counts;
  }
  function build(states) {
    const counts = apportion(
        24600,
        states.map((s) => s.citizenCount),
      ),
      financial = {
        period: "2026-Q3",
        unit: "million Aderin naira",
        currencyIssued: 60000,
        vaultCash: 12000,
        currencyOutsideBanks: 48000,
        overnightDeposits: 180000,
        shortTermDeposits: 100000,
        reservesAtCentralBank: 24000,
      };
    financial.totalDeposits = financial.overnightDeposits + financial.shortTermDeposits;
    financial.narrowMoney = financial.currencyOutsideBanks + financial.overnightDeposits;
    financial.extendedMoney = financial.narrowMoney + financial.shortTermDeposits;
    financial.monetaryBase = financial.currencyIssued + financial.reservesAtCentralBank;
    const names = [
        "Aderin Commercial Bank",
        "Ayara Union Bank",
        "Sava Community Bank",
        "Azure Merchant Bank",
        "Kora Development Bank",
        "Marava International Bank",
        "Lydora Trade Bank",
        "Eastbank Partnership Bank",
      ],
      shares = [24, 18, 15, 12, 10, 8, 7, 6],
      domestic = [100, 100, 85, 75, 100, 0, 25, 50],
      branches = [180, 135, 110, 80, 65, 45, 40, 30];
    const banks = names.map((name, i) => {
      const w = shares[i] / 100,
        deposits = financial.totalDeposits * w,
        equity = 40000 * w,
        wholesaleFunding = 30000 * w;
      return {
        id: `AD-B-${String(i + 1).padStart(3, "0")}`,
        name,
        domesticOwnershipPercent: domestic[i],
        ownership:
          domestic[i] > 50
            ? "Domestic-controlled"
            : domestic[i] < 50
              ? "Foreign-controlled"
              : "Joint control",
        ownerCountry:
          domestic[i] > 50 ? "Aderin" : i === 5 ? "Marava" : i === 6 ? "Lydora" : "Aderin / Marava",
        headquartersStateId: states[[36, 18, 6, 30, 0, 31, 12, 24][i]].id,
        branches: branches[i],
        branchesByState: apportion(
          branches[i],
          states.map((s) => s.citizenCount),
        ),
        overnightDeposits: financial.overnightDeposits * w,
        shortTermDeposits: financial.shortTermDeposits * w,
        deposits,
        loans: 210000 * w,
        governmentSecurities: 64000 * w,
        reserves: financial.reservesAtCentralBank * w,
        vaultCash: financial.vaultCash * w,
        otherAssets: 40000 * w,
        equity,
        wholesaleFunding,
        totalAssets: 350000 * w,
        totalLiabilitiesAndEquity: deposits + equity + wholesaleFunding,
        nonPerformingLoanPercent: 3 + i * 0.35,
        synthetic: true,
        period: financial.period,
      };
    });
    let offset = 0;
    const register = states.map((s, i) => {
      const row = { ...s, businessOffset: offset, businessCount: counts[i] };
      offset += counts[i];
      return row;
    });
    function business(index) {
      if (!Number.isInteger(index) || index < 0 || index >= 24600)
        throw new RangeError("Business index outside register");
      const state = register.find(
          (s) => index >= s.businessOffset && index < s.businessOffset + s.businessCount,
        ),
        r = random(index, 1),
        ownership =
          r < 0.7 ? "Domestic-controlled" : r < 0.88 ? "Foreign-controlled" : "Joint control",
        domesticOwnershipPercent =
          ownership === "Domestic-controlled"
            ? random(index, 2) < 0.6
              ? 100
              : 75
            : ownership === "Foreign-controlled"
              ? random(index, 2) < 0.6
                ? 0
                : 25
              : 50,
        industryIndex = Math.floor(random(index, 3) * industries.length),
        size = random(index, 4),
        employees =
          size < 0.8
            ? 1 + Math.floor(random(index, 5) * 9)
            : size < 0.97
              ? 10 + Math.floor(random(index, 5) * 40)
              : 50 + Math.floor(random(index, 5) * 200),
        suffix = ["Harvest", "Works", "Trading", "Transit", "Digital", "Build", "Advisory"][
          industryIndex
        ],
        bank = banks[Math.floor(random(index, 6) * banks.length)];
      return {
        id: `AD-F-${String(index + 1).padStart(6, "0")}`,
        name: `${state.name.replace(" State", "").replace(" Capital Territory", "")} ${suffix} ${String(index + 1).padStart(5, "0")}`,
        stateId: state.id,
        state: state.name,
        industry: industries[industryIndex],
        ownership,
        domesticOwnershipPercent,
        ultimateOwnerCountry:
          ownership === "Domestic-controlled"
            ? "Aderin"
            : ownership === "Joint control"
              ? "Aderin / Marava"
              : ["Marava", "Lydora", "Teren"][Math.floor(random(index, 7) * 3)],
        incorporationCountry: "Aderin",
        employees,
        annualTurnoverMillions:
          Math.round(employees * (0.04 + random(index, 8) * 0.36) * 100) / 100,
        marketScope: ["State-local", "National", "Export markets"][
          Math.floor(random(index, 9) * 3)
        ],
        legalForm:
          ownership === "Domestic-controlled" && random(index, 10) < 0.25
            ? "Cooperative"
            : "Limited company",
        bankId: bank.id,
        bank: bank.name,
        synthetic: true,
        period: "2026-Q3",
      };
    }
    const summary = register.map((s) => ({
      stateId: s.id,
      businesses: s.businessCount,
      domestic: 0,
      foreign: 0,
      joint: 0,
      employees: 0,
      turnoverMillions: 0,
    }));
    for (let i = 0; i < 24600; i++) {
      const b = business(i),
        row = summary.find((s) => s.stateId === b.stateId);
      row[
        b.ownership === "Domestic-controlled"
          ? "domestic"
          : b.ownership === "Foreign-controlled"
            ? "foreign"
            : "joint"
      ]++;
      row.employees += b.employees;
      row.turnoverMillions += b.annualTurnoverMillions;
    }
    summary.forEach((s) => (s.turnoverMillions = Math.round(s.turnoverMillions * 100) / 100));
    return {
      version,
      financial,
      banks,
      states: register,
      summary,
      totalBusinesses: 24600,
      industries,
      business,
    };
  }
  const api = { version, build };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CommerceEngine = api;
})(globalThis);
