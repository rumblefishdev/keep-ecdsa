// Package client defines ECDSA keep client.
package client

import (
	"github.com/ethereum/go-ethereum/common"
	"github.com/ipfs/go-log"

	"github.com/keep-network/keep-common/pkg/persistence"
	"github.com/keep-network/keep-tecdsa/pkg/chain/eth"
	"github.com/keep-network/keep-tecdsa/pkg/ecdsa"
	"github.com/keep-network/keep-tecdsa/pkg/registry"
	"github.com/keep-network/keep-tecdsa/pkg/tecdsa"
)

var logger = log.Logger("keep-tecdsa")

// Initialize initializes the tECDSA client with rules related to events handling.
// Expects a slice of sanctioned applications selected by the operator for which
// operator will be registered as a member candidate.
func Initialize(
	ethereumChain eth.Handle,
	persistence persistence.Handle,
	sanctionedApplications []common.Address,
) {
	keepsRegistry := registry.NewKeepsRegistry(persistence)

	tecdsa := &tecdsa.TECDSA{
		EthereumChain: ethereumChain,
	}

	// Load current keeps' signers from storage and register for signing events.
	keepsRegistry.LoadExistingKeeps()

	keepsRegistry.ForEachKeep(
		func(keepAddress common.Address, signer *ecdsa.Signer) {
			tecdsa.RegisterForSignEvents(keepAddress, signer)
			logger.Debugf(
				"signer registered for events from keep: [%s]",
				keepAddress.String(),
			)
		},
	)

	// Watch for new keeps creation.
	ethereumChain.OnECDSAKeepCreated(func(event *eth.ECDSAKeepCreatedEvent) {
		logger.Infof(
			"new keep [%s] created with members: [%x]\n",
			event.KeepAddress.String(),
			event.Members,
		)

		if event.IsMember(ethereumChain.Address()) {
			go func(keepAddress common.Address) {
				signer, err := tecdsa.GenerateSignerForKeep(event.KeepAddress)
				if err != nil {
					logger.Errorf("signer generation failed: [%v]", err)
					return
				}

				logger.Infof("initialized signer for keep [%s]", keepAddress.String())

				// Store the signer in a map, with the keep address as a key.
				keepsRegistry.RegisterSigner(keepAddress, signer)

				tecdsa.RegisterForSignEvents(keepAddress, signer)
			}(event.KeepAddress)
		}
	})

	// Register client as a candidate member for keep.
	for _, application := range sanctionedApplications {
		// TODO: Validate if client is already registered and can be registered.
		// If can register but it is not registered, it is registering. If can't
		// be registered yet (stake maturation period), waits some time and tries again
		if err := ethereumChain.RegisterAsMemberCandidate(application); err != nil {
			logger.Errorf(
				"failed to register member for application [%s]: [%v]",
				application.String(),
				err,
			)
		}
		logger.Debugf(
			"client registered as member candidate for application: [%s]",
			application.String(),
		)
	}

	logger.Infof("client initialized")
}