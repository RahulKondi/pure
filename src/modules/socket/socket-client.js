/* @flow */

/* eslint-env browser */

import eio from 'engine.io-client';
import { bus, config } from '../../core-client.js';
import * as models from '../../models/models.js';
import stringPack from 'stringpack';

const protocol = config.server.protocol, host = config.server.apiHost;
let	backOff = 1, client,
	packerArg, packer;

packerArg = Object.keys(models).sort().map(key => models[key]);
packer = stringPack(packerArg);

function disconnected() {

	/* eslint-disable block-scoped-var, no-use-before-define */

	if (backOff < 256) backOff *= 2;
	else backOff = 256;

	bus.emit('setstate', {
		app: { connectionStatus: 'offline', backOff }
	});
	setTimeout(connect, backOff * 1000);
}

function onMessage(message) {
	const stateChange = packer.decode(message);

	bus.emit('setstate', stateChange);
}

function connect() {
	client = new eio.Socket((protocol === 'https:' ? 'wss:' : 'ws:') + '//' + host, {
		jsonp: 'createElement' in document // Disable JSONP in non-web environments, e.g.- react-native
	});

	client.on('close', disconnected);

	client.on('open', () => {
		backOff = 1;
		bus.emit('setstate', {
			app: { connectionStatus: 'online', backOff }
		});
	});

	client.on('message', onMessage);
}

bus.on('setstate', (state) => {
	console.log(state, new Error('from'));
	client.send(packer.encode(state));
}, 1);

connect();
