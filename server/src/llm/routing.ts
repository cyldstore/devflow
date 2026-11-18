import type { LLMProvider } from "./types.js";

export const CHAT_PURPOSES = [
  "analysis",
  "interview",
  "summary",
  "qa",
] as const;
export type ChatPurpose = (typeof CHAT_PURPOSES)[number];

export function isChatPurpose(value: unknown): value is ChatPurpose {
  return (
    typeof value === "string" &&
    (CHAT_PURPOSES as readonly string[]).includes(value)
  );
}

const REASONING_PURPOSES: ReadonlySet<ChatPurpose> = new Set([
  "analysis",
  "summary",
]);

export function resolveModel(
  provider: LLMProvider,
  purpose: ChatPurpose | undefined,
): string {
  if (provider.name !== "deepseek" || purpose === undefined) {
    return provider.defaultModel;
  }
  return REASONING_PURPOSES.has(purpose)
    ? "deepseek-reasoner"
    : "deepseek-chat";
}
