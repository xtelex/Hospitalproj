export default function DoctorCardSkeleton() {
  return (
    <div className="group bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.08)_0px_18px_50px_0px] animate-pulse">
      <div className="p-6">
        <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-slate-200/80" />

        <div className="mt-6 h-7 w-3/4 rounded-md bg-slate-200/80" />

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="h-6 w-24 rounded-md bg-slate-200/80" />
          <div className="h-5 w-16 rounded-md bg-slate-200/80" />
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="h-5 w-2/3 rounded-md bg-slate-200/80" />
          <div className="shrink-0 w-10 h-10 rounded-full bg-slate-200/80" />
        </div>
      </div>
    </div>
  )
}

