export interface ChartSeries { name: string; points: [number, number][] }
export interface ChartSpec {
  title: string;
  xLabel: string;
  yLabel: string;
  series: ChartSeries[];
}
export interface TableData { columns: string[]; rows: string[][] }
