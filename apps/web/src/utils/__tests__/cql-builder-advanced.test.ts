// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { filterNodeToCQL } from "../cql-builder-advanced";
import { FilterCondition, FilterGroup } from "../../components/FilterBuilder/types";
import { parseAttributesFromXSD } from "../../integrations/layer-attributes-integration";

describe("cql-builder-advanced", () => {
  const fields = [
    { name: "cd_setor_fiscal", type: "text" as const },
    { name: "area_terreno", type: "number" as const },
    { name: "dt_cadastro", type: "date" as const },
    { name: "is_ativo", type: "boolean" as const },
  ];

  it("should format text fields with quotes even when numeric-like strings are provided", () => {
    const condition: FilterCondition = {
      id: "1",
      type: "condition",
      field: "cd_setor_fiscal",
      operator: "=",
      value: "01",
      fieldType: "text",
    };

    const cql = filterNodeToCQL(condition, fields);
    expect(cql).toBe("cd_setor_fiscal = '01'");
  });

  it("should escape single quotes in text fields", () => {
    const condition: FilterCondition = {
      id: "1",
      type: "condition",
      field: "cd_setor_fiscal",
      operator: "=",
      value: "D'Agostino",
      fieldType: "text",
    };

    const cql = filterNodeToCQL(condition, fields);
    expect(cql).toBe("cd_setor_fiscal = 'D''Agostino'");
  });

  it("should handle ILIKE for text fields", () => {
    const condition: FilterCondition = {
      id: "1",
      type: "condition",
      field: "cd_setor_fiscal",
      operator: "ILIKE",
      value: "centro",
      fieldType: "text",
    };

    const cql = filterNodeToCQL(condition, fields);
    expect(cql).toBe("cd_setor_fiscal ILIKE '%centro%'");
  });

  it("should format number fields as numeric literals without quotes", () => {
    const condition: FilterCondition = {
      id: "1",
      type: "condition",
      field: "area_terreno",
      operator: ">",
      value: "150.5",
      fieldType: "number",
    };

    const cql = filterNodeToCQL(condition, fields);
    expect(cql).toBe("area_terreno > 150.5");
  });

  it("should format date fields as quoted strings", () => {
    const condition: FilterCondition = {
      id: "1",
      type: "condition",
      field: "dt_cadastro",
      operator: ">=",
      value: "2024-01-01",
      fieldType: "date",
    };

    const cql = filterNodeToCQL(condition, fields);
    expect(cql).toBe("dt_cadastro >= '2024-01-01'");
  });

  it("should format boolean fields as TRUE / FALSE literals", () => {
    const conditionTrue: FilterCondition = {
      id: "1",
      type: "condition",
      field: "is_ativo",
      operator: "=",
      value: "true",
      fieldType: "boolean",
    };

    const conditionFalse: FilterCondition = {
      id: "2",
      type: "condition",
      field: "is_ativo",
      operator: "=",
      value: "false",
      fieldType: "boolean",
    };

    expect(filterNodeToCQL(conditionTrue, fields)).toBe("is_ativo = TRUE");
    expect(filterNodeToCQL(conditionFalse, fields)).toBe("is_ativo = FALSE");
  });

  it("should handle IS NULL operator across all types", () => {
    const condition: FilterCondition = {
      id: "1",
      type: "condition",
      field: "area_terreno",
      operator: "IS NULL",
      value: "",
      fieldType: "number",
    };

    const cql = filterNodeToCQL(condition, fields);
    expect(cql).toBe("area_terreno IS NULL");
  });

  it("should format groups with multiple conditions and nested logic correctly", () => {
    const group: FilterGroup = {
      id: "root",
      type: "group",
      operator: "AND",
      children: [
        {
          id: "1",
          type: "condition",
          field: "cd_setor_fiscal",
          operator: "=",
          value: "01",
          fieldType: "text",
        },
        {
          id: "2",
          type: "condition",
          field: "area_terreno",
          operator: ">=",
          value: "200",
          fieldType: "number",
        },
      ],
    };

    const cql = filterNodeToCQL(group, fields);
    expect(cql).toBe("(cd_setor_fiscal = '01' AND area_terreno >= 200)");
  });
});

describe("parseAttributesFromXSD", () => {
  it("should correctly identify types from DescribeFeatureType XSD XML", () => {
    const xsdXml = `<?xml version="1.0" encoding="UTF-8"?>
    <xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml">
      <xsd:complexType name="loteType">
        <xsd:sequence>
          <xsd:element name="geom" type="gml:GeometryPropertyType"/>
          <xsd:element name="cd_setor_fiscal" type="xsd:string"/>
          <xsd:element name="area_terreno" type="xsd:double"/>
          <xsd:element name="qtd_edificacoes" type="xsd:int"/>
          <xsd:element name="val_imposto" type="xsd:decimal"/>
          <xsd:element name="cod_grande" type="xsd:biginteger"/>
          <xsd:element name="dt_registro" type="xsd:dateTime"/>
          <xsd:element name="is_regular" type="xsd:boolean"/>
        </xsd:sequence>
      </xsd:complexType>
    </xsd:schema>`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xsdXml, "text/xml");
    const attributes = parseAttributesFromXSD(doc, "lote");

    expect(attributes).toEqual([
      { name: "cd_setor_fiscal", type: "text" },
      { name: "area_terreno", type: "number" },
      { name: "qtd_edificacoes", type: "number" },
      { name: "val_imposto", type: "number" },
      { name: "cod_grande", type: "number" },
      { name: "dt_registro", type: "date" },
      { name: "is_regular", type: "boolean" },
    ]);
  });
});
