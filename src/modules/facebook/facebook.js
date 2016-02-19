/* @flow */

import route from 'koa-route';
import { bus, config } from '../../core-server';
import winston from 'winston';
import request from 'request';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

const SCRIPT_REDIRECT = `location.href='https://www.facebook.com/dialog/oauth?'+'client_id=${config.facebook.client_id}'+'&redirect_uri='+encodeURIComponent("https://${config.host}/r/facebook/return")+'&response_type=code&scope=email';`;
const SCRIPT_MESSAGE = `
	window.opener.postMessage({
		type: "auth",
		provider: "facebook",
		code: location.search.substring(6)
	}, "*");

	window.close();
`;

function getTokenFromCode(code, secret, clientID, host) {
	return new Promise((resolve, reject) => {
		request('https://graph.facebook.com/oauth/access_token?client_id=' + clientID +
		'&redirect_uri=https://' + host + '/r/facebook/return' +
		'&client_secret=' + secret +
		'&code=' + code,
		(err, res, body) => {
			const queries = body.split('&');
			let i, l, token;

			if (err) {
				winston.log(err);
				return reject(err);
			}
			for (i = 0, l = queries.length; i < l; i++) {
				if (queries[i].indexOf('access_token') >= 0) {
					token = queries[i].replace('access_token=', '');
					break;
				}
			}

			resolve(token);
		});
	});
}

function verifyToken(token, appId) {
	return new Promise((resolve, reject) => {
		request('https://graph.facebook.com/app/?access_token=' + token,
		(err, res/* , body */) => {
			let response;

			if (err || !res) {
				return reject(err);
			}

			response = JSON.parse(res);
			if (response.error) return reject(new Error(response.error.message));

			if (response.id === appId) resolve(token);
			else reject(new Error('incorrect appid'));
		});
	});
}

function getDataFromToken(token) {
	const signin = {};

	return new Promise((resolve, reject) => {
		request('https://graph.facebook.com/me?access_token=' + token, (err, res, body) => {
			let user;

			try {
				if (err) throw err;
				user = JSON.parse(body);

				if (user.error) {
					throw (new Error(user.error || 'ERR_FB_SIGNIN'));
				} else if (!user.email) {
					throw (new Error(user.error || 'ERR_FB_SIGNIN_NO_EMAIL'));
				}
	//			response.signin.pictures.push('https://gravatar.com/avatar/' + crypto.createHash('md5').update(user.email).digest('hex') + '/?d=retro');

				(signin.identities = []).push('facebook:' + user.id);
				signin.identities.push('mailto:' + user.email);

				signin.params = {
					facebook: {
						facebookID: user.id,
						accessToken: token,
						name: user.first_name + user.middle_name + user.last_name,
						timezone: user.timezone,
						verified: true,
						picture: 'https://graph.facebook.com/' + user.id + '/picture?type=square'
					}
				};
				resolve(signin);
			} catch (e) {
				reject(e);
			}
		});
	});
}

function fbAuth(changes, next) {
	let key, promise;

	if (!changes.auth || !changes.auth.facebook) return next();

	/* TODO: how do we handle auth from already logged in user?*/
	key = changes.auth.facebook.code || changes.auth.facebook.accessToken;
	if (!key) return next(new Error('FACEBOOK_AUTH_FAILED'));

	promise = ((changes.auth.facebook.code) ? getTokenFromCode(key, config.facebook.client_secret, config.facebook.client_id, config.host) : verifyToken(key, config.facebook.client_id));

	promise.then((token) => {
		if (!token) return next(new Error('Invalid_FB_TOKEN'));
		getDataFromToken(token).then((response) => {
			if (!response) return next(new Error('trouble construct the signin object'));
			changes.auth.signin = response;
			next();
		}).catch((error) => {
			return next(error);
		});
	}).catch((err) => {
		return next(err);
	});
}

bus.on('setstate', fbAuth, 900);

const scriptTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../../../templates/script.hbs'), 'utf8').toString());

bus.on('http/init', app => {
	app.use(route.get('/r/facebook/login', function *() {
		this.body = scriptTemplate({
			title: 'Logging in with Facebook',
			script: SCRIPT_REDIRECT
		});
	}));

	app.use(route.get('/r/facebook/return', function *() {
		this.body = scriptTemplate({
			title: 'Logging in with Facebook',
			script: SCRIPT_MESSAGE
		});
	}));
});

winston.info('facebook module is ready.');
