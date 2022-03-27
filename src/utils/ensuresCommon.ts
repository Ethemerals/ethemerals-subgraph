import { Address, BigInt, BigDecimal, log, ethereum, json } from '@graphprotocol/graph-ts';
import { AccountAction, Transaction, Account } from '../../generated/schema';
import { transactionId } from './helpers';

export function ensureTransaction(event: ethereum.Event): Transaction {
	let id = transactionId(event.transaction);
	let transaction = Transaction.load(id);
	if (transaction) {
		return transaction;
	}

	transaction = new Transaction(id);
	transaction.from = event.transaction.from;
	transaction.to = event.transaction.to ? event.transaction.to : null;
	transaction.value = event.transaction.value;
	transaction.block = event.block.number;
	transaction.timestamp = event.block.timestamp;
	transaction.save();

	return transaction;
}
