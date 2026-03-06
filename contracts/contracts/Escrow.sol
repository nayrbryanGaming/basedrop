// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Escrow
 * @dev High-security escrow contract for BaseDrop to hold funds until claimed via payment ID.
 * Now includes on-chain expiry enforcement.
 */
contract Escrow is Ownable, ReentrancyGuard {
    struct Payment {
        address sender;
        address token; // address(0) for native ETH
        uint256 amount;
        uint256 expiry; // 0 for no expiry
        bool claimed;
        bool cancelled;
    }

    // Mapping from paymentId (hashed) to Payment details
    mapping(bytes32 => Payment) public payments;

    event PaymentCreated(bytes32 indexed paymentId, address sender, address token, uint256 amount, uint256 expiry);
    event PaymentClaimed(bytes32 indexed paymentId, address receiver);
    event PaymentCancelled(bytes32 indexed paymentId);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Creates a payment record and locks the funds.
     * @param paymentId The unique identifier for the payment (generated off-chain).
     * @param token The ERC20 token address, or address(0) for native ETH.
     * @param amount The amount of tokens/ETH to lock.
     * @param expiry The timestamp after which the payment cannot be claimed (0 for no expiry).
     */
    function createPayment(bytes32 paymentId, address token, uint256 amount, uint256 expiry) external payable nonReentrant {
        require(payments[paymentId].sender == address(0), "Payment ID already exists");
        require(amount > 0, "Amount must be greater than zero");
        require(expiry == 0 || expiry > block.timestamp, "Expiry must be in the future");

        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount sent");
        } else {
            require(msg.value == 0, "Native ETH sent for ERC20 payment");
            // Security: Ensure the transfer succeeds
            require(IERC20(token).transferFrom(msg.sender, address(this), amount), "ERC20 transfer failed");
        }

        payments[paymentId] = Payment({
            sender: msg.sender,
            token: token,
            amount: amount,
            expiry: expiry,
            claimed: false,
            cancelled: false
        });

        emit PaymentCreated(paymentId, msg.sender, token, amount, expiry);
    }

    /**
     * @dev Allows a receiver to claim the locked funds using the payment ID.
     * @param paymentId The unique identifier for the payment.
     * @param receiver The address where the funds should be sent.
     */
    function claimPayment(bytes32 paymentId, address receiver) external nonReentrant {
        Payment storage payment = payments[paymentId];
        require(payment.sender != address(0), "Payment does not exist");
        require(!payment.claimed, "Payment already claimed");
        require(!payment.cancelled, "Payment already cancelled");
        require(payment.expiry == 0 || block.timestamp <= payment.expiry, "Payment expired");

        // Effects: Update state before transfer to prevent reentrancy (CEI pattern)
        payment.claimed = true;

        // Interaction
        if (payment.token == address(0)) {
            (bool success, ) = payable(receiver).call{value: payment.amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(IERC20(payment.token).transfer(receiver, payment.amount), "ERC20 transfer failed");
        }

        emit PaymentClaimed(paymentId, receiver);
    }

    /**
     * @dev Allows the sender to cancel the payment and reclaim their funds.
     * @param paymentId The unique identifier for the payment.
     */
    function cancelPayment(bytes32 paymentId) external nonReentrant {
        Payment storage payment = payments[paymentId];
        require(payment.sender == msg.sender, "Only the sender can cancel");
        require(!payment.claimed, "Payment already claimed");
        require(!payment.cancelled, "Payment already cancelled");

        payment.cancelled = true;

        if (payment.token == address(0)) {
            (bool success, ) = payable(payment.sender).call{value: payment.amount}("");
            require(success, "ETH refund failed");
        } else {
            require(IERC20(payment.token).transfer(payment.sender, payment.amount), "ERC20 refund failed");
        }

        emit PaymentCancelled(paymentId);
    }
}
