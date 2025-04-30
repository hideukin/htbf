import { HandlerContext } from "$fresh/server.ts";
import { fetchAndFilterEntries, HatenaCategory } from "../../utils/rss.ts";

export const handler = async (
  req: Request,
  _ctx: HandlerContext,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") as HatenaCategory | null;
    const threshold = parseInt(url.searchParams.get("threshold") || "100");

    const entries = await fetchAndFilterEntries(category || "all", threshold);

    return new Response(JSON.stringify(entries), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in RSS API:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
