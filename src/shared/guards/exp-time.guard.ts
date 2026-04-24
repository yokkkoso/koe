import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { getWholeNumber } from '@shared/utils/get-whole-number.util.js';
import { unixTime } from '@shared/utils/unix-time.util.js';
import { type ButtonContext, NecordArgumentsHost } from 'necord';
import { CommandsException } from '../exceptions/commands.exception.js';

@Injectable()
export class ExpTimeGuard implements CanActivate {
	public canActivate (context: ExecutionContext): boolean {
		const necordHost = NecordArgumentsHost.create(context);
		const discovery = necordHost.getDiscovery();

		if (!discovery.isModal() && !discovery.isMessageComponent()) {
			return true;
		}

		const [interaction] = necordHost.getContext<'interactionCreate'>() as ButtonContext;
		const matcher = discovery.matcher;
		const match = matcher([interaction.componentType, interaction.customId].join('_'));

		if (!match) {
			return true;
		}

		const expTime = (match.params as { expTime: string }).expTime;
		if (!expTime) {
			return true;
		}

		const convertedExpTime = getWholeNumber(expTime);
		if (Number.isNaN(convertedExpTime)) {
			return true;
		}

		if (unixTime() >= convertedExpTime) {
			throw new CommandsException({
				name: 'Вы не можете это использовать',
				silent: true,
			});
		}

		return true;
	}
}
