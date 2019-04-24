import { FilePreprocessor } from '../index';

test('Test if define recusion is working', () => {
	const fp = new FilePreprocessor({});
	const teststring = `
        #define TB 5
        #define TA TB
        TA
	`;

	const testresult = `
        5
	`;
	expect(fp.processString(teststring)).toBe(testresult);
});

test('Test if define recusion+combining is working', () => {
	const fp = new FilePreprocessor({});
	const teststring = `
	#define TB 5
	#define TC 7
        #define TA TB.TC
        TA
	`;

	const testresult = `
        5.7
	`;
	expect(fp.processString(teststring)).toBe(testresult);
});
