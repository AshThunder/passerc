import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useFhenix } from '../hooks/useFhenix';
import { useNotification } from '../context/NotificationContext';
import { CONTRACT_ADDRESSES } from '../config';
import MockERC20ABI from '../abi/MockERC20.json';
import PassERC20ABI from '../abi/PassERC20.json';

const Dashboard: React.FC = () => {
    const { signer, provider, account } = useWallet();
    const { client, isReady, permitHash } = useFhenix();
    const { showNotification } = useNotification();
    const [publicBalance, setPublicBalance] = useState<string>('0');
    const [privateBalance, setPrivateBalance] = useState<string>('---');
    const [passwordEnabled, setPasswordEnabled] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [faucetStatus, setFaucetStatus] = useState('');

    const fetchBalances = async () => {
        if (!account) return;
        const runner = signer || provider;
        if (!runner) return;
        setLoading(true);
        try {
            // Public Balance
            const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.mockERC20, MockERC20ABI.abi, runner);
            const pubBal = await tokenContract.balanceOf(account);
            setPublicBalance(ethers.formatUnits(pubBal, 18));

            // Private Balance — only attempt if cofhejs is fully initialized with a permit
            const passContract = new ethers.Contract(CONTRACT_ADDRESSES.passERC20, PassERC20ABI.abi, runner);

            if (client && isReady && permitHash && account) {
                try {
                    const handle = await passContract.balanceHandle(account);
                    const handleBigInt = BigInt(handle.toString());

                    if (handleBigInt === 0n) {
                        // No encrypted balance yet (handle is 0 means no FHE data)
                        setPrivateBalance("0");
                    } else {
                        // Permanent Fix: CoFHE KMS Indexer takes a few seconds to sync new handles.
                        // We implement a retry loop so it doesn't immediately fail.
                        let result: any;
                        let retries = 3;
                        while (retries > 0) {
                            result = await client.unseal(handleBigInt, 4); // 4 = UINT32
                            if (result.success) break;
                            retries--;
                            // Wait 2.5s before retrying to give KMS time to index the Ethereum block
                            if (retries > 0) await new Promise(r => setTimeout(r, 2500));
                        }

                        if (result.success) {
                            setPrivateBalance(result.data.toString());
                        } else {
                            throw result.error;
                        }
                    }
                } catch (unsealErr) {
                    console.error("Unseal failed after retries:", unsealErr);
                    setPrivateBalance("Error");
                }
            } else if (!isReady) {
                setPrivateBalance("Initializing...");
            } else {
                setPrivateBalance("---");
            }

            // Password status
            const pwdEnabled = await passContract.isPasswordRequired(account);
            setPasswordEnabled(pwdEnabled);
        } catch (err) {
            console.error("Failed to fetch balances", err);
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch when account, signer, or cofhejs readiness changes
    useEffect(() => {
        if (account && (provider || signer)) {
            fetchBalances();
        }
    }, [account, signer, isReady, permitHash]);

    const handleMintTestTokens = async () => {
        if (!signer || !account) {
            setFaucetStatus('Connect wallet first');
            return;
        }
        setFaucetStatus('Minting 1000 TST to your wallet...');
        try {
            const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.mockERC20, MockERC20ABI.abi, signer);
            const tx = await tokenContract.mint(account, ethers.parseUnits("1000", 18));
            await tx.wait();
            setFaucetStatus('✅ 1000 TST minted!');
            showNotification('Successfully minted 1000 TST!', 'success');
            fetchBalances();
        } catch (err: any) {
            console.error(err);
            const msg = err?.reason || err?.message || 'Mint failed';
            setFaucetStatus(`❌ ${msg}`);
            showNotification(msg, 'error');
        }
    };

    return (
        <div className="space-y-10">
            {/* TVP Section */}
            <section>
                <div className="relative overflow-hidden glass-card rounded-xl p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="relative z-10 flex-1">
                        <h2 className="text-slate-400 text-sm font-medium mb-1">Total Value Protected (TVP)</h2>
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-bold text-white tracking-tight">
                                {loading ? '...' : (privateBalance !== '---' ? `${privateBalance}` : '---')}
                            </span>
                            {privateBalance !== '---' && (
                                <span className="text-xl text-primary font-semibold">pTST</span>
                            )}
                        </div>
                        <p className="text-slate-500 mt-4 max-w-md">Your confidential assets are protected by FHE encryption.</p>

                        <div className="flex items-center gap-4 mt-4">
                            <button onClick={fetchBalances} disabled={loading} className={`text-primary text-sm hover:underline flex items-center gap-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <span className={`material-icons-round text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span> {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                            {passwordEnabled !== null && (
                                <span className={`text-xs px-3 py-1 rounded-full ${passwordEnabled ? 'bg-primary/10 text-primary' : 'bg-slate-700 text-slate-400'}`}>
                                    {passwordEnabled ? '🔒 Password Protected' : '🔓 No Password'}
                                </span>
                            )}
                        </div>
                    </div>

                    {!account && (
                        <div className="text-slate-500 text-sm italic">Connect wallet to view balances</div>
                    )}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Public Assets */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-icons-round text-secondary">public</span>
                        Public Assets (ERC20)
                    </h3>
                    <div className="glass-card rounded-xl overflow-hidden p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-white font-bold text-lg">TST</h4>
                                <p className="text-slate-500 text-xs">Test Token (Sepolia)</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-mono text-white">{parseFloat(publicBalance).toFixed(2)}</div>
                                <div className="text-slate-500 text-xs">Balance</div>
                            </div>
                        </div>
                    </div>

                    {/* Faucet */}
                    <div className="glass-card rounded-xl p-6 border border-secondary/20">
                        <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                            <span className="material-icons-round text-secondary text-lg">water_drop</span>
                            Test Token Faucet
                        </h4>
                        <p className="text-slate-500 text-xs mb-4">Get free TST tokens for testing.</p>
                        <button
                            onClick={handleMintTestTokens}
                            disabled={!signer}
                            className={`w-full bg-secondary/20 text-secondary font-bold py-3 rounded-xl hover:bg-secondary/30 transition-all text-sm ${!signer ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Mint 1000 TST
                        </button>
                        {faucetStatus && (
                            <p className={`text-xs mt-2 text-center font-mono ${faucetStatus.includes('❌') ? 'text-red-400' : 'text-primary'}`}>
                                {faucetStatus}
                            </p>
                        )}
                    </div>
                </div>

                {/* Private Assets */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-icons-round text-primary">visibility_off</span>
                        Protected (FHERC20)
                    </h3>
                    <div className="glass-card rounded-xl overflow-hidden p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-white font-bold text-lg">pTST</h4>
                                <p className="text-slate-500 text-xs">Confidential Token (Sepolia)</p>
                            </div>
                            <div className="text-right">
                                {account ? (
                                    loading ? (
                                        <div className="animate-pulse flex flex-col items-end">
                                            <div className="h-8 w-24 bg-white/10 rounded mb-1"></div>
                                            <div className="h-3 w-16 bg-white/5 rounded"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-white font-mono text-2xl font-bold">{privateBalance} pTST</div>
                                            <div className="text-slate-500 text-xs">Decrypted Balance</div>
                                        </>
                                    )
                                ) : (
                                    <div className="text-slate-500 italic">Connect wallet to view</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Network info */}
            <div className="text-center text-slate-600 text-xs">
                Network: Sepolia Testnet • Contracts verified on chain
            </div>
        </div>
    );
};

export default Dashboard;
