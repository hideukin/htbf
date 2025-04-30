/**
 * はてなブックマークのRSSを処理するユーティリティモジュール
 */

/**
 * はてなブックマークのホットエントリーのカテゴリ
 */
export const HATENA_CATEGORIES = [
  'all',
  'general',
  'social',
  'economics',
  'life',
  'knowledge',
  'it',
  'fun',
  'entertainment',
  'game'
] as const;

export type HatenaCategory = typeof HATENA_CATEGORIES[number];

/**
 * はてなブックマークのエントリー情報
 */
interface RssResponse {
  total: number;
  filtered: HatenaEntry[];
}

interface HatenaEntry {
  title: string;
  link: string;
  description: string;
  date: string;
  bookmarkCount: number;
  commentUrl: string;
}

/**
 * XMLからタグの内容を抽出する
 */
function decodeHtmlEntities(str: string): string {
  return str.replace(/&#x([0-9A-F]+);/gi, (_, code) => {
    return String.fromCodePoint(parseInt(code, 16));
  });
}

function extractTagContent(xml: string, tagName: string): string[] {
  const results: string[] = [];
  // CDATAセクションを含むコンテンツにも対応
  const regex = new RegExp(`<${tagName}[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|([^<]*))</${tagName}>`, "g");
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const content = match[1] || match[2]; // CDATAまたは通常のコンテンツ
    if (content) {
      const decoded = decodeHtmlEntities(content.trim());
      console.log(`Extracted ${tagName}:`, decoded); // デバッグログ
      results.push(decoded);
    }
  }

  return results;
}

/**
 * XMLからブックマーク数を抽出する
 */

/**
 * はてなブックマークのRSSフィードを取得する
 */
async function fetchRSS(category: HatenaCategory): Promise<string> {
  const baseUrl = 'https://b.hatena.ne.jp';
  const endpoint = category === 'all' ? 'hotentry' : `hotentry/${category}`;
  const url = `${baseUrl}/${endpoint}.rss`;

  console.log('Fetching RSS from:', url); // デバッグログ
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const text = await response.text();
  console.log('RSS response length:', text.length); // デバッグログ
  console.log('RSS sample content:', text.substring(0, 500)); // 最初の500文字を表示
  return text;
}

/**
 * XMLからエントリーを解析する
 */
function parseEntries(xmlText: string): HatenaEntry[] {
  // item要素ごとに分割（より柔軟なパターン）
  const itemRegex = /<item[\s>][\s\S]*?<\/item>/g;
  const items = xmlText.match(itemRegex) || [];
  console.log('Found RSS items:', items.length); // デバッグログ

  const entries = items.map((item, index) => {
    const titles = extractTagContent(item, "title");
    const links = extractTagContent(item, "link");
    const descriptions = extractTagContent(item, "description");
    const dates = extractTagContent(item, "dc:date");
    const bookmarkCounts = extractTagContent(item, "hatena:bookmarkcount");
    const imageUrls = extractTagContent(item, "hatena:imageurl");
    const commentUrls = extractTagContent(item, "hatena:bookmarkCommentListPageUrl");

    const descriptionParts = [];
    if (imageUrls[0]) {
      descriptionParts.push(`<img src="${imageUrls[0]}" alt="Entry thumbnail" />`);
    }
    if (commentUrls[0]) {
      descriptionParts.push(`<p><a href="${commentUrls[0]}" target="_blank">はてブコメント</a></p>`);
    }
    if (descriptions[0]) {
      descriptionParts.push(descriptions[0]);
    }

    const description = descriptionParts.join("\n");

    const entry = {
      title: titles[0] || "",
      link: links[0] || "",
      description: description,
      date: dates[0] || "",
      bookmarkCount: bookmarkCounts[0] ? parseInt(bookmarkCounts[0]) : 0,
      commentUrl: commentUrls[0] || `https://b.hatena.ne.jp/entry/${encodeURIComponent(links[0] || "")}`
    };

    console.log(`Parsed entry ${index + 1}/${items.length}:`, {
      title: entry.title,
      bookmarks: entry.bookmarkCount,
      link: entry.link
    }); // デバッグログ
    return entry;
  });

  return entries;
}

/**
 * エントリーをブックマーク数でフィルタリングする
 */
function filterByBookmarkCount(entries: HatenaEntry[], threshold: number): HatenaEntry[] {
  console.log('Filtering entries with threshold:', threshold);
  console.log('Before filter - total entries:', entries.length);
  console.log('Entry bookmark counts:', entries.map(e => e.bookmarkCount).join(', '));

  const filtered = entries.filter(entry => entry.bookmarkCount >= threshold);
  console.log(`Filtered entries: ${filtered.length} (threshold: ${threshold})`);
  console.log('Filtered entry titles:', filtered.map(e => `${e.title} (${e.bookmarkCount})`).join('\n'));
  return filtered;
}

/**
 * はてなブックマークのRSSフィードを取得してフィルタリングする
 */
export async function fetchAndFilterEntries(
  category: HatenaCategory = 'all',
  threshold: number = 100
): Promise<{ total: number; filtered: HatenaEntry[] }> {
  try {
    console.log(`Fetching entries for category: ${category}`); // デバッグログ
    const xmlText = await fetchRSS(category);
    const entries = parseEntries(xmlText);
    const filtered = filterByBookmarkCount(entries, threshold);
    return {
      filtered: filtered.map(entry => ({
        title: entry.title,
        link: entry.link,
        description: entry.description,
        date: entry.date,
        bookmarkCount: entry.bookmarkCount,
        commentUrl: entry.commentUrl
      })),
      total: entries.length
    };
  } catch (error) {
    console.error('Error processing RSS:', error);
    throw error;
  }
}
