export type DocsModule =
  | "headline_1"
  | "headline_2"
  | "docs_1"
  | "list"
  | "image"
  | "code"
  | "table"
  | "space"
  | "big_space";

export interface DocsBlock {
    module: DocsModule;
    content?: string;
    listItems?: string[];
    imageSrc?: string;
    apiData?: ApiDoc;
    tableHeaders?: string[];
    tableRows?: string[][];
}
  
export interface ApiDoc {
    method: string;
    endpoint: string;
    request: {
      headers?: Record<string, string>;
      body?: Record<string, string>;
    };
    response: {
      status_code: number;
      body: Record<string, string>;
    };
}  