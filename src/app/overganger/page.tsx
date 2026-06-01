import { getGender } from "@/lib/gender";
import * as db from "@/lib/db";
import { PageHeader, Badge } from "@/components/ui/primitives";
import { TransfersList } from "@/components/transfers-list";

export const metadata = { title: "Overganger" };

export default function OvergangerPage() {
  const gender = getGender();
  const transfers = db.transfersByGender(gender);
  return (
    <div>
      <PageHeader
        title="Overganger"
        subtitle="Spillere som rykker opp, ned eller bytter klubb gjennom sesongen."
        badge={<Badge tone="low">Modellert</Badge>}
      />
      <TransfersList transfers={transfers} />
    </div>
  );
}
