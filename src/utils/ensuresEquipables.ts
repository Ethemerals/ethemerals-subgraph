import { Address, BigInt, BigDecimal, log, ethereum, json, JSONValueKind } from '@graphprotocol/graph-ts';

import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE } from './constants';

import { AccountAction, Transaction, Account, Metadata, Scorecard, Pet, PetMetadata, PetAction } from '../../generated/schema';

import { ensureTransaction } from './ensuresCommon';
import { transactionId } from './helpers';
import { getBaseId, getPetAtk, getPetDef, getPetSpd, getPetName, getPetRarity } from '../metadata/getPetData';

export function ensurePet(event: ethereum.Event, tokenId: BigInt): Pet {
	let id = tokenId.toString();
	let pet = Pet.load(id);
	if (pet) {
		return pet;
	}

	pet = new Pet(id);
	pet.tokenId = tokenId;
	pet.timestamp = event.block.timestamp;
	pet.blockNumber = event.block.number;
	pet.creator = ADDRESS_ZERO;
	pet.owner = ADDRESS_ZERO;
	pet.previousOwner = ADDRESS_ZERO;
	pet.baseId = getBaseId(tokenId);

	// GET METADATA
	pet.metadata = ensurePetMetadata(pet.baseId).id;

	// GET STATS
	pet.atk = getPetAtk(tokenId);
	pet.def = getPetDef(tokenId);
	pet.spd = getPetSpd(tokenId);
	pet.rarity = getPetRarity(tokenId);
	pet.name = getPetName(tokenId);

	pet.save();

	return pet;
}

export function ensurePetMetadata(type: BigInt): PetMetadata {
	let meta = PetMetadata.load(type.toString());
	if (meta) {
		return meta;
	}

	meta = new PetMetadata(type.toString());
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
