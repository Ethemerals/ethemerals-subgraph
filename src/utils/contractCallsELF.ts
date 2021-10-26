import { Address, BigInt, BigDecimal, log, ethereum } from '@graphprotocol/graph-ts';
import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, ELF_ADDRESS, elfContract } from './constants';

export function getBalanceOf(address: string): BigInt {
	let balanceCall = elfContract.try_balanceOf(Address.fromString(address));
	let balanceOf = ZERO_BI;
	if (!balanceCall.reverted) {
		return balanceCall.value;
	}
	log.warning('balanceOf() call (string or bytes) reverted for {}', [ELF_ADDRESS]);
	return balanceOf;
}
