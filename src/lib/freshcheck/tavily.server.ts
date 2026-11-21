import { z } from "zod";
import { evidenceFromSearch } from "./evidence";
import { postJson, VerificationError } from "./http.server";

const responseSchema = z.object({ results: z.array(z.object({
  url: z.string(), title: z.string(), content: z.string(), score: z.number().default(0),
  published_date: z.string().nullable().optional(),
})).max(20) });

export async function searchTavily(query: string, topic: "general" | "news", retrievedAt: string) {
  const key = process.env['TAVILY_API_KEY'];
  if (!key) throw new VerificationError("Tavily is not configured. Your answer has not been checked.");
  const response = await postJson("https://api.tavily.com/search", { Authorization: `Bearer ${key}` }, {
    query: query.slice(0, 500), topic, search_depth: "advanced", max_results: 5,
    include_answer: false, include_raw_content: false,
  }, "Tavily");
  const parsed = responseSchema.safeParse(response);
  if (!parsed.success) throw new VerificationError("Tavily returned an unexpected evidence format.");
  return parsed.data.results.flatMap((row) => {
    const evidence = evidenceFromSearch(row, retrievedAt);
    return evidence ? [evidence] : [];
  });
}