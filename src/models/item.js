import { COLUMNS } from '../lib/schema';
// import * as Constants from '../lib/Constants';

export default class Item {
	constructor(data) {
		if (!data) throw new Error('CANNOT_INITIALIZE_MODEL');

		try {
			if (data.createTime) data.createTime = parseInt(data.createTime);
			if (data.updateTime) data.updateTime = parseInt(data.updateTime);
		} catch (e) {
			delete data.createTime;
			delete data.updateTime;
		}

		for (const name of COLUMNS[data.type]) {
			if (typeof data[name.toLowerCase()] !== 'undefined' || typeof data[name] !== 'undefined') {
				this[name] = data[name] || data[name.toLowerCase()];
			}
		}

		if (data.error) this.error = data.error;
	}

	packArguments(): Object {
		const data = {};

		for (const name of COLUMNS[this.type]) {
			if (typeof this[name] !== 'undefined') {
				data[name] = this[name];
			}
		}

		data.type = this.type;
		if (this.error) data.error = this.error;
		return [ data ];
	}

	hasIdentity(identity) {
		return (this.identities || []).indexOf(identity) >= 0;
	}

	addIdentity(identity) {
		if (!this.hadIdentity(identity)) this.identities.push();
	}

	isParent(parentId) {
		return (this.parentIds || [])[0] === parentId;
	}

	isAncestor(ancestorId) {
		return (this.parentId || []).indexOf(ancestorId) >= 0;
	}
}
