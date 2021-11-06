import { Address, BigInt, BigDecimal, log, ethereum } from '@graphprotocol/graph-ts';
import { addressId, transactionId } from '../utils/helpers';

import { ensureDelegate, ensureDelegateAction, ensureAccount, ensureAccountAction, ensureCore, ensureCoreAction } from '../utils/ensuresCore';
import { ensureEthemeral, ensureEthemeralAction, ensureMetadata, ensureScorecard } from '../utils/ensuresMerals';

import { bonusStats } from '../metadata/meralBonusStats';

import { getMintPrice, getMaxAvailableIndex, getEthemeralSupply } from '../utils/contractCallsCore';
import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE, CORE_ADDRESS, coreContract } from '../utils/constants';
import { Approval, ApprovalForAll, OwnershipTransferred, DelegateChange, PriceChange, AllowDelegatesChange, Transfer, Mint, ChangeRewards, ChangeScore } from '../../generated/Ethemerals/Ethemerals';

import { Ethemeral, Core, Account, CoreAction, EthemeralAction, AccountAction } from '../../generated/schema';

export function handleApproval(event: Approval): void {
	// - contract.balanceOf(...)
	// - contract.discountMinTokens(...)
	// - contract.ethemeralSupply(...)
	// - contract.getApproved(...)
	// - contract.maxAvailableIndex(...)
	// - contract.maxEthemeralSupply(...)
	// - contract.mintPrice(...)
	// - contract.name(...)
	// - contract.ownerOf(...)
	// - contract.startingELF(...)
	// - contract.supportsInterface(...)
	// - contract.symbol(...)
	// - contract.tokenURI(...)
	// - contract.contractURI(...)
	// - contract.getEthemeral(...)
	// - contract.isApprovedForAll(...)
}

export function handleApprovalForAll(event: ApprovalForAll): void {}

export function handleAllowDelegatesChange(event: AllowDelegatesChange): void {
	let account = ensureAccount(event, addressId(event.params.user));
	let accountActions = ensureAccountAction(event, account.id);
	accountActions.type = 'DelegateChange';
	account.allowDelegates = event.params.allow;
	account.save();
}

export function handleDelegateChange(event: DelegateChange): void {
	let delegate = ensureDelegate(event, addressId(event.params.delegate));
	let delegateAction = ensureDelegateAction(event, delegate.id);
	delegateAction.type = 'DelegateChange';
	delegate.active = event.params.add;
	delegateAction.save();
	delegate.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
	let core = ensureCore(event);
	let action = ensureCoreAction(event);
	let account = ensureAccount(event, addressId(event.params.newOwner));
	action.type = 'OwnershipTransferred';
	core.owner = Address.fromString(account.id);
	action.save();
	core.save();
}

export function handlePriceChange(event: PriceChange): void {
	let core = Core.load(CORE_ADDRESS);
	let action = ensureCoreAction(event);
	if (core) {
		core.mintPrice = event.params.price;
		action.save();
		core.save();
	}
}

export function handleTransfer(event: Transfer): void {
	// SKIP ZERO INDEX
	if (event.params.tokenId < ONE_BI) {
		return;
	}
	let token = ensureEthemeral(event, event.params.tokenId);
	// TOKEN ACTIONS
	let tokenAction = ensureEthemeralAction(event, token.id);
	tokenAction.type = 'Transfer';
	// NORMAL TRANSFER TO
	let accountTo = ensureAccount(event, addressId(event.params.to));
	let accountToAction = ensureAccountAction(event, accountTo.id);
	accountToAction.type = 'Receive';
	accountToAction.ethemeral = token.id;
	// NORMAL TRANSFER FROM
	let accountFrom = ensureAccount(event, addressId(event.params.from));
	let accountFromAction = ensureAccountAction(event, accountFrom.id);
	accountFromAction.type = 'Send';
	accountFromAction.ethemeral = token.id;
	// TO DELEGATE
	// ORDER OF ACTION
	token.previousOwner = accountFrom.id;
	accountToAction.ethemeral = token.id;
	accountFromAction.ethemeral = token.id;
	token.owner = addressId(event.params.to);
	// MINT
	if (accountFrom.id == ADDRESS_ZERO) {
		token.previousOwner = ADDRESS_ZERO;
		token.creator = accountTo.id;
		token.owner = accountTo.id;
		tokenAction.type = 'Minted';
	}
	accountTo.save();
	accountFrom.save();
	accountFromAction.save();
	accountToAction.save();
	tokenAction.save();
	token.save();
}

export function handleMint(event: Mint): void {
	let token = ensureEthemeral(event, event.params.id);
	let metadata = ensureMetadata(token.baseId);
	let scorecard = ensureScorecard(token.id);
	let tokenAction = ensureEthemeralAction(event, token.id);
	let statData = bonusStats[event.params.id.toI32()]; // random stats
	token.rewards = BigInt.fromI32(event.params.elf);
	token.atk = BigInt.fromI32(event.params.atk).plus(BigInt.fromI32(statData[0]));
	token.def = BigInt.fromI32(event.params.def).plus(BigInt.fromI32(statData[1]));
	token.spd = BigInt.fromI32(event.params.spd).plus(BigInt.fromI32(statData[2]));
	// class boost
	// [
	//   'Paladin' 0,20,0
	//   'Knight' 5,15,0
	//   'Dark Knight' 15,5,0
	//   'Dragoon' 10, 5, 5
	// ],
	if (metadata.subClass == 'Paladin') {
		token.atkBonus = BigInt.fromI32(statData[0]);
		token.defBonus = BigInt.fromI32(statData[1]).minus(BigInt.fromI32(200));
		token.spdBonus = BigInt.fromI32(statData[2]);
	}
	if (metadata.subClass == 'Knight') {
		token.atkBonus = BigInt.fromI32(statData[0]).minus(BigInt.fromI32(50));
		token.defBonus = BigInt.fromI32(statData[1]).minus(BigInt.fromI32(150));
		token.spdBonus = BigInt.fromI32(statData[2]);
	}
	if (metadata.subClass == 'Dark Knight') {
		token.atkBonus = BigInt.fromI32(statData[0]).minus(BigInt.fromI32(150));
		token.defBonus = BigInt.fromI32(statData[1]).minus(BigInt.fromI32(50));
		token.spdBonus = BigInt.fromI32(statData[2]);
	}
	if (metadata.subClass == 'Dragoon') {
		token.atkBonus = BigInt.fromI32(statData[0]).minus(BigInt.fromI32(100));
		token.defBonus = BigInt.fromI32(statData[1]).minus(BigInt.fromI32(50));
		token.spdBonus = BigInt.fromI32(statData[2]).minus(BigInt.fromI32(50));
	}
	// [
	//   'Sorcerer' 20, 0 0
	//   'Summoner' 10, 10, 0
	//   'Cleric' 0, 16, 4
	//   'Druid' 7, 6, 7
	// ],
	if (metadata.subClass == 'Sorcerer') {
		token.atkBonus = BigInt.fromI32(statData[0]).minus(BigInt.fromI32(200));
		token.defBonus = BigInt.fromI32(statData[1]);
		token.spdBonus = BigInt.fromI32(statData[2]);
	}
	if (metadata.subClass == 'Summoner') {
		token.atkBonus = BigInt.fromI32(statData[0]).minus(BigInt.fromI32(100));
		token.defBonus = BigInt.fromI32(statData[1]).minus(BigInt.fromI32(100));
		token.spdBonus = BigInt.fromI32(statData[2]);
	}
	if (metadata.subClass == 'Cleric') {
		token.atkBonus = BigInt.fromI32(statData[0]);
		token.defBonus = BigInt.fromI32(statData[1]).minus(BigInt.fromI32(160));
		token.spdBonus = BigInt.fromI32(statData[2]).minus(BigInt.fromI32(40));
	}
	if (metadata.subClass == 'Druid') {
		token.atkBonus = BigInt.fromI32(statData[0]).minus(BigInt.fromI32(70));
		token.defBonus = BigInt.fromI32(statData[1]).minus(BigInt.fromI32(60));
		token.spdBonus = BigInt.fromI32(statData[2]).minus(BigInt.fromI32(70));
	}
	// [
	//   'Ranger' 0, 0, 20
	//   'Berserker' 10, 0, 10
	//   'Assassin' 12, 0, 8
	//   'Monk' 4, 8, 8
	// ]
	if (metadata.subClass == 'Ranger') {
		token.atkBonus = BigInt.fromI32(statData[0]);
		token.defBonus = BigInt.fromI32(statData[1]);
		token.spdBonus = BigInt.fromI32(statData[2]).minus(BigInt.fromI32(200));
	}
	if (metadata.subClass == 'Berserker') {
		token.atkBonus = BigInt.fromI32(statData[0]).minus(BigInt.fromI32(100));
		token.defBonus = BigInt.fromI32(statData[1]);
		token.spdBonus = BigInt.fromI32(statData[2]).minus(BigInt.fromI32(100));
	}
	if (metadata.subClass == 'Assassin') {
		token.atkBonus = BigInt.fromI32(statData[0]).minus(BigInt.fromI32(120));
		token.defBonus = BigInt.fromI32(statData[1]);
		token.spdBonus = BigInt.fromI32(statData[2]).minus(BigInt.fromI32(80));
	}
	if (metadata.subClass == 'Monk') {
		token.atkBonus = BigInt.fromI32(statData[0]).minus(BigInt.fromI32(40));
		token.defBonus = BigInt.fromI32(statData[1]).minus(BigInt.fromI32(80));
		token.spdBonus = BigInt.fromI32(statData[2]).minus(BigInt.fromI32(80));
	}
	tokenAction.type = 'Minted';
	// save edition
	metadata.editionCount = metadata.editionCount.plus(ONE_BI);
	token.edition = metadata.editionCount;
	// save elf rewards
	scorecard.highestRewards = token.rewards;
	token.save();
	tokenAction.save();
	metadata.save();
	scorecard.save();
	let core = ensureCore(event);
	// try save supply
	core.maxAvailableIndex = getMaxAvailableIndex();
	core.ethemeralSupply = getEthemeralSupply();
	core.save();
}

export function handleChangeRewards(event: ChangeRewards): void {
	let token = ensureEthemeral(event, event.params.tokenId);
	token.rewards = event.params.rewards;
	token.save();
}

export function handleChangeScore(event: ChangeScore): void {
	let token = ensureEthemeral(event, event.params.tokenId);
	let newRewards = token.rewards.plus(event.params.rewards);
	token.rewards = newRewards;
	token.score = BigInt.fromI32(event.params.score);
	token.save();
}
