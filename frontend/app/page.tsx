'use client';

import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, keccak256, toHex, encodePacked } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Link as LinkIcon, CheckCircle, ArrowRight, Wallet, Info, Loader2, Calendar } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { QRCodeSVG } from 'qrcode.react';
import { ESCROW_ADDRESS, ESCROW_ABI } from './constants/contract';

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('ETH'); // Default to ETH for MVP
  const [step, setStep] = useState(1); // 1: Input, 2: Confirm, 3: Success
  const [paymentId, setPaymentId] = useState<`0x${string}`>('0x');
  const [shareLink, setShareLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  const { writeContractAsync } = useWriteContract();

  // Generate a random payment ID (bytes32 format)
  const generatePaymentId = (): `0x${string}` => {
    const randomBytes = Math.random().toString(36).substring(2, 15);
    return keccak256(toHex(randomBytes));
  };

  const handleCreateLink = async () => {
    const id = generatePaymentId();
    setPaymentId(id);
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!address || !amount) return;
    setIsSubmitting(true);

    try {
      // 1. Transaction to Escrow
      console.log("Creating payment on-chain...", paymentId);

      const tx = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'createPayment',
        args: [
          paymentId,
          '0x0000000000000000000000000000000000000000', // ETH address sentinel
          parseEther(amount)
        ],
        value: parseEther(amount),
      });

      console.log("Transaction sent:", tx);

      // 2. Store in Backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          token,
          sender_wallet: address,
          payment_id: paymentId,
          expires_at: expiryDate ? new Date(expiryDate).toISOString() : null
        }),
      });

      if (response.ok) {
        setShareLink(`${window.location.origin}/claim/${paymentId}`);
        setStep(3);
      } else {
        const errorData = await response.json();
        alert(`Backend error: ${errorData.error}`);
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      alert(error.message || "Failed to create payment link");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />

      {/* Header */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Send className="text-white w-5 h-5 -rotate-12" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Base<span className="text-blue-500">Drop</span></span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </nav>

      {/* Main Content */}
      <main className="w-full max-w-xl z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass p-8 rounded-3xl space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold gradient-text">Send crypto with a link.</h1>
                <p className="text-slate-400">Enter an amount and generate a shareable payment link. Anyone with the link can claim it.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 px-6 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-800 px-3 py-1 rounded-lg text-sm font-bold">
                      {token}
                    </div>
                  </div>
                </div>

                {/* Expiry Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">Expiry (Optional)</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="datetime-local"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 focus:border-blue-500/50 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none [color-scheme:dark]"
                    />
                  </div>
                </div>

                {!isConnected ? (
                  <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-start gap-3">
                      <Info className="text-blue-400 w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-200">Please connect your wallet to start creating payment links.</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleCreateLink}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                  >
                    Create Payment Link
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="glass p-8 rounded-3xl space-y-8 text-center"
            >
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                <Wallet className="text-blue-500 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Confirm Deposit</h2>
                <p className="text-slate-400">You are about to lock <span className="text-white font-mono">{amount} {token}</span> into the escrow contract.</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm & Lock Funds"
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-3xl space-y-8 text-center"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="text-green-500 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Payment Link Ready!</h2>
                <p className="text-slate-400">Share this link with the recipient. They can claim the funds instantly.</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="p-4 bg-white rounded-2xl shadow-2xl shadow-blue-500/20">
                  <QRCodeSVG
                    value={shareLink}
                    size={200}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: "https://base.org/images/base-logo.svg",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="w-full relative group">
                  <input
                    readOnly
                    value={shareLink}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-6 pr-14 text-sm font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <LinkIcon className="w-5 h-5 text-blue-400" />
                    )}
                  </button>
                  {copied && (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-8 right-0 text-xs text-green-500 font-bold"
                    >
                      Copied!
                    </motion.span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setAmount('');
                }}
                className="w-full py-4 text-slate-400 hover:text-white transition-all text-sm font-medium"
              >
                Create another payment
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="absolute bottom-6 flex items-center gap-8 text-slate-500 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Base Mainnet
        </div>
        <div className="hover:text-slate-300 cursor-help transition-all underline decoration-slate-800">How it works</div>
        <div className="hover:text-slate-300 cursor-pointer transition-all underline decoration-slate-800">Security</div>
      </footer>
    </div>
  );
}
