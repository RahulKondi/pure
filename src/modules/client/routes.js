/* @flow */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Home from '../../ui/components/views/Home.web';
import ServerHTML from './ServerHTML';
import { config } from '../../core-server';

export default function(): Function {
	return function *(next) {
		if (this.method === 'GET') {
			this.body = '<!DOCTYPE html>' + ReactDOMServer.renderToStaticMarkup(
				<ServerHTML
					locale='en'
					title='Hey, Neighbor!'
					description='Connect with your neighbors on Hey, Neighbor!'
					body={ReactDOMServer.renderToString(
						<Home
							url={`https://play.google.com/store/apps/details?id=${config.package_name}`}
							radiumConfig={{ userAgent: this.headers['user-agent'] }}
						/>
					)}
					image={`${this.request.origin}/assets/thumbnail.png`}
					permalink={this.request.href}
				/>
			);
		}

		return yield next;
	};
}
