
const SortitionPoolsDeployer = require("@keep-network/sortition-pools/migrations/scripts/deployContracts")

module.exports = async function (deployer, network) {
  // Set the stake initialization period to 1 second for local development and testnet.
  const sortitionPoolsDeployer = new SortitionPoolsDeployer(deployer, artifacts)
  await sortitionPoolsDeployer.deployBondedSortitionPoolFactory()
  await sortitionPoolsDeployer.deployFullyBackedSortitionPoolFactory()

}
