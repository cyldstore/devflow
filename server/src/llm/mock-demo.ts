import { mockProvider } from "./mock.js";

const abortAfterMs = Number(process.argv[2] ?? "0");
const controller = new AbortController();

if (Number.isFinite(abortAfterMs) && abortAfterMs > 0) {
  setTimeout(() => controller.abort(), abortAfterMs);
}

async function main(): Promise<void> {
  try {
    for await (const chunk of mockProvider.streamChat({
      model: "mock-chat",
      messages: [
        { role: "system", content: "你是一个测试助手。" },
        { role: "user", content: "用一句话介绍 DevFlow。" },
      ],
      signal: controller.signal,
    })) {
      switch (chunk.type) {
        case "delta":
          process.stdout.write(chunk.text);
          break;
        case "usage":
          console.log("\n[usage]", chunk.usage);
          break;
        case "done":
          console.log("\n[done]", chunk.finishReason);
          break;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("\n[aborted]");
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
