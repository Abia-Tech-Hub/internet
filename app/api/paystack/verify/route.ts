// app/api/paystack/verify/route.ts
import { NextRequest, NextResponse } from "next/server";

// Plan → MikroTik profile mapping
const planProfiles: Record<string, string> = {
  "Quick Surf": "2hour",
  "Daily Access": "24hour",
  "Daily Access II": "24hour-unlimited",
  "Weekly Connect": "7day",
  "Power User": "power-user",
  "Monthly Pro": "monthly",
};

export async function GET(request: NextRequest) {
  const debug: Record<string, any> = {}; // collect info for debugging

  // --- Step 0: Dynamically import MikroTik (server-only) ---
  let createHotspotUser: any;
  try {
    const mikrotikModule = await import("../../../../mikrotik.js");
    createHotspotUser = mikrotikModule.createHotspotUser;
    debug.mikrotikImport = true;
  } catch (err: any) {
    debug.mikrotikImportError = err.message;
    console.error("MikroTik import failed:", err);
    return NextResponse.json(
      { error: "Server failed to import MikroTik module", debug },
      { status: 500 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");
    debug.reference = reference;

    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required", debug },
        { status: 400 }
      );
    }

    // --- Step 1: Verify payment with Paystack ---
    let paystackData;
    try {
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      paystackData = await res.json();
      debug.paystackStatus = res.status;
      debug.paystackData = paystackData;
    } catch (err: any) {
      debug.paystackError = err.message;
      console.error("Paystack verification failed:", err);
      return NextResponse.json(
        { error: "Failed to verify payment with Paystack", debug },
        { status: 500 }
      );
    }

    if (!paystackData?.status) {
      return NextResponse.json(
        { error: "Payment verification failed", debug },
        { status: 400 }
      );
    }

    const transaction = paystackData.data;
    debug.transactionStatus = transaction.status;

    if (transaction.status !== "success") {
      return NextResponse.json(
        { error: "Payment not successful", status: transaction.status, debug },
        { status: 400 }
      );
    }

    // --- Step 2: Extract plan and phone ---
    const planName =
      transaction.metadata?.plan ||
      transaction.metadata?.custom_fields?.find((f: any) => f.variable_name === "plan")?.value;
    const phone =
      transaction.metadata?.phone ||
      transaction.metadata?.custom_fields?.find((f: any) => f.variable_name === "phone")?.value;

    debug.planName = planName;
    debug.phone = phone;

    if (!planName) {
      return NextResponse.json(
        { error: "Plan info missing in transaction", debug },
        { status: 400 }
      );
    }

    // --- Step 3: Generate username/password ---
    const username = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const password =
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10).toUpperCase() +
      "123";

    const profile = planProfiles[planName] || "default";
    debug.generatedUsername = username;
    debug.generatedProfile = profile;

    // --- Step 4: Create MikroTik user ---
    try {
      console.log("Connecting to MikroTik and creating user...");
      await createHotspotUser({ username, password, profile });
      debug.mikrotikSuccess = true;
      console.log("MikroTik user created:", username);

      return NextResponse.json({
        success: true,
        username,
        password,
        reference: transaction.reference,
        message: "Payment verified and user created successfully",
        debug,
      });
    } catch (mikrotikErr: any) {
      debug.mikrotikError = mikrotikErr.message;
      console.error("MikroTik error:", mikrotikErr);
      return NextResponse.json(
        { error: "Failed to create MikroTik user", details: mikrotikErr.message, debug },
        { status: 500 }
      );
    }
  } catch (err: any) {
    debug.unexpectedError = err.message;
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Payment verification process failed", debug },
      { status: 500 }
    );
  }
}
