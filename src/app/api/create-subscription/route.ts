import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    console.log("📦 Received planId:", planId);

    // Log available plans (DEBUG ONLY)
    const plans = await razorpay.plans.all({ count: 10 });
    console.log("🧪 Available plans on Razorpay:", plans.items.map((p) => ({
      id: p.id,
      name: p.item.name,
      amount: p.item.amount,
      currency: p.item.currency,
      interval: p.period,
    })));

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
    });

    return NextResponse.json({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
    });

  } catch (error: any) {
    console.error("🔴 Razorpay subscription error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: error?.error?.description || error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
