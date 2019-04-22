import { forStatement } from "@babel/types";
import * as FS from 'fs';
import * as PATH from 'path';


interface IFilePreprocessorOptions {
	prepend : string[],
	append  : string[]
}

interface IParserStackEntry {
	type     : string,
	result   : boolean,
	wasTrue? : boolean
}

export default class FilePreprocessor {
	private rIsIf 		: RegExp = new RegExp("^\\s*#if\\s+(.*)");
	private rIsElse 	: RegExp = new RegExp("^\\s*#else\\s*$");
	private rIsElseIf 	: RegExp = new RegExp("^\\s*#elseif\\s+(.*)");
	private rIsDefine 	: RegExp = new RegExp("^\\s*#define\\s+(.+?)(\\s+(.+))*\\s*$");
	private rIsEndIf 	: RegExp = new RegExp("^\\s*#endif\\s*$");
	private rIsIfDef 	: RegExp = new RegExp("^\\s*#ifdef\\s+");
	private rIsInclude  : RegExp = new RegExp("^\\s*#include\\s+(.*)")

	private rDefined 	: RegExp = new RegExp("defined\\(\\s*(.*?)\\s*\\)");

	private output		: string[] = [];

	private parserStack : IParserStackEntry[] = [];

	constructor(public options : IFilePreprocessorOptions) {}
	
	public processString(source : string) : string {
		let stackTop;
		let line = 0;
		const lines = source.split(/\r?\n/);
		for(const ln of lines) {
			let res : RegExpExecArray | null;
			line++;
			
			// #ifdef KEKS
			res = this.rIsIfDef.exec(ln);
			if(res !== null) {
				if (this.isDefined(res[0])) {
					this.parserStack.push({type: "if", result: true});
				} else {
					this.parserStack.push({type: "if", result: false});
				}
				continue;
			}

			// #if a == 5
			res = this.rIsIf.exec(ln);
			if(res !== null) {
				if (Function("return (" + this.processDefined(res[0]) + ")")()) {
					this.parserStack.push({type: "if", result: true});
				} else {
					this.parserStack.push({type: "if", result: false});
				}
				continue;
			}
			// #elseif b == 5
			res = this.rIsElseIf.exec(ln);
			if(res !== null) {
				stackTop = this.parserStack[this.parserStack.length - 1];
				if(stackTop && stackTop.type !== "if" && stackTop.type !== "elseif") {
					throw new Error("unexpected #elseif in line " + line);
				} else {
					const wasTrue = stackTop.result || stackTop.wasTrue;
					this.parserStack.pop();
					if (!wasTrue && Function("return (" + this.processDefined(res[0]) + ")")()) {
						this.parserStack.push({type: "elseif", result: true});
					} else {
						this.parserStack.push({type: "elseif", result: false, wasTrue});
					}
				}
				continue;
			}			
			// #else 
			res = this.rIsElse.exec(ln);
			if(res !== null) {
				stackTop = this.parserStack[this.parserStack.length - 1];
				if(stackTop && stackTop.type !== "if" && stackTop.type !== "elseif") {
					throw new Error("unexpected #else in line " + line);
				} else {
					this.parserStack.pop();
					this.parserStack.push({type: "else", result: stackTop.wasTrue || stackTop.result});
				}
				continue;
			}
			// #endif
			res = this.rIsEndIf.exec(ln);
			if(res !== null) {
				stackTop = this.parserStack[this.parserStack.length - 1];
				if(stackTop && stackTop.type !== "if" && stackTop.type !== "elseif") {
					throw new Error("unexpected #endif in line " + line);
				} else {
					this.parserStack.pop();
				}
			}

			// #define
			res = this.rIsDefine.exec(ln);
			if(res !== null) {
				this.setDefine(res[0], res[1]);
				continue;
			}

			// #include
			res = this.rIsInclude.exec(ln);
			if(res !== null) {
				const p = PATH.resolve(__dirname, res[0]);
				const file = FS.readFileSync(p, {encoding: 'utf8'});
				this.processString(file);
				continue;
			}
			


			stackTop = this.parserStack[this.parserStack.length - 1];
			if(stackTop && stackTop.type === "if" && stackTop.result === false) {
				continue;
			}
			if(stackTop && stackTop.type === "else" && stackTop.result === true) {
				continue;
			}
			this.output.push(this.replaceDefines(ln));
		}

		return this.output.join("\n");
	}

	private setDefine(name : string, value : string) : boolean{
		return true;
	}

	private isDefined(def : string) : boolean {
		return true;
	}

	private processDefined(lineIn : string) : string {
		return lineIn;
	}

	private replaceDefines(lineIn : string) : string {
		return lineIn;
	}


}
