import fs from "fs";
import path from "path";

// ── Crime CSV parser ──────────────────────────────────────────────────────────
// cPOC.csv: STATE/UT, YEAR, ...crime columns...
// We use "TOTAL - Theft" + "TOTAL - Robbery" + "TOTAL - Burglary" + "TOTAL - Dacoity"
// as a composite crime index for the most recent year available per state.

const crimeStateToCityMap: Record<string, string[]> = {
  "WEST BENGAL":        ["Kolkata"],
  "DELHI":              ["Delhi"],
  "MAHARASHTRA":        ["Mumbai", "Pune", "Nagpur"],
  "KARNATAKA":          ["Bangalore", "Bengaluru", "Mysuru"],
  "TELANGANA":          ["Hyderabad"],
  "TAMIL NADU":         ["Chennai"],
  "GUJARAT":            ["Ahmedabad", "Surat"],
  "RAJASTHAN":          ["Jaipur"],
  "UTTAR PRADESH":      ["Lucknow"],
  "MADHYA PRADESH":     ["Bhopal", "Indore"],
  "BIHAR":              ["Patna"],
  "CHANDIGARH":         ["Chandigarh"],
  "KERALA":             ["Kochi"],
  "ANDHRA PRADESH":     ["Visakhapatnam"],
  "ODISHA":             ["Bhubaneswar"],
};

// Build reverse map: city name (lowercase) → state name
const cityToState: Record<string, string> = {};
for (const [state, cities] of Object.entries(crimeStateToCityMap)) {
  for (const city of cities) {
    cityToState[city.toLowerCase()] = state;
  }
}

let crimeByState: Record<string, number> | null = null;

function loadCrimeData(): Record<string, number> {
  if (crimeByState) return crimeByState;

  const csvPath = path.join(process.cwd(), "data", "cPOC.csv");
  if (!fs.existsSync(csvPath)) return {};

  const lines = fs.readFileSync(csvPath, "utf-8").split("\n");
  // Header: STATE/UT, YEAR, ...
  // Columns (0-indexed): 0=STATE, 1=YEAR, 29=TOTAL-Dacoity, 30=TOTAL-Robbery, 31=TOTAL-Burglary, 32=TOTAL-Theft
  const latestByState: Record<string, { year: number; total: number }> = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse quoted CSV
    const cols = line.split(",").map((c) => c.replace(/"/g, "").trim());
    if (cols.length < 33) continue;

    const state = cols[0].toUpperCase();
    const year = parseInt(cols[1], 10);
    if (isNaN(year)) continue;
    if (state.startsWith("TOTAL")) continue; // skip aggregate rows

    const dacoity  = parseInt(cols[29], 10) || 0;
    const robbery  = parseInt(cols[30], 10) || 0;
    const burglary = parseInt(cols[31], 10) || 0;
    const theft    = parseInt(cols[32], 10) || 0;
    const total = dacoity + robbery + burglary + theft;

    if (!latestByState[state] || year > latestByState[state].year) {
      latestByState[state] = { year, total };
    }
  }

  crimeByState = {};
  for (const [state, data] of Object.entries(latestByState)) {
    crimeByState[state] = data.total;
  }

  return crimeByState;
}

/**
 * Get crime index for a city (total property crimes from latest year in CSV).
 * Returns null if city/state not found.
 */
export function getCrimeFromCSV(cityName: string): number | null {
  const data = loadCrimeData();
  const state = cityToState[cityName.toLowerCase()];
  if (!state) return null;
  const value = data[state];
  return value !== undefined ? value : null;
}

// ── Schools CSV parser ────────────────────────────────────────────────────────
// DistrictWiseSchools2019_20.csv: Karnataka districts only
// Columns: Sl.No, Management, District, Lower Primary(R,U,T), Upper Primary(R,U,T),
//          Elementary(R,U,T), Secondary(R,U,T), Higher Secondary(R,U,T)
// We use Elementary Total (col index 11) for "All Management" rows as school density proxy.

const districtToCityMap: Record<string, string> = {
  "BENGALURU U NORTH": "Bengaluru",
  "BENGALURU U SOUTH":  "Bengaluru",
  "BENGALURU RURAL":    "Bengaluru",
  "MYSURU":             "Mysuru",
};

let schoolByCity: Record<string, number> | null = null;

function loadSchoolData(): Record<string, number> {
  if (schoolByCity) return schoolByCity;

  const csvPath = path.join(process.cwd(), "data", "DistrictWiseSchools2019_20.csv");
  if (!fs.existsSync(csvPath)) return {};

  const lines = fs.readFileSync(csvPath, "utf-8").split("\n");
  const cityTotals: Record<string, number> = {};

  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",").map((c) => c.trim());
    if (cols.length < 12) continue;

    const management = cols[1];
    const districtRaw = cols[2];

    if (!management.startsWith("01-All Management")) continue;
    if (!districtRaw) continue; // skip subtotal rows

    const districtName = districtRaw.replace(/-\d+$/, "").trim().toUpperCase();

    const city = districtToCityMap[districtName];
    if (!city) continue;

    const elemTotal = parseInt(cols[11], 10) || 0;
    cityTotals[city] = (cityTotals[city] || 0) + elemTotal;
  }

  schoolByCity = cityTotals;
  return schoolByCity;
}


export function getSchoolsFromCSV(cityName: string): number | null {
  const data = loadSchoolData();
  const key = Object.keys(data).find(
    (k) => k.toLowerCase() === cityName.toLowerCase()
  );
  if (!key) return null;
  return data[key] ?? null;
}
