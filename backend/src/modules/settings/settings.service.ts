import { logger } from "../../shared/logger/logger.js";
import {
  DEFAULT_ORGANIZATION_SETTINGS,
  DEFAULT_USER_SETTINGS,
  SETTINGS_KEYS,
} from "./settings.constants.js";
import type { OrganizationSettingsDto, UserSettingsDto } from "./settings.dto.js";
import { settingsRepository } from "./settings.repository.js";
import type {
  OrganizationSettingsUpdateInput,
  UserSettingsUpdateInput,
} from "./settings.validation.js";

function mergeOrganizationSettings(
  stored: Record<string, unknown> | undefined,
): OrganizationSettingsDto {
  return {
    ...DEFAULT_ORGANIZATION_SETTINGS,
    ...stored,
  } as OrganizationSettingsDto;
}

function mergeUserSettings(
  stored: Record<string, unknown> | undefined,
): UserSettingsDto {
  return {
    ...DEFAULT_USER_SETTINGS,
    ...stored,
  } as UserSettingsDto;
}

export class SettingsService {
  async getOrganizationSettings(
    organizationId: string,
  ): Promise<OrganizationSettingsDto> {
    const setting = await settingsRepository.findOrganizationSetting(
      organizationId,
      SETTINGS_KEYS.ORGANIZATION_GENERAL,
    );

    return mergeOrganizationSettings(setting?.value);
  }

  async updateOrganizationSettings(
    organizationId: string,
    input: OrganizationSettingsUpdateInput,
  ): Promise<OrganizationSettingsDto> {
    const updated = await settingsRepository.runInTransaction(async (tx) => {
      const existing = await settingsRepository.findOrganizationSetting(
        organizationId,
        SETTINGS_KEYS.ORGANIZATION_GENERAL,
        tx,
      );

      const mergedValue = {
        ...DEFAULT_ORGANIZATION_SETTINGS,
        ...existing?.value,
        ...input,
      };

      return settingsRepository.upsertOrganizationSetting(
        organizationId,
        SETTINGS_KEYS.ORGANIZATION_GENERAL,
        mergedValue,
        tx,
      );
    });

    logger.info(`Organization settings updated: ${organizationId}`);

    return mergeOrganizationSettings(updated.value);
  }

  async getUserSettings(userId: string): Promise<UserSettingsDto> {
    const setting = await settingsRepository.findUserSetting(
      userId,
      SETTINGS_KEYS.USER_PREFERENCES,
    );

    return mergeUserSettings(setting?.value);
  }

  async updateUserSettings(
    userId: string,
    input: UserSettingsUpdateInput,
  ): Promise<UserSettingsDto> {
    const updated = await settingsRepository.runInTransaction(async (tx) => {
      const existing = await settingsRepository.findUserSetting(
        userId,
        SETTINGS_KEYS.USER_PREFERENCES,
        tx,
      );

      const mergedValue = {
        ...DEFAULT_USER_SETTINGS,
        ...existing?.value,
        ...input,
      };

      return settingsRepository.upsertUserSetting(
        userId,
        SETTINGS_KEYS.USER_PREFERENCES,
        mergedValue,
        tx,
      );
    });

    logger.info(`User settings updated: ${userId}`);

    return mergeUserSettings(updated.value);
  }
}

export const settingsService = new SettingsService();
