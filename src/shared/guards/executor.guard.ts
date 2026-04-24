import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { type ButtonContext, NecordArgumentsHost } from 'necord';
import { CommandsException } from '../exceptions/commands.exception.js';

@Injectable()
export class ExecutorGuard implements CanActivate {
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

		const executorId = (match.params as { executorId: string }).executorId;
		if (!executorId) {
			return true;
		}

		if (executorId !== interaction.user.id) {
			throw new CommandsException({
				name: 'Вы не можете это использовать',
				silent: true,
			});
		}

		return true;
	}
}
