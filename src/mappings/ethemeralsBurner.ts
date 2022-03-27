import { BigInt } from '@graphprotocol/graph-ts';
import { MeralBurnt, PropsChange } from '../../generated/EthemeralsBurner/EthemeralsBurner';
import { Meral } from '../../generated/schema';
import { ONE_BI, ZERO_BI } from '../utils/constants';
import { ensureCore } from '../utils/ensuresAccount';
import { ensureMeral, ensureMetadata } from '../utils/ensuresMerals';

export function handleMeralBurnt(event: MeralBurnt): void {
	let token = ensureMeral(event, event.params.tokenId);
	let edition = token.edition;

	let burnMeta = ensureMetadata(ZERO_BI);
	burnMeta.editionCount = burnMeta.editionCount.plus(ONE_BI);

	let meta = ensureMetadata(token.cmId);
	meta.editionCount = meta.editionCount.minus(ONE_BI);

	// IDS OF OTHER EDITIONS
	let meralsIds = meta.merals;

	if (meralsIds) {
		for (let i = 0; i < meralsIds.length; i++) {
			let id = meralsIds[i];
			let meral = Meral.load(id);
			if (meral) {
				if (meral.edition > edition) {
					meral.edition = meral.edition.minus(ONE_BI);
					meral.save();
				}
			}
		}
	}

	token.metadata = burnMeta.id;
	token.edition = burnMeta.editionCount;
	token.burnt = true;

	let core = ensureCore();
	core.burnCount = burnMeta.editionCount;

	token.save();
	burnMeta.save();
	meta.save();
	core.save();
}

export function handlePropsChange(event: PropsChange): void {
	let core = ensureCore();
	core.burnLimit = BigInt.fromI32(event.params.burnableLimit);
	core.burnMaxId = BigInt.fromI32(event.params.maxTokenId);
	core.save();
}
