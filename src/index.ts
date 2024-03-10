import "dotenv/config";
import express from "express";
import { TOKEN_PROGRAM_ID, unpackAccount } from "@solana/spl-token";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { urlToHttpOptions } from "url";
import {
  LiquidityPoolKeysV4,
  MARKET_STATE_LAYOUT_V3,
  Market,
} from "@raydium-io/raydium-sdk";

const WSS_ENDPOINT = process.env.PRIVATE_SOLANA_QUICKNODE;

const HTTP_ENDPOINT =
  "https://red-divine-flower.solana-mainnet.quiknode.pro/fix/";

const RAYDIUM_PUBLIC_KEY = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"; // "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1" Raydium Authority V4

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello, TypeScript with Express!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

(async () => {
  const publicKey = new PublicKey(
    RAYDIUM_PUBLIC_KEY //Raydium Authority V4
  );

  const solanaConnection = new Connection(WSS_ENDPOINT, {
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
  function generateExplorerUrl(txId) {
    return `https://solscan.io/tx/${txId}?cluster=mainnet`;
  }

  const getAccount = async (address: string, connection) => {
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(publicKey);
    // return accountInfo?.data;
    if (accountInfo && accountInfo.data) {
      return MARKET_STATE_LAYOUT_V3.decode(accountInfo.data);
    }
  };

  async function fetchRaydiumAccounts(signature, connection) {
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

    const tokeAAccount = accounts[tokenAIndex];
    const tokenBAccount = accounts[tokenBIndex];
    const displayData = [
      { Token: "Token A", account: tokeAAccount },
      { Token: "Token B", account: tokenBAccount },
    ];
    console.log("New Raydium  Liquidity Pool Created Found");
    console.log(generateExplorerUrl(txId));
    console.table(displayData);
    //console.log(await getAccount(tokeAAccount, connection));
    // await sleep(2000);
  }

  //Listening for logs on the readyus addrr and looking for pool initialization txs
  solanaConnection.onLogs(
    publicKey,
    async ({ logs, err, signature }) => {
      if (err) return;

      if (logs && logs.some((log) => log.includes("initialize2"))) {
        console.log({ signature });
        fetchRaydiumAccounts(signature, solanaConnection);
        //with the signature get the token created(seems not to be in the logs :/ ), and get more info about it (market cap, liq, holders)
        //Examples to follow: https://github.com/raydium-io/raydium-sdk-V1-demo/blob/master/src/subNewAmmPool.ts
        //https://github.com/rpcpool/yellowstone-grpc/blob/master/examples/typescript/src/client.ts
      }
    },
    "finalized"
  );
})();
