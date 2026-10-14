// Strict-CSP harness: serves skreed-shades.html at https://local.test the way an artifact runs it
// (wrapped in the publish skeleton, CSP header, three from the jsDelivr path, fonts from Google's hosts, nothing else).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SHOTS = path.join(ROOT, 'shots');
const SCR = path.resolve(ROOT, '..');
export const CSP = "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:; connect-src 'none'";
const SKELETON = (body) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;
const FONT_CSS = `@font-face{font-family:'Poppins';font-style:normal;font-weight:700;font-display:swap;src:url(https://fonts.gstatic.com/local/poppins-700.woff2) format('woff2')}
@font-face{font-family:'Open Sans';font-style:normal;font-weight:400 600;font-stretch:100%;font-display:swap;src:url(https://fonts.gstatic.com/local/opensans.woff2) format('woff2')}`;

export async function launch() {
	return chromium.launch({ args: [ '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl' ] });
}

export async function open( browser, { w = 390, h = 844, phone = false, dpr, query = '?render=force&mode=3d', hash = '#/shades/blissful-blue/', file = path.join( ROOT, 'skreed-shades.html' ), reducedMotion, offlineThree = false, delayThreeMs = 0, init = null, offline = false } = {} ) {
	const ctx = await browser.newContext( { viewport: { width: w, height: h }, deviceScaleFactor: dpr ?? ( phone ? 2 : 1 ), isMobile: phone, hasTouch: phone, reducedMotion: reducedMotion || 'no-preference' } );
	const requests = [], net = { offline: false };
	await ctx.route( '**/*', async ( r ) => {
		const u = new URL( r.request().url() );
		requests.push( u.href );
		if ( u.hostname === 'local.test' ) return r.fulfill( { body: SKELETON( fs.readFileSync( file, 'utf8' ) ), headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': CSP } } );
		if ( u.hostname === 'cdn.jsdelivr.net' ) {
			if ( offlineThree ) return r.abort( 'internetdisconnected' );
			if ( delayThreeMs ) await new Promise( ( res ) => setTimeout( res, delayThreeMs ) );
			if ( net.offline ) return r.abort( 'internetdisconnected' ); // route.fulfill would bypass context offline
			const p = path.join( ROOT, 'node_modules/three', u.pathname.replace( '/npm/three@0.165.0/', '' ) );
			if ( ! fs.existsSync( p ) ) return r.fulfill( { status: 404, body: 'not found' } );
			return r.fulfill( { body: fs.readFileSync( p ), headers: { 'content-type': 'text/javascript', 'access-control-allow-origin': '*' } } );
		}
		if ( u.hostname === 'fonts.googleapis.com' ) return r.fulfill( { body: FONT_CSS, headers: { 'content-type': 'text/css', 'access-control-allow-origin': '*' } } );
		if ( u.hostname === 'fonts.gstatic.com' ) {
			const f = u.pathname.includes( 'poppins' ) ? 'gf-poppins-latin.woff2' : 'gf-opensans-latin.woff2';
			return r.fulfill( { body: fs.readFileSync( path.join( SCR, f ) ), headers: { 'content-type': 'font/woff2', 'access-control-allow-origin': '*' } } );
		}
		return r.abort();
	} );
	await ctx.addInitScript( () => {
		window.__csp = [];
		document.addEventListener( 'securitypolicyviolation', ( e ) => window.__csp.push( e.violatedDirective + ' ' + e.blockedURI ) );
	} );
	if ( init ) await ctx.addInitScript( init );
	if ( offline ) { net.offline = true; await ctx.setOffline( true ); }
	const page = await ctx.newPage();
	const log = [];
	page.on( 'console', ( m ) => { if ( m.type() === 'error' || m.type() === 'warning' ) log.push( m.type() + ': ' + m.text().slice( 0, 200 ) ); } );
	page.on( 'pageerror', ( e ) => log.push( 'pageerror: ' + String( e ).slice( 0, 200 ) ) );
	await page.goto( 'https://local.test/' + query + hash, { waitUntil: 'load' } );
	return { ctx, page, log, requests, net };
}

export async function waitLive( page, timeout = 180000 ) {
	await page.waitForFunction( () => document.documentElement.dataset.stage === 'live' && window.__stage, null, { timeout, polling: 250 } );
	await settle( page, timeout );
}
export async function settle( page, timeout = 120000 ) {
	await page.waitForFunction( () => { const s = window.__stage && window.__stage.state(); return s && ! s.busy && ! s.raf; }, null, { timeout, polling: 200 } );
	await page.waitForTimeout( 450 ); // DOM swaps (400 ms) finish
}
export async function fontsReady( page ) { await page.evaluate( () => document.fonts.ready ); }
// Playwright capture. A raw CDP Page.captureScreenshot with a clip scale clears Playwright's device-metrics emulation
// (the page then reads devicePixelRatio 1 until the emulation is re-applied), which made some round-1 phone frames
// DPR-1 renders. Playwright's own capture keeps the emulation; before each capture the canvas must be at the page's
// pixel ratio (canvas.width = CSS width x min(devicePixelRatio, cap)), and the check is recorded.
export const dprLog = [];
export async function shot( page, name, full = false ) {
	const chk = await page.evaluate( () => {
		const c = document.querySelector( '#stage3d canvas' ); if ( ! c || ! c.clientWidth || document.documentElement.dataset.stage !== 'live' ) return null;
		const live = window.__events.filter( ( e ) => e.type === 'stage_live' ).pop(); const low = live && live.tier === 'low';
		const cap = window.SK.layoutClass() === 'phone' || window.SK.mqCoarse.matches ? 2 : 1.5, want = low ? 1 : Math.min( window.devicePixelRatio, cap );
		return { dpr: window.devicePixelRatio, ratio: +( c.width / c.clientWidth ).toFixed( 3 ), want };
	} ).catch( () => null );
	if ( chk ) dprLog.push( { name, ...chk, ok: Math.abs( chk.ratio - chk.want ) < 0.01 } );
	const buf = await page.screenshot( { fullPage: full, timeout: 240000 } );
	fs.writeFileSync( path.join( SHOTS, name ), buf );
}
// CDP touch drag with explicit timing (ms between moves)
export async function touchDrag( page, x0, y0, x1, y1, steps, msPerStep ) {
	const c = await page.context().newCDPSession( page );
	const t0 = Date.now() / 1000;
	let t = t0;
	await c.send( 'Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [ { x: x0, y: y0 } ], timestamp: t } );
	for ( let i = 1; i <= steps; i ++ ) {
		t += msPerStep / 1000;
		const x = x0 + ( x1 - x0 ) * i / steps, y = y0 + ( y1 - y0 ) * i / steps;
		await c.send( 'Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [ { x, y } ], timestamp: t } );
	}
	await c.send( 'Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: t + 0.001 } );
	await c.detach();
}
export async function mouseDrag( page, x0, y0, x1, y1, steps, msPerStep ) {
	await page.mouse.move( x0, y0 );
	await page.mouse.down();
	for ( let i = 1; i <= steps; i ++ ) {
		await page.mouse.move( x0 + ( x1 - x0 ) * i / steps, y0 + ( y1 - y0 ) * i / steps );
		if ( msPerStep ) await page.waitForTimeout( msPerStep );
	}
	await page.mouse.up();
}
