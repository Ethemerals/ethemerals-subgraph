import { Address, BigInt, BigDecimal, log, ethereum, json } from '@graphprotocol/graph-ts';

import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE } from './constants';

import { Meral, MeralAction, Metadata, Scorecard } from '../../generated/schema';

import { ensureTransaction } from './ensuresCommon';
import { getIdFromType, transactionId } from './helpers';
import { getArtist, getCmId, getCoin, getCostume, getElement, getEyes, getHair, getMainclass, getSkin, getSubclass } from '../metadata/getMeralData';

export function ensureMeral(event: ethereum.Event, tokenId: BigInt): Meral {
	let id = tokenId.toString();
	let meral = Meral.load(id);
	if (meral) {
		return meral;
	}

	meral = new Meral(id);
	meral.tokenId = tokenId;
	meral.meralId = getIdFromType(ONE_BI, tokenId);
	meral.timestamp = event.block.timestamp;
	meral.blockNumber = event.block.number;
	meral.creator = ADDRESS_ZERO;
	meral.owner = ADDRESS_ZERO;
	meral.previousOwner = ADDRESS_ZERO;
	meral.petRedeemed = false;
	meral.edition = ONE_BI;
	meral.hp = INI_SCORE;
	meral.elf = ZERO_BI;
	meral.xp = ZERO_BI;
	// STATS
	meral.atk = ZERO_BI;
	meral.def = ZERO_BI;
	meral.spd = ZERO_BI;
	meral.atkBonus = ZERO_BI;
	meral.defBonus = ZERO_BI;
	meral.spdBonus = ZERO_BI;
	// METADATA
	meral.cmId = getCmId(tokenId);
	meral.coin = getCoin(tokenId);
	meral.name = getCoin(tokenId);
	meral.artist = getArtist(tokenId);
	meral.element = getElement(tokenId);
	meral.mainclass = getMainclass(tokenId);
	meral.subclass = getSubclass(tokenId);
	meral.hair = getHair(tokenId);
	meral.eyes = getEyes(tokenId);
	meral.skin = getSkin(tokenId);
	meral.costume = getCostume(tokenId);

	meral.scorecard = ensureScorecard(meral.id).id;
	meral.metadata = ensureMetadata(meral.cmId).id;

	meral.burnt = false;

	meral.save();

	return meral;
}

export function ensureScorecard(tokenId: string): Scorecard {
	let scorecard = Scorecard.load(tokenId);
	if (scorecard) {
		return scorecard;
	}

	scorecard = new Scorecard(tokenId);
	scorecard.meral = tokenId;
	scorecard.highestScore = INI_SCORE;
	scorecard.highestRewards = ZERO_BI; // TODO
	scorecard.battles = ZERO_BI;
	scorecard.wins = ZERO_BI;
	scorecard.revived = ZERO_BI;
	scorecard.reviver = ZERO_BI;
	scorecard.resurrected = ZERO_BI;
	scorecard.reaped = ZERO_BI;
	scorecard.reaper = ZERO_BI;
	scorecard.drained = ZERO_BI;

	scorecard.save();

	return scorecard;
}

export function ensureMetadata(cmId: BigInt): Metadata {
	let meta = Metadata.load(cmId.toString());
	if (meta) {
		return meta;
	}

	meta = new Metadata(cmId.toString());
	meta.merals = [];
	meta.editionCount = ZERO_BI;
	meta.save();

	return meta;
}

export function ensureMeralAction(event: ethereum.Event, tokenId: string): MeralAction {
	let id = transactionId(event.transaction) + '/' + tokenId;
	let action = MeralAction.load(id);
	if (action) {
		return action;
	}

	action = new MeralAction(id);
	action.meral = tokenId;
	action.timestamp = event.block.timestamp;
	action.transaction = ensureTransaction(event).id;
	action.staked = false;
	action.type = 'Default';
	action.save();

	return action;
}
