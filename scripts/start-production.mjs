import { spawn } from "node:child_process";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: "inherit",
    });

    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "null"} and signal ${signal ?? "null"}`));
    });

    child.on("error", reject);
  });
}

await run("npx", ["prisma", "migrate", "deploy"]);
await run("node", ["server.js"]);
