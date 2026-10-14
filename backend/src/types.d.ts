declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    connect(): Promise<any>;
    query(queryTextOrConfig: string | any, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }
  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    query(queryTextOrConfig: string | any, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }
  const pg: {
    Pool: typeof Pool;
    Client: typeof Client;
  };
  export default pg;
}
