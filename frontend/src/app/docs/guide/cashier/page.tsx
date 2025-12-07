"use client";

import { ChevronRight, Monitor, Receipt, DollarSign, TrendingUp, Package, Printer, Search, Image as ImageIcon, CheckCircle } from "lucide-react";

export default function CashierGuidePage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    User Guides <ChevronRight className="h-4 w-4" /> Cashier
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Cashier Guide</h1>
                <p className="text-xl text-gray-500">
                    Learn how to use the POS system, process orders, and manage daily transactions as a cashier.
                </p>
            </div>

            {/* Screenshot */}
            <div className="rounded-xl overflow-hidden border border-gray-200">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">/alt/screenshot-cashier-pos.png</p>
                    </div>
                </div>
                <div className="p-4 bg-white border-t">
                    <p className="text-sm text-gray-600">Cashier POS interface</p>
                </div>
            </div>

            {/* POS Interface */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <Monitor className="h-5 w-5 text-blue-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">POS Interface Overview</h2>
                </div>

                <p className="text-gray-600">The Point of Sale (POS) system is designed for fast, efficient order processing.</p>

                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-5">
                    <h3 className="font-semibold text-blue-900 mb-3">Accessing the POS</h3>
                    <ol className="space-y-2 text-sm text-blue-800">
                        <li>1. Login with your cashier credentials</li>
                        <li>2. Navigate to <a href="/cashier/pos" className="underline font-medium">Cashier → POS</a></li>
                        <li>3. The POS interface will load with product catalog</li>
                    </ol>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="text-3xl mb-2">🛍️</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Product Selection</h3>
                        <p className="text-sm text-gray-600">Click products to add to current order</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="text-3xl mb-2">🧾</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                        <p className="text-sm text-gray-600">View items, quantities, and total amount</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="text-3xl mb-2">💳</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Payment Processing</h3>
                        <p className="text-sm text-gray-600">Complete transactions with various payment methods</p>
                    </div>
                </div>
            </section>

            {/* Processing Orders */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Receipt className="h-5 w-5 text-green-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Processing Orders</h2>
                </div>

                <div className="rounded-lg border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Step-by-Step Order Flow</h3>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 text-sm shrink-0">1</div>
                            <div>
                                <div className="font-medium text-gray-900">Select Products</div>
                                <div className="text-sm text-gray-600">Click on products from the catalog or use the search bar</div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 text-sm shrink-0">2</div>
                            <div>
                                <div className="font-medium text-gray-900">Adjust Quantities & Sizes</div>
                                <div className="text-sm text-gray-600">Use +/- buttons to adjust quantity, select size (Small/Medium/Large)</div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 text-sm shrink-0">3</div>
                            <div>
                                <div className="font-medium text-gray-900">Apply Vouchers (Optional)</div>
                                <div className="text-sm text-gray-600">Enter voucher code if customer has one</div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 text-sm shrink-0">4</div>
                            <div>
                                <div className="font-medium text-gray-900">Select Payment Method</div>
                                <div className="text-sm text-gray-600">Cash, Debit Card, Credit Card, E-Wallet, etc.</div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 text-sm shrink-0">5</div>
                            <div>
                                <div className="font-medium text-gray-900">Complete Transaction</div>
                                <div className="text-sm text-gray-600">Process payment and print receipt</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">💡 Quick Tip</h4>
                    <p className="text-sm text-amber-800">Use keyboard shortcuts for faster processing: <code className="bg-white px-1 rounded">Enter</code> to complete order, <code className="bg-white px-1 rounded">Esc</code> to clear cart</p>
                </div>
            </section>

            {/* Voice Ordering */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                        <Search className="h-5 w-5 text-purple-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Voice Order Processing</h2>
                </div>

                <p className="text-gray-600">Process customer voice orders using the integrated AI system.</p>

                <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-5">
                    <h3 className="font-semibold text-purple-900 mb-3">Using Voice Input</h3>
                    <ol className="space-y-2 text-sm text-purple-800">
                        <li>1. Click the microphone icon in the POS interface</li>
                        <li>2. Customer speaks their order (supports ID, EN, JV, SU)</li>
                        <li>3. AI automatically adds items to cart</li>
                        <li>4. Review and confirm the order</li>
                        <li>5. Proceed to payment</li>
                    </ol>
                </div>
            </section>

            {/* Transaction Management */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                        <Package className="h-5 w-5 text-orange-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Transaction Management</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">View Transactions</h3>
                        <p className="text-sm text-gray-600 mb-3">Access all processed transactions from your dashboard</p>
                        <a href="/cashier/transactions" className="text-green-600 hover:underline text-sm font-medium">View Transactions →</a>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Today's Orders</h3>
                        <p className="text-sm text-gray-600 mb-3">Monitor all orders processed today with real-time updates</p>
                        <a href="/cashier/orders" className="text-green-600 hover:underline text-sm font-medium">View Orders →</a>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Order Status Updates</h4>
                    <p className="text-sm text-gray-600 mb-3">Update order status as they progress:</p>
                    <div className="grid md:grid-cols-4 gap-2 text-xs">
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
                            <div className="font-semibold text-yellow-900">Pending</div>
                            <div className="text-yellow-700">Just received</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                            <div className="font-semibold text-blue-900">Processing</div>
                            <div className="text-blue-700">Being prepared</div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                            <div className="font-semibold text-green-900">Ready</div>
                            <div className="text-green-700">Ready for pickup</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                            <div className="font-semibold text-gray-900">Completed</div>
                            <div className="text-gray-700">Order fulfilled</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Daily Reports */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                        <TrendingUp className="h-5 w-5 text-indigo-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Daily Sales Reports</h2>
                </div>

                <p className="text-gray-600">Access detailed sales reports and analytics for your shift.</p>

                <div className="rounded-lg border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Report Features</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                Total sales amount
                            </li>
                            <li className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-blue-600" />
                                Number of transactions
                            </li>
                            <li className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-purple-600" />
                                Products sold breakdown
                            </li>
                        </ul>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-orange-600" />
                                Sales trends by hour
                            </li>
                            <li className="flex items-center gap-2">
                                <Printer className="h-4 w-4 text-gray-600" />
                                Export/print reports
                            </li>
                            <li className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                Payment method breakdown
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <a href="/cashier/reports" className="flex items-center justify-between group">
                        <div>
                            <h4 className="font-semibold text-indigo-900">View Daily Reports</h4>
                            <p className="text-sm text-indigo-700">Access detailed sales analytics and reports</p>
                        </div>
                        <div className="text-indigo-600 group-hover:translate-x-1 transition-transform">→</div>
                    </a>
                </div>
            </section>

            {/* Receipt Printing */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Printer className="h-5 w-5 text-gray-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Receipt Printing</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Auto Print</h3>
                        <p className="text-sm text-gray-600">Receipts automatically print after completing a transaction</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Reprint Receipt</h3>
                        <p className="text-sm text-gray-600">Find the transaction and click "Print Receipt" to reprint</p>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Receipt Contents</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Store name and address</li>
                        <li>• Order number and date/time</li>
                        <li>• Items ordered with prices</li>
                        <li>• Subtotal, discounts, taxes</li>
                        <li>• Total amount and payment method</li>
                        <li>• Cashier name</li>
                    </ul>
                </div>
            </section>

            {/* Best Practices */}
            <div className="rounded-xl bg-green-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Best Practices
                </h3>
                <ul className="space-y-2 text-blue-50 text-sm">
                    <li>• Always verify the order with the customer before processing payment</li>
                    <li>• Double-check product sizes and quantities</li>
                    <li>• Apply voucher codes BEFORE completing the transaction</li>
                    <li>• Update order status promptly for better customer experience</li>
                    <li>• Keep the POS area clean and organized</li>
                    <li>• Report any technical issues to the admin immediately</li>
                </ul>
            </div>
        </div>
    );
}
