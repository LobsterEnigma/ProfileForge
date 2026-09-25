const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ENTITIES[c]!);
}
