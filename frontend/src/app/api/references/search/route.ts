import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, num_results = 6 } = body;

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json({ error: "Unsplash key not configured" }, { status: 500 });
  }

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${num_results}&client_id=${accessKey}`;
  const res = await fetch(url);
  const data = await res.json();

  const images = (data.results ?? []).map((photo: any) => ({
    id: photo.id,
    url_small: photo.urls.small,
    url_regular: photo.urls.regular,
    alt: photo.alt_description ?? query,
    photographer: photo.user.name,
    photographer_url: photo.user.links.html,
  }));

  return NextResponse.json({ images });
}
