/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts';
import { Ethemerals } from '../../generated/Ethemerals/Ethemerals';
import { EternalBattle } from '../../generated/EternalBattle/EternalBattle';
import { EthemeralLifeForce } from '../../generated/EthemeralLifeForce/EthemeralLifeForce';

// export let MIN_ID = BigInt.fromString('10');
// export let MAX_ID = BigInt.fromString('6909');
export let INI_SCORE = BigInt.fromString('300');
export let INI_ALLOWDELEGATES = false;

export let ELF_ADDRESS = '0x5900f8d3d9fc8425c6dc22b5bda71a1e0e594135';
export let CORE_ADDRESS = '0xee8c0131aa6b66a2ce3cad6d2a039c1473a79a6d';
export let EQUIPABLE_ADDRESS = '0x61493114836bb14dae7a57be93de2eee95327092';
export let ETERNALBATTLE_ADDRESS = '0x169310e61e71ef5834ce5466c7155d8a90d15f1e';

export let elfContract = EthemeralLifeForce.bind(Address.fromString(ELF_ADDRESS));
export let coreContract = Ethemerals.bind(Address.fromString(CORE_ADDRESS));
export let eternalBattleContract = EternalBattle.bind(Address.fromString(ETERNALBATTLE_ADDRESS));

export let ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let TEN_BI = BigInt.fromI32(10);
export let TENTHOUSAND_BI = BigInt.fromI32(10000);
export let ZERO_BD = BigDecimal.fromString('0');
export let ONE_BD = BigDecimal.fromString('1');
export let BI_18 = BigInt.fromI32(18);
