import { Injectable } from '@nestjs/common';
import { ActionRowBuilder, type ButtonBuilder, type Snowflake } from 'discord.js';
import { pageButtons, pageButtonsExtended } from './const/page-buttons.const.js';
import { PageAction } from './enums/page-action.enum.js';

@Injectable()
export class PaginationService {
	public generatePageButtons (
		customId: string,
		currentPage: number,
		totalPages: number,
		expTime: number | string,
		executorId: Snowflake,
	): ActionRowBuilder<ButtonBuilder> {
		const row = new ActionRowBuilder<ButtonBuilder>();

		row.addComponents(
			totalPages > 2
				? pageButtonsExtended(customId, currentPage, totalPages, expTime, executorId)
				: pageButtons(customId, currentPage, totalPages, expTime, executorId),
		);

		if (currentPage === 1) {
			this.editButtonsAvailability(row, totalPages > 2 ? [PageAction.First, PageAction.Prev] : [PageAction.Prev], totalPages, true);
		}

		if (currentPage === totalPages) {
			this.editButtonsAvailability(row, totalPages > 2 ? [PageAction.Next, PageAction.Last] : [PageAction.Next], totalPages, true);
		}

		return row;
	}

	private editButtonsAvailability (
		row: ActionRowBuilder<ButtonBuilder>,
		buttons: PageAction[],
		totalPages: number,
		disable: boolean,
	): ActionRowBuilder<ButtonBuilder> {
		for (const button of buttons) {
			switch (button) {
				case PageAction.First: {
					row.components.splice(
						0,
						1,
						row.components[0]!.setDisabled(disable),
					);
					break;
				}

				case PageAction.Prev: {
					row.components.splice(
						totalPages > 2 ? 1 : 0,
						1,
						row.components[totalPages > 2 ? 1 : 0]!.setDisabled(disable),
					);
					break;
				}

				case PageAction.Next: {
					row.components.splice(
						totalPages > 2 ? 2 : 1,
						1,
						row.components[totalPages > 2 ? 2 : 1]!.setDisabled(disable),
					);
					break;
				}

				case PageAction.Last: {
					row.components.splice(
						3,
						1,
						row.components[3]!.setDisabled(disable),
					);
					break;
				}
			}
		}

		return row;
	}
}
