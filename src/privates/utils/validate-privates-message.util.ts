import type { PrivatesMessageDocument } from '../types/privates-message.type.js';
import { PrivateButtonType } from '@prisma-client';
import { type APIButtonComponent, type APIMessageTopLevelComponent, ComponentType, MessageFlags } from 'discord.js';
import { $enum } from 'ts-enum-util';
import { PrivateButtonStrings } from '../constants/private-button-strings.const.js';

export const PRIVATE_ACTION_PREFIX = 'privateAction/';

const ACTION_TYPES = new Set<string>($enum(PrivateButtonType).getValues());

export function privateActionFromCustomId (customId: string | undefined): PrivateButtonType | null {
	if (!customId?.startsWith(PRIVATE_ACTION_PREFIX)) {
		return null;
	}

	const action = customId.slice(PRIVATE_ACTION_PREFIX.length);

	return ACTION_TYPES.has(action) ? action as PrivateButtonType : null;
}

export function collectPrivateActions (components: APIMessageTopLevelComponent[]): PrivateButtonType[] {
	const actions: PrivateButtonType[] = [];

	for (const component of components) {
		if (component.type === ComponentType.ActionRow) {
			for (const child of component.components) {
				if (child.type === ComponentType.Button && child.style !== 5) {
					const action = privateActionFromCustomId('custom_id' in child ? child.custom_id : undefined);

					if (action) {
						actions.push(action);
					}
				}
			}
		} else if (component.type === ComponentType.Section) {
			if (component.accessory.type === ComponentType.Button && component.accessory.style !== 5) {
				const action = privateActionFromCustomId('custom_id' in component.accessory ? component.accessory.custom_id : undefined);

				if (action) {
					actions.push(action);
				}
			}
		} else if (component.type === ComponentType.Container) {
			actions.push(...collectPrivateActions(component.components as APIMessageTopLevelComponent[]));
		}
	}

	return actions;
}

function walkButtons (
	components: unknown[],
	visit: (button: Record<string, unknown>) => string | null,
	visitOther: (component: Record<string, unknown>) => string | null,
): string | null {
	for (const component of components) {
		if (!component || typeof component !== 'object') {
			return 'в компонентах есть не-объект';
		}

		const item = component as Record<string, unknown>;

		switch (item.type) {
			case ComponentType.ActionRow: {
				if (!Array.isArray(item.components)) {
					return 'ряд без компонентов';
				}

				for (const child of item.components as unknown[]) {
					if (!child || typeof child !== 'object') {
						return 'в ряду есть не-объект';
					}

					const childItem = child as Record<string, unknown>;
					const error = childItem.type === ComponentType.Button ? visit(childItem) : visitOther(childItem);

					if (error) {
						return error;
					}
				}

				break;
			}
			case ComponentType.Section: {
				const accessory = item.accessory as Record<string, unknown> | undefined;

				if (accessory?.type === ComponentType.Button) {
					const error = visit(accessory);

					if (error) {
						return error;
					}
				}

				break;
			}
			case ComponentType.Container: {
				if (!Array.isArray(item.components)) {
					return 'контейнер без компонентов';
				}

				const error = walkButtons(item.components as unknown[], visit, visitOther);

				if (error) {
					return error;
				}

				break;
			}
			default:
				break;
		}
	}

	return null;
}

export function validatePrivatesMessage (raw: unknown): { document: PrivatesMessageDocument } | { error: string } {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return { error: 'документ должен быть JSON-объектом' };
	}

	const source = raw as Record<string, unknown>;
	const components = Array.isArray(source.components) ? source.components as unknown[] : [];
	const embeds = Array.isArray(source.embeds) ? source.embeds as unknown[] : [];
	const content = typeof source.content === 'string' ? source.content : undefined;
	const v2 = (typeof source.flags === 'number' && (source.flags & MessageFlags.IsComponentsV2) !== 0)
		|| components.some((component) => (component as { type?: number } | null)?.type !== ComponentType.ActionRow);

	if (v2 && components.length === 0) {
		return { error: 'в режиме Components V2 нужен хотя бы один компонент' };
	}

	if (!v2 && embeds.length === 0 && !content?.trim() && components.length === 0) {
		return { error: 'сообщение пустое' };
	}

	const seen = new Set<PrivateButtonType>();
	let actionable = 0;

	const error = walkButtons(
		components,
		(button) => {
			if (button.style === 5) {
				return null;
			}

			const action = privateActionFromCustomId(typeof button.custom_id === 'string' ? button.custom_id : undefined);

			if (!action) {
				return `у кнопки ${JSON.stringify(button.label ?? button.custom_id ?? '')} не выбрано действие Koe`;
			}

			if (seen.has(action)) {
				return `действие ${PrivateButtonStrings[action]} используется дважды`;
			}

			seen.add(action);
			actionable += 1;

			return null;
		},
		() => 'Koe не обрабатывает селекты - оставьте только кнопки',
	);

	if (error) {
		return { error };
	}

	if (actionable === 0) {
		return { error: 'в сообщении нет ни одной кнопки с действием Koe' };
	}

	const document: PrivatesMessageDocument = {};

	if (v2) {
		document.components = components as APIMessageTopLevelComponent[];
		document.flags = MessageFlags.IsComponentsV2;
	} else {
		if (content?.trim()) {
			document.content = content;
		}

		if (embeds.length > 0) {
			document.embeds = embeds as PrivatesMessageDocument['embeds'];
		}

		if (components.length > 0) {
			document.components = components as APIMessageTopLevelComponent[];
		}
	}

	return { document };
}

export function withDisabledButtons (components: APIMessageTopLevelComponent[]): APIMessageTopLevelComponent[] {
	return components.map((component) => {
		switch (component.type) {
			case ComponentType.ActionRow:
				return {
					...component,
					components: component.components.map((child) => (child.type === ComponentType.Button
						? { ...child, disabled: true } as APIButtonComponent
						: child)),
				};
			case ComponentType.Section:
				return {
					...component,
					accessory: component.accessory.type === ComponentType.Button
						? { ...component.accessory, disabled: true } as APIButtonComponent
						: component.accessory,
				};
			case ComponentType.Container:
				return {
					...component,
					components: withDisabledButtons(component.components as APIMessageTopLevelComponent[]) as typeof component.components,
				};
			default:
				return component;
		}
	}) as APIMessageTopLevelComponent[];
}
