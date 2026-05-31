#!/usr/bin/env -S npx tsx
/**
 * RStack SDLC — Operator bridge.
 *
 * Operator (a Python AI-agent harness) has no native TypeScript runtime, so its
 * Python extension (extensions/rstack_sdlc.py) shells out to this script once per
 * tool call. We reuse the existing Pi adapter verbatim: load its default export
 * with a mock `pi` that only captures the registered tools, then invoke the
 * requested tool. No SDLC logic is duplicated.
 *
 * Usage:  npx tsx bin/rstack-operator-bridge.ts <tool_name> '<json-params>'
 * Output: the tool's raw result object as JSON on stdout (errors → stderr + exit 1).
 *
 * The project root is taken from RSTACK_PROJECT_ROOT (set by the Python side) so
 * this script can run from the package directory while operating on the user's repo.
 */
import activate from "../extensions/rstack-sdlc.ts";

type RegisteredTool = {
  name: string;
  execute: (id: string, params: any, signal?: AbortSignal, onUpdate?: unknown) => Promise<any>;
};

async function main(): Promise<void> {
  // The harness uses console.log for diagnostics (e.g. unconfigured-webhook notices).
  // Keep stdout pristine for the result JSON by routing all console output to stderr.
  const toStderr = (...args: unknown[]) =>
    process.stderr.write(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ") + "\n");
  console.log = toStderr;
  console.info = toStderr;
  console.debug = toStderr;
  console.warn = toStderr;

  const toolName = process.argv[2];
  const rawParams = process.argv[3] ?? "{}";

  if (!toolName) {
    process.stderr.write("usage: rstack-operator-bridge <tool_name> '<json-params>'\n");
    process.exit(2);
  }

  let params: unknown;
  try {
    params = JSON.parse(rawParams);
  } catch (err) {
    process.stderr.write(`invalid JSON params: ${(err as Error).message}\n`);
    process.exit(2);
  }

  // Mock Pi ExtensionAPI: capture tools, ignore commands/hooks. The `tools` proxy
  // lets any cross-tool reference resolve to a captured tool (commands aren't used
  // here, but the proxy keeps the surface safe).
  const registry: Record<string, RegisteredTool> = {};
  const mockPi: any = {
    registerTool: (tool: RegisteredTool) => {
      registry[tool.name] = tool;
    },
    registerCommand: () => {},
    on: () => {},
    config: {},
    tools: new Proxy(
      {},
      {
        get: (_t, name: string) => ({
          execute: (id: string, args: unknown) => registry[name]?.execute(id, args),
        }),
      },
    ),
  };

  await activate(mockPi);

  const tool = registry[toolName];
  if (!tool) {
    process.stderr.write(
      `unknown tool: ${toolName}\navailable: ${Object.keys(registry).sort().join(", ")}\n`,
    );
    process.exit(2);
  }

  const result = await tool.execute("operator", params);
  process.stdout.write(JSON.stringify(result ?? null));
}

main().catch((err) => {
  process.stderr.write(`${(err as Error).stack || String(err)}\n`);
  process.exit(1);
});
