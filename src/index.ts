import express from 'express';

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, LAMPORTS_PER_SOL, } from "@solana/web3.js";


const sleep = (ms:number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const WSS_ENDPOINT = 'https://red-divine-flower.solana-mainnet.quiknode.pro/fix/';
const HTTP_ENDPOINT = 'https://red-divine-flower.solana-mainnet.quiknode.pro/fix/';
const solanaConnection = new Connection(HTTP_ENDPOINT,{wsEndpoint:WSS_ENDPOINT});


const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello, TypeScript with Express!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


(async () => {
    const publicKey = new PublicKey(
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
    );
    const solanaConnection = new Connection("https://red-divine-flower.solana-mainnet.quiknode.pro/f/", {
      wsEndpoint: "wss://red-divine-flower.solana-mainnet.quiknode.pro/f/",
    });
    solanaConnection.onAccountChange(
      publicKey,
      (updatedAccountInfo, context) =>
        console.log("Updated account info: ", updatedAccountInfo),
      "confirmed"
    );
  })();