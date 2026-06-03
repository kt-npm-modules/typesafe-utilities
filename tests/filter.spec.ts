import { describe, expectTypeOf, it } from 'vitest';
import {
	type DeepFilter,
	type FilterInclude,
	type FilterIncludeKeys,
	type NonNeverKeys,
	type OmitNever
} from '../src/filter.js';

type TestType = {
	a: string;
	b: number;
	c: boolean;
};

type TestTypeNever = {
	a: string;
	b: number;
	c: boolean;
	d: never;
};

type TestTypeDeep = {
	z: 'literal';
	a: string;
	b: number;
	c: boolean;
	d: {
		e: string;
		f: number;
		g: boolean;
	};
	h: {
		i: string;
		j: number;
		k: boolean;
	}[];
};

describe('FilterIncludeKeys', () => {
	it('keeps keys whose value type extends the filter', () => {
		expectTypeOf<FilterIncludeKeys<TestType, string | number>>().toEqualTypeOf<'a' | 'b'>();
		expectTypeOf<FilterIncludeKeys<TestType, string>>().toEqualTypeOf<'a'>();
		expectTypeOf<FilterIncludeKeys<TestType, number>>().toEqualTypeOf<'b'>();
		expectTypeOf<FilterIncludeKeys<TestType, boolean>>().toEqualTypeOf<'c'>();
		expectTypeOf<FilterIncludeKeys<TestType, unknown>>().toEqualTypeOf<'a' | 'b' | 'c'>();
	});
});

describe('FilterInclude', () => {
	it('keeps properties whose value type extends the filter', () => {
		expectTypeOf<FilterInclude<TestType, string | number>>().toEqualTypeOf<{
			a: string;
			b: number;
		}>();
		expectTypeOf<FilterInclude<TestType, string>>().toEqualTypeOf<{ a: string }>();
		expectTypeOf<FilterInclude<TestType, number>>().toEqualTypeOf<{ b: number }>();
		expectTypeOf<FilterInclude<TestType, boolean>>().toEqualTypeOf<{ c: boolean }>();
		expectTypeOf<FilterInclude<TestType, unknown>>().toEqualTypeOf<TestType>();
	});
});

describe('NonNeverKeys', () => {
	it('omits keys whose value type is never', () => {
		expectTypeOf<NonNeverKeys<TestType>>().toEqualTypeOf<'a' | 'b' | 'c'>();
		expectTypeOf<NonNeverKeys<TestTypeNever>>().toEqualTypeOf<'a' | 'b' | 'c'>();
	});
});

describe('OmitNever', () => {
	it('strips properties whose value type is never', () => {
		expectTypeOf<OmitNever<TestType>>().toEqualTypeOf<TestType>();
		expectTypeOf<OmitNever<TestTypeNever>>().toEqualTypeOf<{
			a: string;
			b: number;
			c: boolean;
		}>();
	});
});

describe('DeepFilter', () => {
	it('keeps the filtered shape across nested objects and arrays', () => {
		expectTypeOf<DeepFilter<TestTypeDeep, string>>().toEqualTypeOf<{
			z: 'literal';
			a: string;
			d: { e: string };
			h: { i: string }[];
		}>();
		expectTypeOf<DeepFilter<TestTypeDeep, number>>().toEqualTypeOf<{
			b: number;
			d: { f: number };
			h: { j: number }[];
		}>();
		expectTypeOf<DeepFilter<TestTypeDeep, boolean>>().toEqualTypeOf<{
			c: boolean;
			d: { g: boolean };
			h: { k: boolean }[];
		}>();
		expectTypeOf<DeepFilter<TestTypeDeep, string | number>>().toEqualTypeOf<{
			z: 'literal';
			a: string;
			b: number;
			d: { e: string; f: number };
			h: { i: string; j: number }[];
		}>();
		expectTypeOf<DeepFilter<TestTypeDeep, unknown>>().toEqualTypeOf<TestTypeDeep>();
	});
});
