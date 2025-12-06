"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewItem } from "./ReviewItem";
import { cn } from "@/lib/utils";

interface Review {
    id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    rating: number;
    comment?: string;
    image_url?: string;
    is_ai_generated: boolean;
    is_verified_purchase: boolean;
    created_at: string;
}

interface ReviewListProps {
    productId: string;
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
    currentUserId?: string | null;
    onEditReview?: (review: Review) => void;
    onDeleteReview?: (review: Review) => void;
}

export function ReviewList({
    productId,
    reviews,
    averageRating,
    totalReviews,
    currentUserId,
    onEditReview,
    onDeleteReview,
}: ReviewListProps) {
    const [filterRating, setFilterRating] = useState<number | "all">("all");

    const filteredReviews = reviews.filter(
        (r) => filterRating === "all" || r.rating === filterRating
    );

    // If no reviews, show empty state
    if (reviews.length === 0) {
        return (
            <div className="bg-stone-50 rounded-2xl p-10 text-center">
                <div className="text-gray-400 mb-2">
                    <Star className="h-12 w-12 mx-auto opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">No reviews yet</h3>
                <p className="text-gray-500 mt-1">Be the first to review this product!</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header / Summary */}
            <div className="bg-stone-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Average Rating Block */}
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                        <div className="flex justify-center mt-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={cn("h-4 w-4", star <= Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200")} />
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={filterRating === "all" ? "default" : "outline"}
                        onClick={() => setFilterRating("all")}
                        size="sm"
                        className={filterRating === "all" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    >
                        All
                    </Button>
                    {[5, 4, 3, 2, 1].map(star => (
                        <Button
                            key={star}
                            variant={filterRating === star ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterRating(star)}
                            className={filterRating === star ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        >
                            {star} Star
                        </Button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="space-y-2">
                {filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => (
                        <ReviewItem
                            key={review.id}
                            review={review}
                            isOwner={currentUserId === review.user_id}
                            onEdit={onEditReview ? () => onEditReview(review) : undefined}
                            onDelete={onDeleteReview ? () => onDeleteReview(review) : undefined}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        No reviews found for this filter.
                    </div>
                )}
            </div>
        </div>
    );
}
