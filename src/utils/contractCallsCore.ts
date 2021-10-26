import { Address, BigInt, BigDecimal, log, ethereum } from '@graphprotocol/graph-ts';
import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE, CORE_ADDRESS, coreContract } from './constants';

export function getMintPrice(): BigInt {
	let mintPriceCall = coreContract.try_mintPrice();
	let mintPrice = ZERO_BI;
	if (!mintPriceCall.reverted) {
		return mintPriceCall.value;
	}
	log.warning('mintPrice() call (string or bytes) reverted for {}', [CORE_ADDRESS]);
	return mintPrice;
}

export function getMaxAvailableIndex(): BigInt {
	let maxAvailableIndexCall = coreContract.try_maxMeralIndex();
	let maxAvailableIndex = ZERO_BI;
	if (!maxAvailableIndexCall.reverted) {
		return maxAvailableIndexCall.value;
	}
	log.warning('try_maxMeralIndex() call (string or bytes) reverted for {}', [CORE_ADDRESS]);
	return maxAvailableIndex;
}

export function getEthemeralSupply(): BigInt {
	let ethemeralSupplyCall = coreContract.try_meralSupply();
	let ethemeralSupply = ONE_BI;
	if (!ethemeralSupplyCall.reverted) {
		return ethemeralSupplyCall.value;
	}
	log.warning('try_maxMeralSupply() call (string or bytes) reverted for {}', [CORE_ADDRESS]);
	return ethemeralSupply;
}
