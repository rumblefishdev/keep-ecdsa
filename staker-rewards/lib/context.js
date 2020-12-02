import Web3 from "web3"
import ProviderEngine from "web3-provider-engine"
import WebsocketSubprovider from "web3-provider-engine/subproviders/websocket.js"
import Subproviders from "@0x/subproviders"

import Cache from "./cache.js"
import { Contract, getDeploymentBlockNumber } from "./contract-helper.js"

import TokenStakingJson from "@keep-network/keep-core/artifacts/TokenStaking.json"
import KeepRandomBeaconOperatorJson from "@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json"
import BondedECDSAKeepFactoryJson from "@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json"
import BondedECDSAKeepJson from "@keep-network/keep-ecdsa/artifacts/BondedECDSAKeep.json"
import KeepBondingJson from "@keep-network/keep-ecdsa/artifacts/KeepBonding.json"
import TBTCSystemJson from "@keep-network/tbtc/artifacts/TBTCSystem.json"

export default class Context {
  constructor(cache, web3, contracts) {
    this.cache = cache
    this.web3 = web3
    this.contracts = contracts
  }

  static async initialize(ethUrl) {
    const web3 = await initWeb3(ethUrl)

    const TokenStaking = new Contract(TokenStakingJson, web3)

    const KeepRandomBeaconOperator = new Contract(
      KeepRandomBeaconOperatorJson,
      web3
    )

    const BondedECDSAKeepFactory = new Contract(
      BondedECDSAKeepFactoryJson,
      web3
    )

    const BondedECDSAKeep = new Contract(BondedECDSAKeepJson, web3)

    const KeepBonding = new Contract(KeepBondingJson, web3)

    const TBTCSystem = new Contract(TBTCSystemJson, web3)

    const factoryDeploymentBlock = await getDeploymentBlockNumber(
      BondedECDSAKeepFactoryJson,
      web3
    )

    const contracts = {
      TokenStaking: TokenStaking,
      KeepRandomBeaconOperator: KeepRandomBeaconOperator,
      BondedECDSAKeepFactory: BondedECDSAKeepFactory,
      BondedECDSAKeep: BondedECDSAKeep,
      KeepBonding: KeepBonding,
      TBTCSystem: TBTCSystem,
      factoryDeploymentBlock: factoryDeploymentBlock,
    }

    const cache = new Cache(web3, contracts)
    await cache.initialize()

    return new Context(cache, web3, contracts)
  }
}

async function initWeb3(url) {
  const engine = new ProviderEngine({ pollingInterval: 1000 })

  // MnemonicWalletSubprovider requires us to provide a valid mnemonic.
  // Since we are just reading, we provide a dummy mnemonic that has
  // no ether on it.
  const dummyMnemonic =
    "6892a90dab700bab8cee21cef939461f41f48b91c271120aa8b10cd3d9dd86dc"

  engine.addProvider(
    new Subproviders.MnemonicWalletSubprovider({ mnemonic: dummyMnemonic })
  )

  engine.addProvider(new WebsocketSubprovider({ rpcUrl: url }))

  const web3 = new Web3(engine)

  engine.start()

  // set the default account to the first account from the wallet
  web3.eth.defaultAccount = (await web3.eth.getAccounts())[0]

  return web3
}
