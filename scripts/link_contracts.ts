import { ethers } from "hardhat";

async function main() {
    const vaultAddress = "0xA05174050fF137F4cc03e2280F3Fc2C7f6f37d6f";
    const passERC20Address = "0xfe9B4da093503084d21F897aD9e5F27Ea9AB3AbB";

    console.log("Linking contracts...");
    console.log("Vault:", vaultAddress);
    console.log("PassERC20:", passERC20Address);

    const Vault = await ethers.getContractAt("Vault", vaultAddress);
    const PassERC20 = await ethers.getContractAt("PassERC20", passERC20Address);

    console.log("Linking Vault -> PassERC20...");
    const tx1 = await Vault.setPassToken(passERC20Address);
    await tx1.wait();
    console.log("Vault linked!");

    console.log("Linking PassERC20 -> Vault...");
    const tx2 = await PassERC20.setVault(vaultAddress);
    await tx2.wait();
    console.log("PassERC20 linked!");

    console.log("Linking Complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
