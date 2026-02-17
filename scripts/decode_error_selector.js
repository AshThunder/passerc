const ethers = require("ethers");

const errors = [
    "CallerNotVault(address)",
    "Unauthorized(address)",
    "InvalidCaller(address)",
    "InvalidSender(address)",
    "SignerMismatch(address)",
    "AccessDenied(address)",
    "InvalidSigner(address)",
    "AddressMismatch(address)",
    "SenderMismatch(address)",
    "WrongCaller(address)",
    "NotVault(address)",
    "OnlyVault(address)",
    "Forbidden(address)",
    "InvalidInput(address)",
    "VerifyFailed(address)",
    "VerificationFailed(address)",
    "InvalidSignature(address)",
    "SecurityZoneOutOfBounds(int32)",
    "InvalidEncryptedInput(uint8,uint8)",
    "SenderNotAuthorized(address)",
    "CallerNotAuthorized(address)"
];

const target = "0x7ba5ffb5";

console.log(`Searching for selector matching ${target}...`);

errors.forEach(err => {
    const hash = ethers.id(err).slice(0, 10);
    if (hash === target) {
        console.log(`MATCH FOUND: ${err}`);
    } else {
        // console.log(`${hash} ${err}`);
    }
});
