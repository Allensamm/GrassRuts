export default function Loading() {
  return (
    <div className="px-4 md:px-6 py-5 animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-1/2 mb-1" />
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="grid grid-cols-3 gap-3 mb-6 md:hidden">
        {[0, 1, 2].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
