import paths from "@/data/cited/map-paths.json";

export type MapPath = { id: string; name: string; path: string };

export const MAP_PATHS = paths as MapPath[];

const COLOURS = ["#dcece3", "#abcab8", "#77a58c", "#3b7959", "#145337"];

export function faacFill(rank: number | null, total: number): string {
  if (rank == null) return "#d6d3d1";
  return COLOURS[Math.min(4, Math.floor((total - rank) / 8))];
}
