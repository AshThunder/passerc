import { ethers } from "hardhat";

async function main() {
    const mockERC20Address = "0xd7f5037e430779d5B52FD4F7BDA3A44431996143";
    const passERC20Address = "0xfe9B4da093503084d21F897aD9e5F27Ea9AB3AbB";

    console.log("Redeploying Vault with decimal scaling fix...");

    // Deploy new Vault
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(mockERC20Address);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("New Vault deployed to:", vaultAddress);

    // Link Vault -> PassERC20
    console.log("Linking Vault -> PassERC20...");
    const tx1 = await vault.setPassToken(passERC20Address);
    await tx1.wait();
    console.log("Vault linked!");

    // Link PassERC20 -> New Vault
    console.log("Linking PassERC20 -> new Vault...");
    const PassERC20 = await ethers.getContractAt("PassERC20", passERC20Address);
    const tx2 = await PassERC20.setVault(vaultAddress);
    await tx2.wait();
    console.log("PassERC20 linked!");

    console.log("\n=== UPDATE config.ts vault address to:", vaultAddress, "===");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
