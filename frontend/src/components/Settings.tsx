import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useFhenix } from '../hooks/useFhenix';
import { useNotification } from '../context/NotificationContext';
import { Encryptable } from 'cofhejs/web';
import { CONTRACT_ADDRESSES } from '../config';
import PassERC20ABI from '../abi/PassERC20.json';

const Settings: React.FC = () => {
    const { signer, account } = useWallet();
    const { client } = useFhenix();
    const { showNotification } = useNotification();
    const [passwordEnabled, setPasswordEnabled] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (signer && account) {
            fetchPasswordStatus();
        }
    }, [signer, account]);

    const fetchPasswordStatus = async () => {
        if (!signer || !account) return;
        try {
            const contract = new ethers.Contract(CONTRACT_ADDRESSES.passERC20, PassERC20ABI.abi, signer);
            const enabled = await contract.isPasswordRequired(account);
            setPasswordEnabled(enabled);
        } catch (err) {
            console.error("Failed to fetch password status", err);
        }
    };

    const handleSetPassword = async () => {
        if (!signer || !client) { setStatus('Connect wallet first'); return; }
        if (!newPassword) { setStatus('Enter a password'); return; }

        setLoading(true);
        setStatus('Encrypting password...');
        try {
            const contract = new ethers.Contract(CONTRACT_ADDRESSES.passERC20, PassERC20ABI.abi, signer);

            const pwdItem = Encryptable.uint32(BigInt(parseInt(newPassword)));
            const encryptResult = await client.encrypt([pwdItem]);

            if (!encryptResult.success) {
                throw new Error(`Encryption failed: ${encryptResult.error?.message}`);
            }

            const encryptedPassword = encryptResult.data[0];

            setStatus('Sending transaction...');
            const tx = await contract.setPassword(encryptedPassword);
            await tx.wait();

            setPasswordEnabled(true);
            setStatus('✅ Password set & protection enabled!');
            showNotification('Password successfully set!', 'success');
            setNewPassword('');
        } catch (err: any) {
            console.error(err);
            const msg = err.message || 'Failed to set password';
            setStatus(`❌ Error: ${msg}`);
            showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleProtection = async () => {
        if (!signer) { setStatus('Connect wallet first'); return; }

        setLoading(true);
        const newState = !passwordEnabled;
        setStatus(newState ? 'Activating protection...' : 'Deactivating protection...');
        try {
            const contract = new ethers.Contract(CONTRACT_ADDRESSES.passERC20, PassERC20ABI.abi, signer);
            const tx = await contract.setPasswordProtection(newState);
            await tx.wait();
            setPasswordEnabled(newState);
            const statusMsg = newState ? 'Password protection activated!' : 'Password protection deactivated!';
            setStatus(statusMsg);
            showNotification(statusMsg, 'success');
        } catch (err: any) {
            console.error(err);
            const msg = err.message || 'Failed to toggle protection';
            setStatus(`Error: ${msg}`);
            showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Security Settings</h2>
                <p className="text-slate-500">Manage your password protection for confidential tokens.</p>
            </div>

            {/* Password Protection Toggle */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold text-lg">Password Protection</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                {passwordEnabled
                                    ? 'Transfers and burns require your password.'
                                    : 'Transfers do not require a password.'}
                            </p>
                        </div>
                        <button
                            onClick={handleToggleProtection}
                            disabled={loading || !signer}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${passwordEnabled ? 'bg-primary' : 'bg-slate-700'
                                } ${loading || !signer ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${passwordEnabled ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className={`p-4 rounded-xl ${passwordEnabled ? 'bg-primary/5 border border-primary/20' : 'bg-slate-800/50 border border-slate-700'}`}>
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`material-icons-round text-lg ${passwordEnabled ? 'text-primary' : 'text-slate-500'}`}>
                                {passwordEnabled ? 'shield' : 'shield_moon'}
                            </span>
                            <span className={passwordEnabled ? 'text-primary' : 'text-slate-500'}>
                                {passwordEnabled ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Set/Change Password */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden border border-secondary/20">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="space-y-6 relative z-10">
                    <div>
                        <h3 className="text-white font-bold text-lg">Set / Change Password</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Set a numeric PIN. This will automatically enable password protection.
                        </p>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">New Password (Numeric PIN)</label>
                        <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-secondary/50 transition-all tracking-widest"
                            placeholder="Enter numeric PIN"
                        />
                    </div>

                    {status && (
                        <div className={`text-sm text-center font-mono ${status.includes('Error') ? 'text-red-400' : 'text-primary'}`}>
                            {status}
                        </div>
                    )}

                    <button
                        onClick={handleSetPassword}
                        disabled={loading || !signer}
                        className={`w-full bg-secondary text-[#121212] font-bold py-4 rounded-xl hover:opacity-90 transition-all glow-secondary flex items-center justify-center gap-2 ${loading || !signer ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <span className="material-icons-round animate-spin">sync</span>
                        ) : (
                            <span className="material-icons-round">key</span>
                        )}
                        {loading ? 'Processing...' : 'Set Password'}
                    </button>

                    {!signer && (
                        <p className="text-center text-xs text-slate-500 mt-2">Connect wallet to proceed</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
