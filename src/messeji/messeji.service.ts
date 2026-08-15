import type { PrivatesMessageDocument } from '../privates/types/privates-message.type.js';
import { Buffer } from 'node:buffer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SLUG_PATTERN = /^[\w-]{6,32}$/;

@Injectable()
export class MessejiService {
	private readonly baseUrl: string;
	private readonly token: string | undefined;

	public constructor (configService: ConfigService) {
		this.baseUrl = configService.get<string>('MESSEJI_URL', 'https://messeji.yokkkoso.me').replace(/\/$/, '');
		this.token = configService.get<string>('MESSEJI_API_TOKEN') || undefined;
	}

	public get shareCreationAvailable (): boolean {
		return this.token !== undefined;
	}

	public buildDraftUrl (document: PrivatesMessageDocument): string {
		return `${this.baseUrl}/koe/privates#d=${Buffer.from(JSON.stringify(document), 'utf8').toString('base64url')}`;
	}

	public async buildShortUrl (document: PrivatesMessageDocument): Promise<string | null> {
		if (!this.token) {
			return null;
		}

		const response = await fetch(`${this.baseUrl}/api/share`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(document),
			signal: AbortSignal.timeout(10_000),
		}).catch(() => null);

		if (!response?.ok) {
			return null;
		}

		const payload = await response.json().catch(() => null) as { slug?: string } | null;

		return payload?.slug ? `${this.baseUrl}/koe/privates?s=${payload.slug}` : null;
	}

	public extractSlug (input: string): string | null {
		const trimmed = input.trim();

		if (SLUG_PATTERN.test(trimmed)) {
			return trimmed;
		}

		const match = /\/s\/([\w-]{6,32})(?:[/?#]|$)/.exec(trimmed) ?? /[?&]s=([\w-]{6,32})(?:[&#]|$)/.exec(trimmed);

		return match?.[1] ?? null;
	}

	public async fetchShared (slug: string): Promise<unknown> {
		const response = await fetch(`${this.baseUrl}/api/share/${slug}`, {
			signal: AbortSignal.timeout(10_000),
		}).catch(() => null);

		if (!response) {
			throw new Error('Messēji недоступен, попробуйте позже');
		}

		if (response.status === 404) {
			throw new Error('Ссылка не найдена или истекла - скопируйте её в Messēji заново');
		}

		if (!response.ok) {
			throw new Error(`Messēji ответил ошибкой (${response.status})`);
		}

		return response.json();
	}
}
