import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  try {
    // 1. Verify Payment with Paystack
    const payRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    const payData = await payRes.json();
    console.log("Paystack Verification Status:", payData.status);

    if (!payData.status || payData.data.status !== "success") {
      return NextResponse.json({
        success: false,
        message: "Payment failed on Paystack",
      });
    }

    const amountPaid = payData.data.amount / 100;

    // 2. Map Price to Profile Name (CHECK YOUR FIRESTORE FOR THESE EXACT NAMES)
    const priceMap: { [key: number]: string } = {
      200: "QUICK_SURF",
      350: "DAILY_ACCESS",
      500: "DAILY_ACCESS_II",
      1000: "POWER_USER",
      1500: "WEEKLY_CONNECT",
      10000: "MONTHLY_PRO",
    };

    const targetProfile = priceMap[amountPaid];
    console.log(
      `Searching for voucher: Plan=${targetProfile}, Price=${amountPaid}`
    );

    if (!targetProfile) {
      throw new Error(`No plan mapped for amount: ${amountPaid}`);
    }

    // 3. Find and Update Voucher
    const voucher = await adminDb.runTransaction(async (transaction) => {
      const unusedQuery = adminDb
        .collection("vouchers")
        .where("planType", "==", targetProfile)
        .where("isUsed", "==", false)
        .limit(1);

      const snapshot = await transaction.get(unusedQuery);

      if (snapshot.empty) {
        throw new Error("OUT_OF_STOCK");
      }

      const voucherDoc = snapshot.docs[0];
      const voucherData = voucherDoc.data();

      transaction.update(voucherDoc.ref, {
        isUsed: true,
        assignedTo: payData.data.customer.email,
        soldAt: new Date().toISOString(),
        paystackRef: reference,
      });

      return {
        username: voucherData.username,
        password: voucherData.password,
      };
    });

    return NextResponse.json({ success: true, voucher });
  } catch (error: any) {
    // THIS LOGS THE REAL ERROR TO YOUR TERMINAL
    console.error("DETAILED_VERIFY_ERROR:", error.message);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message === "OUT_OF_STOCK"
            ? "Vouchers sold out!"
            : "Server error",
      },
      { status: 500 }
    );
  }
}
