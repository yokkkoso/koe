-- CreateEnum
CREATE TYPE "PrivateButtonType" AS ENUM ('ACCESS_GIVE', 'ACCESS_TAKE', 'ACCESS_GIVE_TAKE', 'HIDE', 'SHOW', 'HIDE_SHOW', 'LOCK', 'UNLOCK', 'LOCK_UNLOCK', 'MUTE', 'UNMUTE', 'MUTE_UNMUTE', 'RENAME', 'KICK', 'TRANSFER', 'USER_LIMIT');

-- CreateTable
CREATE TABLE "voice_privates" (
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "renameAt" TIMESTAMP(3),

    CONSTRAINT "voice_privates_pkey" PRIMARY KEY ("channelId")
);

-- CreateTable
CREATE TABLE "voice_privates_configs" (
    "guildId" TEXT NOT NULL,
    "buttonsPerRow" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "voice_privates_configs_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "voice_privates_buttons" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "type" "PrivateButtonType" NOT NULL,
    "emoji" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "voice_privates_buttons_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "voice_privates_buttons" ADD CONSTRAINT "voice_privates_buttons_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "voice_privates_configs"("guildId") ON DELETE RESTRICT ON UPDATE CASCADE;
