import { Card } from "@/components/ui/Card";

export default function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-[13px] text-fog">{title}</p>
      <p className="mt-1 truncate font-mono text-xl text-paper">{value}</p>
      {sub && (
        <p className="mt-0.5 truncate text-[13px] text-fog">{sub}</p>
      )}
    </Card>
  );
}
