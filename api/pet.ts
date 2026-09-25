import { handlePet } from "../src/handler.js";

export function GET(request: Request): Promise<Response> {
  return handlePet(new URL(request.url), { GITHUB_TOKEN: process.env.GITHUB_TOKEN });
}
