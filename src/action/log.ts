/** Workflow-command data escaping, so a logged message can never smuggle in `::` commands. */
export function escapeCommand(text: string): string {
  return text.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}

export const warn = (message: string) => console.log(`::warning title=ProfileForge::${escapeCommand(message)}`);
export const fail = (message: string) => console.log(`::error title=ProfileForge::${escapeCommand(message)}`);
