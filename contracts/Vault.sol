// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { FHE, euint32, ebool } from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import { InEuint32 } from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";
import "./PassERC20.sol";

contract Vault {
    PassERC20 public pToken;
    IERC20 public uToken;
    uint256 public constant SCALE = 1e18; // ERC20 has 18 decimals, FHE works with raw uint32

    event Deposit(address indexed user, uint256 amount);
    event WithdrawalRequested(uint256 indexed requestId, address indexed user);
    event WithdrawalFinalized(uint256 indexed requestId, address indexed user, uint256 amount);

    struct WithdrawalRequest {
        address user;
        euint32 amount;
        bool claimed;
    }

    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    uint256 public nextRequestId;

    constructor(address _uToken) {
        uToken = IERC20(_uToken);
    }

    function setPassToken(address _pToken) external {
        pToken = PassERC20(_pToken);
    }

    // Deposit ERC20 -> Get Encrypted PassERC20
    // `amount` is in whole token units (e.g. 100 = 100 TST)
    function deposit(uint32 amount) external {
        require(address(pToken) != address(0), "PassToken not set");
        
        // Transfer user's ERC20 to Vault (scale by 10^18 for ERC20 decimals)
        uToken.transferFrom(msg.sender, address(this), uint256(amount) * SCALE);

        // Mint encrypted tokens to user (raw uint32 amount, no decimals)
        pToken.mint(msg.sender, amount);

        emit Deposit(msg.sender, uint256(amount) * SCALE);
    }

    // Step 1: Request Withdrawal
    // Burns pToken and starts decryption of the burned amount
    function requestWithdraw(uint32 amount, InEuint32 calldata encryptedPassword) external returns (uint256) {
        // Convert encrypted input here so msg.sender matches the signer
        euint32 pwd = FHE.asEuint32(encryptedPassword);
        
        // Grant pToken temporary permission to use this handle
        FHE.allowTransient(pwd, address(pToken));

        // Burn (returns the actual amount burned, which is 0 if password failed)
        euint32 burnedAmount = pToken.burn(msg.sender, amount, pwd);
        
        uint256 reqId = nextRequestId++;
        withdrawalRequests[reqId] = WithdrawalRequest(msg.sender, burnedAmount, false);
        
        // Add to decryption queue
        FHE.decrypt(burnedAmount);
        
        emit WithdrawalRequested(reqId, msg.sender);
        return reqId;
    }

    // Step 2: Finalize Withdrawal after CoFHE processes decryption (async)
    function finalizeWithdraw(uint256 reqId) external {
        WithdrawalRequest storage req = withdrawalRequests[reqId];
        require(req.user == msg.sender, "Not your request");
        require(!req.claimed, "Already claimed");
        
        // Retrieve decrypted value
        // getDecryptResultSafe returns (value, true) if ready, or (0, false) if not
        (uint256 decryptedAmount, bool isReady) = FHE.getDecryptResultSafe(req.amount);
        require(isReady, "Decryption not ready");
        
        req.claimed = true;
        
        if (decryptedAmount > 0) {
            // Scale back to ERC20 decimals
            uToken.transfer(req.user, decryptedAmount * SCALE);
        }
        
        emit WithdrawalFinalized(reqId, msg.sender, decryptedAmount);
    }
}
