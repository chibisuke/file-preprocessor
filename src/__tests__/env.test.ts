import { FilePreprocessor } from '../index';

test('Test if #IF is working', () => {
	const fp = new FilePreprocessor({});
	const teststring = `
        #ifdef ENV_HOSTNAME
            TEST1
        #endif
        #ifdef ENV_KEAJDSBCNJUIEGF
            TEST2
        #endif
	`;

	const testresult = `
            TEST1
	`;
	expect(fp.processString(teststring)).toBe(testresult);
});
