// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { FHE, euint32, ebool } from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import { InEuint32 } from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

contract PassERC20 is ERC20, Ownable {
    mapping(address => euint32) internal _encBalances;
    mapping(address => euint32) private _userPasswords;
    mapping(address => bool) public isPasswordRequired;

    address public vault;

    event VaultUpdated(address indexed vault);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can call");
        _;
    }

    function mint(address to, uint32 amount) external onlyVault {
        euint32 encAmount = FHE.asEuint32(amount);
        _encBalances[to] = FHE.add(_encBalances[to], encAmount);
        FHE.allowThis(_encBalances[to]); 
        FHE.allow(_encBalances[to], to);
    }

    function burn(address from, uint32 amount, euint32 pwd) external onlyVault returns (euint32) {
        euint32 amountToBurn = FHE.asEuint32(amount);
        euint32 actualBurnAmount = amountToBurn;

        if (isPasswordRequired[from]) {
            ebool isPasswordCorrect = FHE.eq(pwd, _userPasswords[from]);
            actualBurnAmount = FHE.select(isPasswordCorrect, amountToBurn, FHE.asEuint32(0));
        }

        ebool hasEnough = FHE.lte(actualBurnAmount, _encBalances[from]);
        actualBurnAmount = FHE.select(hasEnough, actualBurnAmount, FHE.asEuint32(0));

        _encBalances[from] = FHE.sub(_encBalances[from], actualBurnAmount);
        
        FHE.allowThis(_encBalances[from]);
        FHE.allow(_encBalances[from], from);
        
        // Allow vault to use return value
        FHE.allowThis(actualBurnAmount);
        FHE.allow(actualBurnAmount, msg.sender);

        return actualBurnAmount;
    }

    function setPassword(InEuint32 calldata encryptedPassword) public {
        _userPasswords[msg.sender] = FHE.asEuint32(encryptedPassword);
        isPasswordRequired[msg.sender] = true;
        FHE.allowThis(_userPasswords[msg.sender]);
        FHE.allow(_userPasswords[msg.sender], msg.sender);
    }

    function setPasswordProtection(bool enabled) public {
        isPasswordRequired[msg.sender] = enabled;
    }

    function transferEncrypted(address to, InEuint32 calldata encryptedAmount, InEuint32 calldata encryptedPassword) public {
        euint32 amount = FHE.asEuint32(encryptedAmount);
        euint32 amountToTransfer = amount;

        if (isPasswordRequired[msg.sender]) {
            euint32 pwd = FHE.asEuint32(encryptedPassword);
            ebool isPasswordCorrect = FHE.eq(pwd, _userPasswords[msg.sender]);
            amountToTransfer = FHE.select(isPasswordCorrect, amount, FHE.asEuint32(0));
        }

        ebool hasEnough = FHE.lte(amountToTransfer, _encBalances[msg.sender]);
        amountToTransfer = FHE.select(hasEnough, amountToTransfer, FHE.asEuint32(0));

        _encBalances[msg.sender] = FHE.sub(_encBalances[msg.sender], amountToTransfer);
        FHE.allowThis(_encBalances[msg.sender]);
        FHE.allow(_encBalances[msg.sender], msg.sender);

        _encBalances[to] = FHE.add(_encBalances[to], amountToTransfer);
        FHE.allowThis(_encBalances[to]);
        FHE.allow(_encBalances[to], to);
    }
    
    // Minimal view support - returns handle to be sealed by client or permission contract?
    // In strict CoFHE, you use `Permissioned.sol` logic. 
    // For now, we omit `balanceOfEncrypted` returning string/bytes because FHE.seal is not directly exposed in simple interface.
    // Client can use `getDecryptResult` if allowed.
    // We'll rely on `balanceOf` returning 0 for ERC20 compatibility and `balanceHandle` for FHE usage.
    
    function balanceHandle(address account) external view returns (uint256) {
        return euint32.unwrap(_encBalances[account]);
    }

    function getPasswordHandle(address account) external view returns (uint256) {
        return euint32.unwrap(_userPasswords[account]);
    }
}
