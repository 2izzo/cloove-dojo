import { spawn } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";
import YAML from "yaml";

const CONFIG_PATH = resolve(import.meta.dir, "../config.yaml");

interface ClineConfig {
  binary: string;
  auto_approve: boolean;
}

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  elapsedSeconds: number;
  timedOut: boolean;
}

function loadConfig(): ClineConfig {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const config = YAML.parse(raw);
  return config.cline;
}

export async function fireCline(
  prompt: string,
  workdir: string,
  timeoutMinutes: number = 15,
  model?: string
): Promise<RunResult> {
  const config = loadConfig();
  const args = ["--auto-approve-all", "-c", workdir, prompt];
  const env = { ...process.env };
  if (model) {
    env.CLINE_MODEL = model;
  }

  const startTime = Date.now();
  const timeoutMs = timeoutMinutes * 60 * 1000;

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const proc = spawn(config.binary, args, {
      env,
      cwd: workdir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
      setTimeout(() => proc.kill("SIGKILL"), 5000);
    }, timeoutMs);

    proc.on("close", (code: number | null) => {
      clearTimeout(timer);
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        elapsedSeconds,
        timedOut,
      });
    });
  });
}
