"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({});
const axios_1 = __importDefault(require("axios"));
const web3_1 = __importDefault(require("web3"));
const provider = process.env.INFURA_ENDPOINT;
const abiEndpoint = process.env.ETHERSCAN_ABI_ENDPOINT;
const nftContract = process.env.BAYC_CONTRACT;
let startBlock = 12287507;
const web3Provider = new web3_1.default.providers.HttpProvider(provider);
const web3 = new web3_1.default(web3Provider);
async function getContractObj() {
    const response = await axios_1.default.get(abiEndpoint + nftContract);
    const rawAbi = response.data.result;
    const abi = JSON.parse(rawAbi);
    return new web3.eth.Contract(abi, nftContract);
}
async function getTxns(contract, range) {
    let eventList = [];
    let gotAllEvents = false;
    let blockRange = range;
    const currentBlock = await web3.eth.getBlockNumber();
    let iterations = 0;
    console.log('startblock ', startBlock);
    // console.log(contract)
    console.log('Getting past transactions...');
    while (!gotAllEvents) {
        console.log(`Getting txns from block ${startBlock} to ${startBlock + blockRange} - range=${blockRange}`);
        try {
            const chunk = await contract.getPastEvents('Transfer', {
                fromBlock: startBlock,
                toBlock: startBlock + blockRange,
            });
            eventList = [...eventList, ...chunk];
            if (iterations % 5 == 0 && iterations !== 0) {
                console.log(`Passed ${iterations} succesful iterations, increasing range to ${blockRange + 1000}`);
                blockRange += 1000;
            }
            if (startBlock > currentBlock) {
                gotAllEvents = true;
            }
            startBlock += blockRange;
            iterations++;
            console.log(eventList.length);
        }
        catch (error) {
            console.log(error.message);
            if (error.message !==
                'Returned error: query returned more than 10000 results') {
                console.log(error);
                process.exit();
            }
            else {
                console.log(`Query returned more than 10000 results, halving range to ${blockRange * 0.5}`);
                blockRange *= 0.5;
                iterations = 0;
            }
        }
    }
    console.log(`Got ${eventList.length} events`);
    console.log(`Current block ${currentBlock}`);
    console.log(`Last checked block ${startBlock}`);
    return eventList;
}
async function getCollectionTxns() {
    const contract = await getContractObj();
    const txns = await getTxns(contract, 10000);
    console.log(txns);
}
getCollectionTxns();
