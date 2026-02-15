import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { MetaAdsClient } from "@/lib/meta-ads/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_id, meta_account_id } = body;

    if (!client_id || !meta_account_id) {
      return NextResponse.json(
        { error: "client_id and meta_account_id are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Verify the client exists
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name, meta_account_id")
      .eq("id", client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const metaClient = new MetaAdsClient();

    const results = await metaClient.syncCampaignData(
      meta_account_id,
      supabase,
      client_id
    );

    return NextResponse.json({
      success: true,
      client_id,
      meta_account_id,
      results,
    });
  } catch (error: any) {
    console.error("Meta Ads sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync Meta Ads data" },
      { status: 500 }
    );
  }
}
