import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Defines the structure for a Razorpay API error.
 */
interface RazorpayError {
  error: {
    description: string;
  };
}

/**
 * Type guard to check if an error is a RazorpayError.
 * @param error The error to check.
 * @returns True if the error is a RazorpayError, false otherwise.
 */
function isRazorpayError(error: unknown): error is RazorpayError {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as { error: unknown }).error === "object" &&
    (error as { error: object })?.error !== null &&
    "description" in (error as { error: object }).error
  );
}


export async function POST(req: NextRequest) {
  try {
    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    console.log("📦 Received planId:", planId);

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
    });

    return NextResponse.json({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
    });

  } catch (error: unknown) { // CORRECTED: Catch error as 'unknown' for type safety.
    console.error("🔴 Razorpay subscription error:", JSON.stringify(error, null, 2));

    let errorMessage = "Something went wrong";

    // CORRECTED: Type-safe error message extraction.
    if (isRazorpayError(error)) {
      errorMessage = error.error.description;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}