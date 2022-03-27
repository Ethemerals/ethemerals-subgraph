/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts';
import { Ethemerals } from '../../generated/Ethemerals/Ethemerals';

export let INI_SCORE = BigInt.fromString('300');

export let ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let TEN_BI = BigInt.fromI32(10);
export let TENTHOUSAND_BI = BigInt.fromI32(10000);
export let ZERO_BD = BigDecimal.fromString('0');
export let ONE_BD = BigDecimal.fromString('1');
export let BI_18 = BigInt.fromI32(18);

export let CORE_ADDRESS = '0xee8c0131aa6b66a2ce3cad6d2a039c1473a79a6d';
export let coreContract = Ethemerals.bind(Address.fromString(CORE_ADDRESS));
