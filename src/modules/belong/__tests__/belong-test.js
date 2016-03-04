/*
	Purva fountain square: ChIJvSvKgzESrjsRCEU5Xvukedw
	Bangalore: ChIJbU60yXAWrjsR4E9-UejD3_g
*/

import '../belong';
import { bus, cache } from '../../../core-server';
import {
	user as User,
	roomrel as RoomRel,
	room as Room
} from '../../../models/models';
import Cache from 'sbcache';
import * as Constants from '../../../lib/Constants';

cache.onChange(change => {
	if (!change.queries) { return; }

	const key = Object.keys(change.queries)[0],
		slice = cache.keyToSlice(key);

	if (slice.type === 'rel') {
		setImmediate(() => {
			cache.put({
				knowledge: { [key]: new Cache.RangeArray(
					[ [ -Infinity, Infinity ] ]
				) },
				indexes: { [key]: new Cache.OrderedArray(
					[ 'rel', 'roleTime' ], [{
						rel: new RoomRel({
							user: 'harish',
							item: '5bb985a7-8e48-4aa7-bac7-5de9c6f6a35d',
							tags: [ Constants.TAG_REL_HOME ],
							role: [ Constants.ROLE_FOLLOWER ],
							roleTime: 1
						}),
						room: new Room({
							id: '5bb985a7-8e48-4aa7-bac7-5de9c6f6a35d',
							name: 'JP Nagar',
							identities: [ 'place:FakePlace123' ]
						})
					}]
				) }
			});
		});
	}
});


bus.emit('change', { entities: {
	harish: new User({
		id: 'harish',
		params: { profile: {
			home: 'ChIJvSvKgzESrjsRCEU5Xvukedw'
		} }
	})
} });

bus.on('change', change => console.log(change));