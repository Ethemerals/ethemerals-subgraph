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
	let tokenAction = ensurePetAction(event, token.id);

	// NORMAL TRANSFER TO
	let accountTo = ensureAccount(event, addressId(event.params.to));
	let accountToAction = ensureAccountAction(event, accountTo.id);

	// NORMAL TRANSFER FROM
	let accountFrom = ensureAccount(event, addressId(event.params.from));
	let accountFromAction = ensureAccountAction(event, accountFrom.id);

	tokenAction.type = 'Transfer';
	tokenAction.description = `Transfered from ${accountFrom.id}`;

	accountToAction.type = 'Receive';
	accountToAction.description = `Received Pet ${token.tokenId} from ${accountFrom.id}`;

	accountFromAction.type = 'Send';
	accountFromAction.description = `Sent Pet ${token.tokenId} to ${accountTo.id}`;

	// TO DELEGATE
	// ORDER OF ACTION
	token.previousOwner = accountFrom.id;
	token.owner = addressId(event.params.to);

	if (accountFrom.id == ADDRESS_ZERO) {
		token.previousOwner = ADDRESS_ZERO;
		token.creator = accountTo.id;
		token.owner = accountTo.id;
		tokenAction.type = 'Minted';

		let metadata = ensurePetMetadata(token.baseId);
		let meral = ensureMeral(event, event.params.tokenId);
		let meralAction = ensureMeralAction(event, meral.id);

		metadata.editionCount = metadata.editionCount.plus(ONE_BI);
		token.edition = metadata.editionCount;
		metadata.save();

		meral.petRedeemed = true;
		meral.save();

		meralAction.type = 'RedeemPet';
		meralAction.description = `Summoned Pet`;
		meralAction.save();

		accountToAction.type = 'Minted';
		accountToAction.description = `Minted Pet #${token.tokenId}`;
	}

	accountTo.save();
	accountFrom.save();
	accountFromAction.save();
	accountToAction.save();
	tokenAction.save();
	token.save();
}
