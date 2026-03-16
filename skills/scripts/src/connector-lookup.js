#!/usr/bin/env node
/**
 * Connector Definition Lookup Tool
 *
 * Queries connector definition YAML files stored in reference/connectors/.
 * Lets agent skills explore connector operations without loading full files.
 *
 * Usage:
 *     node connector-lookup.bundle.js list
 *     node connector-lookup.bundle.js operations <connector>
 *     node connector-lookup.bundle.js operation <connector> <operationId>
 *     node connector-lookup.bundle.js search <keyword>
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// --- Path helpers ---

function getConnectorsDir() {
  const scriptDir = __dirname;
  // When bundled, __dirname is scripts/; go up one level to project root
  let projectRoot = path.resolve(scriptDir, "..");
  let dir = path.join(projectRoot, "reference", "connectors");

  if (!fs.existsSync(dir)) {
    // Try two levels up (running from scripts/src/)
    projectRoot = path.resolve(scriptDir, "..", "..");
    dir = path.join(projectRoot, "reference", "connectors");
  }

  if (!fs.existsSync(dir)) {
    console.error(`Error: Connectors directory not found at ${dir}`);
    console.error("Please place connector YAML files in 'reference/connectors/'.");
    process.exit(1);
  }

  return dir;
}

function listConnectorFiles() {
  const dir = getConnectorsDir();
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => path.join(dir, f));
}

function loadConnector(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return yaml.load(raw);
}

// --- Connector matching ---

function findConnectorFile(query) {
  const files = listConnectorFiles();
  const queryLower = query.toLowerCase();

  // Exact match on API name (filename without extension)
  for (const f of files) {
    const basename = path.basename(f, path.extname(f));
    if (basename.toLowerCase() === queryLower) return f;
  }

  // Partial match on API name
  for (const f of files) {
    const basename = path.basename(f, path.extname(f));
    if (basename.toLowerCase().includes(queryLower)) return f;
  }

  // Match on displayName (requires loading each file header)
  for (const f of files) {
    const data = loadConnector(f);
    if (data.displayName && data.displayName.toLowerCase().includes(queryLower)) {
      return f;
    }
  }

  return null;
}

// --- Formatting helpers ---

function truncate(str, maxLen) {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

function padRight(str, len) {
  if (str.length >= len) return str;
  return str + " ".repeat(len - str.length);
}

function formatPropertyType(prop) {
  if (!prop) return "unknown";
  if (typeof prop.type === "string") return prop.type;
  if (typeof prop.type === "object" && prop.type.kind) return prop.type.kind;
  return "unknown";
}

function formatProperties(properties, indent) {
  indent = indent || "  ";
  if (!properties) return indent + "(none)\n";

  let out = "";
  const entries = Object.entries(properties);
  entries.sort((a, b) => {
    const orderA = a[1].order != null ? a[1].order : 999;
    const orderB = b[1].order != null ? b[1].order : 999;
    return orderA - orderB;
  });

  for (const [name, prop] of entries) {
    const type = formatPropertyType(prop);
    const required = prop.isRequired ? " (required)" : "";
    const displayName = prop.displayName ? ` — ${prop.displayName}` : "";
    const desc = prop.description ? `: ${prop.description}` : "";
    out += `${indent}${name}${displayName} [${type}${required}]${desc}\n`;

    // Show nested record properties
    if (typeof prop.type === "object" && prop.type.properties) {
      out += formatProperties(prop.type.properties, indent + "  ");
    }
  }

  return out;
}

// --- Commands ---

function cmdList() {
  const files = listConnectorFiles();
  if (files.length === 0) {
    console.log("No connector definitions found in reference/connectors/");
    return;
  }

  console.log("Available connectors:\n");
  console.log(padRight("API Name", 40) + padRight("Display Name", 30) + "Operations");
  console.log("-".repeat(80));

  for (const f of files) {
    const data = loadConnector(f);
    const apiName = path.basename(f, path.extname(f));
    const displayName = data.displayName || "(unknown)";
    const opCount = (data.operations || []).length;
    console.log(padRight(apiName, 40) + padRight(displayName, 30) + opCount);
  }
}

function cmdOperations(query) {
  const file = findConnectorFile(query);
  if (!file) {
    console.error(`Error: No connector found matching '${query}'`);
    console.error("Run 'list' to see available connectors.");
    process.exit(1);
  }

  const data = loadConnector(file);
  const operations = data.operations || [];
  const apiName = path.basename(file, path.extname(file));

  console.log(`${data.displayName} (${apiName}) — ${operations.length} operations\n`);
  console.log(padRight("operationId", 40) + padRight("Display Name", 45) + "Description");
  console.log("-".repeat(130));

  for (const op of operations) {
    const opId = op.operationId || "(no id)";
    const displayName = op.displayName || "";
    const desc = truncate(op.description || "", 60);
    console.log(padRight(opId, 40) + padRight(displayName, 45) + desc);
  }
}

function cmdOperation(connectorQuery, operationId) {
  const file = findConnectorFile(connectorQuery);
  if (!file) {
    console.error(`Error: No connector found matching '${connectorQuery}'`);
    process.exit(1);
  }

  const data = loadConnector(file);
  const operations = data.operations || [];
  const opIdLower = operationId.toLowerCase();

  const op = operations.find((o) => o.operationId && o.operationId.toLowerCase() === opIdLower);
  if (!op) {
    console.error(`Error: Operation '${operationId}' not found in ${data.displayName}`);
    console.error("\nAvailable operations:");
    for (const o of operations) {
      console.error(`  ${o.operationId}`);
    }
    process.exit(1);
  }

  const apiName = path.basename(file, path.extname(file));

  console.log(`Connector: ${data.displayName} (${apiName})`);
  console.log(`ConnectorId: ${data.connectorId}`);
  console.log(`Operation: ${op.displayName}`);
  console.log(`OperationId: ${op.operationId}`);
  if (op.description) console.log(`Description: ${op.description}`);
  console.log("");

  // Input type
  if (op.inputType && op.inputType.properties) {
    console.log("Inputs:");
    console.log(formatProperties(op.inputType.properties));
  } else {
    console.log("Inputs: (none)\n");
  }

  // Output type
  if (op.outputType) {
    console.log("Outputs:");
    if (op.outputType.properties) {
      console.log(formatProperties(op.outputType.properties));
    } else if (op.outputType.kind) {
      console.log(`  kind: ${op.outputType.kind}\n`);
    }
  } else {
    console.log("Outputs: (none)\n");
  }
}

function cmdSearch(keyword) {
  const files = listConnectorFiles();
  const keywordLower = keyword.toLowerCase();
  const results = [];

  for (const f of files) {
    const data = loadConnector(f);
    const apiName = path.basename(f, path.extname(f));
    const connectorName = data.displayName || apiName;

    for (const op of data.operations || []) {
      const displayMatch = op.displayName && op.displayName.toLowerCase().includes(keywordLower);
      const descMatch = op.description && op.description.toLowerCase().includes(keywordLower);

      if (displayMatch || descMatch) {
        results.push({
          connector: connectorName,
          apiName,
          operationId: op.operationId || "(no id)",
          displayName: op.displayName || "",
          description: truncate(op.description || "", 60),
        });
      }
    }
  }

  if (results.length === 0) {
    console.log(`No operations found matching '${keyword}'`);
    return;
  }

  console.log(`Found ${results.length} operations matching '${keyword}':\n`);
  console.log(padRight("Connector", 25) + padRight("operationId", 40) + padRight("Display Name", 45) + "Description");
  console.log("-".repeat(160));

  for (const r of results) {
    console.log(padRight(r.connector, 25) + padRight(r.operationId, 40) + padRight(r.displayName, 45) + r.description);
  }
}

// --- Help ---

function printHelp() {
  console.log(`
Connector Definition Lookup Tool

Commands:
    node connector-lookup.bundle.js list                              List all connectors with operation counts
    node connector-lookup.bundle.js operations <connector>            List operations for a connector
    node connector-lookup.bundle.js operation <connector> <opId>      Full details of one operation (inputs/outputs)
    node connector-lookup.bundle.js search <keyword>                  Search operations across all connectors

<connector> matches by API name (shared_office365) or partial display name (outlook).
`);
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    printHelp();
    process.exit(1);
  }

  const command = args[0].toLowerCase();

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  switch (command) {
    case "list":
      cmdList();
      break;

    case "operations": {
      if (args.length < 2) {
        console.error("Error: Please provide a connector name");
        console.error("Usage: node connector-lookup.bundle.js operations <connector>");
        process.exit(1);
      }
      cmdOperations(args[1]);
      break;
    }

    case "operation": {
      if (args.length < 3) {
        console.error("Error: Please provide a connector name and operation ID");
        console.error("Usage: node connector-lookup.bundle.js operation <connector> <operationId>");
        process.exit(1);
      }
      cmdOperation(args[1], args[2]);
      break;
    }

    case "search": {
      if (args.length < 2) {
        console.error("Error: Please provide a search keyword");
        console.error("Usage: node connector-lookup.bundle.js search <keyword>");
        process.exit(1);
      }
      // Join remaining args to support multi-word searches
      cmdSearch(args.slice(1).join(" "));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main();
