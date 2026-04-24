import { spawn, ChildProcess } from "child_process";
import { createReadStream, existsSync } from "fs";
import { EventEmitter } from "events";

/**
 * DevServer — manages dev server lifecycle
 * Spawns the server, waits for ready signal, kills cleanly
 */

export interface DevServer {
  process: ChildProcess;
  port: number;
  isReady: boolean;
  stdoutLog: string[];
  stderrLog: string[];
  kill(): Promise<void>;
}

/**
 * Start a dev server and wait for readiness signal
 *
 * @param workdir - Working directory to run command in
 * @param command - Full command string (e.g., "npm run dev" or "yarn start")
 * @param port - Port the server should be listening on
 * @param readySignal - String to watch for in stdout (e.g., "Local:")
 * @param timeoutMs - How long to wait for ready signal before timing out
 * @returns Promise<DevServer> with process, port, logs, and kill() method
 * @throws Error if server fails to start or ready signal not detected within timeout
 */
export async function startDevServer(
  workdir: string,
  command: string,
  port: number,
  readySignal: string,
  timeoutMs: number = 30000
): Promise<DevServer> {
  if (!existsSync(workdir)) {
    throw new Error(`Working directory does not exist: ${workdir}`);
  }

  // Parse command into program and args
  // Handle both "npm run dev" and quoted paths
  const parts = command.trim().split(/\s+/);
  const program = parts[0];
  const args = parts.slice(1);

  // Spawn with { shell: true } to handle complex commands
  // and to ensure child processes are in a process group
  const child = spawn(program, args, {
    cwd: workdir,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true, // put child in its own process group so we can kill the whole tree
  });

  const devServer: DevServer = {
    process: child,
    port,
    isReady: false,
    stdoutLog: [],
    stderrLog: [],
    kill: async () => {
      await killProcessTree(child);
    },
  };

  // Attach listeners for stdout/stderr
  if (child.stdout) {
    child.stdout.on("data", (data: Buffer) => {
      const line = data.toString("utf-8");
      devServer.stdoutLog.push(line);

      // Check for ready signal
      if (!devServer.isReady && line.includes(readySignal)) {
        devServer.isReady = true;
      }
    });
  }

  if (child.stderr) {
    child.stderr.on("data", (data: Buffer) => {
      devServer.stderrLog.push(data.toString("utf-8"));
    });
  }

  // Wait for ready signal or timeout
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      devServer.kill()
        .catch(() => {})
        .finally(() => {
          reject(
            new Error(
              `Dev server did not emit ready signal "${readySignal}" within ${timeoutMs}ms`
            )
          );
        });
    }, timeoutMs);

    // Poll for ready state (since we're waiting for a string in stdout)
    const pollHandle = setInterval(() => {
      if (devServer.isReady) {
        clearInterval(pollHandle);
        clearTimeout(timeoutHandle);
        resolve(devServer);
      }
    }, 100);

    // Detect immediate crashes
    child.on("exit", (code, signal) => {
      if (!devServer.isReady) {
        clearInterval(pollHandle);
        clearTimeout(timeoutHandle);
        const errorMsg =
          signal
            ? `Dev server killed by signal: ${signal}`
            : `Dev server exited with code ${code}`;
        const logs = devServer.stderrLog.join("\n") || devServer.stdoutLog.join("\n");
        reject(new Error(`${errorMsg}\n${logs}`));
      }
    });
  });
}

/**
 * Kill a process and its children
 * Sends SIGTERM first, waits 3s, then SIGKILL
 *
 * @param process - ChildProcess to kill
 * @throws Error if kill fails or times out
 */
async function killProcessTree(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (!proc.pid) {
      resolve();
      return;
    }

    const pid = proc.pid;
    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    proc.on("exit", done);
    proc.on("close", done);

    // Signal the whole process group (negative PID). spawn() was called
    // with detached: true, so the child is a group leader and -pid
    // addresses every descendant (vite, esbuild workers, etc).
    try {
      globalThis.process.kill(-pid, "SIGTERM");
    } catch {
      try { proc.kill("SIGTERM"); } catch {}
    }

    // After 2s, escalate to SIGKILL on the whole group.
    setTimeout(() => {
      try {
        globalThis.process.kill(-pid, "SIGKILL");
      } catch {
        try { proc.kill("SIGKILL"); } catch {}
      }
      setTimeout(done, 500);
    }, 2000);
  });
}

/**
 * Stop a running dev server
 * Calls the server's kill method and waits for cleanup
 *
 * @param server - DevServer instance from startDevServer()
 */
export async function stopDevServer(server: DevServer): Promise<void> {
  try {
    await server.kill();
  } catch (error) {
    // Log but don't throw — stopping is best-effort
    console.error("Error stopping dev server:", error);
  }
}
