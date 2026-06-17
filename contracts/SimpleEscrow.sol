// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleEscrow
 * @dev Layanan escrow untuk transaksi aman antara buyer dan seller.
 *      Mendukung arbiter untuk penyelesaian sengketa dan timeout auto-refund.
 *
 * State machine:
 *   AWAITING_DELIVERY -> buyer sudah deposit, menunggu seller konfirmasi
 *   COMPLETE          -> buyer release dana, transaksi selesai
 *   DISPUTED          -> buyer mengajukan sengketa
 *   REFUNDED          -> dana dikembalikan ke buyer
 */
contract SimpleEscrow {
    // ─── Enums ───────────────────────────────────────────────────────────────

    enum State {
        AWAITING_DELIVERY,
        COMPLETE,
        DISPUTED,
        REFUNDED
    }

    // ─── State Variables ──────────────────────────────────────────────────────

    /// @notice Alamat buyer yang melakukan deposit
    address public buyer;

    /// @notice Alamat seller yang akan menerima pembayaran
    address public seller;

    /**
     * @notice Arbiter yang berwenang menyelesaikan sengketa.
     *         Defaultnya adalah deployer contract (owner).
     */
    address public arbiter;

    /// @notice Jumlah dana yang di-deposit oleh buyer (dalam wei)
    uint256 public depositAmount;

    /// @notice Status saat ini dari escrow
    State public currentState;

    /**
     * @notice Timestamp deadline (Unix). Jika block.timestamp melewati deadline
     *         dan state masih AWAITING_DELIVERY, buyer bisa auto-refund.
     */
    uint256 public deadline;

    /// @notice Persentase fee arbiter dari deposit (0-100). Default 0.
    uint256 public arbiterFeePercent;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @dev Dipancarkan saat buyer berhasil deposit dana
    event Deposited(address indexed buyer, uint256 amount, uint256 deadline);

    /// @dev Dipancarkan saat buyer mengonfirmasi pengiriman dan dana dirilis ke seller
    event FundsReleased(address indexed seller, uint256 amount);

    /// @dev Dipancarkan saat buyer mengajukan sengketa
    event DisputeRaised(address indexed buyer);

    /// @dev Dipancarkan saat dana dikembalikan ke buyer (manual atau timeout)
    event Refunded(address indexed buyer, uint256 amount);

    /// @dev Dipancarkan saat arbiter menyelesaikan sengketa
    event DisputeResolved(
        address indexed winner,
        uint256 winnerAmount,
        uint256 arbiterFee
    );

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Escrow: caller is not the buyer");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Escrow: caller is not the arbiter");
        _;
    }

    modifier inState(State expected) {
        require(currentState == expected, "Escrow: invalid state for this action");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _seller          Alamat seller
     * @param _arbiter         Alamat arbiter (bisa sama dengan deployer)
     * @param _durationSeconds Durasi escrow dalam detik sebelum bisa auto-refund
     * @param _arbiterFeePercent Persentase fee arbiter (0-10)
     */
    constructor(
        address _seller,
        address _arbiter,
        uint256 _durationSeconds,
        uint256 _arbiterFeePercent
    ) {
        require(_seller != address(0), "Escrow: seller is zero address");
        require(_arbiter != address(0), "Escrow: arbiter is zero address");
        require(_seller != msg.sender, "Escrow: buyer and seller cannot be the same");
        require(_arbiterFeePercent <= 10, "Escrow: arbiter fee cannot exceed 10%");

        buyer = msg.sender;
        seller = _seller;
        arbiter = _arbiter;
        arbiterFeePercent = _arbiterFeePercent;
        deadline = block.timestamp + _durationSeconds;
        currentState = State.AWAITING_DELIVERY;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Buyer mendeposit ETH ke escrow.
     *         Hanya bisa dilakukan satu kali saat state AWAITING_DELIVERY
     *         dan sebelum deadline.
     */
    function deposit() external payable onlyBuyer inState(State.AWAITING_DELIVERY) {
        require(msg.value > 0, "Escrow: deposit amount must be greater than zero");
        require(depositAmount == 0, "Escrow: already deposited");
        require(block.timestamp < deadline, "Escrow: deadline has passed");

        depositAmount = msg.value;
        emit Deposited(buyer, msg.value, deadline);
    }

    /**
     * @notice Buyer mengonfirmasi bahwa barang/jasa sudah diterima
     *         dan merilis dana ke seller.
     */
    function releaseFunds()
        external
        onlyBuyer
        inState(State.AWAITING_DELIVERY)
    {
        require(depositAmount > 0, "Escrow: no funds deposited");

        currentState = State.COMPLETE;
        uint256 amount = depositAmount;
        depositAmount = 0;

        emit FundsReleased(seller, amount);
        payable(seller).transfer(amount);
    }

    /**
     * @notice Buyer mengajukan sengketa jika barang/jasa tidak sesuai.
     *         Dana akan dikunci hingga arbiter menyelesaikan sengketa.
     */
    function raiseDispute()
        external
        onlyBuyer
        inState(State.AWAITING_DELIVERY)
    {
        require(depositAmount > 0, "Escrow: no funds deposited");

        currentState = State.DISPUTED;
        emit DisputeRaised(buyer);
    }

    /**
     * @notice Buyer meminta refund setelah deadline terlewati
     *         (timeout auto-refund).
     */
    function refundAfterTimeout()
        external
        onlyBuyer
        inState(State.AWAITING_DELIVERY)
    {
        require(depositAmount > 0, "Escrow: no funds deposited");
        require(block.timestamp >= deadline, "Escrow: deadline has not passed yet");

        currentState = State.REFUNDED;
        uint256 amount = depositAmount;
        depositAmount = 0;

        emit Refunded(buyer, amount);
        payable(buyer).transfer(amount);
    }

    /**
     * @notice Arbiter menyelesaikan sengketa dengan memilih pemenang.
     * @param releaseToSeller true  = seller yang menang (dana ke seller)
     *                        false = buyer yang menang (dana ke buyer)
     */
    function resolveDispute(bool releaseToSeller)
        external
        onlyArbiter
        inState(State.DISPUTED)
    {
        require(depositAmount > 0, "Escrow: no funds to resolve");

        uint256 total = depositAmount;
        depositAmount = 0;

        // Hitung fee arbiter
        uint256 fee = (total * arbiterFeePercent) / 100;
        uint256 payout = total - fee;

        if (releaseToSeller) {
            currentState = State.COMPLETE;
            emit DisputeResolved(seller, payout, fee);
            payable(seller).transfer(payout);
        } else {
            currentState = State.REFUNDED;
            emit DisputeResolved(buyer, payout, fee);
            payable(buyer).transfer(payout);
        }

        // Transfer fee ke arbiter jika ada
        if (fee > 0) {
            payable(arbiter).transfer(fee);
        }
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Mengembalikan saldo ETH yang saat ini terkunci di escrow
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Mengecek apakah deadline sudah terlewati
     */
    function isExpired() external view returns (bool) {
        return block.timestamp >= deadline;
    }

    /**
     * @notice Mengembalikan detail lengkap state escrow
     */
    function getEscrowDetails()
        external
        view
        returns (
            address _buyer,
            address _seller,
            address _arbiter,
            uint256 _depositAmount,
            State _state,
            uint256 _deadline,
            uint256 _arbiterFeePercent
        )
    {
        return (
            buyer,
            seller,
            arbiter,
            depositAmount,
            currentState,
            deadline,
            arbiterFeePercent
        );
    }
}
