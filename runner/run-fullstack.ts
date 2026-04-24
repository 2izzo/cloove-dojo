import { resolve, join } from "path";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import Mustache from "mustache";
import YAML from "yaml";

import { loadContract, contractToYAML, Contract } from "./contract.js";
import { startDevServer, stopDevServer, DevServer } from "./dev-server.js";
import { checkCompliance, ComplianceResult } from "./compliance.js";
import { fireOllama } from "./adapters/ollama";

/**
 * Full-Stack Kata Runner
 * Orchestrates the entire pipeline: scaffold → dev → SDET
 */

export interface FullstackKataOptions {
  kataDir: string; // Path to kata directory
  workspaceDir: string; // Where to create workspace for this run
  dojoRoot?: string; // Root of dojo directory (inferred if not given)
  model?: string; // Optional model override (passed to fireOllama)
}

export interface FullstackRunResult {
  success: boolean;
  kata_name: string;
  workspace: string;
  phases: {
    scaffold: PhaseResult;
    dev: PhaseResult;
    compliance: ComplianceResult;
    sdet: PhaseResult;
    tests_unit: PhaseResult;
    tests_e2e: PhaseResult;
  };
  duration: number;
  errors: string[];
}

export interface PhaseResult {
  success: boolean;
  message: string;
  details?: string;
  error?: string;
}

/**
 * Run a full-stack kata through the complete pipeline
 *
 * Flow:
 * 1. Scaffold workspace from template
 * 2. npm install
 * 3. Load contract
 * 4. Render & fire dev prompt (Ollama develops the app)
 * 5. Start dev server
 * 6. Run compliance check
 * 7. Render & fire SDET prompt (Ollama writes E2E tests)
 * 8. Run E2E tests
 * 9. Run unit tests
 * 10. Stop dev server
 * 11. Return results
 *
 * @param opts - FullstackKataOptions
 * @returns Promise<FullstackRunResult> with phase results
 */
export async function runFullstackKata(
  opts: FullstackKataOptions
): Promise<FullstackRunResult> {
  const startTime = Date.now();

  // Infer DOJO_ROOT if not provided
  const dojoRoot = opts.dojoRoot || inferDojoRoot();

  const kataDir = resolve(opts.kataDir);
  const workspaceDir = resolve(opts.workspaceDir);

  const result: FullstackRunResult = {
    success: false,
    kata_name: "",
    workspace: workspaceDir,
    phases: {
      scaffold: { success: false, message: "" },
      dev: { success: false, message: "" },
      compliance: {
        success: false,
        score: 0,
        totalElements: 0,
        foundElements: 0,
        missingElements: [],
        typeErrors: [],
        errors: [],
      },
      sdet: { success: false, message: "" },
      tests_unit: { success: false, message: "" },
      tests_e2e: { success: false, message: "" },
    },
    duration: 0,
    errors: [],
  };

  let devServer: DevServer | null = null;

  try {
    // --- Phase 1: Scaffold ---
    try {
      const scaffoldResult = await scaffoldWorkspace(
        kataDir,
        workspaceDir,
        dojoRoot
      );
      result.phases.scaffold = scaffoldResult;
      if (!scaffoldResult.success) {
        throw new Error(`Scaffold failed: ${scaffoldResult.error}`);
      }
    } catch (e) {
      result.phases.scaffold = {
        success: false,
        message: "Workspace scaffold failed",
        error: String(e),
      };
      throw e;
    }

    // Load kata metadata
    const kataYamlPath = join(kataDir, "kata.yaml");
    const kataYaml = YAML.parse(readFileSync(kataYamlPath, "utf-8")) as any;
    result.kata_name = kataYaml.name || kataDir.split("/").pop() || "unknown";

    // --- Phase 2: Install ---
    try {
      execSync("npm install", { cwd: workspaceDir, stdio: "pipe" });
    } catch (e) {
      result.phases.scaffold.error = `npm install failed: ${String(e)}`;
      throw e;
    }

    // --- Phase 3: Load Contract ---
    const contractPath = join(kataDir, "contract.yaml");
    let contract: Contract;
    try {
      contract = loadContract(contractPath);
    } catch (e) {
      throw new Error(`Failed to load contract: ${String(e)}`);
    }

    // --- Phase 4: Dev Prompt & Fire ---
    try {
      const devResult = await fireDevCloove(
        result.kata_name,
        kataDir,
        workspaceDir,
        contract,
        dojoRoot,
        opts.model
      );
      result.phases.dev = devResult;
      if (!devResult.success) {
        throw new Error(`Dev Cloove failed: ${devResult.error}`);
      }
    } catch (e) {
      result.phases.dev = {
        success: false,
        message: "Dev Cloove failed",
        error: String(e),
      };
      throw e;
    }

    // --- Phase 4.5: Copy blind e2e oracle tests ---
    // Tests live under kata/e2e/ and get copied into workspace/e2e/ only
    // AFTER the dev Cloove has finished. This keeps the dev agent blind to
    // the oracle (real kata discipline).
    try {
      const kataE2eDir = join(kataDir, "e2e");
      if (existsSync(kataE2eDir)) {
        mkdirSync(join(workspaceDir, "e2e"), { recursive: true });
        for (const f of readdirSync(kataE2eDir)) {
          const src = join(kataE2eDir, f);
          const dst = join(workspaceDir, "e2e", f);
          if (existsSync(src)) copyFileSync(src, dst);
        }
      }
    } catch (e) {
      result.errors.push(`Failed to copy blind e2e tests: ${String(e)}`);
    }

    // --- Phase 5: Start Dev Server ---
    try {
      devServer = await startDevServer(
        workspaceDir,
        contract.dev_server.command,
        contract.dev_server.port,
        contract.dev_server.ready_signal,
        contract.dev_server.startup_timeout_ms
      );
    } catch (e) {
      throw new Error(`Dev server failed to start: ${String(e)}`);
    }

    // --- Phase 6: Compliance Check ---
    try {
      const baseUrl = `http://localhost:${contract.dev_server.port}`;
      const complianceResult = await checkCompliance(baseUrl, contract);
      result.phases.compliance = complianceResult;

      if (!complianceResult.success) {
        result.errors.push(
          `Compliance check failed: ${complianceResult.missingElements.length} missing elements`
        );
      }
    } catch (e) {
      result.phases.compliance = {
        success: false,
        score: 0,
        totalElements: 0,
        foundElements: 0,
        missingElements: [],
        typeErrors: [],
        errors: [String(e)],
      };
      throw new Error(`Compliance check error: ${String(e)}`);
    }

    // --- Phase 7: SDET Prompt & Fire ---
    // Ring 1 blind-oracle mode: if the kata ships pre-written e2e tests under
    // workspace/e2e/ (copied from kata/e2e/ during scaffold), those tests ARE
    // the oracle — skip the SDET Cloove entirely.
    const workspaceE2eDir = join(workspaceDir, "e2e");
    const hasPreseededE2e =
      existsSync(workspaceE2eDir) &&
      readdirSync(workspaceE2eDir).some((f) => f.endsWith(".test.ts"));
    if (hasPreseededE2e) {
      result.phases.sdet = {
        success: true,
        message:
          "Skipped — kata ships blind e2e tests (Ring 1 oracle mode)",
      };
    } else {
      try {
        const sdetResult = await fireSdetCloove(
          result.kata_name,
          kataDir,
          workspaceDir,
          contract,
          dojoRoot,
          opts.model
        );
        result.phases.sdet = sdetResult;
        if (!sdetResult.success) {
          result.errors.push(`SDET Cloove returned: ${sdetResult.error}`);
          // Don't throw — SDET failure is non-blocking for now
        }
      } catch (e) {
        result.phases.sdet = {
          success: false,
          message: "SDET Cloove failed",
          error: String(e),
        };
      }
    }

    // --- Phase 8: E2E Tests ---
    try {
      const e2eResult = runE2ETests(workspaceDir);
      result.phases.tests_e2e = e2eResult;
    } catch (e) {
      result.phases.tests_e2e = {
        success: false,
        message: "E2E tests failed",
        error: String(e),
      };
    }

    // --- Phase 9: Unit Tests ---
    try {
      const unitResult = runUnitTests(workspaceDir);
      result.phases.tests_unit = unitResult;
    } catch (e) {
      result.phases.tests_unit = {
        success: false,
        message: "Unit tests failed",
        error: String(e),
      };
    }

    // Determine overall success
    result.success =
      result.phases.scaffold.success &&
      result.phases.dev.success &&
      result.phases.compliance.success &&
      result.phases.tests_e2e.success &&
      result.phases.tests_unit.success;
  } catch (e) {
    result.errors.push(`Fatal error: ${String(e)}`);
  } finally {
    // --- Cleanup: Stop Dev Server ---
    if (devServer) {
      try {
        await stopDevServer(devServer);
      } catch (e) {
        result.errors.push(`Failed to stop dev server: ${String(e)}`);
      }
    }

    result.duration = Date.now() - startTime;
  }

  return result;
}

/**
 * Scaffold a new workspace from the fullstack template
 */
async function scaffoldWorkspace(
  kataDir: string,
  workspaceDir: string,
  dojoRoot: string
): Promise<PhaseResult> {
  try {
    const templateDir = join(dojoRoot, "katas", "_fullstack-template", "scaffold");

    if (!existsSync(templateDir)) {
      return {
        success: false,
        message: "Template scaffold not found",
        error: `Missing: ${templateDir}`,
      };
    }

    // Load kata metadata so we can render templated scaffold files
    const kataYamlPath = join(kataDir, "kata.yaml");
    const kataYaml = existsSync(kataYamlPath)
      ? (YAML.parse(readFileSync(kataYamlPath, "utf-8")) as any)
      : {};
    const kataName: string =
      kataYaml.name || kataDir.split("/").pop() || "unknown";
    const kataTitle: string =
      kataYaml.title || kataYaml.description || kataName;

    // Create workspace directory
    mkdirSync(workspaceDir, { recursive: true });

    // Files that should be Mustache-rendered (they contain {{kata_name}}
    // and {{kata_title}} placeholders) vs copied verbatim.
    const templatedFiles = new Set(["package.json", "index.html"]);
    const templateFiles = [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "vitest.config.ts",
      "index.html",
    ];

    const view = {
      kata_name: kataName,
      kata_title: kataTitle,
    };

    for (const file of templateFiles) {
      const src = join(templateDir, file);
      const dst = join(workspaceDir, file);
      if (!existsSync(src)) continue;

      if (templatedFiles.has(file)) {
        const raw = readFileSync(src, "utf-8");
        const rendered = Mustache.render(raw, view);
        writeFileSync(dst, rendered);
      } else {
        copyFileSync(src, dst);
      }
    }

    // Create src directory structure
    mkdirSync(join(workspaceDir, "src"), { recursive: true });
    mkdirSync(join(workspaceDir, "src", "__tests__"), { recursive: true });
    mkdirSync(join(workspaceDir, "e2e"), { recursive: true });

    // Copy files from scaffold/src/ into workspace/src/ (e.g. main.ts entry).
    // Without this, Vue never mounts and the app is a blank <div id="app"></div>.
    const scaffoldSrcDir = join(templateDir, "src");
    if (existsSync(scaffoldSrcDir)) {
      for (const f of readdirSync(scaffoldSrcDir)) {
        const src = join(scaffoldSrcDir, f);
        const dst = join(workspaceDir, "src", f);
        copyFileSync(src, dst);
      }
    }

    // NOTE: Do NOT copy kata/e2e/ tests into workspace at scaffold time.
    // The dev Cloove must remain BLIND to the oracle tests. They get copied
    // in after the dev phase completes — see Phase 4.5 in the main runner.

    return {
      success: true,
      message: `Scaffolded workspace at ${workspaceDir}`,
    };
  } catch (e) {
    return {
      success: false,
      message: "Scaffold failed",
      error: String(e),
    };
  }
}

/**
 * Fire dev Cloove with rendered prompt
 */
async function fireDevCloove(
  kataName: string,
  kataDir: string,
  workspaceDir: string,
  contract: Contract,
  dojoRoot: string,
  model?: string
): Promise<PhaseResult> {
  try {
    const promptPath = join(dojoRoot, "prompts", "fullstack-dev-v1", "implement.md");

    if (!existsSync(promptPath)) {
      return {
        success: false,
        message: "Dev prompt not found",
        error: `Missing: ${promptPath}`,
      };
    }

    // Load kata metadata for rendering
    const kataYamlPath = join(kataDir, "kata.yaml");
    const descPath = join(kataDir, "description.md");
    const archPath = join(kataDir, "architecture.md");

    const kataYaml = YAML.parse(readFileSync(kataYamlPath, "utf-8")) as any;
    const description = existsSync(descPath)
      ? readFileSync(descPath, "utf-8")
      : "";
    const architecture = existsSync(archPath)
      ? readFileSync(archPath, "utf-8")
      : "";

    // Render prompt template
    const templateContent = readFileSync(promptPath, "utf-8");
    const renderedPrompt = Mustache.render(templateContent, {
      kata_name: kataName,
      description,
      architecture,
      contract: contractToYAML(contract),
      framework: contract.framework,
    });

    // Write rendered prompt to workspace (for reference/debugging)
    const renderedPath = join(workspaceDir, ".dev-prompt.md");
    writeFileSync(renderedPath, renderedPrompt);

    // Fire Ollama with the Ollama adapter:
    // fireOllama(prompt, workdir, timeoutMinutes, model)
    const ollamaResult = await fireOllama(
      renderedPrompt,
      workspaceDir,
      10, // 10 minutes for dev
      model
    );

    if (ollamaResult.exitCode !== 0 || ollamaResult.timedOut) {
      return {
        success: false,
        message: ollamaResult.timedOut
          ? "Dev Cloove timed out"
          : `Ollama /api/chat returned error code ${ollamaResult.exitCode}`,
        error: ollamaResult.stderr || ollamaResult.stdout,
        details: `Elapsed: ${ollamaResult.elapsedSeconds}s`,
      };
    }

    return {
      success: true,
      message: `Dev Cloove completed in ${ollamaResult.elapsedSeconds}s`,
      details: ollamaResult.stdout,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fire Dev Cloove",
      error: String(e),
    };
  }
}

/**
 * Fire SDET Cloove with rendered prompt
 */
async function fireSdetCloove(
  kataName: string,
  kataDir: string,
  workspaceDir: string,
  contract: Contract,
  dojoRoot: string,
  model?: string
): Promise<PhaseResult> {
  try {
    const promptPath = join(dojoRoot, "prompts", "sdet-v1", "implement.md");

    if (!existsSync(promptPath)) {
      return {
        success: false,
        message: "SDET prompt not found",
        error: `Missing: ${promptPath}`,
      };
    }

    // Render prompt template
    const templateContent = readFileSync(promptPath, "utf-8");
    const renderedPrompt = Mustache.render(templateContent, {
      kata_name: kataName,
      contract: contractToYAML(contract),
      app_dir: workspaceDir,
      dev_command: contract.dev_server.command,
      dev_port: contract.dev_server.port,
    });

    // Write rendered prompt (for reference/debugging)
    const renderedPath = join(workspaceDir, ".sdet-prompt.md");
    writeFileSync(renderedPath, renderedPrompt);

    // Fire Ollama with the Ollama adapter:
    // fireOllama(prompt, workdir, timeoutMinutes, model)
    const ollamaResult = await fireOllama(
      renderedPrompt,
      workspaceDir,
      10, // 10 minutes for SDET
      model
    );

    if (ollamaResult.exitCode !== 0 || ollamaResult.timedOut) {
      return {
        success: false,
        message: ollamaResult.timedOut
          ? "SDET Cloove timed out"
          : `Ollama /api/chat returned error code ${ollamaResult.exitCode}`,
        error: ollamaResult.stderr || ollamaResult.stdout,
        details: `Elapsed: ${ollamaResult.elapsedSeconds}s`,
      };
    }

    return {
      success: true,
      message: `SDET Cloove completed in ${ollamaResult.elapsedSeconds}s`,
      details: ollamaResult.stdout,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fire SDET Cloove",
      error: String(e),
    };
  }
}

/**
 * Run E2E tests via vitest
 */
function runE2ETests(workspaceDir: string): PhaseResult {
  try {
    const output = execSync("npm run test:e2e", {
      cwd: workspaceDir,
      encoding: "utf-8",
    });

    return {
      success: true,
      message: "E2E tests passed",
      details: output,
    };
  } catch (e) {
    const error = e as any;
    return {
      success: false,
      message: "E2E tests failed",
      error: error.message || String(e),
      details: error.stdout ? error.stdout.toString() : undefined,
    };
  }
}

/**
 * Run unit tests via vitest
 */
function runUnitTests(workspaceDir: string): PhaseResult {
  try {
    const output = execSync("npm test", { cwd: workspaceDir, encoding: "utf-8" });

    return {
      success: true,
      message: "Unit tests passed",
      details: output,
    };
  } catch (e) {
    const error = e as any;
    return {
      success: false,
      message: "Unit tests failed",
      error: error.message || String(e),
      details: error.stdout ? error.stdout.toString() : undefined,
    };
  }
}

/**
 * Infer DOJO_ROOT from common patterns
 * Looks for .rizzo/dojo directory structure
 */
function inferDojoRoot(): string {
  // Try from environment variable
  if (process.env.DOJO_ROOT) {
    return process.env.DOJO_ROOT;
  }

  // Try common locations
  const candidates = [
    resolve(process.cwd(), "../../.."),
    resolve(process.env.HOME ? `${process.env.HOME}/.rizzo/dojo` : "/data/rizzo/dojo"),
  ];

  for (const candidate of candidates) {
    if (
      existsSync(candidate) &&
      existsSync(join(candidate, "katas")) &&
      existsSync(join(candidate, "prompts"))
    ) {
      return candidate;
    }
  }

  // Fallback
  return resolve(process.cwd());
}
