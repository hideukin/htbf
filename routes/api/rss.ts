import { HandlerContext } from "$fresh/server.ts";
import { fetchAndFilterEntries, HatenaCategory, getCategoryLabel } from "../../utils/rss.ts";

export const handler = async (
  req: Request,
  _ctx: HandlerContext,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") as HatenaCategory | null;
    const threshold = parseInt(url.searchParams.get("threshold") || "100");
    const format = url.searchParams.get("format") || "json";

    const entries = await fetchAndFilterEntries(category || "all", threshold);

    if (format === "rss") {
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:hatena="http://b.hatena.ne.jp/ns/">
  <channel>
    <title>はてブ人気 ${category ? getCategoryLabel(category) : "総合"}</title>
    <link>https://b.hatena.ne.jp/hotentry/${category || ""}</link>
    <description>はてブ${category ? getCategoryLabel(category) : "総合"}${threshold}</description>
    <language>ja</language>
    ${entries.filtered.map(entry => `
    <item>
      <title><![CDATA[${entry.title}]]></title>
      <link>${entry.link}</link>
      <description><![CDATA[${entry.description}]]></description>
      <pubDate>${new Date(entry.date).toUTCString()}</pubDate>
      <hatena:bookmarkcount>${entry.bookmarkCount}</hatena:bookmarkcount>
    </item>`).join("\n")}
  </channel>
</rss>`;

      return new Response(rss, {
        headers: {
          "Content-Type": "application/xml",
        },
      });
    }

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
