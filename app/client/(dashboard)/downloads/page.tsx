'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/client/auth';
import { Card } from '@/components/ui/Card';
import { Download, Package, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ClientDownloadsPage() {
  const { email, isAuthenticated } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);

  useEffect(() => {
    // Load local history
    const history = JSON.parse(localStorage.getItem('seisen_download_history') || '[]');
    setDownloadHistory(history);

    if (isAuthenticated && email) {
        fetch(`/api/client/data?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data && data.data.orders && data.data.orders.length > 0) {
                    // Check for any completed order
                    const hasPaid = data.data.orders.some((o: any) => o.payment_status === 'COMPLETED' || o.payment_status === 'paid'); // Accept 'paid' too just in case
                    setHasAccess(hasPaid);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }
  }, [email, isAuthenticated]);

  const handleDownload = () => {
      // Real Lua Script Content
      const fileName = "SeisenHub_Loader.lua";
      const fileContent = `loadstring(game:HttpGet("https://api.jnkie.com/api/v1/luascripts/public/d78ef9f0c5183f52d0e84d7efed327aa9a7abfb995f4ce86c22c3a7bc4d06a6f/download"))()`;
      
      const element = document.createElement("a");
      const file = new Blob([fileContent], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element); 
      element.click();
      document.body.removeChild(element);

      // Record History
      const newEntry = {
          file: fileName,
          date: new Date().toISOString(),
          version: 'v2.4.5' // Keeping version static for now, ideally comes from API
      };
      const updatedHistory = [newEntry, ...downloadHistory];
      setDownloadHistory(updatedHistory);
      localStorage.setItem('seisen_download_history', JSON.stringify(updatedHistory));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-white">Downloads</h1>
        
        {loading ? (
            <div className="text-center py-12 text-gray-500">Loading products...</div>
        ) : hasAccess ? (
            <div className="grid md:grid-cols-2 gap-8">
                {/* Product Card */}
                <Card className="p-6 border-l-4 accent-border-left bg-[#0f0f0f] flex flex-col" style={{ borderLeftColor: 'var(--accent)' }}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg accent-bg flex items-center justify-center border accent-border">
                                <Package className="w-6 h-6 accent-text" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Seisen Hub Premium Loader</h3>
                                <p className="text-sm text-gray-500">Premium Version • v2.4.5</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 rounded accent-bg accent-text text-xs border accent-border">
                            Active
                        </span>
                    </div>
                    
                    <div className="flex-1 space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                             <ShieldCheck className="w-4 h-4 accent-text" />
                             <span>HWID Protection Enabled</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                             <Clock className="w-4 h-4 accent-text" />
                             <span>Auto-Updates Included</span>
                        </div>
                    </div>

                    <Button onClick={handleDownload} className="w-full gap-2">
                        <Download className="w-4 h-4" />
                        Download Loader
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-3">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </Card>

                {/* Download History */}
                <Card className="p-6 bg-[#0f0f0f]">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-500" />
                        Download History
                     </h3>
                     
                     {downloadHistory.length === 0 ? (
                         <div className="text-center py-8 text-gray-500 text-sm">
                             No download history recorded.
                         </div>
                     ) : (
                         <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                             {downloadHistory.map((entry, i) => (
                                 <div key={i} className="flex justify-between items-center p-3 bg-[#141414] rounded-lg border border-[#1f1f1f]">
                                     <div>
                                         <div className="text-white text-sm font-medium">{entry.file}</div>
                                         <div className="text-xs accent-text">{entry.version}</div>
                                     </div>
                                     <div className="text-xs text-gray-500">
                                         {new Date(entry.date).toLocaleString()}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                </Card>
            </div>
        ) : (
            <div className="p-12 text-center bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Active Licenses Found</h3>
                <p className="text-gray-500 mb-6">You need to purchase a subscription to access downloads.</p>
                <Button variant="secondary" onClick={() => window.location.href = '/'}>
                    View Store
                </Button>
            </div>
        )}
    </div>
  );
}
