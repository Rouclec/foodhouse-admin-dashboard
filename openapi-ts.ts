import { createClient, UserConfig } from "@hey-api/openapi-ts";
import fs from "fs/promises";
import path from "path";

// Directory containing your OpenAPI spec files
const specsDir: string = "openapi";
// Output directories for generated clients
const outputDirs: string[] = ["mobile/client", "admindashboard/client", "agentsApp/client"]; // Add more paths if needed

/**
 * Ensure the output directories are deleted and recreated.
 */
async function ensureOutputDirs(): Promise<void> {
  for (const outputDir of outputDirs) {
    try {
      console.log(`Cleaning up output directory: ${outputDir}`);
      await fs.rm(outputDir, { recursive: true, force: true });

      console.log(`Recreating output directory: ${outputDir}`);
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err: any) {
      console.error(
        `Error ensuring output directory (${outputDir}): ${err.message}`
      );
    }
  }
}

/**
 * Generate clients for all OpenAPI spec files in a directory for multiple output locations.
 * @param dir - Directory path to scan for OpenAPI JSON files.
 */
async function generateClients(dir: string): Promise<void> {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath: string = path.join(dir, file.name);

      if (file.isDirectory()) {
        await generateClients(fullPath); // Recursively process subdirectories
      } else if (file.isFile() && file.name.endsWith(".json")) {
        for (const outputDir of outputDirs) {
          const outputPath: string = path.join(
            outputDir,
            path.basename(file.name, ".json")
          );

          try {
            const options: UserConfig = {
              client: "@hey-api/client-axios",
              input: fullPath,
              output: {
                format: "prettier",
                lint: "eslint",
                path: outputPath,
              },
              plugins: ["@tanstack/react-query"],
            };

            await createClient(options);
            console.log(`Client generated for ${file.name} at ${outputPath}`);
          } catch (error: any) {
            console.error(
              `Error generating client for ${file.name} at ${outputPath}: ${error.message}`
            );
          }
        }
      }
    }
  } catch (err: any) {
    console.error(`Error reading directory: ${err.message}`);
  }
}

/**
 * Main function to run the script.
 */
(async () => {
  try {
    await ensureOutputDirs(); // Clean up and create output directories
    await generateClients(specsDir); // Generate clients in all output directories
  } catch (error: any) {
    console.error(`Error in main execution: ${error.message}`);
  }
})();
