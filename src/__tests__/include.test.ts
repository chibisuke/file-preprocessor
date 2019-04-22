import { FilePreprocessor } from '../index';

test('Test if append is working', () => {
	const fp = new FilePreprocessor({ append: ['src/__tests__/append.inc'] });
	const teststring = `
        CONTENT`;

	const testresult = `
        CONTENT
        APPEND`;
	expect(fp.processString(teststring)).toBe(testresult);
});

test('Test if prepend is working', () => {
	const fp = new FilePreprocessor({ prepend: ['src/__tests__/prepend.inc'] });
	const teststring = `        CONTENT
    `;

	const testresult = `PREPEND
        CONTENT
    `;
	expect(fp.processString(teststring)).toBe(testresult);
});

test('Test if #include is working', () => {
	const fp = new FilePreprocessor();
	const teststring = `
        #include <src/__tests__/include.inc>
    `;

	const testresult = `
INCLUDE
    `;
	expect(fp.processString(teststring)).toBe(testresult);
});
