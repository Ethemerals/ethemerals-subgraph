import { Address, BigInt, BigDecimal, log, ethereum } from '@graphprotocol/graph-ts';
import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE, CORE_ADDRESS, coreContract } from '../utils/constants';
import { EthemeralEquipables, AllowDelegatesChange, Approval, ApprovalForAll, DelegateChange, OwnershipTransferred, Transfer } from '../../generated/EthemeralEquipables/EthemeralEquipables';
import { ensurePet, ensurePetMetadata, ensurePetAction, ensureItem, ensureItemAction, ensureItemMetadata } from '../utils/ensuresEquipables';

import { ensureAccount, ensureAccountAction } from '../utils/ensuresCore';
import { ensureEthemeral, ensureEthemeralAction } from '../utils/ensuresMerals';
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
	if (event.params.tokenId < BigInt.fromI32(10001)) {
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
			let meral = ensureEthemeral(event, event.params.tokenId);
			meral.petRedeemed = true;
			let meralAction = ensureEthemeralAction(event, meral.id);
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
	if (event.params.tokenId > BigInt.fromI32(10000)) {
		/// ITS A ITEM
		let token = ensureItem(event, event.params.tokenId);
		// TOKEN ACTIONS
		let tokenAction = ensureItemAction(event, token.id);
		tokenAction.type = 'Transfer';
		// NORMAL TRANSFER TO
		let accountTo = ensureAccount(event, addressId(event.params.to));
		let accountToAction = ensureAccountAction(event, accountTo.id);
		accountToAction.type = 'Receive';
		accountToAction.item = token.id;
		// NORMAL TRANSFER FROM
		let accountFrom = ensureAccount(event, addressId(event.params.from));
		let accountFromAction = ensureAccountAction(event, accountFrom.id);
		accountFromAction.type = 'Send';
		accountFromAction.item = token.id;
		// TO DELEGATE
		// ORDER OF ACTION
		token.previousOwner = accountFrom.id;
		accountToAction.item = token.id;
		accountFromAction.item = token.id;
		token.owner = addressId(event.params.to);
		if (accountFrom.id == ADDRESS_ZERO) {
			token.previousOwner = ADDRESS_ZERO;
			token.creator = accountTo.id;
			token.owner = accountTo.id;
			tokenAction.type = 'Minted';
			let metadata = ensureItemMetadata(token.baseId);
			metadata.editionCount = metadata.editionCount.plus(ONE_BI);
			token.edition = metadata.editionCount;
			metadata.save();
		}
		accountTo.save();
		accountFrom.save();
		accountFromAction.save();
		accountToAction.save();
		tokenAction.save();
		token.save();
	}
}
