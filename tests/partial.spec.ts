import { describe, expectTypeOf, it } from 'vitest';
import { type PartialDeep } from '../src/partial.js';

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

type TestTypeDeepPartial = PartialDeep<TestType>;

describe('PartialDeep', () => {
	it('accepts shallow subsets at the top level', () => {
		expectTypeOf<{ prop1: 'test'; prop2: 123 }>().toMatchTypeOf<TestTypeDeepPartial>();
		expectTypeOf<{
			propArr: ['test1', 'test2'];
			propArr2: Record<string, never>;
		}>().toMatchTypeOf<TestTypeDeepPartial>();
	});

	it('makes nested object properties optional', () => {
		expectTypeOf<{
			propArr2: { propArr3: ['test1', 'test2'] };
		}>().toMatchTypeOf<TestTypeDeepPartial>();
	});

	it('makes nested arrays-of-objects deeply partial', () => {
		expectTypeOf<{ propArr4: [Record<string, never>] }>().toMatchTypeOf<TestTypeDeepPartial>();
		expectTypeOf<{
			propArr4: [{ propArr5: ['test1', 'test2'] }];
		}>().toMatchTypeOf<TestTypeDeepPartial>();
	});

	it('allows deeply nested object/array combinations', () => {
		expectTypeOf<{ prop3: [Record<string, never>] }>().toMatchTypeOf<TestTypeDeepPartial>();
		expectTypeOf<{
			prop3: [{ prop4: 'test'; prop5: Record<string, never> }];
		}>().toMatchTypeOf<TestTypeDeepPartial>();
		expectTypeOf<{
			prop3: [
				{
					prop4: 'test';
					prop5: { prop6: ['test1', 'test2'] };
				}
			];
		}>().toMatchTypeOf<TestTypeDeepPartial>();
		expectTypeOf<{
			prop3: [
				{
					prop4: 'test';
					prop5: { prop6: ['test1', 'test2'] };
				},
				Record<string, never>
			];
		}>().toMatchTypeOf<TestTypeDeepPartial>();
	});
});
