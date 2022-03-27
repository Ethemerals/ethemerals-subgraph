import { Address, BigInt, BigDecimal, log, ethereum, json } from '@graphprotocol/graph-ts';

import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE, CORE_ADDRESS } from './constants';

import { Core, AccountAction, Transaction, Account, Delegate, Operator } from '../../generated/schema';
import { getMintPrice, getMaxAvailableIndex, getEthemeralSupply } from './contractCallsCore';
import { ensureTransaction } from './ensuresCommon';
import { transactionId } from './helpers';

export function ensureCore(): Core {
	let core = Core.load(CORE_ADDRESS);
	if (core) {
		return core;
	}

	core = new Core(CORE_ADDRESS);
	core.mintPrice = getMintPrice();
	core.maxAvailableIndex = getMaxAvailableIndex();
	core.ethemeralSupply = getEthemeralSupply();

	core.burnCount = ZERO_BI;
	core.burnMaxId = ZERO_BI;
	core.burnLimit = ZERO_BI;

	core.save();

	return core;
}

export function ensureDelegate(event: ethereum.Event, id: string): Delegate {
	let delegate = Delegate.load(id);
	if (delegate) {
		return delegate;
	}

	delegate = new Delegate(id);
	delegate.timestamp = event.block.timestamp;
	delegate.blockNumber = event.block.number;
	delegate.active = true;
	delegate.save();

	return delegate;
}

export function ensureOperator(event: ethereum.Event, operatorAddress: string, ownerAddress: string): Operator {
	let id = operatorAddress + '/' + ownerAddress;
	let operator = Operator.load(id);
	if (operator) {
		return operator;
	}

	operator = new Operator(id);
	operator.timestamp = event.block.timestamp;
	operator.blockNumber = event.block.number;
	operator.approved = false;
	operator.owner = ownerAddress;
	operator.save();

	return operator;
}

export function ensureAccount(event: ethereum.Event, id: string): Account {
	let account = Account.load(id);
	if (account) {
		return account;
	}

	account = new Account(id);
	account.elfBalance = ZERO_BI;
	account.timestamp = event.block.timestamp;
	account.blockNumber = event.block.number;
	account.allowDelegates = false;
	account.save();

	return account;
}

export function ensureAccountAction(event: ethereum.Event, accountId: string): AccountAction {
	let id = transactionId(event.transaction) + '/' + accountId;
	let action = AccountAction.load(id);
	if (action) {
		return action;
	}

	action = new AccountAction(id);
	action.account = accountId;
	action.timestamp = event.block.timestamp;
	action.transaction = ensureTransaction(event).id;
	action.type = 'Default';
	action.save();

	return action;
}
