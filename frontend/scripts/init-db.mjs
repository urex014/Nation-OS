import { getDatabase, sourceDirectory, databasePath } from "../lib/nigeria/database.mjs";
import { importNigeriaData } from "../lib/nigeria/import-data.mjs";
// Re-importing observations never erases saved decisions or historical run snapshots.
importNigeriaData(getDatabase(), sourceDirectory());
console.log("Nigeria observations imported:", databasePath());
