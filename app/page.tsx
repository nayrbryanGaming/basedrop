'use client';

import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, usePublicClient, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { parseEther, parseUnits, keccak256, toHex, formatUnits } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Link as LinkIcon, CheckCircle, AlertCircle, ArrowRight, Wallet, Info, Loader2, Calendar, ShieldCheck, Zap, ExternalLink, Copy, Share2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { ESCROW_ADDRESS, ESCROW_ABI, SUPPORTED_TOKENS } from './constants/contract';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('ETH');
  const [step, setStep] = useState(1); // 1: Input, 2: Confirm, 3: Success
  const [paymentId, setPaymentId] = useState<`0x${string}`>('0x');
  const [shareLink, setShareLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'depositing' | 'syncing'>('idle');
  const [copied, setCopied] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [health, setHealth] = useState({ api: 'checking', db: 'checking' });
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const isCorrectChain = chainId === baseSepolia.id;
  const { writeContractAsync } = useWriteContract();

  const usdcToken = SUPPORTED_TOKENS.find(t => t.symbol === 'USDC')!;
  const { data: ethBalance } = useBalance({ address, chainId: baseSepolia.id });
  const { data: usdcBalance } = useBalance({ address, token: usdcToken.address as `0x${string}`, chainId: baseSepolia.id });

  const selectedBalance = token === 'ETH' ? ethBalance : usdcBalance;
  const selectedDecimals = SUPPORTED_TOKENS.find(t => t.symbol === token)?.decimals ?? 18;
  const balanceNum = selectedBalance?.value != null
    ? parseFloat(formatUnits(selectedBalance.value, selectedBalance.decimals ?? selectedDecimals))
    : null;
  const isInsufficient = balanceNum !== null && amount !== '' && parseFloat(amount) > balanceNum;

  const fetchMyPayments = React.useCallback(async () => {
    if (!address) return;
    setLoadingPayments(true);
    try {
      const res = await fetch(`/api/users/${address.toLowerCase()}/payments`);
      const data = await res.json();
      setMyPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching payments:', e);
    } finally {
      setLoadingPayments(false);
    }
  }, [address]);

  // Health Check & Fetch Payments
  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/payments');
        const data = await res.json();
        setHealth({
          api: res.ok ? 'ok' : 'error',
          db: data.database === 'connected' ? 'connected' : 'error'
        });
      } catch (e) {
        setHealth({ api: 'error', db: 'error' });
      }
    };

    checkHealth();
    if (address) fetchMyPayments();
  }, [address, fetchMyPayments]);

  const generatePaymentId = (): `0x${string}` => {
    const randomBytes = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    return keccak256(toHex(randomBytes));
  };

  const handleCreateLink = () => {
    const id = generatePaymentId();
    setPaymentId(id);
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!address || !amount || !publicClient) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    if (isInsufficient) {
      alert(`Insufficient ${token} balance`);
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedToken = SUPPORTED_TOKENS.find(t => t.symbol === token);
      if (!selectedToken) throw new Error("Unsupported token");

      const expiryTimestamp = expiryDate ? Math.floor(new Date(expiryDate).getTime() / 1000) : 0;
      const amountWei = parseUnits(amount, selectedToken.decimals);

      // 1. ERC20 Approval if needed
      if (selectedToken.address !== '0x0000000000000000000000000000000000000000') {
        setTxStatus('approving');
        const approveHash = await writeContractAsync({
          address: selectedToken.address as `0x${string}`,
          abi: [{ "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }],
          functionName: 'approve',
          args: [ESCROW_ADDRESS, amountWei],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // 2. Transaction to Escrow
      setTxStatus('depositing');
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'createPayment',
        args: [paymentId, selectedToken.address as `0x${string}`, amountWei, BigInt(expiryTimestamp)],
        value: selectedToken.address === '0x0000000000000000000000000000000000000000' ? amountWei : 0n,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // 3. Store in Backend
      setTxStatus('syncing');
      const syncResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          token: selectedToken.symbol,
          sender_wallet: address.toLowerCase(),
          payment_id: paymentId.toLowerCase(),
          expires_at: expiryDate ? new Date(expiryDate).toISOString() : null
        }),
      });

      if (!syncResponse.ok) {
        console.warn("[SYNC] Backend sync failed, but on-chain TX succeeded.");
      }

      setShareLink(`${window.location.origin}/claim/${paymentId}`);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#ffffff']
      });
      setStep(3);
    } catch (error: any) {
      console.error('Payment Error:', error);
      alert(`Payment Failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsSubmitting(false);
      setTxStatus('idle');
      fetchMyPayments();
    }
  };

  const handleCancelPayment = async (pId: string) => {
    if (!address || !publicClient) return;
    if (!confirm("Reclaim funds? This will cancel the payment link.")) return;

    try {
      setLoadingPayments(true);
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'cancelPayment',
        args: [pId as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetch(`/api/payments/${pId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_hash: hash }),
      });
      fetchMyPayments();
    } catch (e: any) {
      alert(`Cancellation Failed: ${e.shortMessage || e.message}`);
    } finally {
      setLoadingPayments(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-50 selection:bg-blue-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 glass border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <Send className="text-white w-5 h-5 -rotate-12" />
          </div>
          <span className="text-2xl font-black tracking-tighter">BASE<span className="text-blue-500">DROP</span></span>
          <span className="hidden sm:inline-flex px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[9px] font-black uppercase tracking-widest text-amber-400">Base Sepolia</span>
        </motion.div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </nav>

      {/* Main Container */}
      <main className="w-full max-w-xl mt-24 mb-32 z-10 flex flex-col gap-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass p-10 rounded-[2.5rem] border border-white/10 space-y-10 shadow-2xl relative group"
            >
              <div className="space-y-3">
                <motion.h1
                  className="text-5xl font-black gradient-text tracking-tight leading-none"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Crypto payments.<br />Simplified.
                </motion.h1>
                <p className="text-slate-400 text-lg font-medium">Create a secure link. Lock your funds. Share anywhere.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] font-black text-slate-500 ml-1">Deposit Amount</label>
                  <div className="relative group">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={cn(
                        "w-full bg-slate-900/60 border rounded-3xl py-6 px-8 text-3xl font-black focus:outline-none focus:ring-4 transition-all placeholder:text-slate-700",
                        isInsufficient
                          ? "border-red-500/40 focus:ring-red-500/10 focus:border-red-500/30"
                          : "border-white/5 focus:ring-blue-500/10 focus:border-blue-500/30"
                      )}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-white/5">
                      {SUPPORTED_TOKENS.map((t) => (
                        <button
                          key={t.symbol}
                          onClick={() => setToken(t.symbol)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black transition-all",
                            token === t.symbol
                              ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                          )}
                        >
                          {t.symbol}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Balance Display */}
                  {isConnected && isCorrectChain && (
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-4">
                        {[ethBalance, usdcBalance].map((bal, i) => {
                          const sym = i === 0 ? 'ETH' : 'USDC';
                          const dec = i === 0 ? 18 : 6;
                          const num = bal?.value != null ? parseFloat(formatUnits(bal.value, bal.decimals ?? dec)) : null;
                          const val = num !== null ? num.toFixed(i === 0 ? 4 : 2) : '—';
                          const isActive = token === sym;
                          return (
                            <button key={sym} onClick={() => setToken(sym)} className={cn("flex items-center gap-1.5 transition-all", isActive ? "opacity-100" : "opacity-40 hover:opacity-70")}>
                              <span className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-blue-400" : "text-slate-500")}>{sym}</span>
                              <span className={cn("text-xs font-black tabular-nums", isActive ? "text-slate-200" : "text-slate-400")}>{val}</span>
                            </button>
                          );
                        })}
                      </div>
                      {isInsufficient && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400 animate-pulse">Insufficient balance</span>
                      )}
                      {!isInsufficient && balanceNum !== null && amount !== '' && (
                        <button
                          onClick={() => setAmount(balanceNum.toFixed(selectedDecimals === 6 ? 2 : 4))}
                          className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Max
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] font-black text-slate-500 ml-1">Expiry (Optional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                    <input
                      type="datetime-local"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      aria-label="Expiry date and time"
                      className="w-full bg-slate-900/60 border border-white/5 rounded-3xl py-5 pl-16 pr-6 text-sm font-bold text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all scheme-dark"
                    />
                  </div>
                </div>

                {!isConnected ? (
                  <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                      <Wallet className="text-blue-400 w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-blue-200/70">Connect your wallet to generate a secure 101% perfected payment link.</p>
                  </div>
                ) : !isCorrectChain ? (
                  <button
                    onClick={() => switchChain?.({ chainId: baseSepolia.id })}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-6 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl group"
                  >
                    Switch to Base Sepolia
                    <Zap className="w-6 h-6 fill-current animate-pulse group-hover:scale-125 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={handleCreateLink}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-900 disabled:text-slate-700 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-blue-500/10"
                  >
                    Generate Secure Link
                    <ArrowRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Badge */}
              <div className="absolute -bottom-4 -right-4 bg-green-500/10 border border-green-500/20 backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Audited Protocol v1.1</span>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="glass p-10 rounded-[2.5rem] border border-white/10 space-y-10 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black tracking-tight leading-none italic">Review & Confirm</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">On-Chain Settlement Process</p>
              </div>

              <div className="bg-slate-900/80 rounded-4xl p-8 border border-white/5 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Send className="w-24 h-24 -rotate-12" />
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs uppercase tracking-[0.2em] font-black text-slate-600">Total Value</span>
                  <span className="text-5xl font-black text-blue-400 tabular-nums tracking-tighter">{amount} <span className="text-xl font-bold ml-1">{token}</span></span>
                </div>
                <div className="h-px bg-white/5 w-full" />
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black text-slate-600 tracking-widest">Network</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-xs font-black">Base Sepolia</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] uppercase font-black text-slate-600 tracking-widest">Expiry</span>
                    <span className="text-xs font-black block">{expiryDate ? new Date(expiryDate).toLocaleDateString() : 'Forever'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full bg-white text-slate-950 hover:bg-blue-50 hover:text-blue-600 disabled:bg-slate-900 disabled:text-slate-700 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="capitalize">{txStatus}...</span>
                  </>
                ) : (
                  <>
                    Authorize & Lock
                    <ShieldCheck className="w-6 h-6" />
                  </>
                )}
              </button>

              <div className="space-y-4">
                {[
                  { id: 'approving', label: '1. ERC20 Authorization', desc: 'Secure spending permission' },
                  { id: 'depositing', label: '2. On-Chain Deposit', desc: 'Locking funds in Escrow' },
                  { id: 'syncing', label: '3. Link Generation', desc: 'Finalizing shared protocol' }
                ].map((s, idx) => (
                  <div key={s.id} className={cn(
                    "flex items-start gap-4 transition-all duration-500",
                    txStatus === s.id ? "opacity-100 scale-100" : "opacity-30 scale-95"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0",
                      txStatus === s.id ? "bg-blue-600 text-white animate-pulse" : "bg-slate-800 text-slate-600"
                    )}>{idx + 1}</div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black uppercase tracking-widest">{s.label}</p>
                      <p className="text-[10px] font-bold text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setStep(1)} disabled={isSubmitting} className="w-full text-slate-600 hover:text-slate-400 text-xs font-black uppercase tracking-widest transition-colors">Abort Mission</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-10 rounded-[3rem] border border-white/10 space-y-10 text-center relative overflow-hidden shadow-[0_0_100px_rgba(34,197,94,0.1)]"
            >
              <div className="absolute top-0 left-0 w-full h-2 shadow-[0_0_40px_rgba(34,197,94,0.5)] bg-green-500" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-2 ring-green-500/20"
              >
                <CheckCircle className="text-green-500 w-12 h-12" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tight leading-none">Victory!</h2>
                <p className="text-slate-400 font-medium">Your link is live on the Base 101% Perfected protocol.</p>
              </div>

              <div className="flex flex-col items-center gap-8">
                <div className="p-6 bg-white rounded-3xl shadow-2xl ring-4 ring-white/5 group relative cursor-pointer" onClick={() => window.open(shareLink, '_blank')}>
                  <QRCodeSVG value={shareLink} size={180} level="H" includeMargin />
                  <div className="absolute inset-0 bg-blue-600/90 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                    <ExternalLink className="w-8 h-8" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Open Link</span>
                  </div>
                </div>

                <div className="w-full relative">
                  <input
                    readOnly
                    value={shareLink}
                    aria-label="Payment link URL"
                    className="w-full bg-slate-950/80 border border-white/5 rounded-3xl py-6 pl-8 pr-16 text-xs font-mono font-bold text-blue-400"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all active:scale-95 shadow-lg"
                  >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareLink)}`} target="_blank" className="p-5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-4xl text-green-400 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl">
                    <Share2 className="w-4 h-4" /> WhatsApp
                  </a>
                  <a href={`https://t.me/share/url?url=${encodeURIComponent(shareLink)}`} target="_blank" className="p-5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-4xl text-blue-400 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl">
                    <Send className="w-4 h-4" /> Telegram
                  </a>
                </div>
              </div>

              <button onClick={() => { setStep(1); setAmount(''); }} className="text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                <Zap className="w-3 h-3 fill-current" /> Initialize New Flow
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Section */}
        {address && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <h3 className="text-2xl font-black italic tracking-tight flex items-center gap-3">
                <Wallet className="w-6 h-6 text-blue-400" /> My Links
              </h3>
              <button onClick={fetchMyPayments} disabled={loadingPayments} aria-label="Refresh my payments" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <Loader2 className={cn("w-5 h-5 text-slate-500", loadingPayments && "animate-spin")} />
              </button>
            </div>

            {loadingPayments && myPayments.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 opacity-30">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <p className="text-sm font-black uppercase tracking-widest">Scanning Chain...</p>
              </div>
            ) : myPayments.length > 0 ? (
              <div className="grid gap-4">
                {myPayments.map((pay) => (
                  <motion.div
                    layout
                    key={pay.payment_id}
                    className="glass border border-white/5 p-6 rounded-4xl flex items-center justify-between group hover:border-blue-500/30 transition-all hover:bg-white/2"
                  >
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        pay.status === 'unclaimed' ? "bg-blue-500/10 text-blue-400" :
                          pay.status === 'claimed' ? "bg-green-500/10 text-green-400" : "bg-slate-800 text-slate-500"
                      )}>
                        {pay.status === 'unclaimed' ? <Send className="w-5 h-5" /> : pay.status === 'claimed' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-black tabular-nums">{pay.amount} <span className="text-blue-500 font-bold">{pay.token}</span></span>
                          <span className={cn(
                            "text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter",
                            pay.status === 'unclaimed' ? "bg-blue-500/20 text-blue-400" :
                              pay.status === 'claimed' ? "bg-green-500/20 text-green-400" : "bg-slate-800 text-slate-500"
                          )}>{pay.status}</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-600">{pay.payment_id.slice(0, 16)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/claim/${pay.payment_id}`); alert("Copied!"); }} aria-label="Copy payment link" className="p-3 bg-white/5 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-xl">
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      {pay.status === 'unclaimed' && (
                        <button onClick={() => handleCancelPayment(pay.payment_id)} aria-label="Cancel payment" className="p-3 bg-white/5 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-xl">
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center glass rounded-[2.5rem] border-dashed border-white/5">
                <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No active protocols detected.</p>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Footer System Status */}
      <footer className="fixed bottom-0 left-0 w-full p-6 pointer-events-none z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 px-6 py-3 bg-slate-900/80 backdrop-blur-xl rounded-full border border-white/5 shadow-2xl pointer-events-auto">
            {[
              { label: 'API', status: health.api },
              { label: 'DB', status: health.db === 'connected' ? 'ok' : 'error' },
              { label: 'ESCROW', status: isCorrectChain ? 'ok' : 'error' }
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", s.status === 'ok' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]")} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{s.label} <span className={s.status === 'ok' ? "text-slate-300" : "text-red-400"}>{s.status}</span></span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pointer-events-auto opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">BaseDrop v1.0.0 · Base Sepolia Testnet</span>
            <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">TESTNET</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
