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
export let ETERNALBATTLE_ADDRESS = '0x169310e61e71ef5834ce5466c7155d8a90d15f1e';
export let BURN_ADDRESS = '0x88329f0ec14ee9a958f0538f78757bc7442cf464';
export let coreContract = Ethemerals.bind(Address.fromString(CORE_ADDRESS));
