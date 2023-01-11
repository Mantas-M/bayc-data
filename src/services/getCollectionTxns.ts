import dotenv from 'dotenv'
dotenv.config({})
import axios from 'axios'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import { Contract, EventData } from 'web3-eth-contract'

const provider = process.env.INFURA_ENDPOINT
const abiEndpoint = process.env.ETHERSCAN_ABI_ENDPOINT
const nftContract = process.env.BAYC_CONTRACT
let startBlock = 12287507

const web3Provider = new Web3.providers.HttpProvider(provider as string)
const web3 = new Web3(web3Provider)

async function getContractObj() {
  const response = await axios.get(
    (abiEndpoint as string) + (nftContract as string)
  )
  const rawAbi: string = response.data.result
  const abi: AbiItem = JSON.parse(rawAbi)

  return new web3.eth.Contract(abi, nftContract)
}

async function getTxns(contract: Contract, range: number) {
  let eventList: EventData[] = []
  let gotAllEvents = false
  let blockRange = range
  const currentBlock = await web3.eth.getBlockNumber()
  let iterations = 0

  console.log('startblock ', startBlock)
  // console.log(contract)
  console.log('Getting past transactions...')
  while (!gotAllEvents) {
    console.log(
      `Getting txns from block ${startBlock} to ${
        startBlock + blockRange
      } - range=${blockRange}`
    )
    try {
      const chunk = await contract.getPastEvents('Transfer', {
        fromBlock: startBlock,
        toBlock: startBlock + blockRange,
      })

      eventList = [...eventList, ...chunk]
      if (iterations % 5 == 0 && iterations !== 0) {
        console.log(
          `Passed ${iterations} succesful iterations, increasing range to ${
            blockRange + 1000
          }`
        )
        blockRange += 1000
      }
      if (startBlock > currentBlock) {
        gotAllEvents = true
      }
      startBlock += blockRange
      iterations++
      console.log(eventList.length)
    } catch (error) {
      console.log((error as Error).message)
      if (
        (error as Error).message !==
        'Returned error: query returned more than 10000 results'
      ) {
        console.log(error)
        process.exit()
      } else {
        console.log(
          `Query returned more than 10000 results, halving range to ${
            blockRange * 0.5
          }`
        )
        blockRange *= 0.5
        iterations = 0
      }
    }
  }
  console.log(`Got ${eventList.length} events`)
  console.log(`Current block ${currentBlock}`)
  console.log(`Last checked block ${startBlock}`)

  return eventList
}

async function getCollectionTxns() {
  const contract = await getContractObj()
  const txns = await getTxns(contract, 10000)
  console.log(txns)
}

getCollectionTxns()
