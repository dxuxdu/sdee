'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/client/auth';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Eye, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OrdersPage() {
  const { email, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && email) {
        fetch(`/api/client/data?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data && data.data.orders) {
                    setOrders(data.data.orders);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }
  }, [email, isAuthenticated]);

  const generateInvoice = (order: any) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // -- Helper for Emerald Color --
      const setEmerald = () => doc.setTextColor(16, 185, 129);
      const setGray = () => doc.setTextColor(100, 100, 100);
      const setBlack = () => doc.setTextColor(0, 0, 0);

      // -- Header --
      doc.setFontSize(24);
      setBlack();
      doc.text('RECEIPT', 14, 20);

      doc.setFontSize(10);
      setGray();
      doc.text(`#${order.transaction_id}`, 14, 26);

      // Status Badge (Simulated)
      doc.setFillColor(16, 185, 129); // Emerald bg
      doc.roundedRect(pageWidth - 50, 14, 36, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(order.payment_status.toUpperCase(), pageWidth - 45, 20.5);
      
      doc.setFont('helvetica', 'normal');

      let currentY = 40;

      // -- Delivered Items (Keys) --
      if (order.generated_keys && order.generated_keys.length > 0) {
          setEmerald();
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Delivered Items', 14, currentY);
          currentY += 8;

          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(250, 250, 250);
          
          order.generated_keys.forEach((key: string) => {
               doc.rect(14, currentY, pageWidth - 28, 12, 'F');
               doc.setDrawColor(16, 185, 129); // Emerald border
               doc.rect(14, currentY, pageWidth - 28, 12, 'S'); // Stroke
               
               doc.setTextColor(16, 185, 129);
               doc.setFont('courier', 'bold');
               doc.setFontSize(11);
               doc.text(key, 18, currentY + 8);
               currentY += 16;
          });
          currentY += 10;
      }

      // -- Order Items --
      setBlack();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Order Items', 14, currentY);
      currentY += 5;

      autoTable(doc, {
          startY: currentY,
          head: [['Item', 'Type', 'Price']],
          body: [
              [`Seisen Hub ${order.tier} Plan`, 'Digital License', `${order.currency === 'EUR' ? '€' : '$'}${order.amount}`],
          ],
          headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
          bodyStyles: { textColor: [50, 50, 50] },
          styles: { fontSize: 10 },
          theme: 'grid'
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Total
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      setBlack();
      doc.text(`Total: ${order.currency === 'EUR' ? '€' : '$'}${order.amount}`, 14, currentY);
      currentY += 15;

      // -- Payment Information --
      doc.setFontSize(14);
      setBlack();
      doc.text('Payment Information', 14, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      setGray();
      
      const addInfoRow = (label: string, value: string) => {
          doc.text(label, 14, currentY);
          setBlack();
          doc.text(value, 60, currentY);
          setGray();
          currentY += 6;
      };

      addInfoRow('Payment Status', order.payment_status.toUpperCase());
      addInfoRow('Email', order.payer_email || 'N/A');
      addInfoRow('Transaction ID', order.transaction_id);
      if (order.payer_id) addInfoRow('Payer ID', order.payer_id);
      addInfoRow('Date', new Date(order.created_at).toLocaleString());

      // -- Footer --
      currentY += 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, currentY, pageWidth - 14, currentY);
      currentY += 8;
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Seisen Hub - Premium Scripts & Utilities', 14, currentY);
      doc.text('Thank you for your business.', 14, currentY + 4);

      doc.save(`SeisenReceipt_${order.transaction_id}.pdf`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Your Orders</h1>
        <Card className="bg-[#0f0f0f] border border-[#1f1f1f] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-[#141414] text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Package</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f1f]">
                        {loading ? (
                             <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading orders...</td></tr>
                        ) : orders.length > 0 ? (
                            orders.map((order: any) => (
                                <tr key={order.transaction_id} className="hover:bg-[#141414] transition-colors">
                                    <td className="px-6 py-4 font-mono text-white text-xs">{order.transaction_id}</td>
                                    <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-white capitalize">{order.tier} Plan</td>
                                    <td className="px-6 py-4 accent-text font-bold">${order.amount}</td>
                                    <td className="px-6 py-4 uppercase text-xs font-bold tracking-wider">{order.payment_status}</td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => generateInvoice(order)}
                                            className="p-2 hover:bg-[#2a2a2a] rounded-lg text-gray-400 hover:text-white transition-colors"
                                            title="Download PDF"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <Link 
                                            href={`/client/orders/${order.transaction_id}`}
                                            className="p-2 hover:bg-[#2a2a2a] rounded-lg accent-text hover-accent transition-colors flex items-center gap-1 font-medium"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No orders found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    </div>
  );
}
