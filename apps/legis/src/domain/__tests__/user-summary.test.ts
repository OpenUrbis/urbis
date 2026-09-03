import { describe, expect, it } from "vitest";
import {
  UNKNOWN_USER_NAME,
  buildUserProfileUrl,
  getUserDisplayName,
  getUserInitials,
  mapUserSummary,
} from "../user-summary";

describe("mapUserSummary", () => {
  it("mantém o rótulo já resolvido pela API", () => {
    expect(
      mapUserSummary({
        id: "user-1",
        name: "Maria Silva",
        initials: "MS",
        email: "maria@sp.gov.br",
        isActive: true,
      }),
    ).toEqual({
      id: "user-1",
      name: "Maria Silva",
      firstName: undefined,
      lastName: undefined,
      socialName: undefined,
      email: "maria@sp.gov.br",
      avatarUrl: undefined,
      initials: "MS",
      isActive: true,
    });
  });

  /* Respostas antigas da API não traziam `name`/`initials` calculados. */
  it("recalcula nome e iniciais quando o payload não os traz", () => {
    const user = mapUserSummary({
      id: "user-1",
      firstName: "Maria",
      lastName: "Silva",
    });

    expect(user?.name).toBe("Maria Silva");
    expect(user?.initials).toBe("MS");
  });

  it("prefere o nome social", () => {
    expect(
      mapUserSummary({
        id: "user-1",
        socialName: "Ana Prado",
        firstName: "Antonio",
        lastName: "Prado",
      })?.name,
    ).toBe("Ana Prado");
  });

  it("cai no e-mail quando não há nome", () => {
    expect(
      mapUserSummary({ id: "user-1", email: "maria@sp.gov.br" })?.name,
    ).toBe("maria@sp.gov.br");
  });

  it("nunca devolve rótulo vazio", () => {
    expect(mapUserSummary({ id: "user-1" })?.name).toBe(UNKNOWN_USER_NAME);
  });

  it("trata a ausência de usuário", () => {
    expect(mapUserSummary(null)).toBeUndefined();
    expect(mapUserSummary(undefined)).toBeUndefined();
  });

  it("ignora payload sem id, que não identifica ninguém", () => {
    expect(mapUserSummary({ id: "", name: "Maria" })).toBeUndefined();
  });

  it("assume conta ativa quando o campo não vem", () => {
    expect(mapUserSummary({ id: "user-1", firstName: "Maria" })?.isActive).toBe(
      true,
    );
  });
});

describe("getUserDisplayName", () => {
  /* O rótulo salvo na página envelhece quando a pessoa renomeia a conta. */
  it("prioriza o usuário vinculado sobre o texto salvo", () => {
    const user = mapUserSummary({ id: "user-1", name: "Maria Silva" });

    expect(getUserDisplayName(user, "Nome antigo")).toBe("Maria Silva");
  });

  it("usa o texto salvo para conteúdo sem usuário vinculado", () => {
    expect(getUserDisplayName(undefined, "Equipe Legis")).toBe("Equipe Legis");
  });

  it("devolve um rótulo neutro quando não há nada", () => {
    expect(getUserDisplayName(undefined, "   ")).toBe(UNKNOWN_USER_NAME);
  });
});

describe("getUserInitials", () => {
  it("usa a primeira e a última palavra", () => {
    expect(getUserInitials("Maria de Souza Silva")).toBe("MS");
  });

  it("usa uma inicial para nome único", () => {
    expect(getUserInitials("Maria")).toBe("M");
  });

  it("devolve um marcador quando não há letras", () => {
    expect(getUserInitials("  ")).toBe("?");
  });
});

describe("buildUserProfileUrl", () => {
  it("aponta para o perfil na aplicação de contas", () => {
    expect(buildUserProfileUrl("user-1")).toMatch(/\/users\/edit\/user-1$/);
  });

  it("não gera link sem usuário", () => {
    expect(buildUserProfileUrl(undefined)).toBeUndefined();
    expect(buildUserProfileUrl(null)).toBeUndefined();
  });
});
