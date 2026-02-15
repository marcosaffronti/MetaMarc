import { NextResponse } from "next/server";
import { MetaAdsClient } from "@/lib/meta-ads/client";

export async function GET() {
  try {
    const metaClient = new MetaAdsClient();
    const accounts = await metaClient.getAdAccounts();

    return NextResponse.json({ data: accounts });
  } catch (error: any) {
    console.error("Meta Ads accounts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Meta Ad accounts" },
      { status: 500 }
    );
  }
}
