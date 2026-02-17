import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useFhenix } from '../hooks/useFhenix';
import { useNotification } from '../context/NotificationContext';
import { Encryptable } from 'cofhejs/web';
import { CONTRACT_ADDRESSES } from '../config';
import VaultABI from '../abi/Vault.json';
import MockERC20ABI from '../abi/MockERC20.json';
import PassERC20ABI from '../abi/PassERC20.json';

const ConversionPortal: React.FC = () => {
    const { signer, account } = useWallet();
    const { client, permitHash } = useFhenix();
    const { showNotification } = useNotification();
    const [amount, setAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [password, setPassword] = useState('');
    const [requestId, setRequestId] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [balance, setBalance] = useState<string | null>(null);

    const fetchBalance = async () => {
        if (!signer || !account) return;
        try {
            const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.mockERC20, MockERC20ABI.abi, signer);
            const bal = await tokenContract.balanceOf(account);
            setBalance(ethers.formatUnits(bal, 18));
        } catch (err) {
            console.error("Balance fetch error:", err);
        }
    };

    // Fetch balance when signer/account changes
    React.useEffect(() => {
        if (signer && account) fetchBalance();
    }, [signer, account]);

    const handleConvert = async () => {
        if (!signer) {
            setStatus('Please connect wallet first');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            setStatus('Enter a valid amount');
            return;
        }

        setLoading(true);
        setStatus('Initializing...');

        try {
            const vaultAddress = CONTRACT_ADDRESSES.vault;
            const tokenAddress = CONTRACT_ADDRESSES.mockERC20;

            const tokenContract = new ethers.Contract(tokenAddress, MockERC20ABI.abi, signer);
            const vaultContract = new ethers.Contract(vaultAddress, VaultABI.abi, signer);

            const amountInt = parseInt(amount);
            if (isNaN(amountInt) || amountInt <= 0 || amountInt > 4294967295) {
                throw new Error("Amount must be a whole number between 1 and ~4.2 billion");
            }

            const amountWei = ethers.parseUnits(amount, 18);

            setStatus('Step 1/2: Approving ERC20 transfer...');
            const approveTx = await tokenContract.approve(vaultAddress, amountWei);
            await approveTx.wait();

            setStatus('Step 2/2: Depositing & minting encrypted tokens...');
            const depositTx = await vaultContract.deposit(amountInt);
            await depositTx.wait();

            setStatus('✅ Conversion successful! You now have encrypted pTST tokens.');
            setAmount('');
            fetchBalance();
        } catch (err: any) {
            console.error(err);
            const reason = err?.reason || err?.message || 'Transaction failed';
            setStatus(`❌ Error: ${reason}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestWithdraw = async () => {
        if (!signer || !client) {
            setStatus('Please connect wallet first');
            return;
        }
        if (!withdrawAmount || !password) {
            setStatus('Enter amount and password');
            return;
        }

        setLoading(true);
        setStatus('Encrypting & Requesting Withdrawal...');

        try {
            const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.vault, VaultABI.abi, signer);
            const passContract = new ethers.Contract(CONTRACT_ADDRESSES.passERC20, PassERC20ABI.abi, signer);
            const amountInt = parseInt(withdrawAmount);
            const pwdInt = parseInt(password);

            // 1. Pre-flight check: Verify password locally if required
            const isProtected = await passContract.isPasswordRequired(account);
            if (isProtected) {
                if (!permitHash) throw new Error("FHE Permit not found. Please refresh.");

                const handle = await passContract.getPasswordHandle(account);
                const unsealResult = await (client as any).unseal(handle, 4);

                if (unsealResult.success) {
                    if (unsealResult.data.toString() !== password) {
                        throw new Error("Wrong password! Please check and try again.");
                    }
                } else {
                    console.error("Local unseal failed:", unsealResult.error);
                    throw new Error(`Password check failed: ${unsealResult.error?.message || 'FHE error'}`);
                }
            }

            // 2. Encrypt password only (amount is plaintext)
            const pwdItem = Encryptable.uint32(BigInt(pwdInt));
            const encryptResult = await (client as any).encrypt([pwdItem], 0);
            if (!encryptResult.success) throw encryptResult.error;

            const encPwd = encryptResult.data[0];

            // 2. Request withdraw
            const tx = await vaultContract.requestWithdraw(amountInt, encPwd);
            const receipt = await tx.wait();

            // Try to find requestId from events
            const event = receipt.logs.find((log: any) => log.fragment?.name === 'WithdrawalRequested');
            let notificationMsg = '';
            if (event) {
                const reqId = event.args[0].toString();
                setRequestId(reqId);
                notificationMsg = `✅ Request #${reqId} submitted! Wait ~1 min for CoFHE decryption.`;
            } else {
                notificationMsg = '✅ Request submitted! Enter ID below to finalize.';
            }
            setStatus(notificationMsg);
            showNotification(notificationMsg, 'success');

        } catch (err: any) {
            console.error(err);
            const msg = err.message || 'Withdrawal failed';
            setStatus(`❌ Error: ${msg}`);
            showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizeWithdraw = async () => {
        if (!signer) return;
        if (!requestId) {
            setStatus('Enter a Request ID');
            return;
        }

        setLoading(true);
        setStatus('Checking decryption status...');

        try {
            const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.vault, VaultABI.abi, signer);
            const tx = await vaultContract.finalizeWithdraw(requestId);
            await tx.wait();

            setStatus('✅ Withdrawal finalized! ERC20 tokens sent to your wallet.');
            setRequestId('');
            setWithdrawAmount('');
            fetchBalance();
        } catch (err: any) {
            console.error(err);
            const msg = err.message || '';
            if (msg.includes('not ready')) {
                setStatus('⏳ Decryption not ready yet. Please wait another 30s.');
            } else {
                setStatus(`❌ Error: ${err.message || 'Finalization failed'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-2">Conversion Portal</h2>
                <p className="text-slate-500">Deposit public tokens to get private assets, or request an async withdrawal.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Deposit Section */}
                <div className="glass-card p-8 rounded-2xl border border-primary/20 flex flex-col h-full">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-icons-round text-primary">add_circle</span>
                        Deposit & Encrypt
                    </h3>

                    <div className="space-y-6 flex-1">
                        {balance !== null && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Your TST Balance</span>
                                <span className="text-white font-mono">{parseFloat(balance).toFixed(2)} TST</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-2">Amount to Convert</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-primary/50 transition-all font-mono"
                                placeholder="100"
                            />
                        </div>

                        <button
                            onClick={handleConvert}
                            disabled={loading || !signer}
                            className={`w-full bg-primary text-[#121212] font-bold py-4 rounded-xl hover:opacity-90 transition-all glow-primary flex items-center justify-center gap-2 ${loading || !signer ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? <span className="material-icons-round animate-spin">sync</span> : <span className="material-icons-round">lock</span>}
                            Deposit TST
                        </button>
                    </div>
                </div>

                {/* Withdraw Section */}
                <div className="glass-card p-8 rounded-2xl border border-secondary/20 flex flex-col h-full">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-icons-round text-secondary">remove_circle</span>
                        Asynchronous Withdrawal
                    </h3>

                    <div className="space-y-6 flex-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-medium mb-2">Amount</label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary/50 font-mono"
                                    placeholder="50"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-medium mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary/50 font-mono"
                                    placeholder="Required"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleRequestWithdraw}
                            disabled={loading || !signer}
                            className={`w-full bg-secondary/20 text-secondary border border-secondary/50 font-bold py-4 rounded-xl hover:bg-secondary/30 transition-all flex items-center justify-center gap-2 ${loading || !signer ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            Step 1: Request Unseal
                        </button>

                        <div className="pt-4 border-t border-white/5">
                            <label className="block text-slate-400 text-sm font-medium mb-2">Request ID (to finalize)</label>
                            <input
                                type="text"
                                value={requestId}
                                onChange={(e) => setRequestId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none font-mono mb-4"
                                placeholder="Auto-filled or manual ID"
                            />
                            <button
                                onClick={handleFinalizeWithdraw}
                                disabled={loading || !signer || !requestId}
                                className={`w-full bg-secondary text-[#121212] font-bold py-4 rounded-xl hover:opacity-90 transition-all glow-secondary ${loading || !signer || !requestId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Step 2: Finalize & Claim
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {status && (
                <div className={`text-center p-4 rounded-xl bg-white/5 font-mono text-sm max-w-2xl mx-auto shadow-inner ${status.includes('❌') ? 'text-red-400' : 'text-primary'}`}>
                    {status}
                </div>
            )}
        </div>
    );
};

export default ConversionPortal;
