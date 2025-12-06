"use client";

import { useState } from "react";
import { Star, CheckCircle2, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || "http://localhost:8000";

interface ReviewItemProps {
    review: {
        id: string;
        user_name: string;
        user_avatar?: string | null;
        rating: number;
        comment?: string | null;
        image_url?: string | null;
        is_ai_generated: boolean;
        is_verified_purchase: boolean;
        created_at: string;
    };
    isOwner?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ReviewItem({ review, isOwner, onEdit, onDelete }: ReviewItemProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Build full image URL if it's a relative path
    const getFullImageUrl = (url: string | null | undefined): string | null => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (url.startsWith('/uploads')) return `${API_BASE_URL}${url}`;
        return url;
    };

    const fullImageUrl = getFullImageUrl(review.image_url);

    return (
        <>
            <div className="border-b border-stone-100 py-6 last:border-0 hover:bg-stone-50/50 transition-colors rounded-xl px-4">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {review.user_avatar ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-stone-200">
                                <Image
                                    src={review.user_avatar}
                                    alt={review.user_name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                {review.user_name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-2">
                        {/* Header: Name, Verified, Date */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{review.user_name}</span>
                                {review.is_verified_purchase && (
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Verified Purchase
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                </span>
                                {/* Edit/Delete buttons for owner */}
                                {isOwner && (
                                    <div className="flex items-center gap-1">
                                        {onEdit && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={onEdit}
                                                className="h-7 px-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={onDelete}
                                                className="h-7 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                        "h-4 w-4",
                                        star <= review.rating
                                            ? "fill-amber-400 text-amber-400"
                                            : "fill-gray-100 text-gray-200"
                                    )}
                                />
                            ))}
                        </div>

                        {/* Comment */}
                        {review.comment && (
                            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                        )}

                        {/* Review Image (AI Photobooth result) */}
                        {fullImageUrl && (
                            <div className="mt-3">
                                <div
                                    className="relative h-48 w-48 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 group cursor-pointer"
                                    onClick={() => setIsLightboxOpen(true)}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={fullImageUrl}
                                        alt="Review photo"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {review.is_ai_generated && (
                                        <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm flex items-center gap-1">
                                            <span className="text-emerald-400">✨</span> Created with AI
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium drop-shadow-lg transition-opacity">
                                            Click to enlarge
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && fullImageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div
                        className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={fullImageUrl}
                            alt="Review photo"
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                        {review.is_ai_generated && (
                            <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm flex items-center gap-1.5">
                                <span className="text-emerald-400">✨</span> Created with AI Photobooth
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
