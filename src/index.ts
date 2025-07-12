const map = [
	// https://github.com
	["github-mirrors.wlist.top", "github.com"],
	// ["github-mirrors-assets.wlist.top", "github.githubassets.com"],
	// ["github-mirrors-collector.wlist.top", "collector.github.com"],
	// ["github-mirrors-api.wlist.top", "api.github.com"],

	// https://github.com/xuxiaocheng0201
	["github-mirrors-avatars.wlist.top", "avatars.githubusercontent.com"],
	["github-mirrors-raw.wlist.top", "raw.githubusercontent.com"],
	["github-mirrors-uploads.wlist.top", "uploads.github.com"],

	// https://github.com/xuxiaocheng0201/github-mirrors/issues
	// ["github-mirrors-s3-user-asset.wlist.top", "github-production-user-asset-6210df.s3.amazonaws.com"],
	["github-mirrors-private-user-images.wlist.top", "private-user-images.githubusercontent.com"],

	// https://github.com/xuxiaocheng0201/github-mirrors/releases
	// ["github-mirrors-objects.wlist.top", "objects.githubusercontent.com"],

	// https://gist.github.com
	["github-mirrors-gist.wlist.top", "gist.github.com"],

	// ["github-mirrors-alive.wlist.top", "alive.github.com"],
	// ["github-mirrors-assets-cdn.wlist.top", "assets-cdn.github.com"],
	// ["github-mirrors-central.wlist.top", "central.github.com"],
	// ["github-mirrors-insights.wlist.top", "insights.github.com"],// 1,
	// ["github-mirrors-live.wlist.top", "live.github.com"],
	// ["github-mirrors-education.wlist.top", "education.github.com"],
	// ["github-mirrors-blog.wlist.top", "github.blog"],
	// ["github-mirrors-community.wlist.top", "github.community"],
	// ["github-mirrors-io.wlist.top", "github.io"],
	//
	// ["github-mirrors-cloud.wlist.top", "cloud.githubusercontent.com"],
	// ["github-mirrors-copilot-proxy.wlist.top", "copilot-proxy.githubusercontent.com"],// 1,
	// ["github-mirrors-desktop.wlist.top", "desktop.githubusercontent.com"],
	// ["github-mirrors-favicons.wlist.top", "favicons.githubusercontent.com"],
	// ["github-mirrors-camo.wlist.top", "camo.githubusercontent.com"],
	// ["github-mirrors-media.wlist.top", "media.githubusercontent.com"],
	// ["github-mirrors-objects-origin.wlist.top", "objects-origin.githubusercontent.com"],// 1,
	// ["github-mirrors-actions.wlist.top", "pipelines.actions.githubusercontent.com"],
	// ["github-mirrors-user-images.wlist.top", "user-images.githubusercontent.com"],
	// ["github-mirrors-private-avatars.wlist.top", "private-avatars.githubusercontent.com"],// 1,
	// ["github-mirrors-secured-user-images.wlist.top", "secured-user-images.githubusercontent.com"],// 1,
	//
	// ["github-mirrors-s3-cloud.wlist.top", "github-cloud.s3.amazonaws.com"],
	// ["github-mirrors-s3-com.wlist.top", "github-com.s3.amazonaws.com"],
	// ["github-mirrors-s3-release-asset.wlist.top", "github-production-release-asset-2e65be.s3.amazonaws.com"],
	// ["github-mirrors-s3-repository-file.wlist.top", "github-production-repository-file-5c1aeb.s3.amazonaws.com"],
	// ["github-mirrors-s3-upload-manifest-file.wlist.top", "github-production-upload-manifest-file-7fdce7.s3.amazonaws.com"],// 1,

];


function replaceToOrigin(value: string) {
	for (const [proxy, origin] of map) {
		value = value.replaceAll(`http\://${proxy}`, `http://${origin}`);
		value = value.replaceAll(`https\://${proxy}`, `https://${origin}`);
		value = value.replaceAll(`ws\://${proxy}`, `ws://${origin}`);
		value = value.replaceAll(`wss\://${proxy}`, `wss://${origin}`);
	}
	for (const [proxy, origin] of map) {
		value = value.replaceAll(`${proxy} `, `${origin} `);
		value = value.replaceAll(` ${proxy}`, ` ${origin}`);
	}
	return value;
}

function replaceToProxy(value: string) {
	for (const [proxy, origin] of map) {
		value = value.replaceAll(`http\://${origin}`, `http://${proxy}`);
		value = value.replaceAll(`https\://${origin}`, `https://${proxy}`);
		value = value.replaceAll(`ws\://${origin}`, `ws://${proxy}`);
		value = value.replaceAll(`wss\://${origin}`, `wss://${proxy}`);
	}
	for (const [proxy, origin] of map) {
		value = value.replaceAll(`${origin} `, `${proxy} `);
		value = value.replaceAll(` ${origin}`, ` ${proxy}`);
	}
	value = value.replaceAll(/[0-9a-f]{24}-application\/javascript/g, 'application/javascript');
	return value;
}

function requireReplaceContent(headers: Headers, method: string) {
	const type = headers.get("content-type");
	let replace: boolean | null = null;
	if (type == null) replace = false;
	else if (type.includes("image")) replace = false;
	else if (type.includes("font")) replace = false;
	else if (type.includes("video")) replace = false;
	else if (type.includes("audio")) replace = false;
	else if (type.includes("text")) replace = true;
	else if (type.includes("javascript")) replace = true;
	else if (type.includes("json")) replace = true;
	else if (type.includes("css")) replace = true;
	else if (type.includes("html")) replace = true;
	else if (type.includes("xml")) replace = true;
	else if (type.includes("application")) replace = true;
	console.log(`on ${method} content type '${type}': replace = ${replace}`);
	return replace ?? false;
}


async function requestToOrigin(request: Request) {
	const originUrl = replaceToOrigin(request.url);
	const headers = new Headers();
	for (const [key, value] of request.headers) {
		headers.set(key, replaceToOrigin(value));
	}
	if (request.method == "GET" || request.method == "HEAD") {
		// TypeError: Request with a GET or HEAD method cannot have a body.
		return new Request(originUrl, {
			method: request.method,
			headers: headers,
		});
	}
	const replace = requireReplaceContent(request.headers, "request");
	const body = replace ? replaceToOrigin(await request.text()) : request.body;
	return new Request(originUrl, {
		method: request.method,
		headers: headers,
		body: body,
	});
}

async function responseToProxy(response: Response) {
	const headers = new Headers();
	for (const [key, value] of response.headers) {
		headers.set(key, replaceToProxy(value));
	}
	headers.set("access-control-allow-origin", "*");
	headers.set("access-control-expose-headers", "*");
	headers.delete("content-security-policy");
	const replace = requireReplaceContent(response.headers, "response");
	const body = replace ? replaceToProxy(await response.text()) : response.body;
	return new Response(body, {
		status: response.status,
		headers: headers,
	});
}

function checkPreflight(request: Request) {
	return request.method == "OPTIONS" && request.headers.has("access-control-request-headers");
}
function getPreflightResponse() {
	return new Response(null, {
		status: 204,
		headers: new Headers({
			'access-control-allow-origin': '*',
			'access-control-expose-headers': '*',
			'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
			'access-control-max-age': '1728000',
		}),
	});
}

function checkAccessible(request: Request, env: Env) {
	const userAgent = request.headers.get("user-agent");
	const ip = request.headers.get("cf-connecting-ip");
	const country = request.headers.get("cf-ipcountry");
	if (userAgent == null || ip == null || country == null) return false;
	if (env.UA_WHITELIST_REGEX.length > 0 && !new RegExp(env.UA_WHITELIST_REGEX).test(userAgent)) return false;
	if (env.UA_BLACKLIST_REGEX.length > 0 && new RegExp(env.UA_BLACKLIST_REGEX).test(userAgent)) return false;
	if (env.IP_WHITELIST_REGEX.length > 0 && !new RegExp(env.IP_WHITELIST_REGEX).test(ip)) return false;
	if (env.IP_BLACKLIST_REGEX.length > 0 && new RegExp(env.IP_BLACKLIST_REGEX).test(ip)) return false;
	if (env.REGION_WHITELIST_REGEX.length > 0 && !new RegExp(env.REGION_WHITELIST_REGEX).test(country)) return false;
	if (env.REGION_BLACKLIST_REGEX.length > 0 && new RegExp(env.REGION_BLACKLIST_REGEX).test(country)) return false;
	// ok.
	return true;
}


export default {
	async fetch(request, env, _ctx): Promise<Response> {
		try {
			if (!checkAccessible(request, env)) {
				return new Response("Not Implemented", { status: 501 });
			}
			let response: Response;
			if (checkPreflight(request)) {
				response = getPreflightResponse();
			} else {
				const originRequest = await requestToOrigin(request);
				const originResponse = await fetch(originRequest);
				response = await responseToProxy(originResponse);
			}
			console.info({
				"client-ip": request.headers.get("cf-connecting-ip"),
				"user-agent": request.headers.get("user-agent"),
				"url": request.url,
			});
			return response;
		} catch (error) {
			console.error({
				"error": error instanceof Error ? `${error.name}: ${error.message}` : `${error}`,
				"client-ip": request.headers.get("cf-connecting-ip"),
				"user-agent": request.headers.get("user-agent"),
				"url": request.url,
			});
			return new Response("Internal Server Error", { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
