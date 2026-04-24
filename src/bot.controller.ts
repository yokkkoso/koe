import { Injectable, Logger } from '@nestjs/common';
import { Context, type ContextOf, Once } from 'necord';

@Injectable()
export class BotController {
	private readonly logger = new Logger(BotController.name);

	@Once('clientReady')
	public onReady (
		@Context() [client]: ContextOf<'clientReady'>,
	): void {
		this.logger.log(`Logged in as ${client.user.tag}!`);
	}
}
