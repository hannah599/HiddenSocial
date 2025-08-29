# ⚡ Hidden Social

**Anonymous Social Payment Platform with Fully Homomorphic Encryption (FHE)**

Hidden Social is a revolutionary decentralized social payment platform that enables anonymous ETH transactions through X (Twitter) accounts using Zama's Fully Homomorphic Encryption (FHE) technology. Users can bind their X accounts to encrypted Ethereum addresses, send ETH to X accounts without revealing recipient identities, and withdraw funds securely through FHE decryption.

## 🌟 Overview

Hidden Social transforms social media into a privacy-first financial platform by:

- **Anonymous Payments**: Send ETH to any X account without revealing the recipient's real wallet address
- **Encrypted Storage**: All wallet addresses are encrypted using FHE and stored on-chain
- **Zero Knowledge**: Only the account owner can decrypt and access their bound address
- **Social Integration**: Seamlessly integrates with X (Twitter) for user-friendly social payments
- **Privacy First**: Complete transaction privacy with mathematical guarantees from FHE

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Smart Contract  │    │   FHE Network   │
│   (React App)   │◄──►│  (HiddenSocial)  │◄──►│  (Zama/Sepolia) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
    ┌────▼────┐              ┌────▼────┐              ┌────▼────┐
    │ X Account│              │Encrypted │              │ FHE KMS │
    │   IDs    │              │Addresses │              │ Service │
    └─────────┘              └─────────┘              └─────────┘
```

## 🚀 Core Features

### 🔗 Account Binding
- **Secure Binding**: Link your X account to any Ethereum address
- **FHE Encryption**: The bound address is encrypted using Zama's FHE technology
- **Privacy Protection**: Only you can decrypt and access your bound address
- **Flexible Binding**: Bind to any address you control, not just your connected wallet

### 💸 Anonymous Payments
- **Social Sending**: Send ETH directly to X account IDs (e.g., @username)
- **Recipient Privacy**: Recipients' real addresses remain completely hidden
- **Public Transactions**: Payment amounts are visible, but destinations are encrypted
- **Instant Processing**: Payments are processed immediately on-chain

### 💰 Secure Withdrawals
- **FHE Decryption**: Withdrawals use secure FHE decryption to reveal bound addresses
- **Owner-Only Access**: Only the account owner can withdraw their funds
- **Complete Extraction**: Withdraw all accumulated balance from your X account
- **Direct Transfer**: Funds are sent directly to your decrypted bound address

### 🛡️ Privacy & Security
- **End-to-End Encryption**: All sensitive data encrypted with FHE
- **Zero Knowledge Proofs**: Cryptographic guarantees without revealing secrets
- **Decentralized Storage**: All data stored on blockchain, no central servers
- **Audit Trail**: Complete transparency while maintaining privacy

## 🛠️ Technology Stack

### Blockchain & Smart Contracts
- **Zama FHEVM**: Fully Homomorphic Encryption Virtual Machine
- **Solidity**: Smart contract development language
- **Hardhat**: Development framework and testing environment
- **Sepolia Testnet**: Ethereum test network with FHE support

### Frontend Application
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **Viem**: Type-safe Ethereum library for web applications
- **RainbowKit**: Wallet connection and management
- **Wagmi**: React hooks for Ethereum

### FHE Integration
- **@zama-fhe/relayer-sdk**: Client-side FHE operations
- **Zama Relayer**: Gateway for FHE network communication
- **KMS Service**: Key management for FHE operations
- **Input Verification**: Cryptographic proof generation

## 📁 Project Structure

```
HiddenSocial/
├── contracts/                 # Smart contract source files
│   ├── HiddenSocial.sol      # Main contract implementation
│   └── interfaces/           # Contract interfaces
├── deploy/                   # Deployment scripts
│   └── 01-deploy-hidden-social.ts
├── tasks/                    # Hardhat custom tasks
├── test/                     # Contract test files
├── app/                      # Frontend React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── BindXAccount.tsx    # Account binding interface
│   │   │   ├── SendToXAccount.tsx  # Payment sending interface
│   │   │   ├── WithdrawETH.tsx     # Withdrawal interface
│   │   │   └── WalletConnect.tsx   # Wallet connection
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── useFHEVM.ts   # FHE integration hook
│   │   ├── utils/            # Utility functions
│   │   │   ├── fhe.ts        # FHE helper functions
│   │   │   └── web3.ts       # Web3 configuration
│   │   ├── contracts/        # Contract configuration
│   │   └── App.tsx           # Main application component
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
├── docs/                     # Documentation
│   ├── zama_llm.md          # FHE development guide
│   └── zama_doc_relayer.md  # Relayer SDK documentation
├── hardhat.config.ts         # Hardhat configuration
├── CLAUDE.md                 # Project instructions and context
└── package.json              # Project dependencies
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm/yarn/pnpm**: Package manager
- **Git**: Version control
- **Metamask**: Or any Web3 wallet
- **Sepolia ETH**: For testnet transactions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/HiddenSocial.git
   cd HiddenSocial
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd app && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Set up Hardhat variables
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY
   
   # Create app environment file
   cd app
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Compile smart contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

### Deployment

#### Deploy to Sepolia Testnet

1. **Deploy the smart contract**
   ```bash
   npx hardhat deploy --network sepolia --tags HiddenSocial
   ```

2. **Verify the contract**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

3. **Update frontend configuration**
   ```bash
   # Update app/.env.local with deployed contract address
   VITE_CONTRACT_ADDRESS=<DEPLOYED_CONTRACT_ADDRESS>
   VITE_CHAIN_ID=11155111
   ```

#### Run the Frontend

1. **Start the development server**
   ```bash
   cd app
   npm run dev
   ```

2. **Access the application**
   - Open http://localhost:5173 in your browser
   - Connect your wallet (Metamask recommended)
   - Switch to Sepolia network
   - Start using Hidden Social!

## 📖 Usage Guide

### 1. Connect Your Wallet

- Click "Connect Wallet" in the header
- Select your preferred wallet (Metamask, WalletConnect, etc.)
- Ensure you're connected to Sepolia testnet
- Wait for FHE module initialization

### 2. Bind Your X Account

- Navigate to the "Bind Account" tab
- Enter your X account ID (e.g., @username)
- Enter the Ethereum address you want to bind (can be any address you control)
- Click "Bind X Account" and confirm the transaction
- Wait for transaction confirmation

### 3. Send ETH to X Accounts

- Navigate to the "Send Assets" tab
- Enter the target X account ID (e.g., @recipient)
- Enter the ETH amount to send
- Review the USD value estimate
- Click "Send ETH" and confirm the transaction

### 4. Withdraw Your Funds

- Navigate to the "Withdraw Assets" tab
- Enter your X account ID
- Click "Check Balance" to see your available funds
- Review the balance details (ETH, Wei, USD value)
- Click "Withdraw All Balance" to extract funds
- Confirm the withdrawal transaction

## 🔧 Smart Contract Details

### HiddenSocial.sol

The main smart contract implements the following key functions:

#### Core Functions

```solidity
// Bind X account to encrypted address
function bindXAccount(
    string calldata xAccountId,
    externalEaddress encryptedAddress,
    bytes calldata proof
) external

// Send ETH to X account
function sendToXAccount(
    string calldata xAccountId
) external payable

// Request withdrawal (triggers FHE decryption)
function requestWithdrawal(
    string calldata xAccountId
) external

// Get encrypted balance
function getBalance(
    string calldata xAccountId
) external view returns (euint256)
```

#### FHE Integration

- **Encrypted Storage**: Uses `eaddress` for storing encrypted Ethereum addresses
- **Access Control**: Implements FHE ACL for secure data access
- **Decryption Requests**: Async decryption pattern for withdrawals
- **Balance Tracking**: Encrypted balance management with `euint256`

### Contract Security

- **Owner Controls**: Only contract owner can withdraw contract ETH
- **Access Validation**: FHE ACL ensures only authorized access to encrypted data
- **Reentrancy Protection**: Standard security measures implemented
- **Input Validation**: Comprehensive input validation and error handling

## 🌐 Frontend Architecture

### React Application Structure

The frontend is built as a modern React single-page application with:

#### Key Components

- **App.tsx**: Main application layout and routing
- **BindXAccount.tsx**: X account binding interface
- **SendToXAccount.tsx**: Payment sending interface  
- **WithdrawETH.tsx**: Fund withdrawal interface
- **WalletConnect.tsx**: Web3 wallet integration

#### State Management

- **React Hooks**: useState, useEffect for local state
- **Wagmi Hooks**: Web3 integration and contract interactions
- **Custom Hooks**: useFHEVM for FHE system integration

#### Styling & UX

- **Modern Design**: Dark theme with neon accents
- **Responsive Layout**: Mobile-first responsive design
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: ARIA labels and keyboard navigation

### FHE Integration

#### Client-Side Operations

```typescript
// Initialize FHE instance
const instance = await createInstance(SepoliaConfig);

// Encrypt user input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.addAddress(targetAddress);
const encryptedInput = await input.encrypt();

// User decryption
const decrypted = await instance.userDecrypt(
  handleContractPairs,
  keypair.privateKey,
  keypair.publicKey,
  signature,
  contractAddresses,
  userAddress,
  timestamp,
  duration
);
```

## 🧪 Testing

### Smart Contract Tests

```bash
# Run all contract tests
npm run test

# Run specific test file
npx hardhat test test/HiddenSocial.test.js

# Run tests with coverage
npm run coverage

# Run tests on Sepolia
npx hardhat test --network sepolia
```

### Frontend Testing

```bash
cd app

# Run component tests
npm run test

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## 📊 Performance & Optimization

### Smart Contract Optimizations

- **Gas Efficiency**: Optimized for minimal gas consumption
- **Storage Layout**: Efficient storage packing
- **Batch Operations**: Support for batch transactions
- **Error Handling**: Comprehensive error messages

### Frontend Optimizations

- **Code Splitting**: Lazy loading of components
- **Asset Optimization**: Compressed images and fonts
- **Caching**: Intelligent caching strategies
- **Bundle Size**: Optimized build output

## 🔒 Security Considerations

### Smart Contract Security

- **Audit Ready**: Code structured for security audits
- **Best Practices**: Follows Solidity security guidelines
- **Access Controls**: Proper permission management
- **Input Validation**: Comprehensive input sanitization

### Privacy Protection

- **FHE Encryption**: Mathematical privacy guarantees
- **Zero Knowledge**: No sensitive data exposed
- **Decentralized**: No central points of failure
- **Audit Trail**: Transparent but private transactions

### Frontend Security

- **Input Sanitization**: XSS protection
- **Secure Communication**: HTTPS/WSS only
- **Wallet Security**: Never stores private keys
- **Type Safety**: TypeScript for runtime safety

## 🌍 Network Configuration

### Supported Networks

#### Sepolia Testnet (Primary)
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_API_KEY
- **FHE Support**: Full FHEVM integration
- **Testnet ETH**: Available from faucets

#### Local Development
- **Chain ID**: 31337
- **RPC URL**: http://localhost:8545
- **FHE Support**: Simulated FHE operations
- **Test ETH**: Unlimited for development

### Contract Addresses

```typescript
// Sepolia Testnet
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  contracts: {
    hiddenSocial: "0x...", // Deployed contract address
    fhevm: "0x848B0066793BcC60346Da1F49049357399B8D595",
    acl: "0x687820221192C5B662b25367F70076A37bc79b6c",
    kms: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC"
  }
};
```

## 🔄 Development Workflow

### Local Development Setup

1. **Start local blockchain**
   ```bash
   npx hardhat node
   ```

2. **Deploy contracts locally**
   ```bash
   npx hardhat deploy --network localhost
   ```

3. **Start frontend development server**
   ```bash
   cd app && npm run dev
   ```

4. **Run tests continuously**
   ```bash
   npm run test:watch
   ```

### Code Quality

```bash
# Lint smart contracts
npm run lint:contracts

# Lint frontend code  
cd app && npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: implement new feature"
git push origin feature/new-feature

# Create pull request
gh pr create --title "feat: implement new feature"
```

## 📚 API Reference

### Smart Contract Events

```solidity
// Account binding event
event XAccountBound(
    string indexed xAccountId,
    address indexed owner,
    eaddress encryptedAddress
);

// Payment sent event
event ETHSentToXAccount(
    string indexed xAccountId,
    address indexed sender,
    uint256 amount
);

// Withdrawal event
event WithdrawalRequested(
    string indexed xAccountId,
    address indexed owner,
    uint256 amount
);
```

### Frontend API

```typescript
// Hook for FHE operations
const { 
  initialized, 
  loading, 
  error,
  encrypt,
  decrypt 
} = useFHEVM();

// Contract interaction
const { writeContract } = useWriteContract();
const { data: balance } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: HIDDEN_SOCIAL_ABI,
  functionName: 'getBalance',
  args: [xAccountId]
});
```

## 🐛 Troubleshooting

### Common Issues

#### FHE Module Initialization Failed
```bash
# Check network connection
curl https://relayer.testnet.zama.cloud/health

# Clear browser cache
# Refresh the page
# Check console for detailed errors
```

#### Transaction Failed
```bash
# Check gas settings
# Verify contract address
# Ensure wallet has sufficient ETH
# Check network connectivity
```

#### Wallet Connection Issues
```bash
# Switch to Sepolia network
# Clear browser cache
# Try different wallet provider
# Check browser console for errors
```

### Debug Mode

```bash
# Enable contract debugging
HARDHAT_NETWORK=sepolia npx hardhat run scripts/debug.js

# Enable frontend debugging
cd app
DEBUG=* npm run dev
```

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow existing patterns and conventions
2. **Testing**: Add tests for all new features
3. **Documentation**: Update docs for any API changes
4. **Security**: Consider security implications of changes

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

### Issue Reporting

- **Bug Reports**: Use the bug report template
- **Feature Requests**: Use the feature request template
- **Security Issues**: Report privately to security@example.com

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama Team**: For the incredible FHE technology
- **Ethereum Foundation**: For the robust blockchain infrastructure
- **Open Source Community**: For the amazing tools and libraries

## 📞 Support & Community

### Getting Help

- **Documentation**: [Full documentation](https://docs.example.com)
- **GitHub Issues**: [Report bugs or request features](https://github.com/your-username/HiddenSocial/issues)
- **Discord**: [Join our community](https://discord.gg/hidden-social)
- **Twitter**: [@HiddenSocial](https://twitter.com/hidden-social)

### Community Resources

- **Developer Guide**: Comprehensive development tutorials
- **Video Tutorials**: Step-by-step video guides  
- **Community Forum**: Ask questions and share knowledge
- **Newsletter**: Stay updated with latest developments

---

**Built with ❤️ for privacy-first social payments**

*Empowering anonymous social transactions through the power of Fully Homomorphic Encryption*