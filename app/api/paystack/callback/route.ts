import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get("reference");
  const status = searchParams.get("status");

  // Redirect to frontend with payment status
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  
  if (status === "success" && reference) {
    // Redirect to success page with reference
    return NextResponse.redirect(`${baseUrl}/payment/success?reference=${reference}`);
  } else {
    // Redirect to failure page
    return NextResponse.redirect(`${baseUrl}/payment/failed`);
  }
}

