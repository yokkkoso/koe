import { PrivateButtonType } from '@prisma-client';

export const PrivateButtonStrings: Record<PrivateButtonType, string> = {
	[PrivateButtonType.ACCESS_GIVE]: 'Выдать доступ в комнату',
	[PrivateButtonType.ACCESS_TAKE]: 'Забрать доступ в комнату',
	[PrivateButtonType.ACCESS_GIVE_TAKE]: 'Выдать/Забрать доступ в комнату',
	[PrivateButtonType.HIDE]: 'Скрыть комнату',
	[PrivateButtonType.SHOW]: 'Отобразить комнату',
	[PrivateButtonType.HIDE_SHOW]: 'Отобразить/Скрыть комнату',
	[PrivateButtonType.KICK]: 'Выгнать из комнаты',
	[PrivateButtonType.LOCK]: 'Закрыть комнату',
	[PrivateButtonType.UNLOCK]: 'Открыть комнату',
	[PrivateButtonType.LOCK_UNLOCK]: 'Открыть/Закрыть комнату',
	[PrivateButtonType.MUTE]: 'Забрать право говорить',
	[PrivateButtonType.UNMUTE]: 'Выдать право говорить',
	[PrivateButtonType.MUTE_UNMUTE]: 'Выдать/Забрать право говорить',
	[PrivateButtonType.RENAME]: 'Изменить название комнаты',
	[PrivateButtonType.TRANSFER]: 'Передать владение комнатой',
	[PrivateButtonType.USER_LIMIT]: 'Изменить лимит пользователей',
};
