import RssViewer from "../islands/RssViewer.tsx";

export default function Home() {
  return (
    <div class="px-4 py-8 mx-auto">
      <div class="max-w-screen-md mx-auto">
        <h1 class="text-4xl font-bold mb-8">
          はてなブックマーク人気エントリー
        </h1>
        <RssViewer />
      </div>
    </div>
  );
}
