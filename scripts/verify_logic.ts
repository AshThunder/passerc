import { ethers } from "hardhat";

async function main() {
    const [deployer, user1] = await ethers.getSigners();
    console.log("Verifying with account:", deployer.address);

    // Addresses from deployment
    const mockERC20Address = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
    const vaultAddress = "0x59b670e9fA9D0A427751Af201D676719a970857b";
    const passERC20Address = "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1";

    const token = await ethers.getContractAt("MockERC20", mockERC20Address);
    const vault = await ethers.getContractAt("Vault", vaultAddress);
    const pToken = await ethers.getContractAt("PassERC20", passERC20Address);

    // 1. Check Initial Balance
    const bal = await token.balanceOf(deployer.address);
    console.log("Initial UTKN Balance:", ethers.formatUnits(bal, 18));

    // 2. Approve & Deposit
    console.log("Approving and Depositing 100 Raw Units...");
    const amount = ethers.parseUnits("100", 0); // Corrected to 0 decimals
    await token.approve(vaultAddress, amount);
    await vault.deposit(amount);
    console.log("Deposit complete.");

    // 3. Set Password (PIN)
    console.log("Setting Password (PIN) to 1234...");
    const coder = ethers.AbiCoder.defaultAbiCoder();
    const password = 1234;
    const encPasswordSetup = {
        data: coder.encode(['uint256'], [password]),
        securityZone: 0
    };
    await pToken.setPassword(encPasswordSetup);
    console.log("Password set.");

    // 4. Check pToken Balance (Encrypted)
    const permission = { publicKey: ethers.ZeroHash, signature: "0x" };
    const pBal = await pToken.balanceOfEncrypted(deployer.address, permission);
    console.log("Encrypted Balance (Mock View):", pBal);


    // 5. Transfer Encrypted
    console.log("Transferring 50 to User1...");
    const amtTransfer = ethers.parseUnits("50", 0); // Corrected to 0 decimals

    const encAmount = {
        data: coder.encode(['uint256'], [amtTransfer]),
        securityZone: 0
    };
    const encPassword = {
        data: coder.encode(['uint256'], [password]),
        securityZone: 0
    };

    await pToken.transferEncrypted(user1.address, encAmount, encPassword);
    console.log("Transfer complete.");

    // 6. Verify balances
    const pBalSender = await pToken.balanceOfEncrypted(deployer.address, permission);
    const pBalReceiver = await pToken.balanceOfEncrypted(user1.address, permission);

    console.log("Sender Final Balance:", pBalSender);
    console.log("Receiver Final Balance:", pBalReceiver);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
