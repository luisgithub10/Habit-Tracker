import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Plus, Trash2, Check, Gift, ShoppingBag, X, Coins, Sparkles, AlertCircle
} from 'lucide-react';
import { getVal, setVal } from '../lib/db';

interface RedeemableReward {
  id: string;
  title: string;
  price: number;
  badge: string;
  isCustom?: boolean;
}

interface PurchaseRecord {
  id: string;
  title: string;
  price: number;
  badge: string;
  claimedAt: string;
}

interface RewardsViewProps {
  walletBalance: number;
  spentAmount: number;
  onSpendAmount: (newSpent: number) => void;
  completionsCount: number;
  totalEarned: number;
}

const DEFAULT_REWARDS: RedeemableReward[] = [
  { id: 'r1', title: 'Guilt-Free Video-gaming (1 Hour)', price: 15, badge: '🎮' },
  { id: 'r2', title: 'Go to a Restaurant', price: 25, badge: '🍽️' },
  { id: 'r3', title: 'Kiss girlfriend or boyfriend for 1 minute', price: 5, badge: '💋' },
  { id: 'r4', title: 'Spend time with pet', price: 10, badge: '🐾' },
  { id: 'r5', title: 'Talk over phone with a loved one', price: 10, badge: '📞' },
  { id: 'r6', title: 'Cheat Meal / Sweet Treat', price: 10, badge: '🍦' },
  { id: 'r7', title: '1 Hour of Netflix / Movie', price: 12, badge: '🍿' },
  { id: 'r8', title: 'Unwind & Relaxing Drink', price: 18, badge: '🍹' },
  { id: 'r9', title: 'Massage or Cozy Pamper Session', price: 50, badge: '💆' },
  { id: 'r10', title: 'Purchase a Small Gift / Shopping', price: 40, badge: '🛍️' },
];

export default function RewardsView({ 
  walletBalance, 
  spentAmount, 
  onSpendAmount, 
  completionsCount,
  totalEarned
}: RewardsViewProps) {
  const [customRewards, setCustomRewards] = useState<RedeemableReward[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  
  // Custom creator form states
  const [showCreator, setShowCreator] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState(15);
  const [newBadge, setNewBadge] = useState('🎁');
  const [formError, setFormError] = useState('');

  // Confirmation modal state
  const [confirmRedeem, setConfirmRedeem] = useState<RedeemableReward | null>(null);
  const [successRedeem, setSuccessRedeem] = useState<PurchaseRecord | null>(null);

  // Load custom rewards and history from LocalStorage/DB
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const storedCustom = await getVal<RedeemableReward[]>('pwa_habits_rewards_custom');
        if (storedCustom) {
          setCustomRewards(storedCustom);
        } else {
          const raw = localStorage.getItem('pwa_habits_rewards_custom');
          if (raw) setCustomRewards(JSON.parse(raw));
        }

        const storedHistory = await getVal<PurchaseRecord[]>('pwa_habits_rewards_history');
        if (storedHistory) {
          setPurchaseHistory(storedHistory);
        } else {
          const raw = localStorage.getItem('pwa_habits_rewards_history');
          if (raw) setPurchaseHistory(JSON.parse(raw));
        }
      } catch (err) {
        console.warn('Failed to load local rewards states', err);
      }
    };
    loadLocalData();
  }, []);

  const saveCustomRewards = async (updated: RedeemableReward[]) => {
    setCustomRewards(updated);
    localStorage.setItem('pwa_habits_rewards_custom', JSON.stringify(updated));
    await setVal('pwa_habits_rewards_custom', updated);
  };

  const saveHistory = async (updated: PurchaseRecord[]) => {
    setPurchaseHistory(updated);
    localStorage.setItem('pwa_habits_rewards_history', JSON.stringify(updated));
    await setVal('pwa_habits_rewards_history', updated);
  };

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim()) {
      setFormError('Please enter a reward title');
      return;
    }
    if (newPrice <= 0) {
      setFormError('Price must be greater than zero points');
      return;
    }

    const created: RedeemableReward = {
      id: `custom_${Date.now()}`,
      title: newTitle.trim(),
      price: Math.max(1, Math.round(newPrice)),
      badge: newBadge ? newBadge.trim().substring(0, 4) : '🎁',
      isCustom: true
    };

    const updated = [created, ...customRewards];
    saveCustomRewards(updated);

    // Reset fields
    setNewTitle('');
    setNewPrice(15);
    setNewBadge('🎁');
    setShowCreator(false);
  };

  const handleDeleteCustomReward = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customRewards.filter(r => r.id !== id);
    saveCustomRewards(updated);
  };

  const proceedPurchaseRedemption = (reward: RedeemableReward) => {
    if (walletBalance < reward.price) return;
    
    // Add purchase record
    const record: PurchaseRecord = {
      id: `claim_${Date.now()}`,
      title: reward.title,
      price: reward.price,
      badge: reward.badge,
      claimedAt: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const updatedHistory = [record, ...purchaseHistory];
    saveHistory(updatedHistory);

    // Subtract and persist balance in App
    onSpendAmount(spentAmount + reward.price);

    // Show success message
    setConfirmRedeem(null);
    setSuccessRedeem(record);

    // Auto-close success drawer after 3 seconds
    setTimeout(() => {
      setSuccessRedeem(null);
    }, 3000);
  };

  const rawPresetEmojis = [
    '🎮', '🍿', '🍦', '🍹', '🍔', '🎁', '🛍️', '💆', '⛳', '✈️', '🛌', '🎵', '🍕', '🍰', '☕',
    '🍩', '🍣', '🍺', '🍫', '🎨', '🎤', '🏋️', '🚗', '🛀', '😴', '📖', '🧸', '💋', '🐾', '📞',
    '🏆', '🎟️', '🕯️', '💅', '🌹', '🧁', '🎡', '🐈', '🐶', '🍿', '💖', '🍿'
  ];
  // Filter out duplicates and trim
  const presetEmojis = Array.from(new Set(rawPresetEmojis)).map(s => s.trim());
  const allRewards = [...customRewards, ...DEFAULT_REWARDS];

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="rewards-view-container">
      {/* Dynamic Header Statistics Block */}
      <div className="p-5 rounded-2xl bg-white border border-neutral-200 text-neutral-800 relative overflow-hidden shadow-xs">
        {/* Background decorative chips */}
        <div className="absolute right-0 bottom-0 opacity-[0.03] font-black text-9xl transform translate-x-12 translate-y-12 select-none text-neutral-900">
          ⭐
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 shrink-0">
            <Coins className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 block">Available Points Balance</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black tracking-tight text-neutral-900">{walletBalance}</span>
              <span className="text-sm font-extrabold text-amber-600">PTS</span>
            </div>
          </div>
        </div>

        {/* Ledger Details row */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4.5 border-t border-neutral-150 text-neutral-600 relative z-10 text-center sm:text-left">
          <div className="border-r border-neutral-150 pr-2">
            <span className="text-[9px] font-black tracking-widest uppercase text-neutral-400 block">LIFETIME EARNED</span>
            <span className="text-sm font-bold tracking-tight text-neutral-900">{totalEarned} PTS</span>
          </div>
          <div className="border-r border-neutral-150 px-2">
            <span className="text-[9px] font-black tracking-widest uppercase text-neutral-400 block">LIFETIME SPENT</span>
            <span className="text-sm font-bold tracking-tight text-neutral-900">{spentAmount} PTS</span>
          </div>
          <div className="pl-2">
            <span className="text-[9px] font-black tracking-widest uppercase text-neutral-400 block">HABITS LOGGED</span>
            <span className="text-sm font-bold tracking-tight text-neutral-900">{completionsCount} done</span>
          </div>
        </div>
      </div>

      {/* Rewards creator collapsible bar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-neutral-500" />
            <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider">Configure Custom Rewards</h3>
          </div>
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="flex items-center gap-1 bg-neutral-900 border border-neutral-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl cursor-pointer hover:bg-neutral-800 transition-all uppercase tracking-wider shadow-5xs"
          >
            {showCreator ? (
              <>
                <X className="w-3 h-3" /> Hide Form
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" /> Create custom
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showCreator && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddReward}
              className="mt-4 pt-4 border-t border-neutral-100 space-y-4 overflow-hidden"
            >
              {formError && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-xl text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Title */}
                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="reward-title" className="text-[9px] font-extrabold uppercase text-neutral-450 tracking-wider block">Reward Name / Description</label>
                  <input
                    id="reward-title"
                    type="text"
                    required
                    placeholder="e.g. Treat myself to specialty coffee"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs font-semibold border border-neutral-200 focus:border-neutral-950 rounded-xl p-2.5 outline-hidden"
                  />
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label htmlFor="reward-price" className="text-[9px] font-extrabold uppercase text-neutral-450 tracking-wider block">Price Cost (Points)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">⭐</span>
                    <input
                      id="reward-price"
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full text-xs font-black border border-neutral-200 focus:border-neutral-950 rounded-xl pl-6 pr-2.5 py-2.5 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Icon selector */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold uppercase text-neutral-450 tracking-wider block">Choose Emblem Emojis</span>
                <div className="flex flex-wrap gap-1.5">
                  {presetEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewBadge(emoji)}
                      className={`text-lg p-2 rounded-xl hover:scale-110 active:scale-95 transition-all text-center flex items-center justify-center cursor-pointer border ${
                        newBadge === emoji 
                          ? 'border-amber-400 bg-amber-50 scale-105 font-black shrink-0' 
                          : 'border-neutral-100 bg-neutral-50/50 hover:bg-neutral-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  <div className="relative pointer-events-auto">
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="Custom Icon"
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value)}
                      className="w-12 text-sm text-center border border-neutral-200 focus:border-neutral-950 rounded-xl p-1.5 h-full font-sans text-neutral-800 font-black outline-hidden bg-white"
                      title="Custom emoji or characters"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-neutral-900 border border-neutral-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs hover:bg-neutral-800 transition-all uppercase tracking-wider cursor-pointer"
              >
                ✓ ADD REWARD INSTANCE
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Redeem Catalog Store */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <ShoppingBag className="w-4 h-4 text-neutral-600" />
          <h3 className="text-xs font-black uppercase text-neutral-700 tracking-wider">Redeem Loop Store</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" id="rewards-grid-listing">
          {allRewards.map((reward) => {
            const canAfford = walletBalance >= reward.price;
            return (
              <div 
                key={reward.id} 
                onClick={() => {
                  if (canAfford) {
                    setConfirmRedeem(reward);
                  }
                }}
                className={`relative group border rounded-2xl p-4 flex gap-4 items-center transition-all ${
                  canAfford 
                    ? 'border-neutral-200 bg-white cursor-pointer hover:border-amber-300 hover:shadow-xs active:bg-neutral-50/50 hover:-translate-y-0.5' 
                    : 'border-neutral-100 bg-neutral-50/40 opacity-70 select-none'
                }`}
                title={canAfford ? `Click to Redeem ${reward.title}` : `Need more points to redeem this`}
              >
                {/* Visual badge icon */}
                <div className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center text-2xl select-none ${
                  canAfford 
                    ? 'bg-amber-50 border-amber-100 group-hover:scale-105 group-hover:rotate-3 transition-all' 
                    : 'bg-neutral-100 border-neutral-150'
                }`}>
                  {reward.badge}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 justify-between">
                    <h4 className="text-xs font-extrabold text-neutral-900 truncate leading-none">{reward.title}</h4>
                    {reward.isCustom && (
                      <button
                        onClick={(e) => handleDeleteCustomReward(reward.id, e)}
                        className="text-neutral-400 hover:text-rose-500 p-1 rounded-sm cursor-pointer shrink-0"
                        title="Delete this custom reward"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-black ${canAfford ? 'text-amber-700' : 'text-neutral-500'}`}>
                      {reward.price} PTS
                    </span>
                    <span className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-wide">cost</span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    {canAfford ? (
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider group-hover:bg-amber-500 group-hover:text-white transition-all">
                        Buy Reward ✓
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Locked 🔒
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Redemption Transactions log */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Coins className="w-3.5 h-3.5 text-neutral-600 animate-spin" />
          <h3 className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">Claims Ledger ({purchaseHistory.length})</h3>
        </div>

        {purchaseHistory.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-neutral-200 rounded-xl bg-white/50">
            <Gift className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">No Redeemed claims yet</span>
            <p className="text-[9px] text-neutral-400 mt-1 max-w-xs mx-auto">
              Finish those essential habits today to collect coins, then buy rewards like gaming sessions or coffee!
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {purchaseHistory.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 bg-white shadow-xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg select-none">{record.badge}</span>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-neutral-900 truncate leading-none">{record.title}</h4>
                    <span className="text-[8px] text-neutral-455 leading-none block font-mono mt-0.5">{record.claimedAt}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-mono font-black text-rose-600">-{record.price} PTS</span>
                  <span className="text-[8px] text-neutral-455 font-bold block uppercase tracking-wider leading-none mt-0.5">Purchased</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRM PURCHASE SLIDE-IN MODAL */}
      <AnimatePresence>
        {confirmRedeem && (
          <div className="fixed inset-0 bg-neutral-950/20 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop dismisser */}
            <div className="absolute inset-0" onClick={() => setConfirmRedeem(null)} />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 border border-amber-200 shadow-2xl relative z-60 w-full max-w-sm space-y-4"
              id="confirm-checkout-panel font-sans"
            >
              <div className="text-center space-y-2">
                <div className="text-4xl select-none mb-1">{confirmRedeem.badge}</div>
                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">Confirm Purchase</h3>
                <p className="text-xs text-neutral-500 px-3">
                  Are you ready to spend <span className="font-mono font-extrabold text-amber-600">{confirmRedeem.price} PTS</span> of your points balance to redeem <span className="font-bold text-neutral-800">"{confirmRedeem.title}"</span>?
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs">
                <span className="text-neutral-450 font-extrabold uppercase text-[10px]">Your Points Balance:</span>
                <span className="font-mono font-bold text-neutral-800">{walletBalance} PTS</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-neutral-450 font-extrabold uppercase text-[10px]">New Points Balance:</span>
                <span className="font-mono font-bold text-emerald-700">{(walletBalance - confirmRedeem.price)} PTS</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmRedeem(null)}
                  className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-100 text-neutral-700 font-bold text-xs py-2 px-3 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => proceedPurchaseRedemption(confirmRedeem)}
                  className="bg-amber-500 hover:bg-amber-600 border border-amber-500 text-white font-black text-xs py-2 px-3 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer uppercase tracking-wider"
                >
                  Confirm ✓
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST SUCCESS PANEL */}
      <AnimatePresence>
        {successRedeem && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              className="bg-neutral-900 border border-amber-500 text-white p-4.5 rounded-2xl shadow-2xl flex items-center gap-3 relative pointer-events-auto"
            >
              <div className="w-10 h-10 shrink-0 text-xl font-black bg-amber-500 text-neutral-900 rounded-xl flex items-center justify-center animate-bounce select-none">
                {successRedeem.badge}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 font-black text-[10px] uppercase tracking-widest block select-none">Transaction Approved</span>
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                </div>
                <h4 className="text-xs font-black truncate text-neutral-100">{successRedeem.title}</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">-{successRedeem.price} PTS spent. Claimed!</p>
              </div>
              <button 
                onClick={() => setSuccessRedeem(null)}
                className="text-neutral-400 hover:text-white cursor-pointer shrink-0 p-1"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
