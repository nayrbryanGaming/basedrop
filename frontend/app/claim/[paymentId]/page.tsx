'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, AlertCircle, Loader2, Wallet, ArrowRight, Info } from 'lucide-react';
import { parseEther } from 'viem';
import confetti from 'canvas-confetti';

import { ESCROW_ADDRESS, ESCROW_ABI } from '../../constants/contract';

export default function ClaimPage() {
    const { paymentId } = useParams();
    const { address, isConnected } = useAccount();
    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState<any>(null);
    const [status, setStatus] = useState<'idle' | 'claiming' | 'success' | 'error'>('idle');
    const [errorType, setErrorType] = useState<'none' | 'notFound' | 'expired' | 'claimed' | 'generic'>('none');
    const [txHash, setTxHash] = useState('');

    const { writeContractAsync } = useWriteContract();

    useEffect(() => {
        const fetchPayment = async () => {
            try {
                // Point to your local or deployed backend
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
                const response = await fetch(`${backendUrl}/api/payments/${paymentId}`);
                if (response.ok) {
                    const data = await response.json();

                    if (data.status === 'claimed') {
                        setErrorType('claimed');
                        setLoading(false);
                        return;
                    }

                    if (data.expires_at && new Date(data.expires_at) < new Date()) {
                        setErrorType('expired');
                        setLoading(false);
                        return;
                    }

                    setPayment(data);
                } else {
                    setErrorType('notFound');
                }
            } catch (error) {
                console.error('Error fetching payment:', error);
            } finally {
                setLoading(false);
            }
        };

        if (paymentId) fetchPayment();
    }, [paymentId]);

    const handleClaim = async () => {
        if (!payment || !address || !paymentId) return;
        setStatus('claiming');

        try {
            // 1. Call Smart Contract
            console.log("Claiming payment on-chain...", paymentId);

            const tx = await writeContractAsync({
                address: ESCROW_ADDRESS,
                abi: ESCROW_ABI,
                functionName: 'claimPayment',
                args: [paymentId as `0x${string}`, address],
            });

            console.log("Claim transaction sent:", tx);
            setTxHash(tx);

            // 2. Update Backend
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
            const response = await fetch(`${backendUrl}/api/payments/${paymentId}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver_wallet: address,
                    tx_hash: tx,
                }),
            });

            if (response.ok) {
                setStatus('success');
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#8b5cf6', '#ffffff']
                });
            } else {
                console.error('Failed to update backend after claim');
                setStatus('success'); // Still show success if contract call was successful
            }
        } catch (error: any) {
            console.error('Error claiming payment:', error);
            alert(error.message || "Failed to claim payment");
            setStatus('error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!payment || errorType !== 'none') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-center space-y-4">
                {errorType === 'expired' ? (
                    <>
                        <AlertCircle className="w-16 h-16 text-amber-500" />
                        <h1 className="text-3xl font-bold italic uppercase">Link Expired</h1>
                        <p className="text-slate-400 max-w-md">This payment link has reached its expiration date and the funds are no longer available for claiming.</p>
                    </>
                ) : errorType === 'claimed' ? (
                    <>
                        <CheckCircle className="w-16 h-16 text-blue-500" />
                        <h1 className="text-3xl font-bold italic uppercase">Already Claimed</h1>
                        <p className="text-slate-400 max-w-md">The funds associated with this link have already been successfully claimed.</p>
                    </>
                ) : (
                    <>
                        <AlertCircle className="w-16 h-16 text-red-500" />
                        <h1 className="text-3xl font-bold italic uppercase">Payment Not Found</h1>
                        <p className="text-slate-400 max-w-md">We couldn't find a valid payment for this link. It may have been cancelled or the ID is incorrect.</p>
                    </>
                )}
                <div className="pt-6">
                    <a href="/" className="px-8 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white hover:bg-slate-800 transition-all">
                        Return Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-slate-950">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />

            {/* Header */}
            <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Download className="text-white w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">Base<span className="text-blue-500">Drop</span></span>
                </div>
                <ConnectButton showBalance={false} chainStatus="icon" />
            </nav>

            <main className="w-full max-w-xl z-10">
                <AnimatePresence mode="wait">
                    {status === 'success' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass p-10 rounded-3xl text-center space-y-6"
                        >
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="text-green-500 w-12 h-12" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-4xl font-bold italic">Funds Claimed!</h2>
                                <p className="text-slate-400 text-lg">
                                    <span className="text-white font-mono">{payment.amount} {payment.token}</span> has been transferred to your wallet.
                                </p>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-xs font-mono break-all text-slate-500">
                                TX: {txHash}
                            </div>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-all"
                            >
                                Back to Dashboard
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass p-10 rounded-3xl space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Payment Received
                                </div>
                                <h1 className="text-5xl font-black tracking-tight italic flex items-center justify-center gap-3">
                                    {payment.amount} <span className="text-blue-500">{payment.token}</span>
                                </h1>
                                <p className="text-slate-400">Waiting for you to claim it on Base Sepolia</p>
                            </div>

                            <div className="space-y-4 p-6 bg-slate-900/30 rounded-2xl border border-slate-800/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Download className="w-12 h-12 rotate-12" />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Sender</span>
                                    <span className="text-slate-300 font-mono italic">{payment.sender_wallet.slice(0, 6)}...{payment.sender_wallet.slice(-4)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Status</span>
                                    <span className={payment.status === 'unclaimed' ? "text-blue-400 font-bold" : "text-green-500 font-bold"}>
                                        {payment.status.toUpperCase()}
                                    </span>
                                </div>
                                {payment.expires_at && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Expires</span>
                                        <span className="text-amber-500/80 font-medium">
                                            {new Date(payment.expires_at).toLocaleDateString()} {new Date(payment.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {!isConnected ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-start gap-3">
                                        <Info className="text-amber-400 w-5 h-5 shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-200">Connect your wallet to claim these funds.</p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleClaim}
                                    disabled={status === 'claiming' || payment.status === 'claimed'}
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3"
                                >
                                    {status === 'claiming' ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Claiming...
                                        </>
                                    ) : payment.status === 'claimed' ? (
                                        'Already Claimed'
                                    ) : (
                                        <>
                                            Claim Payment
                                            <ArrowRight className="w-6 h-6" />
                                        </>
                                    )}
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="absolute bottom-6 text-slate-600 text-xs text-center px-10">
                By clicking claim, you agree to interact with the BaseDrop smart contract. Ensure you are on the correct network.
            </footer>
        </div>
    );
}
