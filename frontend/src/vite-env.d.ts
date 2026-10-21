/// <reference types="vite/client" />

declare module '@hugeicons/core-free-icons' {
  export const FavouriteIcon: any;
  export const FlashIcon: any;
  export const StarIcon: any;
  const icons: Record<string, any>;
  export default icons;
}

declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    connect(): Promise<any>;
    query(text: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
    on(event: string, listener: (...args: any[]) => void): this;
  }
  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    query(text: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
  }
  const pg: any;
  export default pg;
}
