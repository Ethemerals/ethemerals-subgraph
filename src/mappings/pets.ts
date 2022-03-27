import { Address, BigInt, BigDecimal, log, ethereum } from '@graphprotocol/graph-ts';
import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE } from '../utils/constants';
import { EthemeralEquipables, AllowDelegatesChange, Approval, ApprovalForAll, DelegateChange, OwnershipTransferred, Transfer } from '../../generated/EthemeralEquipables/EthemeralEquipables';
import { ensurePet, ensurePetMetadata, ensurePetAction } from '../utils/ensuresEquipables';

import { ensureAccount, ensureAccountAction } from '../utils/ensuresAccount';
import { ensureMeral, ensureMeralAction } from '../utils/ensuresMerals';
import { addressId, transactionId } from '../utils/helpers';

export function handleAllowDelegatesChange(event: AllowDelegatesChange): void {}

export function handleApproval(event: Approval): void {}

export function handleApprovalForAll(event: ApprovalForAll): void {}

export function handleDelegateChange(event: DelegateChange): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleTransfer(event: Transfer): void {
	// SKIP ZERO INDEX
	if (event.params.tokenId < ONE_BI) {
		return;
	}

	/// ITS A PET
	let token = ensurePet(event, event.params.tokenId);
	// TOKEN ACTIONS
	let tokenAction = ensurePetAction(event, token.id);
	tokenAction.type = 'Transfer';
	// NORMAL TRANSFER TO
	let accountTo = ensureAccount(event, addressId(event.params.to));
	let accountToAction = ensureAccountAction(event, accountTo.id);
	accountToAction.type = 'Receive';
	accountToAction.pet = token.id;
	// NORMAL TRANSFER FROM
	let accountFrom = ensureAccount(event, addressId(event.params.from));
	let accountFromAction = ensureAccountAction(event, accountFrom.id);
	accountFromAction.type = 'Send';
	accountFromAction.pet = token.id;
	// TO DELEGATE
	// ORDER OF ACTION
	token.previousOwner = accountFrom.id;
	accountToAction.pet = token.id;
	accountFromAction.pet = token.id;
	token.owner = addressId(event.params.to);
	if (accountFrom.id == ADDRESS_ZERO) {
		token.previousOwner = ADDRESS_ZERO;
		token.creator = accountTo.id;
		token.owner = accountTo.id;
		tokenAction.type = 'Minted';
		let metadata = ensurePetMetadata(token.baseId);
		metadata.editionCount = metadata.editionCount.plus(ONE_BI);
		token.edition = metadata.editionCount;
		metadata.save();
		let meral = ensureMeral(event, event.params.tokenId);
		meral.petRedeemed = true;
		let meralAction = ensureMeralAction(event, meral.id);
		meralAction.type = 'RedeemPet';
		meral.save();
		meralAction.save();
	}
	accountTo.save();
	accountFrom.save();
	accountFromAction.save();
	accountToAction.save();
	tokenAction.save();
	token.save();
}
