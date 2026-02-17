import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DecodeText: React.FC<{ text: string; delay?: number; className?: string; animateOnScroll?: boolean }> = ({ text, delay = 0, className, animateOnScroll = false }) => {
    const [displayText, setDisplayText] = useState("");
    const [triggered, setTriggered] = useState(false);
    const characters = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$&*<>[]!?(%*)";
    const elementRef = React.useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!animateOnScroll) {
            const timer = setTimeout(() => setTriggered(true), delay);
            return () => clearTimeout(timer);
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setTriggered(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });

        if (elementRef.current) observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, [delay, animateOnScroll]);

    useEffect(() => {
        if (!triggered) return;

        let iteration = 0;
        const interval = setInterval(() => {
            setDisplayText(text.split("").map((char, index) => {
                if (index < iteration) return text[index];
                if (char === " ") return " ";
                return characters[Math.floor(Math.random() * characters.length)];
            }).join(""));

            if (iteration >= text.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);
        return () => clearInterval(interval);
    }, [triggered, text]);

    return (
        <span ref={elementRef} className={`${className} font-mono`}>
            {displayText || (triggered ? "" : text.replace(/[^\s]/g, " "))}
        </span>
    );
};

const NewsTicker: React.FC = () => {
    return (
        <div className="w-full bg-primary py-2 overflow-hidden whitespace-nowrap border-b border-black/10 z-[110] relative">
            <div className="inline-block animate-ticker px-4">
                {[
                    "SEPOLIA COFHE NOW LIVE",
                    "ENCRYPTED ASSET PROTECTION",
                    "JOIN THE FHENIX ECOSYSTEM",
                    "COFHE COPROCESSOR ARCHITECTURE",
                    "PASSERC v2 RELEASED"
                ].map((msg, i) => (
                    <span key={i} className="text-[9px] font-black tracking-[0.3em] text-[#121212] mx-12">
                        {msg} •
                    </span>
                ))}
            </div>
            <div className="inline-block animate-ticker px-4">
                {[
                    "SEPOLIA COFHE NOW LIVE",
                    "ENCRYPTED ASSET PROTECTION",
                    "JOIN THE FHENIX ECOSYSTEM",
                    "COFHE COPROCESSOR ARCHITECTURE",
                    "PASSERC v2 RELEASED"
                ].map((msg, i) => (
                    <span key={i} className="text-[9px] font-black tracking-[0.3em] text-[#121212] mx-12">
                        {msg} •
                    </span>
                ))}
            </div>
        </div>
    );
};

const CipherStat: React.FC<{ label: string; value: string }> = ({ label, value }) => {
    return (
        <div className="flex flex-col gap-2 group cursor-default">
            <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase group-hover:translate-x-1 transition-transform">{label}</span>
            <DecodeText text={value} className="text-3xl md:text-4xl font-black text-white tracking-tighter tabular-nums" animateOnScroll />
            <div className="w-12 h-1 bg-primary/20 rounded-full group-hover:w-full transition-all duration-500"></div>
        </div>
    );
};

const useReveal = () => {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);
};

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    useReveal();

    const features = [
        {
            title: "Fhenix Powered FHE",
            desc: "Leverage Fully Homomorphic Encryption to compute on encrypted data without ever revealing the underlying assets.",
            icon: "bolt",
            gradient: "from-primary/20 to-primary/5"
        },
        {
            title: "Password Protected",
            desc: "Secure your assets with a decentralized password, ensuring only you can unlock and transfer your protected tokens.",
            icon: "lock",
            gradient: "from-secondary/20 to-secondary/5"
        },
        {
            title: "Total Privacy",
            desc: "Balances and transfers remain encrypted on-chain, visible only to you through cryptographic unsealing.",
            icon: "visibility_off",
            gradient: "from-primary/20 to-primary/5"
        },
        {
            title: "CoFHE Architecture",
            desc: "Built on the Fhenix Coprocessor model, enabling complex encrypted logic execution directly on Ethereum Sepolia.",
            icon: "hub",
            gradient: "from-secondary/20 to-secondary/5"
        }
    ];

    const stats = [
        { label: "NETWORK CHAIN ID", value: "11155111" },
        { label: "SETTLEMENT LAYER", value: "SEPOLIA" },
        { label: "PROTOCOL ARCH", value: "FHE_COPROCESSOR" }
    ];

    return (
        <div className="min-h-screen bg-surface-dark selection:bg-primary selection:text-surface-dark overflow-x-hidden relative">
            <NewsTicker />
            {/* Grid Overlay */}
            <div className="fixed inset-0 z-1 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            {/* Background Image Layer */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-black/60 z-10"></div>
                <img
                    src="/assets/hero-bg.png"
                    className="w-full h-full object-cover scale-110 blur-sm opacity-40 animate-pulse-slow"
                    alt="Background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-surface-dark via-transparent to-surface-dark z-20"></div>

                {/* Scanline Effect */}
                <div className="absolute inset-0 z-30 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
            </div>

            {/* Nav */}
            <nav className="fixed top-12 left-0 right-0 z-[100] flex justify-between items-center px-8 py-6 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center glow-primary rotate-3 group-hover:rotate-0 transition-transform">
                        <span className="material-icons-round text-[#121212] font-black text-xl">shield</span>
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-xl font-black tracking-tighter text-white">PASSERC</span>
                        <span className="text-[8px] text-primary tracking-[0.3em] font-bold uppercase underline decoration-primary/30 underline-offset-4">Confidential Layer</span>
                    </div>
                </div>
                <div className="hidden lg:flex gap-12 text-[10px] tracking-[0.25em] font-black text-slate-400 uppercase">
                    {["Documentation", "Security", "Ecosystem", "Governance"].map((item, i) => (
                        <a key={item} href="#" className="hover:text-primary transition-all relative group">
                            <DecodeText text={item} delay={300 + (i * 100)} />
                            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary transition-all group-hover:w-full"></span>
                        </a>
                    ))}
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="group relative overflow-hidden bg-white/10 hover:bg-white/20 border border-white/10 px-8 py-3 rounded-full text-[10px] tracking-[0.15em] font-black uppercase transition-all"
                >
                    <span className="relative z-10 group-hover:text-primary transition-colors flex items-center gap-2">
                        <DecodeText text="Enter App" delay={800} />
                    </span>
                    <div className="absolute inset-x-0 bottom-0 h-0 group-hover:h-full bg-primary/10 transition-all duration-300"></div>
                </button>
            </nav>

            {/* Hero */}
            <section className="relative z-10 pt-72 pb-40 px-6 flex flex-col items-center text-center">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="relative px-8 py-3 mb-16 group cursor-default">
                        {/* Corner Brackets */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/40 group-hover:border-primary transition-all duration-500"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/40 group-hover:border-primary transition-all duration-500"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/40 group-hover:border-primary transition-all duration-500"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/40 group-hover:border-primary transition-all duration-500"></div>

                        <div className="flex items-center gap-4">
                            <div className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </div>
                            <span className="text-[10px] font-mono font-black tracking-[0.5em] text-primary/90 uppercase">
                                <DecodeText text="ENCRYPT_LAYER_SESSION_V2" delay={500} />
                            </span>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-[100px] font-black text-white leading-[0.9] tracking-tighter mb-10 drop-shadow-2xl">
                        <DecodeText text="PASSWORD PROTECTED" delay={200} /> <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-[#00ffc8] to-secondary animate-gradient-x drop-shadow-[0_0_30px_rgba(0,255,162,0.4)]">
                            <DecodeText text="CONFIDENTIAL TOKENS" delay={600} />
                        </span>
                    </h1>

                    <p className="text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto mb-20 font-medium leading-relaxed tracking-tight">
                        The definitive standard for <span className="text-white border-b border-primary/30">Password Protected Confidential Tokens</span>.
                        Encrypted assets, secure transfers, and decentralized access control via Fhenix CoFHE.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="group relative inline-flex items-center gap-4 bg-primary text-[#121212] px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all glow-primary"
                        >
                            Launch Terminal
                            <span className="material-icons-round text-xl group-hover:translate-x-1 transition-transform">code</span>
                        </button>
                        <a
                            href="#"
                            className="text-[10px] font-black tracking-[0.2em] text-slate-500 hover:text-white uppercase transition-colors flex items-center gap-2 px-6"
                        >
                            Read Manifest
                            <span className="material-icons-round text-sm">north_east</span>
                        </a>
                    </div>
                </div>

                {/* Floating Elements (Visual Decoration) */}
                <div className="absolute top-1/2 left-10 w-24 h-24 bg-primary/10 border border-primary/20 backdrop-blur-2xl rounded-3xl animate-float opacity-40 hidden xl:flex items-center justify-center">
                    <span className="material-icons-round text-primary text-4xl">security</span>
                </div>
                <div className="absolute top-[60%] right-20 w-32 h-32 bg-secondary/10 border border-secondary/20 backdrop-blur-2xl rounded-full animate-float-delayed opacity-40 hidden xl:flex items-center justify-center">
                    <span className="material-icons-round text-secondary text-5xl">vpn_key</span>
                </div>
            </section>

            {/* Stats Bar */}
            <div className="relative z-20 border-y border-white/5 bg-black/60 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-10 py-10 grid grid-cols-1 md:grid-cols-3 gap-12">
                    {stats.map((s, idx) => (
                        <CipherStat key={idx} label={s.label} value={s.value} />
                    ))}
                </div>
            </div>

            {/* Features (Refined) */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-40">
                <div className="text-center mb-24 reveal">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 uppercase">
                        Core <span className="text-primary italic">Protocol</span> Features
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {features.map((f, idx) => (
                        <div
                            key={idx}
                            style={{ transitionDelay: `${idx * 150}ms` }}
                            className={`reveal group relative p-12 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden hover:border-primary/30 hover:bg-white/[0.04] transition-all duration-500
                                ${idx === 0 || idx === 3 ? 'md:col-span-12 lg:col-span-8' : 'md:col-span-12 lg:col-span-4'}`}
                        >
                            {/* Inner Glow */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-10 border border-white/10 group-hover:border-primary/50 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                                    <span className="material-icons-round text-primary text-3xl">{f.icon}</span>
                                </div>
                                <h3 className="text-4xl font-black text-white mb-6 leading-tight tracking-tighter">{f.title}</h3>
                                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md group-hover:text-slate-200 transition-colors">{f.desc}</p>

                                <div className="mt-12 flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                    Exploration Mode
                                    <span className="material-icons-round text-sm">arrow_forward</span>
                                </div>
                            </div>

                            {/* Grid Pattern BG */}
                            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Overhaul */}
            <section className="reveal relative z-10 py-48 px-6 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-primary/10 skew-y-3 -z-10 blur-[100px]"></div>
                <div className="max-w-5xl mx-auto text-center relative">
                    <div className="mb-12 inline-block">
                        <span className="material-icons-round text-primary text-7xl animate-pulse">lock_open</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-black text-white mb-12 leading-[0.85] tracking-tighter">THE ENCRYPTED <br /><span className="text-primary italic">FRONTIER</span> AWAITS</h2>
                    <p className="text-slate-400 text-xl font-medium mb-16 max-w-2xl mx-auto">Secure your assets with on-chain password protection and Fully Homomorphic Encryption on Ethereum Sepolia.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-white text-[#121212] px-16 py-8 rounded-[2rem] font-black text-lg uppercase tracking-[0.3em] hover:scale-105 hover:bg-primary transition-all shadow-[0_20px_60px_-15px_rgba(0,255,162,0.3)] group"
                    >
                        Access Protocol
                        <span className="inline-block ml-4 group-hover:translate-x-2 transition-transform">→</span>
                    </button>
                </div>
            </section>

            {/* Footer Refinement */}
            <footer className="relative z-10 pt-40 pb-20 px-10 border-t border-white/5 bg-[#080808]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">
                        <div className="col-span-1 lg:col-span-2 space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center glow-primary">
                                    <span className="material-icons-round text-[#121212] font-black text-2xl">shield</span>
                                </div>
                                <span className="text-3xl font-black tracking-tighter text-white">PASSERC</span>
                            </div>
                            <p className="text-slate-500 text-lg font-medium max-w-md leading-relaxed">
                                Deploying the next evolution of on-chain privacy. The definitive confidential layer for the Fhenix ecosystem.
                            </p>
                            <div className="flex gap-6">
                                {["terminal", "forum", "public", "verified_user"].map((icon) => (
                                    <a key={icon} href="#" className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all group">
                                        <span className="material-icons-round text-slate-400 group-hover:text-primary transition-colors">{icon}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-primary font-black mb-10 uppercase text-xs tracking-[0.4em]">Infrastructure</h4>
                            <ul className="space-y-6 text-slate-500 font-bold text-sm tracking-wide">
                                {["Documentation", "Security Audits", "Whitepaper", "Bug Bounty"].map(link => (
                                    <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-primary font-black mb-10 uppercase text-xs tracking-[0.4em]">Foundation</h4>
                            <ul className="space-y-6 text-slate-500 font-bold text-sm tracking-wide">
                                {["Governance", "Grants Program", "Partnerships", "Institutional"].map(link => (
                                    <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-10 pt-16 border-t border-white/5 text-[10px] font-black tracking-[0.4em] text-slate-700 uppercase">
                        <div className="flex gap-10">
                            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
                            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms of Service</span>
                        </div>
                        <div className="flex items-center gap-10">
                            <a href="https://github.com/AshThunder/passerc" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-3">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                <span className="hidden sm:inline">GITHUB</span>
                            </a>
                            <a href="https://x.com/ChrisGold__" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-3">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                <span className="hidden sm:inline">X/TWITTER</span>
                            </a>
                        </div>
                        <span className="text-slate-800">© 2026 PASSERC LABS. DESIGNED FOR THE ERA OF FHE.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
