import { Address, BigInt, BigDecimal, log, ethereum } from '@graphprotocol/graph-ts';

export function transactionId(tx: ethereum.Transaction): string {
	return tx.hash.toHex();
}

export function addressId(address: Address): string {
	return address.toHexString();
}

const typeMult = BigInt.fromI32(1000000);

// export const getTypeFromId = (id) => {
// 	return parseInt(parseInt(id) / typeMult);
// };

// export const getTokenIdFromId = (id) => {
// 	let type = getTypeFromId(id);
// 	return parseInt(parseInt(id) - parseInt(type) * typeMult);
// };

// export const getIdFromType = (type, tokenId) => {
// 	return parseInt(parseInt(tokenId) + parseInt(type) * typeMult);
// };

export function getIdFromType(type: BigInt, tokenId: BigInt): BigInt {
	let mult = type.times(typeMult);
	return tokenId.plus(mult);
}
