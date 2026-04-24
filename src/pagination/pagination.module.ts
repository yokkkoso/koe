import { Module } from '@nestjs/common';
import { PaginationService } from './pagination.service.js';

@Module({
	providers: [PaginationService],
	exports: [PaginationService],
})
export class PaginationModule {}
