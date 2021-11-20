import { Address, BigInt, BigDecimal, log, ethereum, json } from '@graphprotocol/graph-ts';

import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE, INI_ALLOWDELEGATES, CORE_ADDRESS, coreContract } from './constants';

import { getMintPrice, getMaxAvailableIndex, getEthemeralSupply } from './contractCallsCore';
import { getBalanceOf } from './contractCallsELF';
import {
	metaMainclass,
	metaSubclass,
	metaCoinName,
	metaSpecial2,
	metaArtist,
	metaColors,
	metaPets,
	metaPetStats,
	metaIdToItem,
	metaItems,
	metaItemsStats,
	metaCostumes,
} from '../metadata/metadataStats';

import { meralTraits } from '../metadata/meralTraits';

import { tokenToRanks } from '../metadata/tokenToRanks';

import {
	CoreAction,
	AccountAction,
	Transaction,
	Account,
	Core,
	Ethemeral,
	EthemeralAction,
	Metadata,
	Delegate,
	DelegateAction,
	Scorecard,
	Pet,
	PetMetadata,
	PetAction,
	Item,
	ItemMetadata,
	ItemAction,
} from '../../generated/schema';

import { ensureTransaction } from './ensuresCommon';
import { transactionId } from './helpers';

export function ensurePet(event: ethereum.Event, tokenId: BigInt): Pet {
	let id = tokenId.toString();
	let pet = Pet.load(id);
	if (pet) {
		return pet;
	}

	let rankData = tokenToRanks[tokenId.toI32()]; // random rank
	pet = new Pet(id);
	pet.timestamp = event.block.timestamp;
	pet.blockNumber = event.block.number;
	pet.creator = CORE_ADDRESS;
	pet.owner = CORE_ADDRESS;
	pet.previousOwner = CORE_ADDRESS;
	pet.baseId = BigInt.fromI32(rankData[2]);

	// GET METADATA
	pet.metadata = ensurePetMetadata(pet.baseId).id;

	// GET STATS
	pet.atk = BigInt.fromI32(metaPetStats[pet.baseId.toI32()][0]);
	pet.def = BigInt.fromI32(metaPetStats[pet.baseId.toI32()][1]);
	pet.spd = BigInt.fromI32(metaPetStats[pet.baseId.toI32()][2]);
	pet.rarity = BigInt.fromI32(metaPetStats[pet.baseId.toI32()][3]);
	pet.name = metaPets[pet.baseId.toI32()];

	pet.save();

	return pet;
}

export function ensurePetMetadata(type: BigInt): PetMetadata {
	let meta = PetMetadata.load(type.toString());
	if (meta) {
		return meta;
	}

	meta = new PetMetadata(type.toString());
	let typeIndex = type.toI32();
	// 33 === doge 0-31 === slimes 32 === the egg
	meta.name = metaPets[typeIndex];
	meta.editionCount = ZERO_BI;

	meta.save();

	return meta;
}

export function ensurePetAction(event: ethereum.Event, tokenId: string): PetAction {
	let id = transactionId(event.transaction) + '/' + tokenId;
	let action = PetAction.load(id);
	if (action) {
		return action;
	}

	action = new PetAction(id);
	action.pet = tokenId;
	action.timestamp = event.block.timestamp;
	action.transaction = ensureTransaction(event).id;
	action.type = 'Default';
	action.save();

	return action;
}

export function ensureItem(event: ethereum.Event, tokenId: BigInt): Item {
	let id = tokenId.toString();

	let item = Item.load(id);
	if (item) {
		return item;
	}

	let itemID = tokenId.minus(BigInt.fromI32(10001)); // reset to 0

	let idToItem = metaIdToItem[itemID.toI32()]; // random item
	item = new Item(id);
	item.timestamp = event.block.timestamp;
	item.blockNumber = event.block.number;
	item.creator = CORE_ADDRESS;
	item.owner = CORE_ADDRESS;
	item.previousOwner = CORE_ADDRESS;
	item.baseId = BigInt.fromI32(idToItem);

	// GET METADATA
	item.metadata = ensureItemMetadata(item.baseId).id;

	// GET STATS
	item.atk = BigInt.fromI32(metaItemsStats[item.baseId.toI32()][0]);
	item.def = BigInt.fromI32(metaItemsStats[item.baseId.toI32()][1]);
	item.spd = BigInt.fromI32(metaItemsStats[item.baseId.toI32()][2]);
	item.rarity = BigInt.fromI32(metaItemsStats[item.baseId.toI32()][3]);

	item.save();

	return item;
}

export function ensureItemMetadata(type: BigInt): ItemMetadata {
	let meta = ItemMetadata.load(type.toString());
	if (meta) {
		return meta;
	}

	meta = new ItemMetadata(type.toString());
	let typeIndex = type.toI32();
	meta.name = metaItems[typeIndex];
	meta.editionCount = ZERO_BI;
	meta.save();

	return meta;
}

export function ensureItemAction(event: ethereum.Event, tokenId: string): ItemAction {
	let id = transactionId(event.transaction) + '/' + tokenId;
	let action = ItemAction.load(id);
	if (action) {
		return action;
	}

	action = new ItemAction(id);
	action.item = tokenId;
	action.timestamp = event.block.timestamp;
	action.transaction = ensureTransaction(event).id;
	action.type = 'Default';
	action.save();

	return action;
}
