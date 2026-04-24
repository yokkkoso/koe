import { Module } from '@nestjs/common';
import { PaginationModule } from '../pagination/pagination.module.js';
import { PrivatesCommand } from './commands/privates.command.js';
import { PrivateAccessGiveOrTakeController } from './controllers/access/access-give-or-take.controller.js';
import { PrivateAccessGiveController } from './controllers/access/access-give.controller.js';
import { PrivateAccessTakeController } from './controllers/access/access-take.controller.js';
import { PrivateLockOrUnlockController } from './controllers/closedness/lock-or-unlock.controller.js';
import { PrivateLockController } from './controllers/closedness/lock.controller.js';
import { PrivateUnlockController } from './controllers/closedness/unlock.controller.js';
import { PrivateKickController } from './controllers/misc/kick.controller.js';
import { PrivateRenameController } from './controllers/misc/rename.controller.js';
import { PrivateTransferController } from './controllers/misc/transfer.controller.js';
import { PrivateUserLimitController } from './controllers/misc/user-limit.controller.js';
import { PrivateMuteOrUnmuteController } from './controllers/mute/mute-or-unmute.controller.js';
import { PrivateMuteController } from './controllers/mute/mute.controller.js';
import { PrivateUnmuteController } from './controllers/mute/unmute.controller.js';
import { PrivatesMessageButtonAddController } from './controllers/panel/message-button-add.controller.js';
import {
	PrivatesMessageButtonButtonsPerRowController,
} from './controllers/panel/message-button-buttons-per-row.controller.js';
import { PrivatesMessageButtonDeleteController } from './controllers/panel/message-button-delete.controller.js';
import { PrivatesMessageButtonPositionController } from './controllers/panel/message-button-position.controller.js';
import { PrivatesMessagePreviewController } from './controllers/panel/message-preview.controller.js';
import { PrivatesMessageSendController } from './controllers/panel/message-send.controller.js';
import { PrivatesPanelReturnController } from './controllers/panel/panel-return.controller.js';
import { PrivateHideOrShowController } from './controllers/visibility/hide-or-show.controller.js';
import { PrivateHideController } from './controllers/visibility/hide.controller.js';
import { PrivateShowController } from './controllers/visibility/show.controller.js';
import { PrivateMessageFactory } from './factory/private-message.factory.js';
import { PrivatesController } from './privates.controller.js';
import { PrivatesService } from './privates.service.js';

@Module({
	imports: [
		PaginationModule,
	],
	providers: [
		PrivatesController,
		PrivatesService,

		PrivateMessageFactory,

		PrivatesCommand,

		PrivatesPanelReturnController,
		PrivatesMessageButtonAddController,
		PrivatesMessageButtonDeleteController,
		PrivatesMessageButtonPositionController,
		PrivatesMessageButtonButtonsPerRowController,
		PrivatesMessagePreviewController,
		PrivatesMessageSendController,

		PrivateAccessGiveController,
		PrivateAccessTakeController,
		PrivateAccessGiveOrTakeController,

		PrivateLockController,
		PrivateUnlockController,
		PrivateLockOrUnlockController,

		PrivateKickController,
		PrivateRenameController,
		PrivateTransferController,
		PrivateUserLimitController,

		PrivateMuteController,
		PrivateUnmuteController,
		PrivateMuteOrUnmuteController,

		PrivateHideController,
		PrivateShowController,
		PrivateHideOrShowController,
	],
	exports: [
		PrivatesService,
	],
})
export class PrivatesModule {}
