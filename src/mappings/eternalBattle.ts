import { Address, BigInt, BigDecimal, log, ethereum } from '@graphprotocol/graph-ts';
import { addressId, transactionId } from '../utils/helpers';

import { ensureDelegate, ensureDelegateAction, ensureAccount, ensureAccountAction, ensureCore, ensureCoreAction } from '../utils/ensuresCore';
import { ensureEthemeral, ensureEthemeralAction, ensureMetadata, ensureScorecard } from '../utils/ensuresMerals';

import { bonusStats } from '../metadata/meralBonusStats';

import { getMintPrice, getMaxAvailableIndex, getEthemeralSupply } from '../utils/contractCallsCore';
import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE, CORE_ADDRESS, coreContract } from '../utils/constants';
import { OwnershipTransferred, StakeCanceled, StakeCreated, TokenRevived } from '../../generated/EternalBattle/EternalBattle';

import { Ethemeral, Core, Account, CoreAction, EthemeralAction, AccountAction } from '../../generated/schema';

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
	// - contract.atkDivMod(...)
	// - contract.calcBps(...)
	// - contract.defDivMod(...)
	// - contract.getChange(...)
	// - contract.getGamePair(...)
	// - contract.getStake(...)
	// - contract.onERC721Received(...)
	// - contract.reviverReward(...)
	// - contract.spdDivMod(...)
}

export function handleStakeCanceled(event: StakeCanceled): void {
	let token = ensureEthemeral(event, event.params.tokenId);
	let tokenScorecard = ensureScorecard(token.id);
	let tokenAction = ensureEthemeralAction(event, token.id);
	tokenAction.type = 'Unstaked';
	tokenAction.staked = false;

	if (event.params.win) {
		tokenScorecard.wins = tokenScorecard.wins.plus(ONE_BI);
		tokenScorecard.save();
	}

	let account = ensureAccount(event, token.owner);
	let accountAction = ensureAccountAction(event, account.id);
	accountAction.type = 'Unstaked';
	accountAction.ethemeral = token.id;

	tokenAction.save();
	accountAction.save();
}

export function handleStakeCreated(event: StakeCreated): void {
	let token = ensureEthemeral(event, event.params.tokenId);
	let tokenAction = ensureEthemeralAction(event, token.id);
	tokenAction.type = 'Staked';
	tokenAction.staked = true;
	tokenAction.priceFeed = event.params.priceFeedId;
	tokenAction.long = event.params.long;

	let tokenScorecard = ensureScorecard(token.id);
	tokenScorecard.battles = tokenScorecard.battles.plus(ONE_BI);

	let account = ensureAccount(event, token.owner);
	let accountAction = ensureAccountAction(event, account.id);
	accountAction.ethemeral = token.id;
	accountAction.type = 'Staked';

	tokenAction.save();
	tokenScorecard.save();
	accountAction.save();
}

export function handleTokenRevived(event: TokenRevived): void {
	let token = ensureEthemeral(event, event.params.tokenId);
	let tokenAction = ensureEthemeralAction(event, token.id);
	let tokenScorecard = ensureScorecard(token.id);
	tokenAction.staked = false;

	let tokenReviver = ensureEthemeral(event, event.params.reviver);
	let tokenReviverAction = ensureEthemeralAction(event, tokenReviver.id);
	let tokenReviverScorecard = ensureScorecard(tokenReviver.id);

	if (token.owner !== tokenReviver.owner) {
		let account = ensureAccount(event, token.owner);
		let accountAction = ensureAccountAction(event, account.id);
		accountAction.type = 'Revived';
		accountAction.ethemeral = token.id;
		accountAction.save();
	}

	let accountReviver = ensureAccount(event, tokenReviver.owner);
	let accountReviverAction = ensureAccountAction(event, accountReviver.id);
	accountReviverAction.ethemeral = tokenReviver.id;

	tokenAction.type = 'Revived';
	tokenReviverAction.type = 'Reviver';
	accountReviverAction.type = 'Reviver';
	tokenScorecard.revived = tokenScorecard.revived.plus(ONE_BI);
	tokenReviverScorecard.reviver = tokenReviverScorecard.reviver.plus(ONE_BI);

	tokenAction.save();
	tokenScorecard.save();
	tokenReviverAction.save();
	tokenReviverScorecard.save();
	accountReviverAction.save();
}
