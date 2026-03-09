'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, AlertCircle, Loader2, Wallet, ArrowRight, Info, Zap, ShieldCheck, ShieldAlert, ExternalLink, RefreshCw } from 'lucide-react';
import { parseEther, formatUnits } from 'viem';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ESCROW_ADDRESS, ESCROW_ABI, SUPPORTED_TOKENS } from '../../constants/contract';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function ClaimPage() {
    const { paymentId } = useParams();
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const publicClient = usePublicClient();
    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState<any>(null);
    const [status, setStatus] = useState<'idle' | 'claiming' | 'success' | 'error'>('idle');
    const [errorType, setErrorType] = useState<'none' | 'notFound' | 'expired' | 'claimed' | 'generic'>('none');
    const [txHash, setTxHash] = useState('');
    const [health, setHealth] = useState({ api: 'checking', db: 'checking' });

    const isCorrectChain = chainId === baseSepolia.id;
    const { writeContractAsync } = useWriteContract();

    // Health Check
    useEffect(() => {
        fetch('/api/payments')
            .then(res => res.json())
            .then(data => setHealth({ api: 'ok', db: data.database === 'connected' ? 'connected' : 'error' }))
            .catch(() => setHealth({ api: 'error', db: 'error' }));
    }, []);

    const fetchPayment = async () => {
        if (!paymentId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/payments/${paymentId}`);
            if (response.ok) {
                const data = await response.json();

                // ON-CHAIN VERIFICATION & FALLBACK
                if (publicClient) {
                    try {
                        const onChainData = await publicClient.readContract({
                            address: ESCROW_ADDRESS,
                            abi: ESCROW_ABI,
                            functionName: 'payments',
                            args: [paymentId as `0x${string}`],
                        }) as [string, string, bigint, bigint, boolean, boolean];

                        const [sender, tokenAddr, amountRaw, expiryRaw, claimed, cancelled] = onChainData;

                        if (sender === '0x0000000000000000000000000000000000000000') {
                            setErrorType('notFound');
                            setLoading(false);
                            return;
                        }

                        if (cancelled) {
                            setErrorType('notFound');
                            setLoading(false);
                            return;
                        }
                        if (claimed) {
                            setErrorType('claimed');
                            setLoading(false);
                            return;
                        }

                        // Fallback metadata if API failed or returned 404
                        const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tokenAddr.toLowerCase());
                        setPayment({
                            amount: formatUnits(amountRaw, tokenInfo?.decimals || 18),
                            token: tokenInfo?.symbol || 'UNKNOWN',
                            sender_wallet: sender,
                            expires_at: expiryRaw > 0n ? new Date(Number(expiryRaw) * 1000).toISOString() : null
                        });
                        setErrorType('none');
                        setLoading(false);
                        return;
                    } catch (e) {
                        console.warn('On-chain check failed:', e);
                    }
                }

                if (data.expires_at && new Date(data.expires_at) < new Date()) {
                    setErrorType('expired');
                    setLoading(false);
                    return;
                }

                setPayment(data);
                setErrorType('none');
            } else {
                setErrorType('notFound');
            }
        } catch (error) {
            console.error('Error fetching payment:', error);
            setErrorType('generic');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayment();
    }, [paymentId, publicClient]);

    const handleClaim = async () => {
        if (!payment || !address || !paymentId) return;
        setStatus('claiming');

        try {
            const tx = await writeContractAsync({
                address: ESCROW_ADDRESS,
                abi: ESCROW_ABI,
                functionName: 'claimPayment',
                args: [paymentId as `0x${string}`, address],
            });

            setTxHash(tx);

            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash: tx });
            }

            // Update Backend
            await fetch(`/api/payments/${paymentId}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver_wallet: address.toLowerCase(),
                    tx_hash: tx,
                }),
            });

            setStatus('success');
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#8b5cf6', '#ffffff']
            });
        } catch (error: any) {
            console.error('Claim Error:', error);
            alert(`Claim Failed: ${error.shortMessage || error.message}`);
            setStatus('error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-blue-500 animate-pulse" />
                    </div>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Decrypting Protocol...</p>
            </div>
        );
    }

    if (errorType !== 'none') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-center space-y-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-b from-red-500/5 to-transparent pointer-events-none" />
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 z-10">
                        {errorType === 'expired' ? (
                            <>
                                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto ring-2 ring-amber-500/20 shadow-2xl">
                                    <AlertCircle className="w-12 h-12 text-amber-500" />
                                </div>
                                <h1 className="text-4xl font-black italic tracking-tighter gradient-text">LINK EXPIRED</h1>
                                <p className="text-slate-400 max-w-md mx-auto font-medium">This payment protocol has timed out. The funds have been returned to the original sender.</p>
                            </>
                        ) : errorType === 'claimed' ? (
                            <>
                                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto ring-2 ring-blue-500/20 shadow-2xl">
                                    <CheckCircle className="w-12 h-12 text-blue-500" />
                                </div>
                                <h1 className="text-4xl font-black italic tracking-tighter gradient-text">VAULT SECURED</h1>
                                <p className="text-slate-400 max-w-md mx-auto font-medium">The funds associated with this link have already been transferred to a recipient wallet.</p>
                            </>
                        ) : (
                            <>
                                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-2 ring-red-500/20 shadow-2xl">
                                    <ShieldAlert className="w-12 h-12 text-red-500" />
                                </div>
                                <h1 className="text-4xl font-black italic tracking-tighter gradient-text">PROTOCOL ERROR</h1>
                                <p className="text-slate-400 max-w-md mx-auto font-medium">We could not locate this payment record on the Base Sepolia ledger. It may be cancelled or invalid.</p>
                            </>
                        )}
                        <div className="pt-8">
                            <button onClick={() => window.location.href = '/'} className="px-10 py-5 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-2xl">
                                Return to Protocol
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-50 selection:bg-blue-500/30 overflow-hidden">
            {/* Dynamic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" />
            </div>

            {/* Header */}
            <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 glass border-b border-white/5">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
                    <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Download className="text-white w-5 h-5 -rotate-6" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter">BASE<span className="text-blue-500">DROP</span></span>
                </div>
                <ConnectButton showBalance={false} chainStatus="icon" />
            </nav>

            <main className="w-full max-w-xl z-10 transition-all">
                <AnimatePresence mode="wait">
                    {status === 'success' ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass p-12 rounded-[3rem] text-center space-y-10 relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-2 ring-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                                <CheckCircle className="text-green-500 w-12 h-12" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-5xl font-black italic tracking-tighter gradient-text">Funds Claimed!</h2>
                                <p className="text-slate-400 font-medium text-lg">
                                    <span className="text-white font-black">{payment.amount} {payment.token}</span> has been transferred to your wallet on Base Sepolia.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="p-5 bg-slate-900/80 rounded-2xl border border-white/5 text-[10px] font-mono text-slate-500 relative group truncate">
                                    <span className="block opacity-40 mb-1 uppercase font-black">Ledger Proof</span>
                                    {txHash}
                                    <button onClick={() => window.open(`https://sepolia.basescan.org/tx/${txHash}`, '_blank')} aria-label="View transaction on BaseScan" className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                                <button onClick={() => window.location.href = '/'} className="w-full py-6 bg-white text-slate-950 hover:bg-slate-100 rounded-3xl font-black text-xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 group">
                                    Back to Home
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="claim"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass p-12 rounded-[3.5rem] space-y-12 relative border border-white/10 shadow-2xl"
                        >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl whitespace-nowrap">
                                Incoming Safe Protocol
                            </div>

                            <div className="text-center space-y-6">
                                <h1 className="text-8xl font-black tracking-tighter italic leading-none flex flex-col items-center">
                                    {payment.amount}
                                    <span className="text-blue-500 text-3xl not-italic uppercase tracking-[0.4em] mt-3">{payment.token}</span>
                                </h1>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting claim from escrow</p>
                            </div>

                            <div className="grid gap-3 p-8 bg-slate-900/60 rounded-[2.5rem] border border-white/5 relative group">
                                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-500">
                                    <span>Sender Wallet</span>
                                    <span className="text-slate-300 font-mono italic">{payment.sender_wallet.slice(0, 10)}...</span>
                                </div>
                                <div className="h-px bg-white/5 w-full my-1" />
                                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-500">
                                    <span>Protocol Status</span>
                                    <span className="text-blue-400 animate-pulse">Ready to release</span>
                                </div>
                                {payment.expires_at && (
                                    <>
                                        <div className="h-px bg-white/5 w-full my-1" />
                                        <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-500">
                                            <span>Expiry Date</span>
                                            <span className="text-amber-500">{new Date(payment.expires_at).toLocaleDateString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-6">
                                {!isConnected ? (
                                    <div className="p-8 bg-blue-500/5 rounded-4xl border border-blue-500/10 flex items-center gap-6">
                                        <Wallet className="text-blue-400 w-10 h-10 shrink-0" />
                                        <p className="text-sm font-medium text-blue-200/70 leading-relaxed">Connect your wallet to authorize the transfer from the Base Sepolia Escrow contract.</p>
                                    </div>
                                ) : !isCorrectChain ? (
                                    <button
                                        onClick={() => switchChain?.({ chainId: baseSepolia.id })}
                                        className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xl rounded-3xl transition-all shadow-xl flex items-center justify-center gap-3 group"
                                    >
                                        Switch to Base Sepolia
                                        <Zap className="w-6 h-6 fill-current group-hover:scale-125 transition-transform" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleClaim}
                                        disabled={status === 'claiming'}
                                        className="w-full py-7 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-900 disabled:text-slate-700 text-white font-black text-2xl rounded-3xl transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 group active:scale-[0.98]"
                                    >
                                        {status === 'claiming' ? (
                                            <>
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                                Processing Link...
                                            </>
                                        ) : (
                                            <>
                                                Secure Funds Now
                                                <ShieldCheck className="w-8 h-8" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="flex justify-center gap-8 opacity-20 hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">Non-Custodial</span>
                                <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">Atomic Settlement</span>
                                <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">Gas Optimized</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer System Status */}
            <footer className="fixed bottom-0 left-0 w-full p-8 pointer-events-none z-50">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-10 px-8 py-4 bg-slate-900/90 backdrop-blur-2xl rounded-full border border-white/5 shadow-2xl pointer-events-auto">
                        <div className="flex items-center gap-2.5">
                            <div className={cn("w-2 h-2 rounded-full", health.api === 'ok' ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-red-500 animate-pulse")} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">API: {health.api}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className={cn("w-2 h-2 rounded-full", health.db === 'connected' ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-red-500 animate-pulse")} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">DB: {health.db}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className={cn("w-2 h-2 rounded-full", isCorrectChain ? "bg-blue-500 shadow-[0_0_10px_#3b82f6]" : "bg-amber-500 animate-pulse")} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">NET: {isCorrectChain ? 'Synced' : 'Switch'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 pointer-events-auto opacity-30 hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">101% Perfected Protocol</span>
                        <img src="https://base.org/images/base-logo.svg" alt="Base" className="w-16 h-4 opacity-50 grayscale" />
                    </div>
                </div>
            </footer>
        </div>
    );
}
