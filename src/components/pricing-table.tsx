// src/components/PricingTable.tsx
"use client";
import React from "react";

const plans = [
  {
    name: "Pro",
    price: 99,
    frequency: "month",
    description: "Best for individual developers getting started.",
    features: [
      "Basic AI Components",
      "10 Free Tokens",
      "Community Support",
    ],
    planId: "plan_QzpBIytAWkH7YP",
  },
  {
    name: "Premium",
    price: 299,
    frequency: "month",
    description: "Advanced tools for power users & teams.",
    features: [
      "100 Free Tokens",
      "Better Model",
      "Priority Support",
    ],
    planId: "plan_QzpC2Y8yYghc3z",
  },
];

export const PricingTable = () => {
  const handleSubscribe = async (planId: string) => {
    const res = await fetch("/api/create-subscription", {
      method: "POST",
      body: JSON.stringify({ planId }),
    });
    const data = await res.json();

    if (data.error) return alert("Failed to subscribe: " + data.error);
    if (!(window as any).Razorpay) return alert("Razorpay SDK not loaded.");

    const razorpay = new (window as any).Razorpay({
      key: data.key,
      subscription_id: data.subscriptionId,
      name: "CodeNebula",
      description: "Plan Subscription",
      theme: { color: "#6366f1" },
      handler: (response: any) => {
        alert("Subscribed successfully!");
        console.log(response);
      },
    });

    razorpay.open();
  };

  return (
    <div className="py-16 text-zinc-800 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">Choose your plan</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-10">
          Simple pricing, for developers at any stage.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.planId}
              className="rounded-2xl border shadow-sm bg-zinc-50 dark:bg-zinc-900 p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-2xl font-semibold mb-1">{plan.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  {plan.description}
                </p>
                <div className="text-4xl font-bold mb-4">
                  ₹{plan.price}
                  <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
                    /{plan.frequency}
                  </span>
                </div>
                <ul className="mb-6 space-y-2 text-left text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="mr-2">✅</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe(plan.planId)}
                className="mt-4 w-full bg-background text-white py-2 rounded hover:opacity-90 transition"
              >
                Subscribe
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
