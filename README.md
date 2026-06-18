# Simple Escrow dApp — Blockchain Project 2 & 3

## Deskripsi

**Simple Escrow** adalah dApp (decentralized application) layanan escrow untuk transaksi aman antara dua pihak (buyer dan seller) di atas blockchain Ethereum. Dana buyer dikunci di smart contract hingga buyer mengonfirmasi penerimaan barang/jasa. Jika terjadi sengketa, arbiter berwenang memutuskan alokasi dana.

Contract mengimplementasikan **state machine** dengan 4 state:

```
AWAITING_DELIVERY → COMPLETE   (buyer release)
AWAITING_DELIVERY → DISPUTED   (buyer dispute)
AWAITING_DELIVERY → REFUNDED   (timeout / arbiter ruled buyer wins)
DISPUTED          → COMPLETE   (arbiter ruled seller wins)
DISPUTED          → REFUNDED   (arbiter ruled buyer wins)
```

## Anggota Kelompok

| Nama | NRP | Kontribusi |
|------|-----|------------|
| Danar Bagus Rasendriya | 5027231055 | Smart Contract, Frontend, Integrasi Web3 |
| Diandra Naufal Abror | 5027231004 | Frontend UI/UX, Dokumentasi |
| Tio Axellino Irin | 5027231065 | Integrasi Web3, Testing |

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Smart Contract:** Solidity ^0.8.20 + Hardhat ^2.22.0
- **Web3 Library:** ethers.js v6
- **Wallet:** MetaMask
- **Styling:** Dark Minimalism + Glassmorphism (Obsidian theme)

## Fitur

### Smart Contract (Project 2)

- ✅ Buyer deposit dana — buyer mengirim ETH ke contract saat memulai transaksi
- ✅ Buyer release dana — buyer mengonfirmasi penerimaan dan merilis dana ke seller
- ✅ Buyer raise dispute — buyer mengajukan sengketa jika tidak puas
- ✅ Refund mechanism — dana dikembalikan ke buyer jika sengketa dimenangkan buyer
- ✅ Arbiter untuk dispute — pihak ketiga netral menyelesaikan sengketa dengan arbiter fee
- ✅ Timeout auto-refund — buyer bisa request refund otomatis setelah deadline

### Frontend dApp (Project 3)

- [x] Connect Wallet — deteksi MetaMask, request koneksi, tampilkan address
- [x] Network Detection — deteksi chain ID, warning jika salah network, tombol switch
- [x] Account Display — tampilkan address + role badge (Buyer/Seller/Arbiter/Viewer)
- [x] Read: Escrow Details — buyer, seller, arbiter, amount, deadline, state, arbiter fee
- [x] Read: Contract Balance — saldo ETH yang terkunci di escrow
- [x] Read: Expiry Check — cek apakah deadline sudah terlewati
- [x] Write: Deposit — buyer deposit ETH via MetaMask
- [x] Write: Release Funds — buyer release dana ke seller
- [x] Write: Raise Dispute — buyer ajukan sengketa
- [x] Write: Refund After Timeout — buyer refund setelah deadline
- [x] Write: Resolve Dispute — arbiter menyelesaikan sengketa
- [x] Transaction Feedback — status pending/success/failed dengan toast
- [x] Error Handling — pesan error user-friendly dalam Bahasa Indonesia
- [x] Responsive Design — desktop 2-kolom, mobile 1-kolom
- [x] Role-based Actions — tombol aksi muncul sesuai role + state

## Struktur Project

```
Escrow-dApp/
├── contracts/
│   └── SimpleEscrow.sol              # Smart contract utama (266 baris)
├── test/
│   └── SimpleEscrow.test.js          # Unit tests (40 test, 8 grup)
├── scripts/
│   ├── deploy.js                     # Deployment script
│   └── interact.js                   # Demo interaction script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConnectWallet.jsx     # Wallet connection + role badge
│   │   │   ├── EscrowOverview.jsx    # Hero card: amount, status, countdown
│   │   │   ├── ActionPanel.jsx       # Tombol aksi kontekstual role+state
│   │   │   ├── NetworkStatusCard.jsx # Sidebar: network detection
│   │   │   ├── EscrowDetailsCard.jsx # Sidebar: details + copy address
│   │   │   ├── SecurityProtocolCard.jsx # Sidebar: info keamanan
│   │   │   └── TransactionToast.jsx  # Toast feedback transaksi
│   │   ├── hooks/
│   │   │   ├── useWallet.js          # Wallet connection, network, events
│   │   │   └── useContract.js        # Contract read/write operations
│   │   ├── utils/
│   │   │   ├── contract.js           # CONTRACT_ADDRESS, CONTRACT_ABI
│   │   │   ├── helpers.js            # formatAddress, formatETH, formatDeadline
│   │   │   └── errors.js             # Mapping error → pesan user-friendly
│   │   ├── styles/
│   │   │   └── index.css             # Tailwind + custom glassmorphism
│   │   ├── App.jsx                   # Root component + layout
│   │   └── main.jsx                  # Entry point
│   ├── index.html
│   ├── tailwind.config.js
│   ├── package.json
│   └── vite.config.js
├── hardhat.config.js
├── package.json
└── README.md
```

## Cara Menjalankan

### Prerequisites

- Node.js v18+
- npm
- MetaMask browser extension
- Git

### 1. Clone & Install Root (Smart Contract)

```bash
git clone <url-repo>
cd Escrow-dApp
npm install
```

### 2. Compile Smart Contract

```bash
npx hardhat compile
```

### 3. Test Smart Contract

```bash
npx hardhat test
```

### 4. Jalankan Local Blockchain

Terminal 1 — jalankan Hardhat node (biarkan berjalan):

```bash
npx hardhat node
```

Catat: Hardhat node akan menampilkan 20 akun + private key. Simpan minimal 3 akun pertama untuk buyer (Account #0), seller (Account #1), dan arbiter (Account #2).

### 5. Deploy Smart Contract ke Localhost

Terminal 2 — deploy contract:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Copy **Contract Address** dari output deploy.

### 6. Update Contract Address di Frontend

Buka file `frontend/src/utils/contract.js` dan ganti `CONTRACT_ADDRESS` dengan address hasil deploy:

```javascript
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // contoh
```

### 7. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 8. Import Akun ke MetaMask

1. Buka MetaMask → klik dropdown network → **Add a network manually**
2. Isi:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
3. Import 3 akun menggunakan private key dari output `npx hardhat node`:
   - Account #0 → Buyer
   - Account #1 → Seller
   - Account #2 → Arbiter

### 9. Jalankan Frontend

```bash
# Di folder frontend/
npm run dev
```

Buka browser: **http://localhost:5173**

### 10. Interaksi dengan dApp

1. Connect wallet dari Account #0 (Buyer) → akan tampil role badge "Buyer"
2. Tombol "Deposit Funds" muncul → masukkan jumlah ETH dan submit
3. Setelah deposit sukses, tombol "Release Funds", "Raise Dispute", "Refund" muncul
4. Switch ke Account #1 (Seller) → hanya bisa melihat status (read-only)
5. Switch ke Account #2 (Arbiter) → tombol resolve muncul saat state DISPUTED
6. Semua status transaksi ditampilkan via toast di bagian bawah layar

## Contract Address

| Network | Chain ID | Address |
|---------|----------|---------|
| Hardhat Localhost | 31337 | `<isi setelah deploy>` |
| Sepolia Testnet (bonus) | 11155111 | `<isi jika deploy ke testnet>` |

## Spesifikasi Contract

| Komponen | Detail |
|---|---|
| State Variables | `buyer`, `seller`, `arbiter`, `depositAmount`, `currentState`, `deadline`, `arbiterFeePercent` |
| Functions | `deposit()`, `releaseFunds()`, `raiseDispute()`, `refundAfterTimeout()`, `resolveDispute()`, `getBalance()`, `isExpired()`, `getEscrowDetails()` |
| Modifiers | `onlyBuyer`, `onlyArbiter`, `inState` |
| Events | `Deposited`, `FundsReleased`, `DisputeRaised`, `Refunded`, `DisputeResolved` |

## Design System

| Token | Value |
|---|---|
| Background | `#0A0A0A` (obsidian-bg) |
| Card | `#161616` (obsidian-card) |
| Surface | `#222222` (obsidian-surface) |
| Accent | `#E1FF4A` (obsidian-neon) |
| Accent Hover | `#cbe643` (obsidian-neon-hover) |
| Heading Font | Be Vietnam Pro |
| Monospace Font | JetBrains Mono |
| Border Radius | Organic (rounded-full, rounded-[2.5rem], rounded-[3rem]) |

## Screenshot

> Tambahkan screenshot berikut setelah demo:

| Screenshot | Keterangan |
|---|---|
| `wallet-not-connected.png` | State awal sebelum connect wallet |
| `wallet-connected.png` | Tampilan setelah connect (show address + role) |
| `escrow-overview.png` | Hero card dengan data on-chain |
| `deposit-pending.png` | Loading state saat transaksi deposit pending |
| `deposit-success.png` | Konfirmasi transaksi deposit berhasil |
| `metamask-popup.png` | Request signature/transaction di MetaMask |
| `release.png` | Transaksi release dana berhasil |
| `dispute-resolution.png` | Arbiter menyelesaikan sengketa |
| `wrong-network.png` | Warning banner saat network salah |
| `error-handling.png` | Contoh tampilan error handling |
| `mobile-view.png` | Tampilan mobile responsive |

## Bonus (Opsional)

- [ ] Event Listening (real-time UI update)
- [ ] Transaction History (query past events)
- [ ] Deploy ke Sepolia Testnet
- [ ] Frontend Hosting (Vercel/Netlify)
- [ ] Loading Skeleton

Maksimum bonus: +15 poin.
