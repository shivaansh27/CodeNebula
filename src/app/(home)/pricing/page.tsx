import { PricingTable } from "@/components/pricing-table";

export default function PricingPage() {
  return (
    <main className="pt-24 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Pricing Plans</h1>
      <PricingTable />
    </main>
  );
}
