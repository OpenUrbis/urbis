import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('layer_schemas')
export class LayerSchema {
  @PrimaryColumn()
  id: string;

  @Column()
  '@@type': string; // Stored as string, validated as enum in DTO

  @Column()
  name: string;

  @Column()
  visible: boolean;

  @Column({ type: 'jsonb', nullable: true })
  getFillColor?: string | number[];

  @Column({ nullable: true })
  minZoom?: number;

  @Column({ nullable: true })
  data?: string;

  @Column({ nullable: true })
  groupId?: string;

  @Column({ nullable: true })
  getText?: string;

  @Column({ type: 'jsonb', nullable: true })
  getTextColor?: number[];

  @Column({ type: 'jsonb', nullable: true })
  getLineColor?: string | number[];

  @Column({ nullable: true })
  getTextSize?: number;

  @Column({ nullable: true })
  autoHighlight?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  highlightColor?: number[];

  @Column({ type: 'jsonb', nullable: true })
  labelColor?: number[][];

  @Column({ type: 'jsonb', nullable: true })
  mapLegend?: { label: string; color: number[] }[];

  @Column({ nullable: true })
  urlTemplate?: string;
}