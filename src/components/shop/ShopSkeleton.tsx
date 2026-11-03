export function ShopSkeleton() {
  return (
    <div className="container-luxe pb-28" aria-busy="true" aria-label="Loading products">
      <div className="h-14 border-y border-line" />
      <div className="mt-8 grid gap-12 lg:grid-cols-[250px_1fr] xl:grid-cols-[270px_1fr] xl:gap-16">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse bg-sand" style={{ width: `${60 + ((i * 17) % 35)}%` }} />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div className="aspect-[4/5] animate-pulse bg-sand" />
              <div className="mt-4 h-5 w-3/4 animate-pulse bg-sand" />
              <div className="mt-2 h-3 w-1/3 animate-pulse bg-sand" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
