"use client";

import { useState, useRef } from "react";
import { Star, Camera, ImagePlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AiPhotobooth } from "./AiPhotobooth";

interface ExistingReview {
    id: string;
    rating: number;
    comment?: string;
    image_url?: string;
}

interface ReviewFormProps {
    productId: string;
    productName: string;
    onSubmit: (data: { rating: number; comment: string; imageBlob?: Blob; isAiGenerated?: boolean }) => Promise<void>;
    onCancel: () => void;
    photoboothRemaining?: number;
    existingReview?: ExistingReview | null;
}

export function ReviewForm({ productId, productName, onSubmit, onCancel, photoboothRemaining = 3, existingReview }: ReviewFormProps) {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState(existingReview?.comment || "");
    const [showPhotobooth, setShowPhotobooth] = useState(false);
    const [reviewImage, setReviewImage] = useState<Blob | null>(null);
    const [isAiImage, setIsAiImage] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isEditing = !!existingReview;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                rating,
                comment,
                imageBlob: reviewImage || undefined,
                isAiGenerated: isAiImage
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAiImageGenerated = (blob: Blob) => {
        setReviewImage(blob);
        setIsAiImage(true);
        setShowPhotobooth(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB');
                return;
            }
            setReviewImage(file);
            setIsAiImage(false);
        }
    };

    const handleRemoveImage = () => {
        setReviewImage(null);
        setIsAiImage(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">
                {isEditing ? 'Edit Your Review' : 'Write a Review'} for {productName}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Rating</label>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={cn(
                                        "h-8 w-8 transition-colors",
                                        star <= (hoverRating || rating)
                                            ? "fill-amber-400 text-amber-400"
                                            : "fill-gray-100 text-gray-200"
                                    )}
                                />
                            </button>
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-500">
                            {rating > 0 ? `${rating} stars` : "Select a rating"}
                        </span>
                    </div>
                </div>

                {/* Comment */}
                <div>
                    <label htmlFor="comment" className="mb-2 block text-sm font-medium text-gray-700">
                        Review (Optional)
                    </label>
                    <textarea
                        id="comment"
                        rows={4}
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="What did you like about this product?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                {/* Photo Options */}
                <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">
                        Add a Photo (Optional)
                    </label>

                    {!reviewImage ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Upload Regular Photo */}
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-colors"
                                >
                                    <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-gray-600">Upload Photo</span>
                                    <span className="text-xs text-gray-400 mt-1">Max 5MB</span>
                                </label>
                            </div>

                            {/* AI Photobooth */}
                            <button
                                type="button"
                                onClick={() => setShowPhotobooth(true)}
                                disabled={photoboothRemaining <= 0}
                                className={cn(
                                    "flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed transition-colors",
                                    photoboothRemaining > 0
                                        ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer"
                                        : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                                )}
                            >
                                <Sparkles className={cn("h-8 w-8 mb-2", photoboothRemaining > 0 ? "text-emerald-500" : "text-gray-400")} />
                                <span className={cn("text-sm font-medium", photoboothRemaining > 0 ? "text-emerald-700" : "text-gray-500")}>
                                    AI Photobooth
                                </span>
                                <span className={cn("text-xs mt-1", photoboothRemaining > 0 ? "text-emerald-500" : "text-gray-400")}>
                                    {photoboothRemaining > 0
                                        ? `${photoboothRemaining} uses left`
                                        : "Limit reached"
                                    }
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={URL.createObjectURL(reviewImage)}
                                        alt="Review preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-emerald-800 block">Photo added!</span>
                                    <span className="text-xs text-emerald-600">
                                        {isAiImage ? "✨ Created with AI Photobooth" : "📷 Uploaded photo"}
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={handleRemoveImage}
                            >
                                Remove
                            </Button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={rating === 0 || isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                    >
                        {isSubmitting ? "Submitting..." : isEditing ? "Update Review" : "Submit Review"}
                    </Button>
                </div>
            </form>

            {showPhotobooth && (
                <AiPhotobooth
                    productName={productName}
                    onImageGenerated={handleAiImageGenerated}
                    onCancel={() => setShowPhotobooth(false)}
                />
            )}
        </div>
    );
}
