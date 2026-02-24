import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const { account, connect, disconnect, isCorrectNetwork, switchToSepolia } = useWallet();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const isLandingPage = location.pathname === '/';

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    if (isLandingPage) {
        return <>{children}</>;
    }

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Convert', path: '/convert' },
        { name: 'Private Transfer', path: '/transfer' },
        { name: 'Settings', path: '/settings' },
    ];

    return (
        <div className="bg-surface-dark text-slate-100 min-h-screen font-display flex flex-col">
            <nav className="sticky top-0 z-50 border-b border-primary/10 bg-[#121212]/80 backdrop-blur-md px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center glow-primary">
                            <span className="material-icons-round text-[#121212] font-bold">lock</span>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-2xl font-bold tracking-tight text-white uppercase italic">PASSERC</span>
                            <span className="text-[10px] text-primary tracking-[0.2em] font-black">CONFIDENTIAL</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`${isActive(link.path) ? 'text-primary' : 'hover:text-primary transition-all underline-offset-8 hover:underline decoration-primary/40'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 relative">
                        {account ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`hidden sm:flex px-6 py-2.5 rounded-full transition-all items-center gap-2 text-xs uppercase tracking-wider font-black ${!isCorrectNetwork
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                                        : 'bg-primary/10 border border-primary/30 hover:bg-primary/20 text-white glow-primary'
                                        }`}
                                >
                                    <span className="material-icons-round text-sm text-primary">
                                        {!isCorrectNetwork ? 'warning' : 'account_balance_wallet'}
                                    </span>
                                    {!isCorrectNetwork ? 'Wrong Chain' : `${account.slice(0, 6)}...${account.slice(-4)}`}
                                    <span className="material-icons-round text-sm ml-1 opacity-50">
                                        expand_more
                                    </span>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                        <button
                                            onClick={() => { disconnect(); setIsDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-400 font-bold hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                        >
                                            <span className="material-icons-round text-sm">logout</span>
                                            Disconnect
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={connect}
                                className="hidden sm:flex bg-primary hover:bg-primary/90 text-[#121212] font-black px-6 py-2.5 rounded-full transition-all items-center gap-2 glow-primary shadow-[0_0_20px_rgba(0,255,162,0.2)] text-xs uppercase tracking-wider"
                            >
                                <span className="material-icons-round text-sm">account_balance_wallet</span>
                                Connect Wallet
                            </button>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMenu}
                            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 transition-all"
                        >
                            <span className="material-icons-round">
                                {isMenuOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-[#121212]/95 backdrop-blur-xl border-b border-primary/10 py-6 px-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={closeMenu}
                                    className={`text-lg font-bold tracking-tight ${isActive(link.path) ? 'text-primary' : 'text-slate-400 hover:text-white transition-colors'}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            {account ? (
                                <div className="flex flex-col gap-2">
                                    <div className={`w-full font-black py-4 rounded-xl flex items-center justify-center gap-2 ${!isCorrectNetwork ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-primary/10 border border-primary/30 text-white'}`}>
                                        <span className="material-icons-round text-sm text-primary">
                                            {!isCorrectNetwork ? 'warning' : 'account_balance_wallet'}
                                        </span>
                                        {!isCorrectNetwork ? 'Switch Network' : `${account.slice(0, 6)}...${account.slice(-4)}`}
                                    </div>
                                    <button
                                        onClick={() => { disconnect(); closeMenu(); }}
                                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black py-3 rounded-xl transition-all border border-red-500/20 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons-round text-sm">logout</span>
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { connect(); closeMenu(); }}
                                    className="sm:hidden w-full bg-primary text-[#121212] font-black py-4 rounded-xl flex items-center justify-center gap-2 glow-primary"
                                >
                                    <span className="material-icons-round text-sm">account_balance_wallet</span>
                                    Connect Wallet
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Wrong Network Overlay */}
            {account && !isCorrectNetwork && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#121212]/90 backdrop-blur-xl px-6">
                    <div className="bg-surface border border-primary/30 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(0,255,162,0.15)] animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                            <span className="material-icons-round text-3xl">wifi_off</span>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Wrong Network</h2>
                        <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                            PASSERC operates exclusively on the <strong>Ethereum Sepolia</strong> network for confidential transactions. Please switch your wallet network to continue.
                        </p>
                        <button
                            onClick={switchToSepolia}
                            className="w-full bg-primary hover:bg-primary/90 text-[#121212] font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,162,0.3)] uppercase tracking-widest text-sm glow-primary"
                        >
                            Switch to Ethereum Sepolia
                        </button>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full">
                {children}
            </main>

            <footer className="mt-auto border-t border-white/5 bg-[#121212] py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-slate-600 text-sm">
                        © 2026 PASSERC Labs. Powered by Fhenix FHE.
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="https://github.com/AshThunder/passerc" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-primary transition-colors">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                        </a>
                        <a href="https://x.com/ChrisGold__" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-primary transition-colors">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
