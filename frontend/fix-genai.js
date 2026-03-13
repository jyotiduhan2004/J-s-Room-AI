const fs = require("fs");
const path = require("path");
const target = path.join(__dirname, "node_modules/@google/genai/dist/node/index.mjs");
if (!fs.existsSync(target)) {
  fs.writeFileSync(target, 'export * from "../web/index.mjs";\n');
  console.log("Created @google/genai ESM shim");
}
