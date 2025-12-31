import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, plan, phone } = body;

    if (!email || !amount || !plan) {
      return NextResponse.json(
        { error: "Email, amount, and plan are required" },
        { status: 400 }
      );
    }

    // Convert amount from string (e.g., "₦200") to kobo (Paystack uses kobo)
    const amountInKobo = parseInt(amount.replace(/[₦,]/g, "")) * 100;
    
    if (isNaN(amountInKobo) || amountInKobo <= 0) {
      console.error("Invalid amount:", amount);
      return NextResponse.json(
        { error: "Invalid amount. Please check the plan price." },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `plan_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Check if secret key is available
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY is not set in environment variables");
      return NextResponse.json(
        { 
          error: "Payment configuration error. Secret key not found.",
          details: "Please ensure PAYSTACK_SECRET_KEY is set in .env.local and restart the server"
        },
        { status: 500 }
      );
    }

    // Initialize Paystack payment
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/paystack/callback`,
        metadata: {
          plan: plan.name,
          phone: phone || "",
          custom_fields: [
            {
              display_name: "Plan",
              variable_name: "plan",
              value: plan.name,
            },
            {
              display_name: "Phone",
              variable_name: "phone",
              value: phone || "",
            },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      console.error("Paystack API error:", paystackData);
      return NextResponse.json(
        { error: paystackData.message || "Failed to initialize payment" },
        { status: paystackResponse.status }
      );
    }

    // Get public key from environment
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    
    if (!publicKey) {
      console.error("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set in environment variables");
      console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('PAYSTACK')));
      return NextResponse.json(
        { 
          error: "Payment configuration error. Public key not found.",
          details: "Please ensure NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is set in .env.local and restart the server"
        },
        { status: 500 }
      );
    }

    console.log("Payment initialized successfully. Reference:", paystackData.data.reference);

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
      public_key: publicKey,
    });
  } catch (error: any) {
    console.error("Paystack initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment", details: error.message },
      { status: 500 }
    );
  }
}

