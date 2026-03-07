'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/client/auth';
import { Card } from '@/components/ui/Card';
import { FileCode, Clock, ShieldCheck, AlertCircle, Copy, Check, Star, X } from 'lucide-react';
import Button from '@/components/ui/Button';

const LOADSTRING = `loadstring(game:HttpGet("https://api.jnkie.com/api/v1/luascripts/public/d78ef9f0c5183f52d0e84d7efed327aa9a7abfb995f4ce86c22c3a7bc4d06a6f/download"))()`;

function ReviewModal({
  email,
  onDone,
}: {
  email: string | null;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [selectedGame, setSelectedGame] = useState('');
  const [games, setGames] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/games')
      .then(r => r.json())
      .then(d => { if (d.games) setGames([...d.games, 'Other']); })
      .catch(() => setGames(['Blox Fruits', 'Pet Simulator 99', 'Anime Defenders', 'Fisch', 'Rivals', 'Da Hood', 'Other']));
  }, []);

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || null,
          display_name: displayName.trim() || null,
          rating,
          game: selectedGame || null,
          content: content.trim() || null,
        }),
      });
    } catch {
      // non-critical, proceed regardless
    }
    setSubmitted(true);
    setTimeout(onDone, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Skip button */}
        <button
          onClick={onDone}
          className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
          aria-label="Skip"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 gap-3">
            <div className="w-16 h-16 rounded-full accent-bg flex items-center justify-center mb-2">
              <Check className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-semibold text-xl">Thank you!</p>
            <p className="text-gray-400 text-sm">Your review has been submitted.</p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-[#2a2a2a]">
              <h2 className="text-white font-bold text-lg">How's your experience?</h2>
              <p className="text-gray-500 text-sm mt-1">You're about to copy your script. Leave a quick review!</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Star rating */}
              <div>
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider font-semibold">Rating <span className="text-red-400">*</span></p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hovered || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Game selection */}
              <div>
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider font-semibold">Which game? <span className="text-gray-600">(optional)</span></p>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {games.map((game) => (
                    <button
                      key={game}
                      onClick={() => setSelectedGame(selectedGame === game ? '' : game)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all ${
                        selectedGame === game
                          ? 'accent-bg text-white border-[var(--accent)]'
                          : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a] hover:text-white'
                      }`}
                    >
                      {game}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display name */}
              <div>
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-semibold">Display Name <span className="text-gray-600">(optional)</span></p>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 80))}
                  placeholder="e.g. bloxplayer123"
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Review text */}
              <div>
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-semibold">Review <span className="text-gray-600">(optional)</span></p>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 500))}
                  placeholder="Share your experience with Seisen Hub..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
                <p className="text-xs text-gray-600 text-right mt-1">{content.length}/500</p>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onDone}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#3a3a3a] text-sm font-medium transition-all"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  rating === 0
                    ? 'bg-[#2a2a2a] text-gray-600 cursor-not-allowed'
                    : 'accent-bg text-white hover:opacity-90'
                }`}
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ClientScriptPage() {
  const { email, isAuthenticated } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyHistory, setCopyHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('seisen_copy_history') || '[]');
    setCopyHistory(history);

    if (isAuthenticated && email) {
      fetch(`/api/client/data?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.orders?.length > 0) {
            const hasPaid = data.data.orders.some((o: any) => o.payment_status === 'COMPLETED' || o.payment_status === 'paid');
            setHasAccess(hasPaid);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [email, isAuthenticated]);

  const doCopy = () => {
    try {
      navigator.clipboard.writeText(LOADSTRING);
    } catch {
      const el = document.createElement('textarea');
      el.value = LOADSTRING;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    const newEntry = { date: new Date().toISOString() };
    const updated = [newEntry, ...copyHistory];
    setCopyHistory(updated);
    localStorage.setItem('seisen_copy_history', JSON.stringify(updated));
  };

  const handleCopy = () => {
    const hasReviewed = localStorage.getItem('seisen_reviewed') === '1';
    const isSecondCopy = copyHistory.length === 1;

    if (isSecondCopy && !hasReviewed) {
      setShowReview(true);
    } else {
      doCopy();
    }
  };

  const handleReviewDone = () => {
    localStorage.setItem('seisen_reviewed', '1');
    setShowReview(false);
    doCopy();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {showReview && <ReviewModal email={email ?? null} onDone={handleReviewDone} />}

      <h1 className="text-2xl font-bold text-white">Script</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : hasAccess ? (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Script Card */}
          <Card className="p-6 border-l-4 bg-[#0f0f0f] flex flex-col" style={{ borderLeftColor: 'var(--accent)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg accent-bg flex items-center justify-center border accent-border">
                  <FileCode className="w-6 h-6 accent-text" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Seisen Hub Premium</h3>
                  <p className="text-sm text-gray-500">Loadstring • Auto-Updates</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded accent-bg accent-text text-xs border accent-border">Active</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
              <ShieldCheck className="w-4 h-4 accent-text" />
              <span>HWID Protection Enabled</span>
            </div>

            {/* Loadstring box */}
            <div className="relative mb-4">
              <pre className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap break-all select-all">{LOADSTRING}</pre>
            </div>

            <Button onClick={handleCopy} className="w-full gap-2">
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Loadstring</>}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Paste into your executor and execute.
            </p>
          </Card>

          {/* Copy History */}
          <Card className="p-6 bg-[#0f0f0f]">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Copy History
            </h3>
            <p className="text-xs text-gray-500 mb-4">Total copies: <span className="accent-text font-semibold">{copyHistory.length}</span></p>

            {copyHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No copy history yet. Copy the loadstring to get started.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {copyHistory.map((entry, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-[#141414] rounded-lg border border-[#1f1f1f]">
                    <div className="text-white text-sm font-medium">Loadstring copied</div>
                    <div className="text-xs text-gray-500">{new Date(entry.date).toLocaleString()}</div>
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
          <p className="text-gray-500 mb-6">You need to purchase a subscription to access the script.</p>
          <Button variant="secondary" onClick={() => window.location.href = '/'}>
            View Store
          </Button>
        </div>
      )}
    </div>
  );
}

