import { ethers } from "hardhat";

async function main() {
    const vaultAddress = "0x09A52174f21A1c86A5851773f4ee0edD6e7C0c1D";
    const passERC20Address = "0x0e3ac72329e75A9f4cFC7f802CCe16d872BA16EB";

    console.log("Linking contracts...");
    console.log("Vault:", vaultAddress);
    console.log("PassERC20:", passERC20Address);

    const vault = await ethers.getContractAt("Vault", vaultAddress);
    const passERC20 = await ethers.getContractAt("PassERC20", passERC20Address);

    // 1. Link Vault to PassERC20
    console.log("Executing vault.setPassToken...");
    const tx1 = await vault.setPassToken(passERC20Address);
    await tx1.wait();
    console.log("✅ Vault linked to PassERC20");

    // 2. Link PassERC20 to Vault
    console.log("Executing passERC20.setVault...");
    const tx2 = await passERC20.setVault(vaultAddress);
    await tx2.wait();
    console.log("✅ PassERC20 linked to Vault");

    console.log("Linking Complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
