"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getGuestId } from "@/lib/utils/guest-id";
import { StarRatingDisplay, StarRatingInput } from "../../components/StarRating";
import { fetchOrderReview, submitOrderReview } from "../order-data";

const REVIEWABLE = ["delivered", "closed"];

export function OrderReviewSection({
  orderId,
  orderGuestId,
  status,
}: {
  orderId: string;
  orderGuestId: string | null;
  status: string;
}) {
  const [guestId] = useState<string | null>(() => getGuestId());
  const isOwner = Boolean(guestId) && guestId === orderGuestId;

  const reviewQuery = useQuery({
    queryKey: ["order-review", orderId],
    queryFn: () => fetchOrderReview(orderId),
  });

  const [draftStars, setDraftStars] = useState(0);
  const [draftComment, setDraftComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ rating: number; comment: string | null } | null>(
    null,
  );

  // Don't render anything until the order can be reviewed.
  if (!REVIEWABLE.includes(status)) return null;

  const existing = saved ?? reviewQuery.data;

  // A non-owner only sees an existing review (read-only); never the form.
  if (!isOwner && !existing) return null;

  const submit = async () => {
    if (!guestId || saving || draftStars === 0) return;
    setSaving(true);
    try {
      const res = await submitOrderReview(orderId, guestId, draftStars, draftComment);
      setSaved(res);
      toast("Дякуємо за відгук!");
    } catch {
      toast("Не вдалося надіслати відгук");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="review" className="scroll-mt-24 mt-6">
      <h2 className="mb-3 text-[17px] font-bold text-white">Відгук</h2>

      {existing ? (
        <div className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-4 py-4">
          <StarRatingDisplay value={existing.rating} size={18} />
          {existing.comment ? (
            <p className="mt-2 text-[13px] leading-5 text-[#ccc]">
              {existing.comment}
            </p>
          ) : null}
          {isOwner ? (
            <p className="mt-2 text-[11px] text-[#666]">Ваш відгук збережено.</p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-4 py-4">
          <p className="mb-3 text-[13px] text-[#aaa]">
            Як вам кальян? Поставте оцінку.
          </p>
          <StarRatingInput value={draftStars} onPick={setDraftStars} disabled={saving} />
          <textarea
            value={draftComment}
            onChange={(e) => setDraftComment(e.target.value)}
            placeholder="Коментар (необовʼязково)"
            maxLength={500}
            rows={3}
            className="mt-3 w-full resize-none rounded-[10px] border border-white/[0.08] bg-black/30 px-3 py-2 text-[13px] text-white placeholder:text-[#666] focus:border-[#ff4500]/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={saving || draftStars === 0}
            className="tap mt-3 flex h-11 w-full items-center justify-center rounded-[12px] bg-[#ff4500] text-[14px] font-extrabold text-white disabled:opacity-40"
          >
            Надіслати відгук
          </button>
        </div>
      )}
    </section>
  );
}
