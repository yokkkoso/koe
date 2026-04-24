import process from 'node:process';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { BotModule } from './bot.module.js';

const logger = new Logger('Runtime');

async function bootstrap () {
	await NestFactory.createApplicationContext(BotModule);
}

process.on('unhandledRejection', (error) => {
	logger.error('Unhandled promise rejection:');
	console.error(error);
});

process.on('uncaughtException', (error) => {
	logger.error('Unhandled exception:');
	console.error(error);
});

void bootstrap();
