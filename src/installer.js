import fs from 'fs';
import https from 'https';
import os from 'os';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';

const TOOL_OWNER = "projectdiscovery"
const TOOL_NAME = "naabu"
const ROOT_URL = `https://github.com/${TOOL_OWNER}/${TOOL_NAME}/releases/download`;

// schema from projectdiscovery tools
function getPackage() {
    switch (os.type()) {
        case 'Windows_NT':
            return `windows_amd64`;
        case 'Darwin':
            return `macOS_amd64`;
        case 'Linux':
        default:
            return `linux_amd64`;
    }
}

async function getLatestInfo() {
	return new Promise((resolve, reject) => {
		let data = [];
		https.get({
			hostname: 'api.github.com',
			path: `/repos/${TOOL_OWNER}/${TOOL_NAME}/releases/latest`,
			headers: { 'User-Agent': 'Github Actions' }
		}, res => {
			res.on('data', chunk => data.push(chunk));
			res.on('close', () => resolve(JSON.parse(data.join(''))));
		}).on('error', err => {
			reject(err);
		});
	});
};

export async function downloadAndInstall(selectedVersion) {
	const latest = await getLatestInfo();
    const version = selectedVersion ? selectedVersion : latest.tag_name.replace(/v/g, '');

	core.startGroup(`Download and install ${TOOL_NAME} ${version}`);

	const packageName = getPackage();
	const url = `${ROOT_URL}/v${version}/${TOOL_NAME}_${version}_${packageName}.zip`;

	core.info(`Download version ${version} from ${url}`);

	const downloadDir = await tc.downloadTool(url);
	if (downloadDir == null) {
		throw new Error(`Unable to download ${TOOL_NAME} from ${url}`);
	}

	const installDir = await tc.extractZip(downloadDir);
	if (installDir == null) {
		throw new Error(`Unable to extract ${TOOL_NAME}.`);
	}

	const binPath = `${installDir}/${TOOL_NAME}`
	fs.chmodSync(binPath, "755");

	core.info(`${TOOL_NAME} ${version} was successfully installed to ${installDir}`);
	core.endGroup();
	return binPath
}