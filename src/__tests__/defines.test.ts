import { FilePreprocessor } from '../index';

test('Test nonvalue #define #ifdef', () => {
	const fp = new FilePreprocessor();
	const teststring = `
        #define CONTENT keks
        #ifdef CONTENT
        test
        #endif
    `;

	const testresult = `
        test
    `;
	expect(fp.processString(teststring)).toBe(testresult);
});

test('Test if #define replace', () => {
	const fp = new FilePreprocessor();
	const teststring = `
        #define CONTENT bla
        CONTENT
    `;

	const testresult = `
        bla
    `;
	expect(fp.processString(teststring)).toBe(testresult);
});
