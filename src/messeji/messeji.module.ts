import { Module } from '@nestjs/common';
import { MessejiService } from './messeji.service.js';

@Module({
	providers: [MessejiService],
	exports: [MessejiService],
})
export class MessejiModule {}
