import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, max_price, num_results = 6 } = body;

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SerpAPI key not configured" }, { status: 500 });
  }

  let serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
  if (max_price) serpUrl += `&price_max=${max_price}`;

  const res = await fetch(serpUrl);
  const data = await res.json();

  const products = (data.shopping_results ?? []).slice(0, num_results).map((item: any) => ({
    title: item.title,
    price: item.price,
    currency: item.extracted_price ? "USD" : undefined,
    source: item.source,
    link: item.link,
    thumbnail: item.thumbnail,
    rating: item.rating,
  }));

  return NextResponse.json({ products });
}
