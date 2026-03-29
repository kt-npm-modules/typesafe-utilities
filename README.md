[![NPM Version](https://img.shields.io/npm/v/%40ktarmyshov%2Ftypesafe-utilities)](https://www.npmjs.com/package/@ktarmyshov/typesafe-utilities)
[![CI](https://github.com/kt-npm-modules/typesafe-utilities/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/kt-npm-modules/typesafe-utilities/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=kt-npm-modules_typesafe-utilities&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=kt-npm-modules_typesafe-utilities)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=kt-npm-modules_typesafe-utilities&metric=bugs)](https://sonarcloud.io/summary/new_code?id=kt-npm-modules_typesafe-utilities)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=kt-npm-modules_typesafe-utilities&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=kt-npm-modules_typesafe-utilities)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=kt-npm-modules_typesafe-utilities&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=kt-npm-modules_typesafe-utilities)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@ktarmyshov/typesafe-utilities)](https://socket.dev/npm/package/@ktarmyshov/typesafe-utilities/overview)

# typesafe-utilities

Some very specific type-safe utilities that are not available in [type-fest (very extensive)](https://www.npmjs.com/package/type-fest).

# Usage

## Property paths

Difference to `type-fest`:

- Array property path can be specified like `prop1[].prop2` (without index)
- Does not support tuples
- Supports only `Record<string, unknown>`
- Somewhat better auto-complete for nested arrays of objects

```typescript
/* eslint-disable @typescript-eslint/no-unused-vars  */
import { PropertyPaths } from '../src/paths';

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

const test1: TestTypePropertyPaths = 'prop1';
const test2: TestTypePropertyPaths = 'prop2';
const test3: TestTypePropertyPaths = 'propArr';
const test4: TestTypePropertyPaths = 'propArr[]';
const test5: TestTypePropertyPaths = 'propArr[0]';
const test6: TestTypePropertyPaths = 'propArr2.propArr3';
const test7: TestTypePropertyPaths = 'propArr2.propArr3[]';
const test8: TestTypePropertyPaths = 'propArr2.propArr3[0]';
const test9: TestTypePropertyPaths = 'propArr4';
const test10: TestTypePropertyPaths = 'propArr4[]';
const test11: TestTypePropertyPaths = 'propArr4[0]';
const test12: TestTypePropertyPaths = 'propArr4[].propArr5';
const test13: TestTypePropertyPaths = 'propArr4[].propArr5[]';
const test14: TestTypePropertyPaths = 'propArr4[].propArr5[0]';
const test15: TestTypePropertyPaths = 'propArr4[0].propArr5';
const test16: TestTypePropertyPaths = 'propArr4[0].propArr5[]';
const test17: TestTypePropertyPaths = 'propArr4[0].propArr5[0]';
const test18: TestTypePropertyPaths = 'prop3';
const test19: TestTypePropertyPaths = 'prop3[]';
const test21: TestTypePropertyPaths = 'prop3[].prop4';
const test22: TestTypePropertyPaths = 'prop3[].prop5';
const test23: TestTypePropertyPaths = 'prop3[].prop5.prop6';
const test24: TestTypePropertyPaths = 'prop3[].prop5.prop6[]';
const test25: TestTypePropertyPaths = 'prop3[0]';
const test26: TestTypePropertyPaths = 'prop3[0].prop4';
const test27: TestTypePropertyPaths = 'prop3[0].prop5';
const test28: TestTypePropertyPaths = 'prop3[0].prop5.prop6';
const test29: TestTypePropertyPaths = 'prop3[0].prop5.prop6[]';
const test30: TestTypePropertyPaths = 'prop3[0].prop5.prop6[0]';

// @ts-expect-error: Invalid property path
const test_e1: TestTypePropertyPaths = ''; // should be error
// @ts-expect-error: Invalid property path
const test_e2: TestTypePropertyPaths = 'prop1.prop2'; // should be error
// @ts-expect-error: Invalid property path
const test_e3: TestTypePropertyPaths = 'prop1[]'; // should be error
// @ts-expect-error: Invalid property path
const test_e4: TestTypePropertyPaths = 'prop1[0]'; // should be error
// @ts-expect-error: Invalid property path
const test_e5: TestTypePropertyPaths = 'propArr.'; // should be error
```

## DeepPartial

```typescript
/* eslint-disable @typescript-eslint/no-unused-vars */
import { type DeepPartial } from '../src/partial';

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

type TestTypeDeepPartial = DeepPartial<TestType>;
const test1: TestTypeDeepPartial = {
	prop1: 'test',
	prop2: 123
};
const test2: TestTypeDeepPartial = {
	propArr: ['test1', 'test2'],
	propArr2: {}
};
const test3: TestTypeDeepPartial = {
	propArr2: {
		propArr3: ['test1', 'test2']
	}
};
const test4: TestTypeDeepPartial = {
	propArr4: [{}]
};
const test5: TestTypeDeepPartial = {
	propArr4: [
		{
			propArr5: ['test1', 'test2']
		}
	]
};
const test6: TestTypeDeepPartial = {
	prop3: [{}]
};
const test7: TestTypeDeepPartial = {
	prop3: [
		{
			prop4: 'test',
			prop5: {}
		}
	]
};
const test8: TestTypeDeepPartial = {
	prop3: [
		{
			prop4: 'test',
			prop5: {
				prop6: ['test1', 'test2']
			}
		}
	]
};
const test9: TestTypeDeepPartial = {
	prop3: [
		{
			prop4: 'test',
			prop5: {
				prop6: ['test1', 'test2']
			}
		},
		{}
	]
};
```

## Filter & DeepFilter

```typescript
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	DeepFilter,
	type FilterInclude,
	type FilterIncludeKeys,
	type NonNeverKeys,
	type OmitNever
} from '../src/filter';
import { type Equal, type Expect } from './helpers';

type TestType = {
	a: string;
	b: number;
	c: boolean;
};

type asserts_FilterKeys = [
	Expect<Equal<FilterIncludeKeys<TestType, string | number>, 'a' | 'b'>>,
	Expect<Equal<FilterIncludeKeys<TestType, string>, 'a'>>,
	Expect<Equal<FilterIncludeKeys<TestType, number>, 'b'>>,
	Expect<Equal<FilterIncludeKeys<TestType, boolean>, 'c'>>,
	Expect<Equal<FilterIncludeKeys<TestType, unknown>, 'a' | 'b' | 'c'>>
];

type asserts_Filter = [
	Expect<Equal<FilterInclude<TestType, string | number>, { a: string; b: number }>>,
	Expect<Equal<FilterInclude<TestType, string>, { a: string }>>,
	Expect<Equal<FilterInclude<TestType, number>, { b: number }>>,
	Expect<Equal<FilterInclude<TestType, boolean>, { c: boolean }>>,
	Expect<Equal<FilterInclude<TestType, unknown>, TestType>>
];

type TestTypeNever = {
	a: string;
	b: number;
	c: boolean;
	d: never;
};

type asserts_NeverKeys = [
	Expect<Equal<NonNeverKeys<TestType>, 'a' | 'b' | 'c'>>,
	Expect<Equal<NonNeverKeys<TestTypeNever>, 'a' | 'b' | 'c'>>
];

type asserts_OmitNever = [
	Expect<Equal<OmitNever<TestType>, TestType>>,
	Expect<Equal<OmitNever<TestTypeNever>, { a: string; b: number; c: boolean }>>
];

type TestTypeDeep = {
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

type asserts_DeepFilter = [
	Expect<
		Equal<DeepFilter<TestTypeDeep, string>, { a: string; d: { e: string }; h: { i: string }[] }>
	>,
	Expect<
		Equal<DeepFilter<TestTypeDeep, number>, { b: number; d: { f: number }; h: { j: number }[] }>
	>,
	Expect<
		Equal<DeepFilter<TestTypeDeep, boolean>, { c: boolean; d: { g: boolean }; h: { k: boolean }[] }>
	>,
	Expect<
		Equal<
			DeepFilter<TestTypeDeep, string | number>,
			{ a: string; b: number; d: { e: string; f: number }; h: { i: string; j: number }[] }
		>
	>,
	Expect<Equal<DeepFilter<TestTypeDeep, unknown>, TestTypeDeep>>
];
```
