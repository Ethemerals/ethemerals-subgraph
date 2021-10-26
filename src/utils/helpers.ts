import { Address, BigInt, BigDecimal, log, ethereum } from '@graphprotocol/graph-ts';

export function transactionId(tx: ethereum.Transaction): string {
	return tx.hash.toHex();
}

export function addressId(address: Address): string {
	return address.toHexString();
}
