/** Preserve the ID ranges defined by original citizen offsets. */
module.exports = [
  require("./citizens/zone-1.json"),
  require("./citizens/zone-2.json"),
  require("./citizens/zone-3.json"),
  require("./citizens/zone-4.json"),
  require("./citizens/zone-5.json"),
  require("./citizens/zone-6.json"),
]
  .flat()
  .sort((a, b) => a.offset - b.offset);
