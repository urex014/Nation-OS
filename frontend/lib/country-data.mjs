/** Join small seed files in stable ID order, with the capital territory last. */
import zones from "../data/country/zones.json" with { type: "json" };
import education from "../data/country/sectors/education.json" with { type: "json" };
import transport from "../data/country/sectors/transport.json" with { type: "json" };
import health from "../data/country/sectors/health.json" with { type: "json" };
import energy from "../data/country/sectors/energy.json" with { type: "json" };
import water from "../data/country/sectors/water.json" with { type: "json" };
const sectors = { education, transport, health, energy, water };
import north from "../data/country/states/zone-1.json" with { type: "json" };
import plains from "../data/country/states/zone-2.json" with { type: "json" };
import west from "../data/country/states/zone-3.json" with { type: "json" };
import central from "../data/country/states/zone-4.json" with { type: "json" };
import east from "../data/country/states/zone-5.json" with { type: "json" };
import coast from "../data/country/states/zone-6.json" with { type: "json" };
const states = [north, plains, west, central, east, coast].flat().sort((a, b) => {
  if (a.id === "AD-CT") return 1;
  if (b.id === "AD-CT") return -1;
  return a.id.localeCompare(b.id);
});
export default { zones, sectors, states };
