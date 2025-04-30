import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { HATENA_CATEGORIES, type HatenaCategory } from "../utils/rss.ts";

const DEFAULT_BOOKMARK_CATEGORY = "all";
const DEFAULT_BOOKMARK_THRESHOLD = 100;

interface Entry {
  title: string;
  link: string;
  description: string;
  date: string;
  bookmarks: number;
}

export default function RssViewer() {
  const entries = useSignal<{ filtered: Entry[]; total: number }>({
    filtered: [],
    total: 0,
  });
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const category = useSignal<HatenaCategory>(DEFAULT_BOOKMARK_CATEGORY);
  const threshold = useSignal<number>(DEFAULT_BOOKMARK_THRESHOLD);

  async function fetchEntries(
    selectedCategory: HatenaCategory,
    bookmarkThreshold: number,
  ) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch(
        `/api/rss?category=${selectedCategory}&threshold=${bookmarkThreshold}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      entries.value = data;
    } catch (e) {
      error.value = e instanceof Error
        ? e.message
        : "エントリーの取得に失敗しました";
    } finally {
      loading.value = false;
    }
  }

  useEffect(() => {
    fetchEntries(category.value, threshold.value);
  }, [category.value, threshold.value]);

  return (
    <div class="p-4">
      <div class="mb-4 flex items-center gap-4">
        <label class="mr-2">カテゴリ:</label>
        <select
          class="px-2 py-1 border rounded"
          value={category.value}
          onChange={(e) =>
            category.value = e.currentTarget.value as HatenaCategory}
        >
          {HATENA_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <label class="flex items-center">
          <span class="mr-2">ブックマーク数の閾値:</span>
          <input
            type="number"
            min="0"
            class="px-2 py-1 border rounded w-24"
            value={threshold.value}
            onChange={(e) =>
              threshold.value = parseInt(e.currentTarget.value) || 0}
          />
        </label>
      </div>

      {loading.value && <div class="text-center py-4">読み込み中...</div>}

      {error.value && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error.value}
        </div>
      )}

      <div class="mb-4 text-gray-600">
        全{entries.value.total}件中、{entries.value.filtered.length}件表示
        （ブックマーク数{threshold
          .value}以上）
      </div>

      <div class="space-y-4">
        {entries.value.filtered.map((entry) => (
          <div key={entry.link} class="p-4 border rounded hover:bg-gray-50">
            <a
              href={entry.link}
              target="_blank"
              rel="noopener noreferrer"
              class="block"
            >
              <h3 class="text-lg font-semibold mb-2">{entry.title}</h3>
              <div class="text-sm text-gray-600">
                <span class="mr-4">
                  📅 {new Date(entry.date).toLocaleString("ja-JP")}
                </span>
                <span>🔖 {entry.bookmarks} ブックマーク</span>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
