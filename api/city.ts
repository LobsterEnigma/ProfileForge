import { handleWidget } from "../src/handler.js";

export function GET(request: Request): Promise<Response> {
  return handleWidget("city", new URL(request.url), { GITHUB_TOKEN: process.env.GITHUB_TOKEN });
}
