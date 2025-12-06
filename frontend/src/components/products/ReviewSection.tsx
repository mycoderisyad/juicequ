"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PenLine, Lock, Check } from "lucide-react";
import apiClient from "@/lib/api/config";
import { ReviewList } from "./ReviewList";
import { ReviewForm } from "./ReviewForm";

interface ReviewSectionProps {
    productId: string;
    productName: string;
}

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

interface ReviewsData {
    items: Review[];
    total: number;
    page: number;
    size: number;
    average_rating: number;
    rating_distribution: Record<number, number>;
}

const AI_PHOTOBOOTH_LIMIT = 3;

export function ReviewSection({ productId, productName }: ReviewSectionProps) {
    const [isWriting, setIsWriting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [canReview, setCanReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [photoboothRemaining, setPhotoboothRemaining] = useState(AI_PHOTOBOOTH_LIMIT);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [reviews, setReviews] = useState<ReviewsData | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await apiClient.get(`/customer/products/${productId}/reviews`);
            setReviews(res.data);

            // Check if current user already reviewed
            if (currentUserId && res.data?.items) {
                const existing = res.data.items.find((r: Review) => r.user_id === currentUserId);
                setHasReviewed(!!existing);
            } else {
                setHasReviewed(false);
            }
        } catch (err) {
            console.error("Failed to fetch reviews:", err);
        }
    }, [productId, currentUserId]);

    useEffect(() => {
        const checkEligibility = async () => {
            try {
                const token = localStorage.getItem("token") || localStorage.getItem("access_token");
                if (!token) {
                    setIsLoggedIn(false);
                    setIsLoading(false);
                    fetchReviews();
                    return;
                }
                setIsLoggedIn(true);

                const [ordersRes, profileRes] = await Promise.allSettled([
                    apiClient.get("/customer/orders", {
                        params: { page: 1, page_size: 100 },
                    }),
                    apiClient.get("/customer/profile"),
                ]);

                if (ordersRes.status === "fulfilled") {
                    const orders = ordersRes.value.data?.orders || [];
                    const validStatuses = ["paid", "preparing", "ready", "completed"];
                    const hasPurchased = orders.some((order: any) => {
                        const statusMatch = validStatuses.includes(order.status?.toLowerCase());
                        const itemMatch = order.items?.some(
                            (item: any) => String(item.product_id) === String(productId),
                        );
                        return statusMatch && itemMatch;
                    });
                    setCanReview(hasPurchased);
                }

                if (profileRes.status === "fulfilled") {
                    const profile = profileRes.value.data;
                    const used = profile?.ai_photobooth_count || 0;
                    setPhotoboothRemaining(Math.max(0, AI_PHOTOBOOTH_LIMIT - used));
                    setCurrentUserId(profile?.id);
                }
            } catch (err) {
                console.error("Failed to check review eligibility:", err);
            } finally {
                setIsLoading(false);
            }
        };
        checkEligibility();
    }, [productId, fetchReviews]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmitReview = async (data: { rating: number; comment: string; imageBlob?: Blob; isAiGenerated?: boolean }) => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("access_token");
            if (!token) return;

            const formData = new FormData();
            formData.append("rating", String(data.rating));
            if (data.comment) formData.append("comment", data.comment);
            if (data.imageBlob) {
                formData.append("image", data.imageBlob, "review-image.jpg");
                formData.append("is_ai_generated", data.isAiGenerated ? "true" : "false");
            }

            if (isEditing && editingReview) {
                // Update existing review
                await apiClient.put(
                    `/customer/products/${productId}/reviews/${editingReview.id}`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
            } else {
                // Create new review
                await apiClient.post(
                    `/customer/products/${productId}/reviews`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
            }

            await fetchReviews();
            setIsWriting(false);
            setIsEditing(false);
            setEditingReview(null);
            setHasReviewed(true);

        } catch (err: any) {
            console.error(err);
            const message = err?.response?.data?.detail || "Failed to submit review. Please try again.";
            alert(message);
        }
    };

    const handleEditReview = (review: Review) => {
        setEditingReview(review);
        setIsEditing(true);
        setIsWriting(true);
    };

    const handleDeleteReview = async (review: Review) => {
        if (!confirm("Are you sure you want to delete your review?")) return;

        try {
            await apiClient.delete(`/customer/products/${productId}/reviews/${review.id}`);
            await fetchReviews();
            setHasReviewed(false);
        } catch (err: any) {
            console.error(err);
            const message = err?.response?.data?.detail || "Failed to delete review. Please try again.";
            alert(message);
        }
    };

    const handleCancelForm = () => {
        setIsWriting(false);
        setIsEditing(false);
        setEditingReview(null);
    };

    const renderButton = () => {
        if (isLoading) return null;

        if (!isLoggedIn) {
            return (
                <div className="mt-4 md:mt-0 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                    <Link href="/login" className="hover:underline">Login</Link> to write a review
                </div>
            );
        }

        if (hasReviewed) {
            return (
                <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                    <Check className="h-4 w-4" />
                    You&apos;ve reviewed this product
                </div>
            );
        }

        if (canReview) {
            return (
                <Button
                    onClick={() => setIsWriting(true)}
                    className="mt-4 md:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6"
                >
                    <PenLine className="mr-2 h-4 w-4" />
                    Write a Review
                </Button>
            );
        }

        return (
            <div className="flex flex-col items-end">
                <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full cursor-not-allowed">
                    <Lock className="h-4 w-4" />
                    Purchase this product to write a review
                </div>
            </div>
        );
    };

    return (
        <section className="py-10 border-t border-stone-100" id="reviews">
            <div className="md:flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                    <p className="text-gray-500 mt-1">See what others are saying about {productName}</p>
                </div>

                {!isWriting && renderButton()}
            </div>

            {isWriting ? (
                <ReviewForm
                    productId={productId}
                    productName={productName}
                    onSubmit={handleSubmitReview}
                    onCancel={handleCancelForm}
                    photoboothRemaining={photoboothRemaining}
                    existingReview={editingReview}
                />
            ) : (
                <ReviewList
                    productId={productId}
                    reviews={reviews?.items || []}
                    averageRating={reviews?.average_rating || 0}
                    totalReviews={reviews?.total || 0}
                    currentUserId={currentUserId}
                    onEditReview={handleEditReview}
                    onDeleteReview={handleDeleteReview}
                />
            )}
        </section>
    );
}
