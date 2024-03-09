import express from "express";

import { TOKEN_PROGRAM_ID, unpackAccount } from "@solana/spl-token";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { urlToHttpOptions } from "url";

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const WSS_ENDPOINT =
  "https://mainnet.helius-rpc.com/?api-key=";
const HTTP_ENDPOINT =
  "https://red-divine-flower.solana-mainnet.quiknode.pro/fix/";

const solanaConnection = new Connection(HTTP_ENDPOINT, {
  wsEndpoint: WSS_ENDPOINT,
});

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
    "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1" //Raydium Authority V4
  );

  const solanaConnection = new Connection(WSS_ENDPOINT, {
    wsEndpoint: WSS_ENDPOINT,
  });
  console.log("Connecting");

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

  //Listening for logs on the readyus addrr and looking for pool initialization txs
  solanaConnection.onLogs(
    publicKey,
    async ({ logs, err, signature }) => {
      if (err) return;

      if (logs && logs.some((log) => log.includes("initialize2"))) {
        console.log({ signature }, JSON.stringify(logs));
        //with the signature get the token created(seems not to be in the logs :/ ), and get more info about it (market cap, liq, holders)
        //Examples to follow: https://github.com/raydium-io/raydium-sdk-V1-demo/blob/master/src/subNewAmmPool.ts
        //https://github.com/rpcpool/yellowstone-grpc/blob/master/examples/typescript/src/client.ts
      }
    },
    "finalized"
  );
})();
