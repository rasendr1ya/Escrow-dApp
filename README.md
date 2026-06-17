# SimpleEscrow - Blockchain Project 2

## Deskripsi

**SimpleEscrow** adalah smart contract layanan escrow untuk transaksi aman antara dua pihak (buyer dan seller) di atas blockchain Ethereum. Dana buyer dikunci di contract hingga buyer mengonfirmasi penerimaan barang/jasa. Jika terjadi sengketa, arbiter berwenang memutuskan alokasi dana.

Contract mengimplementasikan **state machine** dengan 4 state:

```
AWAITING_DELIVERY → COMPLETE   (buyer release)
AWAITING_DELIVERY → DISPUTED   (buyer dispute)
AWAITING_DELIVERY → REFUNDED   (timeout / arbiter ruled buyer wins)
DISPUTED          → COMPLETE   (arbiter ruled seller wins)
DISPUTED          → REFUNDED   (arbiter ruled buyer wins)
```

## Anggota Kelompok

- _(Danar Bagus Rasendriya - 5027231055)_
- _(Diandra Naufal Abror - 5027231004)_
- _(Tio Axellino Irin - 5027231065)_

## Fitur

### Fitur Wajib
- ✅ **Buyer deposit dana** — buyer mengirim ETH ke contract saat memulai transaksi
- ✅ **Seller deliver / konfirmasi** — buyer mengonfirmasi penerimaan dan merilis dana ke seller
- ✅ **Buyer raise dispute** — buyer mengajukan sengketa jika tidak puas
- ✅ **Refund mechanism** — dana dikembalikan ke buyer jika sengketa dimenangkan buyer

### Fitur Bonus
- ✅ **Arbiter untuk dispute** — pihak ketiga netral menyelesaikan sengketa dengan arbiter fee
- ✅ **Timeout auto-refund** — buyer bisa request refund otomatis setelah deadline terlewati
- ✅ **Partial release (arbiter fee)** — arbiter mendapat fee persentase dari deposit saat menyelesaikan sengketa

## Cara Menjalankan

### Prerequisites

- Node.js v18+
- npm

### Installation

```bash
npm install
```

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

### Test dengan Coverage

```bash
npx hardhat coverage
```

### Deploy ke Local Network

Terminal 1 — jalankan local node:
```bash
npx hardhat node
```

Terminal 2 — deploy contract:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Interact dengan Contract

```bash
npx hardhat run scripts/interact.js --network localhost
```

## Struktur Project

```
├── contracts/
│   └── SimpleEscrow.sol        # Smart contract utama
├── test/
│   └── SimpleEscrow.test.js    # Unit tests (30+ test cases)
├── scripts/
│   ├── deploy.js               # Deployment script
│   └── interact.js             # Demo interaction script
├── hardhat.config.js
├── package.json
└── README.md
```

## Contract Address

> Deploy ke local network terlebih dahulu, lalu isi di sini.

```
Network  : Hardhat Localhost (chainId: 31337)
Address  : <isi setelah deploy>
```

## Spesifikasi Contract

| Komponen | Detail |
|---|---|
| State Variables | `buyer`, `seller`, `arbiter`, `depositAmount`, `currentState`, `deadline`, `arbiterFeePercent` |
| Functions | `deposit()`, `releaseFunds()`, `raiseDispute()`, `refundAfterTimeout()`, `resolveDispute()`, `getBalance()`, `isExpired()`, `getEscrowDetails()` |
| Modifiers | `onlyBuyer`, `onlyArbiter`, `inState` |
| Events | `Deposited`, `FundsReleased`, `DisputeRaised`, `Refunded`, `DisputeResolved` |
| Mappings | - (state machine berbasis enum) |

## Menghubungkan MetaMask

1. Buka MetaMask → klik dropdown network → **Add a network manually**
2. Isi:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
3. Import akun dari output `npx hardhat node` menggunakan private key yang disediakan
4. Import minimal 3 akun (buyer, seller, arbiter)

## Screenshot

> Tambahkan screenshot berikut setelah demo:

| Screenshot | Keterangan |
|---|---|
| `compile.png` | Output `npx hardhat compile` |
| `test.png` | Output `npx hardhat test` (semua hijau) |
| `deploy.png` | Output `npx hardhat run scripts/deploy.js` |
| `metamask-network.png` | MetaMask terhubung ke Hardhat Local |
| `tx-deposit.png` | Transaksi deposit berhasil |
| `tx-release.png` | Transaksi release/dispute berhasil |
