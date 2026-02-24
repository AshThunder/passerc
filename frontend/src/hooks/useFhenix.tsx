import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { cofhejs } from 'cofhejs/web';
import { useWallet } from './useWallet';
import { MOCK_MODE } from '../config';

interface FhenixContextType {
    client: typeof cofhejs | null;
    isReady: boolean;
    permitHash: string | null;
}

const FhenixContext = createContext<FhenixContextType>({
    client: null,
    isReady: false,
    permitHash: null,
});

export const FhenixProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { provider, signer, account } = useWallet();
    const [client, setClient] = useState<typeof cofhejs | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [permitHash, setPermitHash] = useState<string | null>(null);
    const initRef = useRef<string | null>(null);

    useEffect(() => {
        if (MOCK_MODE) {
            setClient({
                encrypt: async (items: any[]) => ({
                    success: true,
                    data: items.map(item => item.value.toString())
                }),
                unseal: async (handle: any) => ({
                    success: true,
                    data: handle.toString()
                })
            } as any);
            setIsReady(true);
            return;
        }

        if (provider && signer && account && initRef.current !== account) {
            initRef.current = account;
            const initClient = async () => {
                try {
                    console.log("[CoFHE] Initializing cofhejs...");
                    const result = await cofhejs.initializeWithEthers({
                        ethersProvider: provider as any,
                        ethersSigner: signer as any,
                        environment: "TESTNET",
                        generatePermit: true,
                    } as any);
                    if (result.success && result.data) {
                        const hash = result.data.getHash();
                        console.log("[CoFHE] Initialized with permit hash:", hash);
                        setPermitHash(hash);
                        setClient(cofhejs);
                        setIsReady(true);
                    } else {
                        console.error("[CoFHE] Init returned error:", result.error);
                        setClient(cofhejs);
                        setIsReady(false);
                    }
                } catch (err) {
                    console.error("[CoFHE] Init Failed:", err);
                    setIsReady(false);
                    initRef.current = null;
                }
            };
            initClient();
        }

        if (!account) {
            initRef.current = null;
            setIsReady(false);
            setPermitHash(null);
        }

        return () => {
            // Don't reset initRef on cleanup — we want to prevent double init within exact same session
        };
    }, [provider, signer, account]);

    return (
        <FhenixContext.Provider value={{ client, isReady, permitHash }}>
            {children}
        </FhenixContext.Provider>
    );
};

export const useFhenix = () => useContext(FhenixContext);

