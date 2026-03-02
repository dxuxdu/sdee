'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/client/auth';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Loader2, Copy, Check, ShoppingBag, Calendar, CreditCard, Key, MessageCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OrderDetailsPage() {
    const { email, isAuthenticated, isLoading: authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/client/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated && email && params.id) {
            fetchOrderDetails();
        }
    }, [isAuthenticated, email, params.id]);

    const fetchOrderDetails = async () => {
        try {
            const res = await fetch(`/api/orders/${params.id}?email=${encodeURIComponent(email!)}`);
            const json = await res.json();
            
            if (json.success) {
                setOrder(json.data);
            } else {
                setError(json.error || 'Failed to fetch order');
            }
        } catch (e) {
            console.error(e);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin accent-text" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="p-8 max-w-7xl mx-auto text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
                <p className="text-red-500 mb-6">{error || 'Order not found'}</p>
                <Link href="/client/orders" className="accent-text hover:underline">
                    &larr; Back to Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                     <Link href="/client/orders" className="text-sm text-gray-400 hover-accent mb-2 inline-block">
                        &larr; Back to Orders
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        Order #{order.transaction_id.substring(0, 18)}...
                    </h1>
                    <p className="text-gray-500 text-sm">Placed on {new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="accent-bg accent-text accent-border border px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4" />
                    Status: {order.payment_status}
                </div>
            </div>

            {/* Delivered Items (Key) - Prominent at Top */}
            <Card className="p-6 border-l-4" style={{ borderLeftColor: 'var(--accent)' }}>
                 <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 accent-text" />
                    Delivered Items
                </h3>
                
                {order.generated_keys && order.generated_keys.length > 0 ? (
                    <div className="space-y-3">
                         {order.generated_keys.map((key: string, i: number) => (
                            <div key={i} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 flex items-center justify-between gap-4 group hover-accent-border transition-colors">
                                <code className="accent-text font-mono text-lg truncate">{key}</code>
                                <button 
                                    onClick={() => copyToClipboard(key)}
                                    className={`p-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${copiedKey === key ? "accent-bg accent-text" : "bg-[#1f1f1f] text-gray-400 hover:text-white"}`}
                                >
                                    {copiedKey === key ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                                    {copiedKey === key ? "Copied" : "Copy"}
                                </button>
                            </div>
                         ))}
                    </div>
                ) : (
                     <div className="text-gray-500 italic">No keys found for this order.</div>
                )}
                <p className="text-xs text-gray-500 mt-4">
                    Delivered instantly on {new Date(order.created_at).toLocaleDateString()}
                </p>
            </Card>

            {/* Premium Redemption Guide - IMPORTANT */}
            <Card className="p-6 border-l-4 border-l-indigo-500 bg-indigo-500/10 print:border shadow-none">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2 print:text-black">
                    <MessageCircle className="w-5 h-5 text-indigo-400 print:text-black" />
                    Activate Your Premium
                </h3>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                    To activate your premium features, you must redeem your key in our verified Discord server. 
                    This step links your Discord account to your premium access.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-black/20 p-4 rounded-lg border border-indigo-500/20">
                    <div className="flex-1">
                        <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Step 1</div>
                        <div className="text-sm text-white">Copy your key from above</div>
                    </div>
                    <div className="hidden sm:block text-gray-600">→</div>
                    <div className="flex-1">
                        <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Step 2</div>
                        <div className="text-sm text-white">Join Discord & Go to Premium Script Channel</div>
                    </div>
                    <div className="hidden sm:block text-gray-600">→</div>
                    <div className="flex-1">
                        <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Step 3</div>
                        <div className="text-sm text-white">Send Key to Redeem</div>
                    </div>
                </div>
                
                <div className="mt-6">
                    <a 
                        href="https://discord.com/channels/1333251917098520628/1421560929425817662" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex"
                    >
                        <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-none shadow-lg shadow-indigo-500/20 px-4 py-2 rounded-lg flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Go to Premium Script Channel
                        </Button>
                    </a>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                
                {/* Order Items */}
                <Card className="p-6 h-full flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 accent-text" />
                        Order Items
                    </h3>
                    
                    <div className="flex justify-between items-center py-4 border-b border-[#2a2a2a]">
                        <div>
                            <div className="font-medium text-white capitalize">{order.tier} Plan</div>
                            <div className="text-sm text-gray-500">Seisen Hub Premium x 1</div>
                        </div>
                        <div className="font-mono text-white">
                            {order.currency === 'EUR' ? '€' : (order.currency === 'USD' ? '$' : order.currency)}
                            {order.amount}
                        </div>
                    </div>
                    
                    <div className="mt-auto pt-4 flex justify-between items-center border-t border-[#2a2a2a]">
                        <span className="text-gray-400">Total</span>
                        <span className="text-xl font-bold text-white">
                             {order.currency === 'EUR' ? '€' : (order.currency === 'USD' ? '$' : order.currency)}
                             {order.amount}
                        </span>
                    </div>
                </Card>

                {/* Payment Information */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 accent-text" />
                        Payment Information
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Status</span>
                            <span className="text-white capitalize">{order.payment_status}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="text-white truncate max-w-[200px]">{order.payer_email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Transaction ID</span>
                            <span className="text-white font-mono text-sm truncate max-w-[150px]">{order.transaction_id}</span>
                        </div>
                        {order.payer_id && (
                             <div className="flex justify-between">
                                <span className="text-gray-500">Payer ID</span>
                                <span className="text-white font-mono text-sm">{order.payer_id}</span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Order Timeline */}
            <Card className="p-6">
                 <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 accent-text" />
                    Order Timeline
                </h3>
                
                <div className="space-y-6 ml-2 border-l-2 border-[#2a2a2a] pl-6 relative">
                     <div className="relative">
                        <div className="absolute -left-[31px] w-6 h-6 rounded-full bg-[#1a1a1a] border-2 border-[var(--accent)] flex items-center justify-center">
                            <CreditCard className="w-3 h-3 accent-text" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium">Order Placed</h4>
                            <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute -left-[31px] w-6 h-6 rounded-full accent-bg flex items-center justify-center shadow-lg" style={{ boxShadow: '0 10px 15px -3px rgba(var(--accent-rgb), 0.2)' }}>
                            <Check className="w-3 h-3 text-white" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium">Order Delivered</h4>
                            <p className="text-sm text-gray-500">Instant Delivery</p>
                        </div>
                    </div>
                </div>
            </Card>
            
            <div className="text-center pt-8">
                <Link href="/client/support" className="text-gray-500 hover:text-white text-sm underline">
                    Need help with this order? Contact Support
                </Link>
            </div>
        </div>
    );
}
