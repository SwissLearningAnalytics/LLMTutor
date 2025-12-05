import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";
import { fileURLToPath } from "url";

// Paths
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const tutorsDir = path.join(scriptDir, "tutors", "tutors");
const outputFile = path.join(scriptDir, "tutors", "index.ts");

// Type for tutor data
interface TutorData {
  tutor_id: string;
  filename: string;
}

// Check if tutors directory exists
if (!fs.existsSync(tutorsDir)) {
  console.error(`Error: Directory ${tutorsDir} does not exist`);
  process.exit(1);
}

// Read all YAML files and extract IDs
const tutorIds: TutorData[] = [];
const yamlFiles = fs
  .readdirSync(tutorsDir)
  .filter((file: string) => file.endsWith(".yaml"));

console.log(`Found ${yamlFiles.length} YAML files in ${tutorsDir}`);

for (const yamlFile of yamlFiles) {
  const filePath = path.join(tutorsDir, yamlFile);
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const parsedYaml = parse(fileContent) as any;

    if (parsedYaml && parsedYaml.tutor_id) {
      tutorIds.push({
        tutor_id: parsedYaml.tutor_id,
        filename: path.basename(yamlFile, ".yaml"),
      });
    }
  } catch (error: any) {
    console.error(`Error parsing ${yamlFile}:`, error.message);
  }
}

// Sort by ID for consistent output
tutorIds.sort((a, b) => a.tutor_id.localeCompare(b.tutor_id));

// Generate TypeScript content
let content = `// This file is auto-generated. Do not edit directly.
import type { Tutor } from "@/lib/types/tutor";

export async function getTutor(tutorId: string): Promise<Tutor> {
  switch (tutorId) {
`;

// Generate switch cases
for (const tutor of tutorIds) {
  content += `    case "${tutor.tutor_id}":\n`;
  content += `      return (await import("./tutors/${tutor.filename}.yaml")).default as Tutor;\n`;
}

content += `    default:
      throw new Error("Tutor not found");
  }
}

export const tutorIds = [
`;

// Generate tutorIds array
for (const tutor of tutorIds) {
  content += `  "${tutor.tutor_id}",\n`;
}

content += `];
`;

// Write the file
fs.writeFileSync(outputFile, content);
console.log(`Generated ${outputFile} successfully!`);
console.log(
  `Found ${tutorIds.length} tutors:`,
  tutorIds.map((t) => t.tutor_id),
);
