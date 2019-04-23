import { FilePreprocessor } from '../index';

test('Test if other prefixes are working', () => {
	const fp = new FilePreprocessor({ prefix: '//' });
	const teststring = `
        //define BLA TEST
        BLA
    `;

	const testresult = `
        TEST
    `;
	expect(fp.processString(teststring)).toBe(testresult);
});
