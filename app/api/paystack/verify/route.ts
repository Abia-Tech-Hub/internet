import { NextRequest, NextResponse } from "next/server";

// Plan to MikroTik profile mapping
const planProfiles: Record<string, string> = {
  "Quick Surf": "2hour",
  "Daily Access": "24hour",
  "Daily Access II": "24hour-unlimited",
  "Weekly Connect": "7day",
  "Power User": "power-user",
  "Monthly Pro": "monthly",
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || paystackData.status !== true) {
      return NextResponse.json(
        { error: "Payment verification failed", details: paystackData.message },
        { status: 400 }
      );
    }

    const transaction = paystackData.data;
    
    // Check if payment was successful
    if (transaction.status !== "success") {
      return NextResponse.json(
        { error: "Payment not successful", status: transaction.status },
        { status: 400 }
      );
    }

    // Get plan from metadata
    const planName = transaction.metadata?.plan || transaction.metadata?.custom_fields?.find((f: any) => f.variable_name === "plan")?.value;
    const phone = transaction.metadata?.phone || transaction.metadata?.custom_fields?.find((f: any) => f.variable_name === "phone")?.value;

    if (!planName) {
      return NextResponse.json(
        { error: "Plan information not found in transaction" },
        { status: 400 }
      );
    }

    // Generate username and password
    const username = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const password = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10).toUpperCase() + "123";

    // Get MikroTik profile for the plan
    const profile = planProfiles[planName] || "default";

    // Create hotspot user in MikroTik
    try {
      const { createHotspotUser } = require("../../../../mikrotik.js");
      await createHotspotUser({
        username,
        password,
        profile,
      });

      // Here you would typically:
      // 1. Save payment record to database with reference, username, password, etc.
      // 2. Send confirmation email if email provided

      return NextResponse.json({
        success: true,
        username,
        password,
        reference: transaction.reference,
        message: "Payment verified and user created successfully",
      });
    } catch (mikrotikError: any) {
      console.error("MikroTik error:", mikrotikError);
      return NextResponse.json(
        {
          error: "Failed to create user account. Please contact support.",
          details: mikrotikError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed", details: error.message },
      { status: 500 }
    );
  }
}

