import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { EthemeralLifeForce as ELF, Approval, Transfer } from '../../generated/EthemeralLifeForce/EthemeralLifeForce';
import { addressId, transactionId } from '../utils/helpers';
import { ensureAccount, ensureAccountAction } from '../utils/ensuresCore';
import { Account } from '../../generated/schema';
import { ZERO_BD, ZERO_BI } from '../utils/constants';

export function handleApproval(event: Approval): void {
	// - contract.allowance(...)
	// - contract.approve(...)
	// - contract.balanceOf(...)
	// - contract.decimals(...)
	// - contract.decreaseAllowance(...)
	// - contract.increaseAllowance(...)
	// - contract.name(...)
	// - contract.symbol(...)
	// - contract.totalSupply(...)
	// - contract.transfer(...)
	// - contract.transferFrom(...)
}

export function handleTransfer1(event: Transfer): void {
	// let amount = event.params.value;
	// TO
	let account = Account.load(event.transaction.from.toHex());
	if (!account) {
		account = new Account(event.transaction.from.toHex());
	}

	account.elfBalance = ZERO_BI;
	account.timestamp = event.block.timestamp;
	account.blockNumber = event.block.number;
	account.allowDelegates = false;
	account.save();
}

export function handleTransfer(event: Transfer): void {
	let amount = event.params.value;
	// TO
	let accountTo = Account.load(event.transaction.from.toHex());
	if (accountTo) {
		accountTo.elfBalance = accountTo.elfBalance.plus(amount);
	} else {
		accountTo = ensureAccount(event, addressId(event.params.to));
		accountTo.elfBalance = amount;
	}
	let accountToAction = ensureAccountAction(event, accountTo.id);
	accountToAction.type = 'ReceiveELF';
	// FROM
	let accountFrom = Account.load(addressId(event.params.from));
	if (accountFrom) {
		if (amount >= accountFrom.elfBalance) {
			accountFrom.elfBalance = ZERO_BI;
		} else {
			accountFrom.elfBalance = accountFrom.elfBalance.minus(amount);
		}
	} else {
		accountFrom = ensureAccount(event, addressId(event.params.from));
	}
	let accountFromAction = ensureAccountAction(event, accountFrom.id);
	accountFromAction.type = 'SendELF';
	accountTo.save();
	accountToAction.save();
	accountFromAction.save();
	accountFrom.save();
}
