import { StarIcon, BadgeCheck, Quote, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StarsProps = {
  value: number;
  className?: string;
};

export function Stars({ value, className }: StarsProps) {
  const rating = Math.min(5, Math.max(0, value));

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(Math.max(rating - i, 0), 1);

        return (
          <span key={i} className="relative inline-block size-3.5 sm:size-4">
            <StarIcon
              className="absolute inset-0 size-3.5 sm:size-4 fill-[#E8E2DE] text-[#E8E2DE] dark:fill-stone-700 dark:text-stone-700"
              aria-hidden="true"
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <StarIcon
                className="size-3.5 sm:size-4 fill-[#F59E0B] text-[#F59E0B]"
                aria-hidden="true"
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export type ReviewCardProps = {
  rating?: number;
  title?: string;
  review?: string;
  author?: string;
  role?: string;
  date?: string;
  avatarUrl?: string;
  verifiedText?: string;
  className?: string;
};

export default function ReviewCard({
  rating = 4.5,
  title = "Beautiful craftsmanship",
  review = "The jewellery is even more beautiful in person. The detailing feels exquisite, the finish is elegant, and the entire shopping experience was wonderful.",
  author = "Priya S.",
  role = "Jewellery customer",
  date = "Recently",
  avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces",
  verifiedText = "Verified purchase",
  className,
}: ReviewCardProps) {
  return (
    <Card
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border border-[#E8DDD8] dark:border-[#3D252E] bg-[#FFFEFC] dark:bg-[#1E1115] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C69A8B] hover:shadow-lg flex flex-col justify-between",
        className
      )}
    >
      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Stars value={rating} />
                <span className="text-xs font-bold text-[#34252A] dark:text-[#FAF5F0]">
                  {rating.toFixed(1)}
                </span>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-[#F5ECE8] dark:bg-[#341822] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#702638] dark:text-[#E8A598]">
                <BadgeCheck className="size-3" />
                {verifiedText}
              </span>
            </div>

            <Quote
              className="size-6 shrink-0 text-[#C69A8B]/50"
              strokeWidth={1.4}
              aria-hidden="true"
            />
          </div>

          {/* Review */}
          <div className="space-y-1">
            <h3 className="font-serif text-base sm:text-[17px] font-normal leading-snug text-[#34252A] dark:text-[#FAF5F0]">
              {title}
            </h3>

            <p className="text-xs sm:text-[13px] leading-relaxed text-[#71666A] dark:text-[#C6B6BA] line-clamp-3">
              {review}
            </p>
          </div>
        </div>

        <div className="pt-2.5">
          {/* Divider */}
          <div className="h-px bg-[#EEE5E1] dark:bg-[#38232B] mb-2.5" />

          {/* Customer information */}
          <div className="flex items-center gap-2.5">
            <img
              src={avatarUrl}
              alt={`${author} portrait`}
              loading="lazy"
              className="size-9 sm:size-10 rounded-full border border-[#E8DDD8] dark:border-[#3D252E] object-cover shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs sm:text-sm font-semibold text-[#34252A] dark:text-[#FAF5F0]">
                {author}
              </p>

              <p className="truncate text-[11px] text-[#8A7D80] dark:text-[#A8989C]">
                {role}
              </p>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[#8A7D80] dark:text-[#A8989C] shrink-0">
              <CalendarDays className="size-3 text-[#C69A8B]" />
              <span>{date}</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Subtle brand accent */}
      <div className="h-0.5 sm:h-1 w-full bg-gradient-to-r from-[#702638] via-[#C69A8B] to-[#702638] opacity-70 transition-opacity group-hover:opacity-100" />
    </Card>
  );
}
