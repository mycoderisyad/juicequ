"use client";

import { ChevronRight, ShoppingCart, MessageCircle, Mic, Search, Heart, Clock, CreditCard, Package, Image as ImageIcon, CheckCircle, Settings, Sparkles } from "lucide-react";

export default function CustomerGuidePage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text grey-600 font-medium">
                    User Guides <ChevronRight className="h-4 w-4" /> Customer
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Customer Guide</h1>
                <p className="text-xl text-gray-500">
                    Learn how to browse products, order juice, and use AI-powered features as a customer.
                </p>
            </div>

            {/* Screenshot */}
            <div className="rounded-xl overflow-hidden border border-gray-200">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">/alt/screenshot-customer-homepage.png</p>
                    </div>
                </div>
                <div className="p-4 bg-white border-t">
                    <p className="text-sm text-gray-600">Customer homepage with product catalog</p>
                </div>
            </div>

            {/* Browsing Products */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Search className="h-5 w-5 text-green-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Browsing Products</h2>
                </div>

                <p className="text-gray-600">Explore our juice catalog with powerful search and filtering options.</p>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Menu Page</h3>
                        <p className="text-sm text-gray-600 mb-3">View all available juices in our catalog</p>
                        <a href="/menu" className="text-green-600 hover:underline text-sm font-medium">Go to Menu →</a>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Search & Filter</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Search by product name</li>
                            <li>• Filter by category (Fresh, Smoothie, etc.)</li>
                            <li>• Sort by price, popularity, or name</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* AI Chatbot */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <MessageCircle className="h-5 w-5 text-blue-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Chatbot Assistant</h2>
                </div>

                <p className="text-gray-600">Get instant help with product recommendations, nutrition info, and more using our AI chatbot.</p>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">How to Use the Chatbot</h3>
                    <ol className="space-y-3 text-sm text-blue-800">
                        <li className="flex gap-2">
                            <span className="font-bold">1.</span>
                            <span>Click the chatbot icon in the bottom-right corner of any page</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold">2.</span>
                            <span>Type your question or use voice input (click mic icon)</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold">3.</span>
                            <span>The AI will understand your intent and provide relevant information</span>
                        </li>
                    </ol>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-900 mb-2">Sample Questions</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>"Show me fresh juices"</li>
                            <li>"What's the most popular juice?"</li>
                            <li>"I need something with vitamin C"</li>
                            <li>"Add Berry Blast to my cart"</li>
                            <li>"What's in the Green Detox?"</li>
                        </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-900 mb-2">AI Capabilities</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> Product recommendations</li>
                            <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> Nutrition information</li>
                            <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> Ingredient details</li>
                            <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> Add to cart via voice/text</li>
                            <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> Navigate to specific pages</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Voice Ordering */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                        <Mic className="h-5 w-5 text-purple-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Voice Ordering</h2>
                </div>

                <p className="text-gray-600">Order juice using your voice in Indonesian, English, Javanese, or Sundanese.</p>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="font-semibold text-purple-900 mb-4">Voice Order Example</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                            <Mic className="h-4 w-4 text-purple-600 mt-1 shrink-0" />
                            <div>
                                <div className="font-medium text-purple-900">You say:</div>
                                <div className="text-purple-700 italic">"Pesan dua Berry Blast ukuran medium dan satu Green Detox large"</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MessageCircle className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                            <div>
                                <div className="font-medium text-green-900">AI responds:</div>
                                <div className="text-green-700">"I've added 2x Berry Blast (Medium) and 1x Green Detox (Large) to your cart!"</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Supported Languages</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="bg-gray-50 rounded p-2 text-center font-medium">Indonesian</div>
                        <div className="bg-gray-50 rounded p-2 text-center font-medium">English</div>
                        <div className="bg-gray-50 rounded p-2 text-center font-medium">Javanese</div>
                        <div className="bg-gray-50 rounded p-2 text-center font-medium">Sundanese</div>
                    </div>
                </div>
            </section>

            {/* Cart & Checkout */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                        <ShoppingCart className="h-5 w-5 text-orange-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Cart & Checkout</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <ShoppingCart className="h-8 w-8 text-orange-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-2">Add to Cart</h3>
                        <p className="text-sm text-gray-600">Click "Add to Cart" on any product or use voice commands</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <Settings className="h-8 w-8 text-blue-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-2">Review Items</h3>
                        <p className="text-sm text-gray-600">Adjust quantities, sizes, or remove items from your cart</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <CreditCard className="h-8 w-8 text-green-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-2">Checkout</h3>
                        <p className="text-sm text-gray-600">Complete your order with payment and delivery details</p>
                    </div>
                </div>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Checkout Features
                    </h4>
                    <ul className="text-sm text-orange-800 space-y-1 ml-7">
                        <li>Apply voucher codes for discounts</li>
                        <li>Schedule pre-orders (1-7 days ahead)</li>
                        <li>Choose pickup or delivery</li>
                        <li>Multiple payment methods</li>
                    </ul>
                </div>
            </section>

            {/* Pre-Orders */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                        <Clock className="h-5 w-5 text-indigo-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Pre-Order Scheduling</h2>
                </div>

                <p className="text-gray-600">Schedule your juice order up to 7 days in advance.</p>

                <div className="rounded-lg border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">How to Pre-Order</h3>
                    <ol className="space-y-2 text-sm text-gray-600">
                        <li>1. Add items to your cart</li>
                        <li>2. Go to checkout page</li>
                        <li>3. Select "Pre-order" option</li>
                        <li>4. Choose your preferred pickup/delivery date and time</li>
                        <li>5. Complete payment</li>
                    </ol>
                </div>
            </section>

            {/* Order Tracking */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Package className="h-5 w-5 text-green-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Order History & Tracking</h2>
                </div>

                <p className="text-gray-600">Track your current and past orders from your profile.</p>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Access Your Orders</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>1. Click your profile icon (top-right)</p>
                        <p>2. Select "My Orders"</p>
                        <p>3. View order status: Pending, Processing, Ready, Completed</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Order Status</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li className="flex items-center gap-2"><Clock className="h-3 w-3 text-yellow-600" /> <strong>Pending:</strong> Order received</li>
                            <li className="flex items-center gap-2"><Settings className="h-3 w-3 text-blue-600" /> <strong>Processing:</strong> Being prepared</li>
                            <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> <strong>Ready:</strong> Ready for pickup</li>
                            <li className="flex items-center gap-2"><Package className="h-3 w-3 text-gray-600" /> <strong>Completed:</strong> Order fulfilled</li>
                        </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Order Details</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Order number & date</li>
                            <li>• Items ordered with quantities</li>
                            <li>• Total amount paid</li>
                            <li>• Pickup/delivery time</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Profile Management */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Heart className="h-5 w-5 text-gray-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Update Profile</h3>
                        <p className="text-sm text-gray-600 mb-3">Change your name, email, phone, or profile picture</p>
                        <a href="/profile" className="text-green-600 hover:underline text-sm font-medium">Go to Profile →</a>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Change Password</h3>
                        <p className="text-sm text-gray-600 mb-3">Update your account password for security</p>
                        <a href="/profile/password" className="text-green-600 hover:underline text-sm font-medium">Change Password →</a>
                    </div>
                </div>
            </section>

            {/* Tips */}
            <div className="rounded-xl bg-green-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Pro Tips
                </h3>
                <ul className="space-y-2 text-green-50 text-sm">
                    <li className="flex items-start gap-2">
                        <span className="text-green-200">•</span>
                        <span>Use voice commands for faster ordering</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-200">•</span>
                        <span>Ask the AI chatbot for personalized recommendations based on your preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-200">•</span>
                        <span>Pre-order during busy hours to skip the queue</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-200">•</span>
                        <span>Check for active voucher codes before checkout</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-200">•</span>
                        <span>Enable notifications to get order status updates</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
