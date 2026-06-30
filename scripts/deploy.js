const { SorobanRpc, TransactionBuilder, Networks, BASE_FEE, Keypair, Operation, hash, xdr, nativeToScVal } = require('@stellar/stellar-sdk');
const fs = require('fs');
const path = require('path');

const RPC_URL = process.env.RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

async function deploy() {
  const secretKey = process.env.STELLAR_SECRET_KEY;
  if (!secretKey) {
    console.error('Please set STELLAR_SECRET_KEY environment variable');
    process.exit(1);
  }

  const wasmPath = process.argv[2] || path.join(__dirname, '..', 'contracts', 'poll', 'target', 'wasm32-unknown-unknown', 'release', 'stellar_poll.wasm');
  if (!fs.existsSync(wasmPath)) {
    console.error(`WASM file not found at: ${wasmPath}`);
    console.error('Build the contract first:');
    console.error('  cd contracts/poll');
    console.error('  soroban contract build');
    process.exit(1);
  }

  const kp = Keypair.fromSecret(secretKey);
  const server = new SorobanRpc.Server(RPC_URL);
  const publicKey = kp.publicKey();

  console.log(`Deploying contract...`);
  console.log(`Network: Testnet`);
  console.log(`Deployer: ${publicKey}`);
  console.log(`RPC: ${RPC_URL}`);
  console.log();

  // Get account
  const account = await server.getAccount(publicKey);

  // Read WASM
  const wasm = fs.readFileSync(wasmPath);

  // Step 1: Upload WASM
  console.log('1. Uploading WASM...');
  const uploadTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.uploadContractWasm({ wasm }))
    .setTimeout(30)
    .build();

  const uploadPrep = await server.prepareTransaction(uploadTx);
  uploadPrep.sign(kp);
  const uploadResult = await server.sendTransaction(uploadPrep);
  console.log(`   Upload tx hash: ${uploadResult.hash}`);

  if (uploadResult.status === 'PENDING') {
    let status = await server.getTransaction(uploadResult.hash);
    while (status.status === 'NOT_FOUND') {
      await new Promise(r => setTimeout(r, 1000));
      status = await server.getTransaction(uploadResult.hash);
    }
    if (status.status !== 'SUCCESS') {
      throw new Error(`Upload failed: ${JSON.stringify(status)}`);
    }
    console.log('   Upload successful!');
  }

  // Get WASM hash
  const wasmId = hash(wasm).toString('hex');
  console.log(`   WASM hash: ${wasmId}`);

  // Step 2: Deploy contract
  console.log('\n2. Deploying contract...');
  const deployTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.createCustomContract({
      wasmId,
      address: xdr.ScAddress.scAddressTypeContract(
        xdr.Hash.fromXDR(hash(Buffer.from(publicKey + '-poll')), xdr.Hash)
      ),
    }))
    .setTimeout(30)
    .build();

  const deployPrep = await server.prepareTransaction(deployTx);
  deployPrep.sign(kp);
  const deployResult = await server.sendTransaction(deployPrep);
  console.log(`   Deploy tx hash: ${deployResult.hash}`);

  if (deployResult.status === 'PENDING') {
    let status = await server.getTransaction(deployResult.hash);
    while (status.status === 'NOT_FOUND') {
      await new Promise(r => setTimeout(r, 1000));
      status = await server.getTransaction(deployResult.hash);
    }
    if (status.status !== 'SUCCESS') {
      throw new Error(`Deploy failed: ${JSON.stringify(status)}`);
    }
    console.log('   Deploy successful!');
  }

  console.log('\n✅ Contract deployed!');
  console.log(`Contract ID: ${wasmId}`);
}

deploy().catch(console.error);
