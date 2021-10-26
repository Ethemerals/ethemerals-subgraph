import { Address, BigInt, BigDecimal, log, ethereum, json } from '@graphprotocol/graph-ts';

import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE, INI_ALLOWDELEGATES, CORE_ADDRESS, coreContract } from './constants';

import { getMintPrice, getMaxAvailableIndex, getEthemeralSupply } from './contractCallsCore';

import { CoreAction, AccountAction, Delegate, DelegateAction, Transaction, Account, Core } from '../../generated/schema';

import { ensureTransaction } from './ensuresCommon';
import { transactionId } from './helpers';

export function ensureCore(event: ethereum.Event): Core {
	let core = Core.load(CORE_ADDRESS);
	if (core) {
		return core;
	}

	core = new Core(CORE_ADDRESS);
	core.timestamp = event.block.timestamp;
	core.blockNumber = event.block.number;
	core.owner = Address.fromString(ADDRESS_ZERO);
	core.mintPrice = getMintPrice();
	core.maxAvailableIndex = getMaxAvailableIndex();
	core.ethemeralSupply = getEthemeralSupply();

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

export function ensureAccount(event: ethereum.Event, id: string): Account {
	let account = Account.load(id);
	if (account) {
		return account;
	}

	account = new Account(id);
	account.elfBalance = ZERO_BI;
	account.timestamp = event.block.timestamp;
	account.blockNumber = event.block.number;
	account.allowDelegates = INI_ALLOWDELEGATES;
	account.save();

	return account;
}

export function ensureCoreAction(event: ethereum.Event): CoreAction {
	let id = transactionId(event.transaction);
	let action = CoreAction.load(id);
	if (action) {
		return action;
	}

	action = new CoreAction(id);
	action.timestamp = event.block.timestamp;
	action.transaction = ensureTransaction(event).id;
	action.type = 'Default';
	action.save();

	return action;
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

export function ensureDelegateAction(event: ethereum.Event, delegateId: string): DelegateAction {
	let id = transactionId(event.transaction);
	let action = DelegateAction.load(id);
	if (action) {
		return action;
	}

	action = new DelegateAction(id);
	action.delegate = delegateId;
	action.timestamp = event.block.timestamp;
	action.transaction = ensureTransaction(event).id;
	action.type = 'Default';
	action.save();

	return action;
}
