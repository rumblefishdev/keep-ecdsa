const KeepRegistry = artifacts.require("KeepRegistry")

const KeepBonding = artifacts.require("KeepBonding")
const BondedECDSAKeep = artifacts.require("BondedECDSAKeep")
const BondedECDSAKeepFactory = artifacts.require("BondedECDSAKeepFactory")
const BondedECDSAKeepVendor = artifacts.require("BondedECDSAKeepVendor")
const BondedECDSAKeepVendorImplV1 = artifacts.require(
  "BondedECDSAKeepVendorImplV1"
)

const FullyBackedBonding = artifacts.require("FullyBackedBonding")
const FullyBackedECDSAKeep = artifacts.require("FullyBackedECDSAKeep")
const FullyBackedECDSAKeepFactory = artifacts.require(
  "FullyBackedECDSAKeepFactory"
)

const BondedSortitionPoolFactory = artifacts.require(
  "BondedSortitionPoolFactory"
)
const FullyBackedSortitionPoolFactory = artifacts.require(
  "FullyBackedSortitionPoolFactory"
)

const LPRewardsTBTCETH = artifacts.require("LPRewardsTBTCETH")
const LPRewardsKEEPETH = artifacts.require("LPRewardsKEEPETH")
const LPRewardsKEEPTBTC = artifacts.require("LPRewardsKEEPTBTC")
const TestToken = artifacts.require("./test/TestToken")
const ECDSARewards = artifacts.require("ECDSARewards")
const ECDSARewardsDistributor = artifacts.require("ECDSARewardsDistributor")

let initializationPeriod = 43200 // 12 hours in seconds

let {
  RandomBeaconAddress,
  TokenStakingAddress,
  TokenGrantAddress,
  RegistryAddress,
  KeepTokenAddress,
  BondTokenAddress,
} = require("./external-contracts")

module.exports = async function (deployer, network) {
  // Set the stake initialization period to 1 second for local development and testnet.
  if (
    network === "local" ||
    network === "ropsten" ||
    network === "keep_dev" ||
    network === "sov"
  ) {
    initializationPeriod = 1
  }

  
  if (process.env.TEST) {
    TokenStakingStub = artifacts.require("TokenStakingStub")

    TokenStakingAddress = (await TokenStakingStub.new()).address

    TokenGrantStub = artifacts.require("TokenGrantStub")
    TokenGrantAddress = (await TokenGrantStub.new()).address

    RandomBeaconStub = artifacts.require("RandomBeaconStub")
    RandomBeaconAddress = (await RandomBeaconStub.new()).address

    RegistryAddress = (await deployer.deploy(KeepRegistry)).address

    const ERC20Stub = artifacts.require("ERC20Stub")
    BondTokenAddress = (await deployer.deploy(ERC20Stub)).address
  }

  const BondERC20 = artifacts.require("BondERC20")
  await deployer.deploy(BondERC20)
  BondTokenAddress = (await BondERC20.deployed()).address


  // KEEP staking and ETH bonding
  await deployer.deploy(
    KeepBonding,
    RegistryAddress,
    TokenStakingAddress,
    TokenGrantAddress,
    BondTokenAddress
  )
  await deployer.deploy(BondedECDSAKeep)

  await deployer.deploy(
    BondedECDSAKeepFactory,
    BondedECDSAKeep.address,
    BondedSortitionPoolFactory.address,
    TokenStakingAddress,
    KeepBonding.address,
    RandomBeaconAddress,
    BondTokenAddress
  )


  const bondedECDSAKeepVendorImplV1 = await deployer.deploy(
    BondedECDSAKeepVendorImplV1
  )

  const implInitializeCallData = bondedECDSAKeepVendorImplV1.contract.methods
    .initialize(RegistryAddress, BondedECDSAKeepFactory.address)
    .encodeABI()

  await deployer.deploy(
    BondedECDSAKeepVendor,
    BondedECDSAKeepVendorImplV1.address,
    implInitializeCallData
  )

  // ETH bonding only
  await deployer.deploy(
    FullyBackedBonding,
    RegistryAddress,
    initializationPeriod,
    BondTokenAddress
  )

  await deployer.deploy(FullyBackedECDSAKeep)

  await deployer.deploy(
    FullyBackedECDSAKeepFactory,
    FullyBackedECDSAKeep.address,
    FullyBackedSortitionPoolFactory.address,
    FullyBackedBonding.address,
    RandomBeaconAddress,
    BondTokenAddress
  )

  // Liquidity Rewards
  const WrappedTokenKEEPETH = await deployer.deploy(TestToken)
  await deployer.deploy(
    LPRewardsKEEPETH,
    KeepTokenAddress,
    WrappedTokenKEEPETH.address
  )

  const WrappedTokenTBTCETH = await deployer.deploy(TestToken)
  await deployer.deploy(
    LPRewardsTBTCETH,
    KeepTokenAddress,
    WrappedTokenTBTCETH.address
  )

  const WrappedTokenKEEPTBTC = await deployer.deploy(TestToken)
  await deployer.deploy(
    LPRewardsKEEPTBTC,
    KeepTokenAddress,
    WrappedTokenKEEPTBTC.address
  )

  // ECDSA Rewards
  await deployer.deploy(
    ECDSARewards,
    KeepTokenAddress,
    BondedECDSAKeepFactory.address,
    TokenStakingAddress
  )

  await deployer.deploy(
    ECDSARewardsDistributor,
    KeepTokenAddress,
    TokenStakingAddress
  )
}
