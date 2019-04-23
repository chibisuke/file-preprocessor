import { forStatement, optionalCallExpression } from '@babel/types';
import * as FS from 'fs';
import * as PATH from 'path';

interface IFilePreprocessorOptions {
	prepend?: string[];
	append?: string[];
	defines?: object;
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

	private readonly rIsIf: RegExp = new RegExp('^\\s*#if\\s+(.*)');
	private readonly rIsElse: RegExp = new RegExp('^\\s*#else\\s*$');
	private readonly rIsElseIf: RegExp = new RegExp('^\\s*#elseif\\s+(.*)');
	private readonly rIsDefine: RegExp = new RegExp('^\\s*#define\\s+(.+?)(\\s+(.+))*\\s*$');
	private readonly rIsEndIf: RegExp = new RegExp('^\\s*#endif\\s*$');
	private readonly rIsIfDef: RegExp = new RegExp('^\\s*#ifdef\\s+(.*)');
	private readonly rIsInclude: RegExp = new RegExp('^\\s*#include\\s+(.*)');
	private readonly rDefined: RegExp = new RegExp('defined\\(\\s*(.*?)\\s*\\)');

	constructor(public options: IFilePreprocessorOptions = {}) {
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
					throw new Error(
						'#include syntax with quotes is not yet supported. Please use full path from CWD with < >. in line ' +
							line,
					);
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

	private setDefine(name: string, value: string): boolean {
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
		let res : RegExpExecArray | null;
		while( (res = this.rDefined.exec(lineIn)) !== null) {
			if(this.defines[res[1]] !== undefined) {
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
