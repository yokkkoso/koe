import { type DynamicModule, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Module({})
export class PrismaModule {
	public static forRoot (): DynamicModule {
		return {
			global: true,
			module: PrismaModule,
			providers: [PrismaService],
			exports: [PrismaService],
		};
	}
}
