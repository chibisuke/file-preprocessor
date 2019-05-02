import { FilePreprocessor } from '../index';

test('Test if defined() is working', () => {
	const fp = new FilePreprocessor();
	const teststring = `
        #define BLUBB
        #if defined(BLA)
            TEST1
        #endif
        #if defined(BLUBB)
            TEST2
        #endif
    `;

	const testresult = `
            TEST2
    `;
	expect(fp.processString(teststring)).toBe(testresult);
});


test('Test if defines inside if is working', () => {
	const fp = new FilePreprocessor();
	const teststring = `
        #define BLUBB 5
        #if BLUBB == 3
            TEST1
        #elseif BLUBB == 5
            TEST2
        #endif
    `;

	const testresult = `
            TEST2
    `;
	expect(fp.processString(teststring)).toBe(testresult);
});
