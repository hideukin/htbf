import { assertEquals } from "https://deno.land/std@0.219.0/assert/mod.ts";
import { HATENA_CATEGORIES, filterByBookmarkCount } from "./rss.ts";

Deno.test("HATENAカテゴリが正しく定義されている", () => {
  assertEquals(HATENA_CATEGORIES.length, 10);
  assertEquals(HATENA_CATEGORIES[0], "all");
  assertEquals(HATENA_CATEGORIES[6], "it");
});

// filterByBookmarkCountのテスト
Deno.test("ブックマーク数でのフィルタリングが正しく動作する", () => {
  const entries = [
    { title: "test1", link: "", description: "", date: "", bookmarkCount: 50, commentUrl: "" },
    { title: "test2", link: "", description: "", date: "", bookmarkCount: 100, commentUrl: "" },
    { title: "test3", link: "", description: "", date: "", bookmarkCount: 150, commentUrl: "" },
  ];

  const filtered = filterByBookmarkCount(entries, 100);
  assertEquals(filtered.length, 2);
  assertEquals(filtered[0].bookmarkCount, 100);
  assertEquals(filtered[1].bookmarkCount, 150);
});

// 空の配列のテスト
Deno.test("空の配列に対してフィルタリングが正しく動作する", () => {
  const entries: Array<{
    title: string;
    link: string;
    description: string;
    date: string;
    bookmarkCount: number;
    commentUrl: string;
  }> = [];

  const filtered = filterByBookmarkCount(entries, 100);
  assertEquals(filtered.length, 0);
});

// 閾値が0のテスト
Deno.test("閾値0でのフィルタリングが正しく動作する", () => {
  const entries = [
    { title: "test1", link: "", description: "", date: "", bookmarkCount: 0, commentUrl: "" },
    { title: "test2", link: "", description: "", date: "", bookmarkCount: 1, commentUrl: "" },
  ];

  const filtered = filterByBookmarkCount(entries, 0);
  assertEquals(filtered.length, 2);
});
