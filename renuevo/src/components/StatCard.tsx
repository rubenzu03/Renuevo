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
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="mt-1 truncate text-xl font-semibold">{value}</p>
      {sub && (
        <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
          {sub}
        </p>
      )}
    </div>
  );
}
