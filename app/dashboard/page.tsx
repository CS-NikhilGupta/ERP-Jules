"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
    const { analytics, fetchAnalytics, currentUser, isLoading } = useStore();

    useEffect(() => {
        if (currentUser) {
            fetchAnalytics();
        }
    }, [currentUser, fetchAnalytics]);

    if (!currentUser) {
        return <div className="p-8">Please log in to view dashboard.</div>
    }

    if (isLoading && analytics.revenue === 0) {
        return <div className="p-8">Loading analytics...</div>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(analytics.revenue)}</div>
                        <p className="text-xs text-muted-foreground">Lifetime revenue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders This Month</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.ordersCount}</div>
                        <p className="text-xs text-muted-foreground">Active orders</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">Items below 5 qty</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {/* We don't have a direct count in analytics struct, let's just say "Global Catalog" or omit */}
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">Catalog items</p>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Sales by Salesperson</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.salesByPerson.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No data available.</p>
                            ) : (
                                analytics.salesByPerson.map((person, idx) => (
                                    <div className="flex items-center justify-between" key={idx}>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{person.name}</p>
                                        </div>
                                        <div className="font-medium">{formatCurrency(person.total)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {analytics.recentOrders.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent orders.</p>
                            ) : (
                                analytics.recentOrders.map((order) => (
                                    <div className="flex items-center" key={order.id}>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{order.customer_info?.customerName || 'Guest Customer'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.customer_info?.customerPhone}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">+{formatCurrency(order.total || 0)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
