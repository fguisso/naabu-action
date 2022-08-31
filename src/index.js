import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as installer from './installer';
import { parseFlagsToArray } from './utils';

// Github Actions Inputs
const version = core.getInput('version', { required: false });
const host = core.getInput('host', { required: false });
const list = core.getInput('list', { required: false });
const ports = core.getInput('ports', { required: false });
const output = core.getInput('output', { required: false });
const rate = core.getInput('rate', { required: false });
const json = core.getBooleanInput('json', { required: false });
const passive = core.getBooleanInput('passive', { required: false });
const flags = core.getInput('flags', { required: false });

async function run() {
	try {
		// download and install
		const binPath = await installer.downloadAndInstall(version);
        const params = [];

        if (list.length == 0 || host.length == 0) {
            core.setFailed('You need to provide a host or a list of hosts to naabu.');
            return
        }

        // Setting up flags
        if (host) params.push(`-host=${host}`);
        if (list) params.push(`-list=${list}`);
        if (ports) params.push(`-p=${ports}`);
        if (rate) params.push(`-rate=${rate}`);
        params.push(`-o=${ output ? output : 'naabu.log' }`);
        if (json) params.push('-json');
        if (passive) params.push('-passive');

        if (flags) params.push(...parseFlagsToArray(flags));

        // execute the final command with parsed flags
        core.startGroup(`Running naabu...`);
        await exec.exec(binPath, params);
        core.endGroup();
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();