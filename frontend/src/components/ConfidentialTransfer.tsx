import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useFhenix } from '../hooks/useFhenix';
import { useNotification } from '../context/NotificationContext';
import { Encryptable } from 'cofhejs/web';
import { CONTRACT_ADDRESSES } from '../config';
import PassERC20ABI from '../abi/PassERC20.json';

const ConfidentialTransfer: React.FC = () => {
    const { signer, account } = useWallet();
    const { client, permitHash } = useFhenix();
    const { showNotification } = useNotification();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const handleTransfer = async () => {
        if (!signer || !client) {
            setStatus('Please connect wallet');
            return;
        }
        if (!recipient) {
            setStatus('❌ Error: Input recipient address');
            return;
        }
        if (!amount) {
            setStatus('❌ Error: Input amount');
            return;
        }
        if (!password) {
            setStatus('❌ Error: Input password');
            return;
        }

        setLoading(true);
        setStatus('Encrypting & Sending Transfer...');

        try {
            const contractAddress = CONTRACT_ADDRESSES.passERC20;
            const contract = new ethers.Contract(contractAddress, PassERC20ABI.abi, signer);

            const amountInt = parseInt(amount);
            const passwordInt = parseInt(password);

            if (isNaN(amountInt)) throw new Error("Invalid amount");
            if (isNaN(passwordInt)) throw new Error("Password must be numeric");

            // 1. Pre-flight check: Verify password locally
            const isProtected = await contract.isPasswordRequired(account);
            if (!isProtected) {
                throw new Error("You must set a password in the settings page before you can transfer funds securely.");
            }

            if (!permitHash) throw new Error("FHE Permit not found. Please refresh.");

            const handle = await contract.getPasswordHandle(account);
            const unsealResult = await (client as any).unseal(handle, 4);

            if (unsealResult.success) {
                if (unsealResult.data.toString() !== password) {
                    throw new Error("Wrong password! Please check and try again.");
                }
            } else {
                console.error("Local unseal failed:", unsealResult.error);
                throw new Error(`Password check failed: ${unsealResult.error?.message || 'FHE error'}`);
            }

            // 2. Pre-flight check: Verify balance locally
            const balanceHandle = await contract.balanceHandle(account);
            const balanceHandleBigInt = BigInt(balanceHandle.toString());

            if (balanceHandleBigInt === 0n) {
                throw new Error("Insufficient balance!");
            }

            const balanceUnsealResult = await (client as any).unseal(balanceHandleBigInt, 4, undefined, permitHash);
            if (balanceUnsealResult.success) {
                const currentBalanceInt = parseInt(balanceUnsealResult.data.toString());
                if (amountInt > currentBalanceInt) {
                    throw new Error(`Insufficient private balance! You have ${currentBalanceInt} pTST, but tried to send ${amountInt}.`);
                }
            } else {
                console.error("Local balance unseal failed:", balanceUnsealResult.error);
                // We won't strictly halt here if the unseal itself fails due to FHE hiccups, but ideally it shouldn't.
                // It's safer to throw.
                throw new Error("Could not verify your private balance. Please refresh and try again.");
            }

            // 3. Encrypt inputs for CoFHE
            const amountItem = Encryptable.uint32(BigInt(amountInt));
            const passwordItem = Encryptable.uint32(BigInt(passwordInt));

            const encryptResult = await (client as any).encrypt([amountItem, passwordItem], 0);
            if (!encryptResult.success) throw encryptResult.error;

            const [encAmount, encPassword] = encryptResult.data;

            setStatus('Step 3: Sending Encrypted Transaction...');

            // 4. Execute transferEncrypted(to, encAmount, encPassword)
            const tx = await contract.transferEncrypted(recipient, encAmount, encPassword);
            await tx.wait();
            const successMsg = '✅ Transfer Successful!';
            setStatus(successMsg);
            showNotification(successMsg, 'success');
            setAmount('');
            setRecipient('');
            setPassword('');
        } catch (err: any) {
            console.error(err);
            const msg = err.message || 'Transaction failed';
            setStatus(`❌ Error: ${msg}`);
            showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Private Transfer</h2>
                <p className="text-slate-500">Send encrypted assets with password protection.</p>
            </div>

            <div className="glass-card p-8 rounded-2xl relative overflow-hidden border border-secondary/20">
                <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/20 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Recipient Address</label>
                        <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-secondary/50 transition-all font-mono"
                            placeholder="0x..."
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-secondary/50 transition-all font-mono"
                                placeholder="0"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">pTST</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2 flex justify-between">
                            <span>Transfer Password (Numeric)</span>
                            <span className="text-secondary text-xs">Password required</span>
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-secondary/50 transition-all tracking-widest"
                            placeholder="Input password"
                        />
                    </div>

                    {status && (
                        <div className={`text-sm text-center font-mono ${status.includes('Error') ? 'text-red-400' : 'text-secondary'}`}>
                            {status}
                        </div>
                    )}

                    <button
                        onClick={handleTransfer}
                        disabled={loading || !signer}
                        className={`w-full bg-secondary text-[#121212] font-bold py-4 rounded-xl hover:opacity-90 transition-all glow-secondary flex items-center justify-center gap-2 ${loading || !signer ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <span className="material-icons-round animate-spin">sync</span>
                        ) : (
                            <span className="material-icons-round">send</span>
                        )}
                        {loading ? 'Processing...' : 'Send Privately'}
                    </button>
                    {!signer && (
                        <p className="text-center text-xs text-slate-500 mt-2">Connect wallet to proceed</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfidentialTransfer;
