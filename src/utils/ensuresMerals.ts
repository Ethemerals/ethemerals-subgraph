import { Address, BigInt, BigDecimal, log, ethereum, json } from '@graphprotocol/graph-ts';

import { ADDRESS_ZERO, ZERO_BI, ZERO_BD, ONE_BI, TEN_BI, INI_SCORE, INI_ALLOWDELEGATES, CORE_ADDRESS, coreContract } from './constants';

import { metaMainclass, metaSubclass, metaCoinName, metaSpecial2, metaArtist, metaColors, metaCostumes } from '../metadata/metadataStats';

import { meralTraits } from '../metadata/meralTraits';

import { tokenToRanks } from '../metadata/tokenToRanks';
import { Ethemeral, EthemeralAction, Metadata, Scorecard } from '../../generated/schema';

import { ensureTransaction } from './ensuresCommon';
import { transactionId } from './helpers';

export function ensureEthemeral(event: ethereum.Event, tokenId: BigInt): Ethemeral {
	let id = tokenId.toString();
	let ethemeral = Ethemeral.load(id);
	if (ethemeral) {
		return ethemeral;
	}

	let rankData = tokenToRanks[tokenId.toI32()]; // random rank
	ethemeral = new Ethemeral(id);
	ethemeral.timestamp = event.block.timestamp;
	ethemeral.blockNumber = event.block.number;
	ethemeral.creator = CORE_ADDRESS;
	ethemeral.owner = CORE_ADDRESS;
	ethemeral.previousOwner = CORE_ADDRESS;
	ethemeral.score = INI_SCORE;
	ethemeral.rewards = ZERO_BI;
	ethemeral.atk = ZERO_BI;
	ethemeral.def = ZERO_BI;
	ethemeral.spd = ZERO_BI;
	ethemeral.atkBonus = ZERO_BI;
	ethemeral.defBonus = ZERO_BI;
	ethemeral.spdBonus = ZERO_BI;
	ethemeral.baseId = BigInt.fromI32(rankData[0]);
	ethemeral.bgId = BigInt.fromI32(rankData[1]);
	ethemeral.coin = metaCoinName[rankData[0]];
	ethemeral.petRedeemed = false;
	ethemeral.scorecard = ensureScorecard(ethemeral.id).id;
	ethemeral.metadata = ensureMetadata(BigInt.fromI32(rankData[0])).id;
	ethemeral.save();

	return ethemeral;
}

export function ensureScorecard(tokenId: string): Scorecard {
	let scorecard = Scorecard.load(tokenId);
	if (scorecard) {
		return scorecard;
	}

	scorecard = new Scorecard(tokenId);
	scorecard.ethemeral = tokenId;
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

export function ensureMetadata(rank: BigInt): Metadata {
	let rankIndex = rank.toI32();
	let metadata = meralTraits[rankIndex];
	let id = metadata[0];

	let meta = Metadata.load(id.toString());
	if (meta) {
		return meta;
	}

	// [cmId, mainClass, subclass, special1, hair, eyes, skin]
	meta = new Metadata(id.toString());
	meta.editionCount = ZERO_BI;
	meta.coin = metaCoinName[rankIndex];
	meta.artist = metaArtist[rankIndex];
	meta.mainClass = metaMainclass[metadata[1]];
	meta.subClass = metaSubclass[metadata[1]][metadata[2]];
	meta.special1 = metadata[3];
	meta.special2 = metaSpecial2[rankIndex];
	meta.hair = metaColors[metadata[4]];
	meta.eyes = metaColors[metadata[5]];
	meta.skin = metaColors[metadata[6]];
	meta.costume = metaCostumes[metadata[7]];

	meta.save();

	return meta;
}

export function ensureEthemeralAction(event: ethereum.Event, tokenId: string): EthemeralAction {
	let id = transactionId(event.transaction) + '/' + tokenId;
	let action = EthemeralAction.load(id);
	if (action) {
		return action;
	}

	action = new EthemeralAction(id);
	action.ethemeral = tokenId;
	action.timestamp = event.block.timestamp;
	action.transaction = ensureTransaction(event).id;
	action.staked = false;
	action.type = 'Default';
	action.save();

	return action;
}
