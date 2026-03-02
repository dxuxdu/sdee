'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Loader2, Send, User, ShieldAlert, Clock, ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/utils';

interface Ticket {
    id: string;
    ticket_number: string;
    subject: string;
    category: string;
    status: string;
    description: string;
    created_at: string;
    updated_at: string;
    user_name: string;
    user_email: string;
}

interface Reply {
    id: string;
    message: string;
    author_name: string;
    author_type: 'user' | 'admin' | 'support';
    created_at: string;
}

export default function AdminTicketDetail() {
    const { id } = useParams();
    const router = useRouter();
    
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [closing, setClosing] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchTicketDetails();
    }, [id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [replies]);

    const fetchTicketDetails = async () => {
        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/api/tickets/${id}`); // Public fetch is fine
            const data = await res.json();
            
            if (data.success) {
                setTicket(data.ticket);
                setReplies(data.replies || []);
            }
        } catch (error) {
            console.error('Error fetching ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;
        
        setSending(true);
        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: replyMessage,
                    authorName: 'Support Team',
                    authorType: 'admin' // Mark as staff/admin
                })
            });
            
            const data = await res.json();
            if (data.success) {
                setReplyMessage('');
                fetchTicketDetails();
                
                // If ticket was closed, re-open it? 
                // Alternatively, just replying usually sets it to 'replied' or similar logic if implemented.
                // For now, let's explicitly update status to 'replied' if it's open.
                if (ticket?.status === 'open') {
                     updateStatus('replied');
                }
            }
        } catch (error) {
            console.error('Reply error:', error);
        } finally {
            setSending(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        if (newStatus === 'closed') setClosing(true);

        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/api/admin/tickets/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (res.ok) {
                fetchTicketDetails();
            }
        } catch (error) {
            console.error('Status update error:', error);
        } finally {
            setClosing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'closed': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
            case 'replied': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-gray-400 bg-gray-500/10';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl text-white font-bold mb-4">Ticket Not Found</h2>
                <Link href="/admin">
                    <Button variant="secondary">Back to Admin Panel</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4 md:px-8 bg-[#050505]">
            <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin" className="text-gray-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-white line-clamp-1">{ticket.subject}</h1>
                                <span className={`px-2 py-0.5 rounded text-xs border whitespace-nowrap ${getStatusColor(ticket.status)} capitalize`}>
                                    {ticket.status}
                                </span>
                            </div>
                            
                            {ticket.status !== 'closed' ? (
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={() => updateStatus('closed')}
                                    disabled={closing}
                                    className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                                >
                                    {closing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Lock className="w-4 h-4 mr-2"/>}
                                    Close Ticket
                                </Button>
                            ) : (
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={() => updateStatus('open')}
                                    disabled={closing}
                                >
                                    {closing ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
                                    Reopen Ticket
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="font-mono">#{ticket.ticket_number}</span>
                            <span className="capitalize">{ticket.category}</span>
                            <span>{new Date(ticket.created_at).toLocaleString()}</span>
                            <span className="text-emerald-500">{ticket.user_name} ({ticket.user_email})</span>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <Card className="flex-1 overflow-hidden flex flex-col border-[#2a2a2a] bg-[#0f0f0f]">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        
                        {/* Original Message */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-[#2a2a2a]">
                                <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-3 mb-1">
                                    <span className="font-bold text-white">{ticket.user_name}</span>
                                    <span className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleString()}</span>
                                </div>
                                <div className="bg-[#1a1a1a] p-4 rounded-r-xl rounded-bl-xl border border-[#2a2a2a] text-gray-300 whitespace-pre-wrap">
                                    {ticket.description}
                                </div>
                            </div>
                        </div>

                        {/* Replies */}
                        {replies.map(reply => {
                            const isStaff = reply.author_type !== 'user';
                            return (
                                <div key={reply.id} className={`flex gap-4 ${isStaff ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                                        isStaff 
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                            : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400'
                                    }`}>
                                        {isStaff ? <ShieldAlert className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                    </div>
                                    
                                    <div className={`flex-1 flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-baseline gap-3 mb-1">
                                            <span className={`font-bold ${isStaff ? 'text-emerald-500' : 'text-white'}`}>
                                                {reply.author_name} {isStaff && '(Staff)'}
                                            </span>
                                            <span className="text-xs text-gray-500">{new Date(reply.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className={`p-4 rounded-xl border whitespace-pre-wrap ${
                                            isStaff 
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100 rounded-tr-none' 
                                                : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-300 rounded-tl-none'
                                        }`}>
                                            {reply.message}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div ref={bottomRef} />
                    </div>

                    {/* Reply Input */}
                    <div className="p-4 border-t border-[#2a2a2a] bg-[#141414]">
                        <form onSubmit={handleReply} className="flex gap-4">
                            <textarea 
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Reply as Support..."
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleReply(e);
                                    }
                                }}
                                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                            />
                            <Button 
                                type="submit" 
                                disabled={sending || !replyMessage.trim()}
                                className="h-auto aspect-square rounded-xl"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    );
}
