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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, phone, email } = body;

    if (!plan || !phone) {
      return NextResponse.json(
        { error: "Plan and phone number are required" },
        { status: 400 }
      );
    }

    // Generate username and password
    const username = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const password = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10).toUpperCase() + "123";

    // Get MikroTik profile for the plan
    const profile = planProfiles[plan.name] || "default";

    // Create hotspot user in MikroTik
    try {
      // Use require for CommonJS module
      const { createHotspotUser } = require("../../../../mikrotik.js");
      await createHotspotUser({
        username,
        password,
        profile,
      });

      // Here you would typically:
      // 1. Save payment record to database
      // 2. Send confirmation email if email provided
      // 3. Process actual payment (Paystack, Flutterwave, etc.)

      return NextResponse.json({
        success: true,
        username,
        password,
        message: "User created successfully",
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
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Payment processing failed", details: error.message },
      { status: 500 }
    );
  }
}

