import { forStatement, optionalCallExpression } from '@babel/types';
import * as FS from 'fs';
import * as PATH from 'path';
interface IFilePreprocessorOptionsDefines {
	[key: string]: string;
}

interface IFilePreprocessorOptions {
	prepend?: string[];
	append?: string[];
	defines?: IFilePreprocessorOptionsDefines;
	prefix?: string;
}

interface IParserStackEntry {
	type: string;
	result: boolean;
	wasTrue?: boolean;
}

interface IDefines {
	[key: string]: { value?: string; regex?: RegExp };
}

export class FilePreprocessor {
	protected output: string[] = [];
	protected parserStack: IParserStackEntry[] = [];
	protected defines: IDefines = {};

	private rIsIf: RegExp;
	private rIsElse: RegExp;
	private rIsElseIf: RegExp;
	private rIsDefine: RegExp;
	private rIsEndIf: RegExp;
	private rIsIfDef: RegExp;
	private rIsInclude: RegExp;
	private rDefined: RegExp;

	private rLocalInclude: RegExp = new RegExp('.*\\((.*):[0-9]+:[0-9]+\\)');

	constructor(public options: IFilePreprocessorOptions = {}) {
		const prefix = options.prefix || '#';

		this.rIsIf = new RegExp('^\\s*' + prefix + 'if\\s+(.*)');
		this.rIsElse = new RegExp('^\\s*' + prefix + 'else\\s*$');
		this.rIsElseIf = new RegExp('^\\s*' + prefix + 'elseif\\s+(.*)');
		this.rIsDefine = new RegExp('^\\s*' + prefix + 'define\\s+(.+?)(\\s+(.+))*\\s*$');
		this.rIsEndIf = new RegExp('^\\s*' + prefix + 'endif\\s*$');
		this.rIsIfDef = new RegExp('^\\s*' + prefix + 'ifdef\\s+(.*)');
		this.rIsInclude = new RegExp('^\\s*' + prefix + 'include\\s+(.*)');
		this.rDefined = new RegExp('defined\\(\\s*(.*?)\\s*\\)');

		if (options.defines) {
			for (const name in options.defines) {
				if (options.defines.hasOwnProperty(name)) {
					this.setDefine(name, options.defines[name]);
				}
			}
		}
		for(let name in process.env) {
			if (process.env.hasOwnProperty(name)) {
				this.setDefine("ENV_"+name, process.env[name] || null);
			}
		}
		// 	this.defines = options.defines || {};
	}

	public processString(source: string, nested: boolean = false): string {
		let stackTop;
		let line = 0;
		const lines = source.split(/\r?\n/);

		if (!nested && this.options.prepend) {
			for (const ap of this.options.prepend) {
				const file = FS.readFileSync(ap, { encoding: 'utf8' });
				this.processString(file, true);
			}
		}

		for (const ln of lines) {
			let res: RegExpExecArray | null;
			line++;

			// #ifdef KEKS
			res = this.rIsIfDef.exec(ln);
			if (res !== null) {
				if (this.isDefined(res[1])) {
					this.parserStack.push({ type: 'if', result: true });
				} else {
					this.parserStack.push({ type: 'if', result: false });
				}
				continue;
			}

			// #if a == 5
			res = this.rIsIf.exec(ln);
			if (res !== null) {
				const fun = new Function('return (' + this.processDefined(res[1]) + ')');
				if (fun()) {
					this.parserStack.push({ type: 'if', result: true });
				} else {
					this.parserStack.push({ type: 'if', result: false });
				}
				continue;
			}
			// #elseif b == 5
			res = this.rIsElseIf.exec(ln);
			if (res !== null) {
				stackTop = this.parserStack[this.parserStack.length - 1];
				if (stackTop && stackTop.type !== 'if' && stackTop.type !== 'elseif') {
					throw new Error('unexpected #elseif in line ' + line);
				} else {
					const wasTrue = stackTop.result || stackTop.wasTrue;
					this.parserStack.pop();
					const fun = new Function('return (' + this.processDefined(res[1]) + ')');
					if (!wasTrue && fun()) {
						this.parserStack.push({ type: 'elseif', result: true });
					} else {
						this.parserStack.push({ type: 'elseif', result: false, wasTrue });
					}
				}
				continue;
			}
			// #else
			res = this.rIsElse.exec(ln);
			if (res !== null) {
				stackTop = this.parserStack[this.parserStack.length - 1];
				if (stackTop && stackTop.type !== 'if' && stackTop.type !== 'elseif') {
					throw new Error('unexpected #else in line ' + line);
				} else {
					this.parserStack.pop();
					this.parserStack.push({ type: 'else', result: stackTop.wasTrue || stackTop.result });
				}
				continue;
			}
			// #endif
			res = this.rIsEndIf.exec(ln);
			if (res !== null) {
				stackTop = this.parserStack[this.parserStack.length - 1];
				if (stackTop && stackTop.type !== 'if' && stackTop.type !== 'elseif' && stackTop.type !== 'else') {
					throw new Error('unexpected #endif in line ' + line);
				} else {
					this.parserStack.pop();
				}
				continue;
			}

			// #define
			res = this.rIsDefine.exec(ln);
			if (res !== null) {
				this.setDefine(res[1], res[3]);
				continue;
			}

			// #include
			res = this.rIsInclude.exec(ln);
			if (res !== null) {
				let p: string;
				if (res[1].charAt(0) === '<') {
					p = res[1].replace(/[<>]/g, '');
					p = PATH.resolve(process.cwd(), p);
				} else {
					p = res[1].replace(/"/g, '');
					res = this.rLocalInclude.exec((new Error().stack || '').split('\n')[2]);
					if (!res) {
						throw new Error('#include syntax with quotes - detection of current path failed');
					}
					p = PATH.resolve(PATH.dirname(res[1]), p);
				}
				const file = FS.readFileSync(p, { encoding: 'utf8' });
				this.processString(file, true);
				continue;
			}

			stackTop = this.parserStack[this.parserStack.length - 1];
			if (stackTop && stackTop.type === 'if' && stackTop.result === false) {
				continue;
			}
			if (stackTop && stackTop.type === 'elseif' && stackTop.result === false) {
				continue;
			}
			if (stackTop && stackTop.type === 'else' && stackTop.result === true) {
				continue;
			}
			this.output.push(this.replaceDefines(ln));
		}
		if (!nested && this.options.append) {
			for (const ap of this.options.append) {
				const file = FS.readFileSync(ap, { encoding: 'utf8' });
				this.processString(file, true);
			}
		}
		return this.output.join('\n');
	}

	private setDefine(name: string, value: string | null): boolean {
		if (this.defines[name]) {
			throw new Error(name + ' is already defined');
		} else if (value) {
			this.defines[name] = { value, regex: new RegExp('(\\W*)(' + name + ')(\\W*)') };
		} else {
			this.defines[name] = {};
		}
		return true;
	}

	private isDefined(def: string): boolean {
		if (this.defines[def] !== undefined) {
			return true;
		}
		return false;
	}

	private processDefined(lineIn: string): string {
		let res: RegExpExecArray | null;
		// tslint:disable-next-line: no-conditional-assignment
		while ((res = this.rDefined.exec(lineIn)) !== null) {
			if (this.defines[res[1]] !== undefined) {
				lineIn = lineIn.replace(res[0], 'true');
			} else {
				lineIn = lineIn.replace(res[0], 'false');
			}
		}
		return lineIn;
	}

	private replaceDefines(lineIn: string): string {
		for (const def in this.defines) {
			if (this.defines.hasOwnProperty(def)) {
				const value = this.defines[def];
				if (value.regex && value.value !== undefined) {
					lineIn = lineIn.replace(value.regex, '$1' + value.value + '$3');
				}
			}
		}
		return lineIn;
	}
}
