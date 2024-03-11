import "dotenv/config";
import express from "express";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  LiquidityPoolKeysV4,
  MARKET_STATE_LAYOUT_V3,
  Market,
} from "@raydium-io/raydium-sdk";
import { Client, Token } from "@solflare-wallet/utl-sdk";

const WSS_ENDPOINT = process.env.PRIVATE_SOLANA_QUICKNODE;

const PRIVATE_SOLANA_QUICKNODE_HTTPS =
  process.env.PRIVATE_SOLANA_QUICKNODE_HTTPS;

const RAYDIUM_PUBLIC_KEY = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"; // "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1" Raydium Authority V4

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello, TypeScript with Express!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

function generateExplorerUrl(txId) {
  return `https://solscan.io/tx/${txId}?cluster=mainnet`;
}

function generateDEXExplorerUrl(address) {
  return `https://dexscreener.com/solana/${address}`;
}

const utl = new Client();

const getAccount = async (address: string, connection) => {
  const publicKey = new PublicKey(address);
  const accountInfo = await connection.getAccountInfo(publicKey);
  // return accountInfo?.data;
  if (accountInfo && accountInfo.data) {
    return MARKET_STATE_LAYOUT_V3.decode(accountInfo.data);
  }
};

async function fetchRaydiumAccounts(signature, connection /* : Connection */) {
  const txId = signature;
  const tx = await connection.getParsedTransaction(txId, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  const accounts = tx?.transaction?.message?.instructions.find(
    (ix) => ix.programId.toBase58() === RAYDIUM_PUBLIC_KEY
  ).accounts;

  if (!accounts) {
    console.log("No accounts found");
    return;
  }
  const tokenAIndex = 8;
  const tokenBIndex = 9;

  const tokeAAccount = accounts[tokenAIndex] as PublicKey;
  const tokenBAccount = accounts[tokenBIndex] as PublicKey;
  /* 
  const displayData = [
    { Token: "Token A", account: tokeAAccount },
    { Token: "Token B", account: tokenBAccount },
  ];
  console.table(displayData); */
  console.log("New Raydium  Liquidity Pool Created Found");
  console.log(generateExplorerUrl(txId));
  const tokenAddress =
    tokeAAccount.toString() === "So11111111111111111111111111111111111111112"
      ? tokenBAccount.toString()
      : tokeAAccount.toString();
  console.log(generateDEXExplorerUrl(tokenAddress));
  return tokenAddress;
}

(async () => {
  const publicKey = new PublicKey(
    RAYDIUM_PUBLIC_KEY //Raydium Authority V4
  );

  const solanaConnection = new Connection(PRIVATE_SOLANA_QUICKNODE_HTTPS, {
    wsEndpoint: WSS_ENDPOINT,
  });
  console.log("Connecting to: ", WSS_ENDPOINT);

  /* solanaConnection.onAccountChange(
    publicKey,
    async (updatedAccountInfo, context) => {
      console.log("Updated account info: ", updatedAccountInfo);
      const accountInfo = await solanaConnection.getParsedAccountInfo(
        publicKey
      );
      console.log("accountInfo: " + JSON.stringify(accountInfo));

      try {
        var parsedAccount = unpackAccount(
          publicKey,
          updatedAccountInfo,
          TOKEN_PROGRAM_ID
        );
        console.log("ParsedTokenAccount: " + JSON.stringify(parsedAccount));
      } catch (error) {
        console.log({ error });
      }
    },
    "confirmed"
  ); */

  solanaConnection.onLogs(
    publicKey,
    async ({ logs, err, signature }) => {
      if (err) return;

      if (logs && logs.some((log) => log.includes("initialize2"))) {
        console.log({ signature }, new Date().toLocaleTimeString());
        const mainTokenAddr = await fetchRaydiumAccounts(
          signature,
          solanaConnection
        );

        if (mainTokenAddr) {
          const token: Token = await utl.fetchMint(
            new PublicKey(mainTokenAddr)
          );
          console.log({ token });
        } else console.error("No mainTokenAdrr", mainTokenAddr);
      }
    },
    "confirmed"
  );
})();

/* const metaplex = Metaplex.make(solanaConnection);
  const metadataPda = metaplex
    .nfts()
    .pdas()
    .metadata({
      mint: new PublicKey("D4sugsn1dmBG9UsV5BggnGHJqSM5mtepqC564Cqm5UmV"),
    });
  console.log({ metadataPda });
  const account = Metadata.fromAccountAddress(solanaConnection, metadataPda);
  console.log({ account });
 */
/* 
  let mint = await solanaConnection.getParsedAccountInfo(
    new PublicKey("GQqcCLRTSW3ozcypNpzHC5hcqCB2wronA9X8wDKg131q")
  );

  // all the token data is here
  console.log(mint.value.data);
  
  */

//https://api.solscan.io/v2/token/meta?token=EWcvmPdo7jy8zQyDjfHxaCZPzBGoTUc8FXPHhi38NPV5&cluster=
//Examples to follow: https://github.com/raydium-io/raydium-sdk-V1-demo/blob/master/src/subNewAmmPool.ts
//https://github.com/rpcpool/yellowstone-grpc/blob/master/examples/typescript/src/client.ts
