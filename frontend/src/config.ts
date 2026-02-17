export const CONTRACT_ADDRESSES = {
    mockERC20: "0x24c04a7dEAbBE94708548F234456b84C6AB726AF",
    vault: "0x1dA665014bC4c66bAE44585f22709Cf2DBa3eE69",
    passERC20: "0x444FF26156e68D7A04fA1930e0faB5f648f300Ef",
};

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC = (import.meta as any).env?.VITE_SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com";

export const MOCK_MODE = false; // Using real CoFHE on Sepolia
