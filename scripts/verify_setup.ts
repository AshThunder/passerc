import { ethers } from "hardhat";

async function main() {
    const vaultAddr = "0x439963c92A189CD676c296845bBee395752DeF3c"; // From config.ts
    const passAddr = "0xfe9B4da093503084d21F897aD9e5F27Ea9AB3AbB"; // From config.ts
    const mockAddr = "0xd7f5037e430779d5B52FD4F7BDA3A44431996143"; // From config.ts

    console.log("Verifying setup...");

    const Vault = await ethers.getContractFactory("Vault");
    const PassERC20 = await ethers.getContractFactory("PassERC20");

    const vault = Vault.attach(vaultAddr);
    const pass = PassERC20.attach(passAddr);

    try {
        const pTokenOnVault = await vault.pToken();
        console.log(`Vault.pToken(): ${pTokenOnVault}`);
        console.log(`Expected:       ${passAddr}`);
        console.log(`Match:          ${pTokenOnVault.toLowerCase() === passAddr.toLowerCase()}`);

        const uTokenOnVault = await vault.uToken();
        console.log(`Vault.uToken(): ${uTokenOnVault}`);
        console.log(`Expected:       ${mockAddr}`);
        console.log(`Match:          ${uTokenOnVault.toLowerCase() === mockAddr.toLowerCase()}`);

        const vaultOnPass = await pass.vault();
        console.log(`PassERC20.vault(): ${vaultOnPass}`);
        console.log(`Expected:          ${vaultAddr}`);
        console.log(`Match:             ${vaultOnPass.toLowerCase() === vaultAddr.toLowerCase()}`);

    } catch (error) {
        console.error("Error verifying setup:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
