import { AUTHORITIES } from "../data/authorities";
import type { Authority } from "../domain/entities";
import { mapUserSummary } from "../domain/user-summary";
import {
  legisAuthorityApi,
  type CreateLegisAuthorityApiPayload,
  type LegisAuthorityApiModel,
} from "../integrations/legis-authority-api";

export type CreateAuthorityDto = CreateLegisAuthorityApiPayload;
export type UpdateAuthorityDto = Partial<CreateLegisAuthorityApiPayload>;

class AuthorityService {
  private mapAuthority(authority: LegisAuthorityApiModel): Authority {
    return {
      id: authority.id,
      commonRefFull: authority.commonRefFull,
      commonRefAbbr: authority.commonRefAbbr,
      complementFull: authority.complementFull ?? undefined,
      complementAbbr: authority.complementAbbr ?? undefined,
      startDate: authority.startDate,
      endDate: authority.endDate ?? undefined,
      pageId: authority.pageId ?? undefined,
      createdBy: authority.createdBy ?? undefined,
      updatedBy: authority.updatedBy ?? undefined,
      createdByUser: mapUserSummary(authority.createdByUser),
      updatedByUser: mapUserSummary(authority.updatedByUser),
      createdAt: authority.createdAt,
      updatedAt: authority.updatedAt,
    };
  }

  private sortAuthorities(authorities: Authority[]): Authority[] {
    return [...authorities].sort((left, right) => {
      const leftLabel =
        `${left.commonRefAbbr} ${left.complementAbbr ?? ""} ${left.commonRefFull}`
          .trim()
          .toLocaleLowerCase("pt-BR");
      const rightLabel =
        `${right.commonRefAbbr} ${right.complementAbbr ?? ""} ${right.commonRefFull}`
          .trim()
          .toLocaleLowerCase("pt-BR");

      return leftLabel.localeCompare(rightLabel, "pt-BR");
    });
  }

  async list(): Promise<Authority[]> {
    try {
      const authorities = await legisAuthorityApi.list();
      return this.sortAuthorities(
        authorities.map((authority) => this.mapAuthority(authority)),
      );
    } catch (error) {
      console.warn(
        "Failed to load authorities from API, using local fallback.",
        error,
      );
      return this.sortAuthorities(AUTHORITIES);
    }
  }

  async create(payload: CreateAuthorityDto): Promise<Authority> {
    const authority = await legisAuthorityApi.create(payload);
    return this.mapAuthority(authority);
  }

  async update(id: string, payload: UpdateAuthorityDto): Promise<Authority> {
    const authority = await legisAuthorityApi.update(id, payload);
    return this.mapAuthority(authority);
  }

  async delete(id: string): Promise<void> {
    await legisAuthorityApi.remove(id);
  }
}

export const authorityService = new AuthorityService();
