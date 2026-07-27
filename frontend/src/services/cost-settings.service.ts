import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  ComplexityMultiplier,
  CostConfiguration,
  CostPreview,
  CostSettings,
  HourlyRate,
  PlatformMultiplier,
  PreviewCostParams,
  UpdateCostSettingsPayload,
} from "@/types";

const COST_SETTINGS = "/api/cost-settings";
const HOURLY_RATES = "/api/hourly-rates";
const COMPLEXITY = "/api/complexity-multipliers";
const PLATFORM = "/api/platform-multipliers";

export const costSettingsService = {
  /** One request for the whole rate card — the page prices as a unit. */
  async getConfiguration(): Promise<CostConfiguration> {
    const response =
      await api.get<ApiSuccessResponse<CostConfiguration>>(COST_SETTINGS);
    return response.data.data;
  },

  async updateSettings(
    payload: UpdateCostSettingsPayload,
  ): Promise<CostSettings> {
    const response = await api.patch<ApiSuccessResponse<CostSettings>>(
      COST_SETTINGS,
      payload,
    );
    return response.data.data;
  },

  async updateHourlyRates(rates: HourlyRate[]): Promise<HourlyRate[]> {
    const response = await api.patch<ApiSuccessResponse<HourlyRate[]>>(
      HOURLY_RATES,
      { rates },
    );
    return response.data.data;
  },

  /**
   * @deprecated Complexity no longer affects price, so nothing calls this. Kept
   * only while the deprecated backend endpoint exists.
   */
  async updateComplexityMultipliers(
    multipliers: ComplexityMultiplier[],
  ): Promise<ComplexityMultiplier[]> {
    const response = await api.patch<ApiSuccessResponse<ComplexityMultiplier[]>>(
      COMPLEXITY,
      { multipliers },
    );
    return response.data.data;
  },

  async updatePlatformMultipliers(
    multipliers: PlatformMultiplier[],
  ): Promise<PlatformMultiplier[]> {
    const response = await api.patch<ApiSuccessResponse<PlatformMultiplier[]>>(
      PLATFORM,
      { multipliers },
    );
    return response.data.data;
  },

  /**
   * Server-side calculation for the live preview.
   *
   * The engine deliberately lives on the server only: a second copy in the
   * browser would be a second source of truth for what a project costs, and the
   * two would drift the first time a rule changed.
   */
  async preview(params: PreviewCostParams): Promise<CostPreview> {
    const response = await api.get<ApiSuccessResponse<CostPreview>>(
      `${COST_SETTINGS}/preview`,
      { params },
    );
    return response.data.data;
  },
};
