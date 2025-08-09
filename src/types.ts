export type Panel = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Page = {
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
  panels: Panel[];
};
