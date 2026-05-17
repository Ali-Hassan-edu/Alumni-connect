export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded-lg mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse flex gap-3">
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded flex-1" />
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded flex-1" />
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded flex-1" />
        </div>
      ))}
    </div>
  )
}

export function GridSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-4`}>
      {[...Array(6)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
