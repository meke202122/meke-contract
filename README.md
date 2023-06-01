# Meke Protocol

## Usage

### Pre Requisites

Before running any command, make sure to install dependencies:

```sh
$ pnpm install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ pnpm compile
```

### Test

Run the Mocha tests:

```sh
$ pnpm test
```

### setup deploy env

refer to `.env.example`

### Deploy contract to network (requires Mnemonic and infura API key)

```
pnpm run deploy
```

### Validate a contract with etherscan (requires API key)

```
pnpm exec hardhat verify --network <network> <DEPLOYED_CONTRACT_ADDRESS> "Constructor argument 1"
```