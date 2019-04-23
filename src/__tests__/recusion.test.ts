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
