import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_CHAIN_ID, SEPOLIA_RPC } from '../config';

declare global {
    interface Window {
        ethereum?: any;
    }
}

interface WalletContextType {
    account: string | null;
    provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null;
    signer: ethers.JsonRpcSigner | ethers.Wallet | null;
    connect: () => Promise<void>;
    isCorrectNetwork: boolean;
    switchToSepolia: () => Promise<void>;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
    account: null,
    provider: null,
    signer: null,
    connect: async () => { },
    isCorrectNetwork: true,
    switchToSepolia: async () => { },
    disconnect: () => { },
});

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [account, setAccount] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | ethers.JsonRpcProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | ethers.Wallet | null>(null);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(true);

    useEffect(() => {
        if (window.ethereum) {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(browserProvider);

            window.ethereum.on('accountsChanged', async (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    const bp = new ethers.BrowserProvider(window.ethereum);
                    setProvider(bp);
                    const s = await bp.getSigner();
                    setSigner(s);
                } else {
                    setAccount(null);
                    setSigner(null);
                }
            });

            window.ethereum.on('chainChanged', (chainId: string) => {
                setIsCorrectNetwork(parseInt(chainId, 16) === SEPOLIA_CHAIN_ID);
                window.location.reload();
            });

            // Auto-connect if already connected
            window.ethereum.request({ method: 'eth_accounts' }).then(async (accounts: string[]) => {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                setIsCorrectNetwork(parseInt(chainId, 16) === SEPOLIA_CHAIN_ID);
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    const bp = new ethers.BrowserProvider(window.ethereum);
                    setProvider(bp);
                    const s = await bp.getSigner();
                    setSigner(s);
                }
            }).catch(console.error);
        }
    }, []);

    const switchToSepolia = async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
            });
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                        chainName: 'Sepolia Testnet',
                        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                        rpcUrls: [SEPOLIA_RPC],
                        blockExplorerUrls: ['https://sepolia.etherscan.io'],
                    }],
                });
            }
        }
    };

    const connect = async () => {
        if (window.ethereum) {
            try {
                await switchToSepolia();
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                setProvider(browserProvider);
                const accounts = await browserProvider.send("eth_requestAccounts", []);
                setAccount(accounts[0]);
                const s = await browserProvider.getSigner();
                setSigner(s);
            } catch (err) {
                console.error("Connect error:", err);
            }
        } else {
            console.log("MetaMask not found, read-only mode");
            const readProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
            setProvider(readProvider);
        }
    };

    const disconnect = () => {
        setAccount(null);
        setSigner(null);
    };

    return (
        <WalletContext.Provider value={{ account, provider, signer, connect, disconnect, isCorrectNetwork, switchToSepolia }
        }>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);
