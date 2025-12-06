"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Sparkles, X, RefreshCw, Wand2, AlertCircle } from "lucide-react";
import apiClient from "@/lib/api/config";

interface AiPhotoboothProps {
    productName: string;
    onImageGenerated: (blob: Blob) => void;
    onCancel: () => void;
}

export function AiPhotobooth({ productName, onImageGenerated, onCancel }: AiPhotoboothProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image size must be less than 10MB');
            return;
        }

        setError(null);
        setImageFile(file);

        const reader = new FileReader();
        reader.onload = (event) => {
            setImageSrc(event.target?.result as string);
            setProcessedImage(null);
        };
        reader.readAsDataURL(file);
    };

    const processImage = async () => {
        if (!imageFile) return;

        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('product_name', productName);

            const response = await apiClient.post('/customer/photobooth/generate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
                timeout: 240000, // 240 seconds for AI image generation
            });

            // Create blob from response
            const blob = new Blob([response.data], { type: 'image/jpeg' });
            const imageUrl = URL.createObjectURL(blob);

            setProcessedImage(imageUrl);
            onImageGenerated(blob);

        } catch (err: any) {

            // Try to get error message
            let errorMessage = 'Failed to generate image. Please try again.';

            if (err.response?.data) {
                // If it's a blob response, try to read it as text
                if (err.response.data instanceof Blob) {
                    try {
                        const text = await err.response.data.text();
                        const json = JSON.parse(text);
                        errorMessage = json.detail || errorMessage;
                    } catch {
                        // Ignore parsing errors
                    }
                } else if (err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                }
            }

            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setImageSrc(null);
        setImageFile(null);
        setProcessedImage(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl">
                <button
                    onClick={onCancel}
                    className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-gray-500 hover:bg-gray-100"
                >
                    <X className="h-5 w-5" />
                </button>

                <h3 className="mb-2 text-center text-xl font-bold text-gray-900">
                    AI Photobooth ✨
                </h3>
                <p className="mb-4 text-center text-sm text-gray-500">
                    Upload your photo and we&apos;ll create a stunning JuiceQu-themed image!
                </p>

                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-100 border-2 border-dashed border-stone-300">
                    {!imageSrc ? (
                        <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                            <div className="rounded-full bg-gradient-to-br from-emerald-100 to-orange-100 p-6">
                                <Camera className="h-10 w-10 text-emerald-600" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-gray-700">Upload your photo</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    We&apos;ll transform it into an amazing<br />
                                    JuiceQu promotional image!
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Choose Photo
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </div>
                    ) : (
                        <div className="relative h-full w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={processedImage || imageSrc}
                                alt="Upload preview"
                                className="h-full w-full object-cover"
                            />
                            {isProcessing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <div className="flex flex-col items-center text-white">
                                        <div className="relative">
                                            <Sparkles className="h-12 w-12 text-amber-400 animate-pulse" />
                                            <div className="absolute inset-0 animate-spin">
                                                <Sparkles className="h-12 w-12 text-pink-400 opacity-50" />
                                            </div>
                                        </div>
                                        <p className="mt-4 font-medium text-lg">Creating magic...</p>
                                        <p className="text-sm text-gray-300 mt-1">This may take a moment</p>
                                    </div>
                                </div>
                            )}
                            {processedImage && (
                                <div className="absolute bottom-3 left-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    AI Generated
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                    {imageSrc && !processedImage && (
                        <Button
                            onClick={processImage}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold hover:opacity-90 transition-opacity h-12"
                        >
                            <Wand2 className="mr-2 h-5 w-5" />
                            {isProcessing ? "Generating..." : "Generate AI Image"}
                        </Button>
                    )}

                    {processedImage && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleReset}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={onCancel}
                            >
                                Use This Photo
                            </Button>
                        </div>
                    )}

                    {imageSrc && !processedImage && !isProcessing && (
                        <Button
                            variant="ghost"
                            className="text-gray-500"
                            onClick={handleReset}
                        >
                            Choose Different Photo
                        </Button>
                    )}
                </div>

                <p className="mt-4 text-center text-xs text-gray-400">
                    Powered by AI • Your photo will be transformed into a JuiceQu-themed image
                </p>
            </div>
        </div>
    );
}
