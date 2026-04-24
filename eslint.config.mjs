import antfu from '@antfu/eslint-config';

export default antfu({
	isInEditor: false,

	type: 'app',

	stylistic: {
		indent: 'tab',
		quotes: 'single',
		semi: true,
	},

	typescript: true,
	jsonc: false,

	ignores: [
		'prisma',
		'src/prisma/generated',
		'.yarnrc.yml',
	],

	languageOptions: {
		parserOptions: {
			emitDecoratorMetadata: true,
			experimentalDecorators: true,
		},
	},
}, {
	rules: {
		'style/space-before-function-paren': ['error', 'always'],
		'style/brace-style': ['error', '1tbs'],
		'style/arrow-parens': ['error', 'always'],
		'antfu/top-level-function': 'off',
		'antfu/no-top-level-await': 'off',
	},
}, {
	files: ['**/*.ts', '**/*.tsx'],
	rules: {
		'ts/consistent-type-imports': ['error', {
			disallowTypeAnnotations: true,
			fixStyle: 'inline-type-imports',
			prefer: 'type-imports',
		}],
		'import/consistent-type-specifier-style': 'off',
		'style/member-delimiter-style': ['error', {
			multiline: {
				delimiter: 'semi',
				requireLast: true,
			},
			singleline: {
				delimiter: 'comma',
				requireLast: false,
			},
		}],
	},
});
