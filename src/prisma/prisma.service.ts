import process from 'node:process';
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(PrismaService.name);

	constructor () {
		const adapter = new PrismaPg({
			connectionString: process.env.DATABASE_URL as string,
		});
		super({ adapter });
	}

	public async onModuleInit () {
		await this.$connect();
		this.logger.log('DB connection established');
	}

	public async onModuleDestroy () {
		await this.$disconnect();
		this.logger.log('DB connection closed');
	}
}
