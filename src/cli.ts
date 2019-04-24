// tslint:disable: no-console
import * as fs from 'fs';
import { FilePreprocessor } from './index';

function run() {
	const args: any = {};
	if (!process.argv[2]) {
		console.log('Usage: preprocess <input> [<output>]');
		console.log('if output is ommitted, stdout is used');
		console.log('Environemnt: ');
		console.log('   PREFIX=');
		console.log('   PREPEND=');
		return;
	}
	if (process.env.PREFIX) {
		args.prefix = process.env.PREFIX;
	}
	if (process.env.PREPEND) {
		args.prepend = [process.env.PREPEND];
	}

	const fp: FilePreprocessor = new FilePreprocessor(args);
	const input = fs.readFileSync(process.argv[2], { encoding: 'utf8' });
	const output = fp.processString(input);

	if (process.argv[3]) {
		try {
			fs.writeFileSync(process.argv[3], output, { encoding: 'utf8' });
		} catch (e) {
			console.log(e);
		}
	} else {
		console.log(output);
	}
}

run();
