import { Address, BigInt, BigDecimal, log, ethereum } from '@graphprotocol/graph-ts';
import { addressId, transactionId } from '../utils/helpers';

import { ensureAccount, ensureAccountAction, ensureCore, ensureDelegate, ensureOperator } from '../utils/ensuresAccount';
import { ensureMeral, ensureMeralAction, ensureMetadata, ensureScorecard } from '../utils/ensuresMerals';

import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE, CORE_ADDRESS, ETERNALBATTLE_ADDRESS, BURN_ADDRESS } from '../utils/constants';
import { Approval, ApprovalForAll, OwnershipTransferred, DelegateChange, PriceChange, AllowDelegatesChange, Transfer, Mint, ChangeRewards, ChangeScore } from '../../generated/Ethemerals/Ethemerals';

import { Account, AccountAction, Core } from '../../generated/schema';
import { getBonusAtk, getBonusDef, getBonusSpd } from '../metadata/getMeralData';
import { getEthemeralSupply, getMaxAvailableIndex } from '../utils/contractCallsCore';

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
	// event.params.approved
	// event.params.owner
	// event.params.tokenId
}

export function handleApprovalForAll(event: ApprovalForAll): void {
	let operator = ensureOperator(event, addressId(event.params.operator), addressId(event.params.owner));

	operator.approved = event.params.approved;

	operator.save;
}

export function handleAllowDelegatesChange(event: AllowDelegatesChange): void {
	let account = ensureAccount(event, addressId(event.params.user));
	let accountActions = ensureAccountAction(event, account.id);
	accountActions.type = 'DelegateChange';
	account.allowDelegates = event.params.allow;
	account.save();
}

export function handleDelegateChange(event: DelegateChange): void {
	let delegate = ensureDelegate(event, addressId(event.params.delegate));
	let account = ensureAccount(event, addressId(event.params.delegate));
	delegate.active = event.params.add;

	delegate.save();
	account.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePriceChange(event: PriceChange): void {
	let core = Core.load(CORE_ADDRESS);
	if (core) {
		core.mintPrice = event.params.price;
		core.save();
	}
}

export function handleTransfer(event: Transfer): void {
	// SKIP ZERO INDEX
	if (event.params.tokenId < ONE_BI) {
		return;
	}
	let token = ensureMeral(event, event.params.tokenId);
	let tokenAction = ensureMeralAction(event, token.id);

	// NORMAL TRANSFER TO
	let accountTo = ensureAccount(event, addressId(event.params.to));
	let accountToAction = ensureAccountAction(event, accountTo.id);

	// NORMAL TRANSFER FROM
	let accountFrom = ensureAccount(event, addressId(event.params.from));
	let accountFromAction = ensureAccountAction(event, accountFrom.id);

	tokenAction.type = 'Transfer';
	tokenAction.description = `Transfered from ${accountFrom.id}`;

	accountToAction.type = 'Receive';
	accountToAction.description = `Received ${token.tokenId} from ${accountFrom.id}`;

	accountFromAction.type = 'Send';
	accountFromAction.description = `Sent ${token.tokenId} to ${accountTo.id}`;

	// ORDER OF ACTION
	token.previousOwner = accountFrom.id;
	token.owner = addressId(event.params.to);

	// MINT
	if (accountFrom.id == ADDRESS_ZERO) {
		token.previousOwner = ADDRESS_ZERO;
		token.creator = accountTo.id;
		token.owner = accountTo.id;
		token.status = BigInt.fromI32(2);
		tokenAction.type = 'Minted';
		tokenAction.description = `Birthed by ${accountTo.id}`;
		accountToAction.type = 'Minted';
		accountToAction.description = `Minted Meral #${token.tokenId}`;
	}

	// BURN
	if (accountTo.id == ADDRESS_ZERO) {
		token.owner = accountTo.id;
		token.status = ZERO_BI;
		token.burnt = true;
		accountFromAction.type = 'Burnt';
		accountFromAction.description = `Burnt Meral #${token.tokenId}`;
	}

	// UNSTAKE ETERNAL BATTLE
	if (accountFrom.id == ETERNALBATTLE_ADDRESS) {
		tokenAction.type = 'Unstaked';
		tokenAction.description = `Return from Eternal Battle`;
		accountToAction.type = 'Unstaked';
		accountToAction.description = `Retrieve ${token.tokenId} from Eternal Battle`;
	}

	// STAKE ETERNAL BATTLE
	if (accountTo.id == ETERNALBATTLE_ADDRESS) {
		tokenAction.type = 'Staked';
		tokenAction.description = `Enter the Eternal Battle`;
		accountFromAction.type = 'Staked';
		accountFromAction.description = `Sent ${token.tokenId} to Eternal Battle`;
	}

	// BURN ADDRESS
	if (accountTo.id == BURN_ADDRESS) {
		accountFromAction.type = 'Burnt';
		accountFromAction.description = `Burnt Meral #${token.tokenId}`;
	}

	accountTo.save();
	accountFrom.save();
	accountFromAction.save();
	accountToAction.save();
	tokenAction.save();
	token.save();
}

export function handleMint(event: Mint): void {
	let token = ensureMeral(event, event.params.id);
	let metadata = ensureMetadata(token.cmId);
	let scorecard = ensureScorecard(token.id);

	if (metadata) {
		let meralArray = metadata.merals;
		if (meralArray) {
			meralArray.push(token.id);
			metadata.merals = meralArray;
		}
	}

	let atkBonus = getBonusAtk(event.params.id);
	let defBonus = getBonusDef(event.params.id);
	let spdBonus = getBonusSpd(event.params.id);

	token.elf = BigInt.fromI32(event.params.elf);
	token.atk = BigInt.fromI32(event.params.atk).plus(atkBonus);
	token.def = BigInt.fromI32(event.params.def).plus(defBonus);
	token.spd = BigInt.fromI32(event.params.spd).plus(spdBonus);

	token.atkBonus = atkBonus;
	token.defBonus = defBonus;
	token.spdBonus = spdBonus;

	// class boost
	// [
	//   'Paladin' 0,20,0
	//   'Knight' 5,15,0
	//   'Dark Knight' 15,5,0
	//   'Dragoon' 10, 5, 5
	// 150 + 123
	// ],
	if (token.subclass == BigInt.fromI32(0)) {
		token.def = token.def.plus(BigInt.fromI32(200));
	}
	if (token.subclass == BigInt.fromI32(1)) {
		token.atk = token.atk.plus(BigInt.fromI32(50));
		token.def = token.def.plus(BigInt.fromI32(150));
	}
	if (token.subclass == BigInt.fromI32(2)) {
		token.atk = token.atk.plus(BigInt.fromI32(150));
		token.def = token.def.plus(BigInt.fromI32(50));
	}
	if (token.subclass == BigInt.fromI32(3)) {
		token.atk = token.atk.plus(BigInt.fromI32(100));
		token.def = token.def.plus(BigInt.fromI32(50));
		token.spd = token.spd.plus(BigInt.fromI32(50));
	}
	// [
	//   'Sorcerer' 20, 0 0
	//   'Summoner' 10, 10, 0
	//   'Cleric' 0, 16, 4
	//   'Druid' 7, 6, 7
	// ],
	if (token.subclass == BigInt.fromI32(4)) {
		token.atk = token.atk.plus(BigInt.fromI32(200));
	}
	if (token.subclass == BigInt.fromI32(5)) {
		token.atk = token.atk.plus(BigInt.fromI32(100));
		token.def = token.def.plus(BigInt.fromI32(100));
	}
	if (token.subclass == BigInt.fromI32(6)) {
		token.def = token.def.plus(BigInt.fromI32(160));
		token.spd = token.spd.plus(BigInt.fromI32(40));
	}
	if (token.subclass == BigInt.fromI32(7)) {
		token.atk = token.atk.plus(BigInt.fromI32(70));
		token.def = token.def.plus(BigInt.fromI32(60));
		token.spd = token.spd.plus(BigInt.fromI32(70));
	}
	// [
	//   'Ranger' 0, 0, 20
	//   'Berserker' 10, 0, 10
	//   'Assassin' 12, 0, 8
	//   'Monk' 4, 8, 8
	// ]
	if (token.subclass == BigInt.fromI32(8)) {
		token.spd = token.spd.plus(BigInt.fromI32(200));
	}
	if (token.subclass == BigInt.fromI32(9)) {
		token.atk = token.atk.plus(BigInt.fromI32(100));
		token.spd = token.spd.plus(BigInt.fromI32(100));
	}
	if (token.subclass == BigInt.fromI32(10)) {
		token.atk = token.atk.plus(BigInt.fromI32(120));
		token.spd = token.spd.plus(BigInt.fromI32(80));
	}
	if (token.subclass == BigInt.fromI32(11)) {
		token.atk = token.atk.plus(BigInt.fromI32(40));
		token.def = token.def.plus(BigInt.fromI32(80));
		token.spd = token.spd.plus(BigInt.fromI32(80));
	}

	// save edition
	metadata.editionCount = metadata.editionCount.plus(ONE_BI);
	token.edition = metadata.editionCount;
	// save elf rewards
	scorecard.highestRewards = token.elf;

	token.save();
	metadata.save();
	scorecard.save();

	let core = ensureCore();
	// try save supply
	core.maxAvailableIndex = getMaxAvailableIndex();
	core.ethemeralSupply = getEthemeralSupply();
	core.save();
}

export function handleChangeRewards(event: ChangeRewards): void {
	let token = ensureMeral(event, event.params.tokenId);
	token.elf = event.params.rewards;
	token.save();
}

export function handleChangeScore(event: ChangeScore): void {
	let token = ensureMeral(event, event.params.tokenId);
	let newRewards = token.elf.plus(event.params.rewards);
	token.elf = newRewards;
	token.hp = BigInt.fromI32(event.params.score);
	token.save();
}
