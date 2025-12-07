"use client";

import { ChevronRight, Settings, Users, Package, Tag, BarChart3, Clock, Globe, Shield, Image as ImageIcon, CheckCircle } from "lucide-react";

export default function AdminGuidePage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    User Guides <ChevronRight className="h-4 w-4" /> Admin
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Admin Guide</h1>
                <p className="text-xl text-gray-500">
                    Complete system administration guide for managing products, users, settings, and analytics.
                </p>
            </div>

            {/* Screenshot Placeholder */}
            <div className="rounded-xl overflow-hidden border border-gray-200">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">/alt/screenshot-admin-dashboard.png</p>
                    </div>
                </div>
                <div className="p-4 bg-white border-t">
                    <p className="text-sm text-gray-600">Admin dashboard overview</p>
                </div>
            </div>

            {/* Dashboard Overview */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <BarChart3 className="h-5 w-5 text-blue-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                </div>

                <p className="text-gray-600">Access the admin dashboard at <a href="/admin" className="text-green-600 hover:underline font-medium">/admin</a> after logging in as an administrator.</p>

                <div className="grid md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                        <div className="text-3xl mb-2">📊</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
                        <p className="text-sm text-gray-600">Real-time sales, revenue, and performance metrics</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                        <div className="text-3xl mb-2">🛒</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Quick Stats</h3>
                        <p className="text-sm text-gray-600">Today's orders, revenue, and top products</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                        <div className="text-3xl mb-2">👥</div>
                        <h3 className="font-semibold text-gray-900 mb-2">User Activity</h3>
                        <p className="text-sm text-gray-600">Active customers and recent registrations</p>
                    </div>
                </div>
            </section>

            {/* Product Management */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Package className="h-5 w-5 text-green-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
                </div>

                <p className="text-gray-600">Manage your juice products, categories, and inventory.</p>

                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-5">
                    <h3 className="font-semibold text-green-900 mb-3">Product Operations</h3>
                    <div className="space-y-3">
                        <a href="/admin/products" className="block bg-white hover:bg-green-50 border border-green-100 rounded-lg p-3 transition-colors">
                            <div className="font-medium text-green-900">View All Products →</div>
                            <div className="text-sm text-green-700">Browse, search, and filter your product catalog</div>
                        </a>
                        <a href="/admin/products/new" className="block bg-white hover:bg-green-50 border border-green-100 rounded-lg p-3 transition-colors">
                            <div className="font-medium text-green-900">Add New Product →</div>
                            <div className="text-sm text-green-700">Create new juice products with images and details</div>
                        </a>
                        <a href="/admin/categories" className="block bg-white hover:bg-green-50 border border-green-100 rounded-lg p-3 transition-colors">
                            <div className="font-medium text-green-900">Manage Categories →</div>
                            <div className="text-sm text-green-700">Create and edit product categories</div>
                        </a>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Product Fields</h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <ul className="space-y-1 text-gray-600">
                            <li>• Name & Description</li>
                            <li>• Base Price (varies by size)</li>
                            <li>• Category</li>
                            <li>• Product Images (hero, catalog, thumbnail)</li>
                        </ul>
                        <ul className="space-y-1 text-gray-600">
                            <li>• Ingredients</li>
                            <li>• Nutrition Facts</li>
                            <li>• Availability Status</li>
                            <li>• AI Training Data (for chatbot)</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">💡 Product Images</h4>
                    <p className="text-sm text-amber-800">Upload high-quality images for best results. Images are automatically optimized and stored in <code className="bg-white px-1 rounded">/uploads/products/</code></p>
                </div>
            </section>

            {/* Category Management */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                        <Tag className="h-5 w-5 text-purple-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Create Categories</h3>
                        <p className="text-sm text-gray-600 mb-3">Organize products into categories like "Fresh Juice", "Smoothies", "Detox", etc.</p>
                        <a href="/admin/categories/new" className="text-green-600 hover:underline text-sm font-medium">Add Category →</a>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Edit Categories</h3>
                        <p className="text-sm text-gray-600 mb-3">Update category names, descriptions, and display order</p>
                        <a href="/admin/categories" className="text-green-600 hover:underline text-sm font-medium">Manage Categories →</a>
                    </div>
                </div>
            </section>

            {/* User Management */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                        <Users className="h-5 w-5 text-indigo-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                </div>

                <p className="text-gray-600">Manage user accounts and assign roles.</p>

                <div className="rounded-lg border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">User Roles</h3>
                    <div className="grid md:grid-cols-3 gap-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="font-semibold text-green-900 mb-1">Customer</div>
                            <div className="text-xs text-green-700">Browse, order, and track purchases</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="font-semibold text-blue-900 mb-1">Cashier</div>
                            <div className="text-xs text-blue-700">Process orders via POS system</div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="font-semibold text-purple-900 mb-1">Admin</div>
                            <div className="text-xs text-purple-700">Full system access and control</div>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <a href="/admin/users" className="flex items-center justify-between group">
                        <div>
                            <h4 className="font-semibold text-indigo-900">Manage Users</h4>
                            <p className="text-sm text-indigo-700">View, edit, or deactivate user accounts</p>
                        </div>
                        <div className="text-indigo-600 group-hover:translate-x-1 transition-transform">→</div>
                    </a>
                </div>
            </section>

            {/* Voucher Management */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                        <Tag className="h-5 w-5 text-orange-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Voucher & Promotions</h2>
                </div>

                <p className="text-gray-600">Create discount vouchers and promotional campaigns.</p>

                <div className="rounded-lg border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Voucher Types</h3>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                            <div className="font-semibold text-gray-900 mb-1">Percentage Discount</div>
                            <div className="text-gray-600">e.g., 10% OFF, 20% OFF</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                            <div className="font-semibold text-gray-900 mb-1">Fixed Amount</div>
                            <div className="text-gray-600">e.g., Rp 10.000 OFF</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Voucher Settings</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Voucher code (e.g., FRESH10, NEWUSER)</li>
                        <li>• Discount type and amount</li>
                        <li>• Minimum purchase requirement</li>
                        <li>• Usage limit (total uses or per user)</li>
                        <li>• Valid from and expiry date</li>
                        <li>• Active/inactive status</li>
                    </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <a href="/admin/vouchers" className="flex items-center justify-between group">
                        <div>
                            <h4 className="font-semibold text-orange-900">Manage Vouchers</h4>
                            <p className="text-sm text-orange-700">Create, edit, or deactivate vouchers</p>
                        </div>
                        <div className="text-orange-600 group-hover:translate-x-1 transition-transform">→</div>
                    </a>
                </div>
            </section>

            {/* Store Settings */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Settings className="h-5 w-5 text-gray-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Store Settings</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <Clock className="h-6 w-6 text-blue-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-2">Operating Hours</h3>
                        <p className="text-sm text-gray-600">Set store opening and closing times for each day of the week</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <Globe className="h-6 w-6 text-green-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-2">Currency & Language</h3>
                        <p className="text-sm text-gray-600">Configure display currency (IDR/USD) and default language</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <Package className="h-6 w-6 text-purple-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-2">Payment Methods</h3>
                        <p className="text-sm text-gray-600">Enable/disable payment options (Cash, Card, E-Wallet)</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <Shield className="h-6 w-6 text-red-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-2">API Keys</h3>
                        <p className="text-sm text-gray-600">Manage Kolosal AI, Gemini, and other service API keys</p>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <a href="/admin/settings" className="flex items-center justify-between group">
                        <div>
                            <h4 className="font-semibold text-gray-900">System Settings</h4>
                            <p className="text-sm text-gray-600">Access all configuration options</p>
                        </div>
                        <div className="text-gray-600 group-hover:translate-x-1 transition-transform">→</div>
                    </a>
                </div>
            </section>

            {/* Analytics */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <BarChart3 className="h-5 w-5 text-blue-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
                </div>

                <p className="text-gray-600">Monitor business performance with detailed analytics.</p>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <h3 className="font-semibold text-gray-900 mb-3">Sales Reports</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Daily, weekly, monthly revenue</li>
                            <li>• Sales trends and growth charts</li>
                            <li>• Peak hours analysis</li>
                            <li>• Payment method distribution</li>
                        </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                        <h3 className="font-semibold text-gray-900 mb-3">Product Analytics</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Best-selling products</li>
                            <li>• Product performance comparison</li>
                            <li>• Category-wise sales</li>
                            <li>• Low-stock alerts</li>
                        </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                        <h3 className="font-semibold text-gray-900 mb-3">Customer Insights</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• New vs returning customers</li>
                            <li>• Customer lifetime value</li>
                            <li>• Order frequency analysis</li>
                            <li>• Popular customer preferences</li>
                        </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-orange-50 to-amber-50">
                        <h3 className="font-semibold text-gray-900 mb-3">Operational Metrics</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Average order value</li>
                            <li>• Order completion rate</li>
                            <li>• Cashier performance</li>
                            <li>• Voucher usage statistics</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <a href="/admin/analytics" className="flex items-center justify-between group">
                        <div>
                            <h4 className="font-semibold text-blue-900">View Full Analytics</h4>
                            <p className="text-sm text-blue-700">Access comprehensive business intelligence dashboard</p>
                        </div>
                        <div className="text-blue-600 group-hover:translate-x-1 transition-transform">→</div>
                    </a>
                </div>
            </section>

            {/* Best Practices */}
            <div className="rounded-xl bg-green-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Admin Best Practices
                </h3>
                <ul className="space-y-2 text-green-50 text-sm">
                    <li className="flex items-start gap-2"><span className="text-green-200">•</span><span>Regularly update product pricing and availability</span></li>
                    <li className="flex items-start gap-2"><span className="text-green-200">•</span><span>Monitor analytics daily to identify trends and opportunities</span></li>
                    <li className="flex items-start gap-2"><span className="text-green-200">•</span><span>Create promotional vouchers during slow periods to boost sales</span></li>
                    <li className="flex items-start gap-2"><span className="text-green-200">•</span><span>Keep product images and descriptions up-to-date</span></li>
                    <li className="flex items-start gap-2"><span className="text-green-200">•</span><span>Review user feedback and adjust product offerings accordingly</span></li>
                    <li className="flex items-start gap-2"><span className="text-green-200">•</span><span>Backup database regularly (configured in settings)</span></li>
                    <li className="flex items-start gap-2"><span className="text-green-200">•</span><span>Train cashier staff on new features and updates</span></li>
                </ul>
            </div>
        </div>
    );
}
