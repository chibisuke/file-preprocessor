import { FilePreprocessor } from '../index';

test('Test if #IF is working', () => {
	const fp = new FilePreprocessor({});
	const teststring = `
		A
		#if 5==5
			true
		#endif
		#if 5 == 4
			false
		#endif
		B
	`;

	const testresult = `
		A
			true
		B
	`;
	expect(
		fp.processString(teststring)
	).toBe(testresult);
});


test('Test if #ELSE is working', () => {
	const fp = new FilePreprocessor({});
	const teststring = `
		A
		#if 5==4
			true
		#elseif 5 == 3
			fail
		#else
			false
		#endif
		B
	`;

	const testresult = `
		A
			false
		B
	`;
	expect(
		fp.processString(teststring)
	).toBe(testresult);
});

test('Test if #ELSEIF is working', () => {
	const fp = new FilePreprocessor({});
	const teststring = `
		A
		#if 5==4
			X1
		#elseif 5 == 3
			X2
		#elseif 5 == 5
			X3
		#elseif 5 == 1
			X4
		#else
			X5
		#endif
		B
	`;

	const testresult = `
		A
			X3
		B
	`;
	expect(
		fp.processString(teststring)
	).toBe(testresult);
});