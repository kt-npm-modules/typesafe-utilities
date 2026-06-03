import { Paths } from 'type-fest';
import { describe, expectTypeOf, it } from 'vitest';
import { PropertyPaths } from '../src/paths.js';

type TestType = {
	prop1: string;
	prop2: number;
	propArr: string[];
	propArr2: {
		propArr3: string[];
	};
	propArr4: {
		propArr5: string[];
	}[];
	prop3: {
		prop4: string;
		prop5: {
			prop6: string[];
		};
	}[];
};

type TestTypePropertyPaths = PropertyPaths<TestType>;

describe('PropertyPaths', () => {
	it('accepts top-level property names', () => {
		expectTypeOf<'prop1'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop2'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr'>().toMatchTypeOf<TestTypePropertyPaths>();
	});

	it('accepts array bracket suffixes (empty and indexed)', () => {
		expectTypeOf<'propArr[]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr[0]'>().toMatchTypeOf<TestTypePropertyPaths>();
	});

	it('accepts nested object paths', () => {
		expectTypeOf<'propArr2.propArr3'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr2.propArr3[]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr2.propArr3[0]'>().toMatchTypeOf<TestTypePropertyPaths>();
	});

	it('accepts arrays of objects with bracket-prefixed sub-paths', () => {
		expectTypeOf<'propArr4'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr4[]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr4[0]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr4[].propArr5'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr4[].propArr5[]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr4[].propArr5[0]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr4[0].propArr5'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr4[0].propArr5[]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'propArr4[0].propArr5[0]'>().toMatchTypeOf<TestTypePropertyPaths>();
	});

	it('accepts deeply nested array-object-array paths', () => {
		expectTypeOf<'prop3'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[].prop4'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[].prop5'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[].prop5.prop6'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[].prop5.prop6[]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[0]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[0].prop4'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[0].prop5'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[0].prop5.prop6'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[0].prop5.prop6[]'>().toMatchTypeOf<TestTypePropertyPaths>();
		expectTypeOf<'prop3[0].prop5.prop6[0]'>().toMatchTypeOf<TestTypePropertyPaths>();
	});

	it('rejects invalid property paths', () => {
		// Empty string is not a valid path.
		// @ts-expect-error: empty path
		const e1: TestTypePropertyPaths = '';
		void e1;
		// Non-existent nested path: prop1 is a string and has no sub-property.
		// @ts-expect-error: invalid sub-path
		const e2: TestTypePropertyPaths = 'prop1.prop2';
		void e2;
		// Array suffix on a non-array property.
		// @ts-expect-error: prop1 is not an array
		const e3: TestTypePropertyPaths = 'prop1[]';
		void e3;
		// Indexed suffix on a non-array property.
		// @ts-expect-error: prop1 is not an array
		const e4: TestTypePropertyPaths = 'prop1[0]';
		void e4;
		// Trailing dot is not a valid suffix.
		// @ts-expect-error: dangling dot
		const e5: TestTypePropertyPaths = 'propArr.';
		void e5;
	});

	it('aligns conceptually with type-fest Paths (bracket notation)', () => {
		type FestPaths = Paths<TestType, { bracketNotation: true }>;
		expectTypeOf<'prop3[0].prop5.prop6[0]'>().toMatchTypeOf<FestPaths>();
	});
});
