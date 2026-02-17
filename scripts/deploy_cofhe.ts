import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy MockERC20
    console.log("Deploying MockERC20...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy("TestToken", "TST");
    await mockERC20.waitForDeployment();
    const mockERC20Address = await mockERC20.getAddress();
    console.log("MockERC20 deployed to:", mockERC20Address);

    // Mint some to deployer
    console.log("Minting tokens to deployer...");
    const mintTx = await mockERC20.mint(deployer.address, ethers.parseUnits("1000000", 18));
    await mintTx.wait();

    // 2. Deploy Vault
    console.log("Deploying Vault...");
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(mockERC20Address);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("Vault deployed to:", vaultAddress);

    // 3. Deploy PassERC20 (FHE Token)
    console.log("Deploying PassERC20...");
    const PassERC20 = await ethers.getContractFactory("PassERC20");
    const passERC20 = await PassERC20.deploy("PrivateTST", "pTST");
    await passERC20.waitForDeployment();
    const passERC20Address = await passERC20.getAddress();
    console.log("PassERC20 deployed to:", passERC20Address);

    // 4. Link Contracts
    console.log("Linking Vault -> PassERC20...");
    const linkVaultTx = await vault.setPassToken(passERC20Address);
    await linkVaultTx.wait();

    console.log("Linking PassERC20 -> Vault...");
    const linkPassTx = await passERC20.setVault(vaultAddress);
    await linkPassTx.wait();

    console.log("Deployment Complete!");
    console.log("----------------------------------------------------");
    console.log(`MockERC20: ${mockERC20Address}`);
    console.log(`Vault:     ${vaultAddress}`);
    console.log(`PassERC20: ${passERC20Address}`);
    console.log("----------------------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
