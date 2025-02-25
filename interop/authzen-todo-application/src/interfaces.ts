export interface TodoValues {
  Title: string;
  Completed: boolean;
}

export interface Todo extends TodoValues {
  ID: string;
  OwnerID: string;
  CannotUpdate?: boolean;
}

export interface User {
  id: string;
  email: string;
  picture: string;
  name: string;
}

export interface ITodoService {
  listTodos: () => Promise<Todo[]>;
  createTodo: (todo: TodoValues) => Promise<Todo>;
  saveTodo: (id: string, values: TodoValues) => Promise<Todo[]>;
  deleteTodo: (todo: Todo) => Promise<void | Response>;
  getUser: (sub: string) => Promise<User>;
  getConfig: () => Promise<Config>;
  setPdp: (pdp: string) => void;
  setSpecVersion: (specVersion: string) => void;
  setGateway: (gateway: string) => void;
  setGatewayUrl: (url: string) => void;
  setGatewayPdp: (gatewayPdp: string) => void;
  pdp: string
  specVersion: string
  gateway: string
  gatewayUrl: string
  gatewayPdp: string
}

export interface TodoProps {
  todo: Todo;
  handleCompletedChange: (todoId: string, completed: boolean) => void;
  handleDeleteChange: (Todo: Todo) => void;
}

export interface TodosProps {
  // todos: Todo[] | void;
  showCompleted: boolean;
  showActive: boolean;
  // refreshTodos: () => void;
  // errorHandler(errorText: string, autoClose?: number | boolean): void;
}

export interface AppProps {
  user: AuthUser;
}

export interface AuthUser {
  email: string;
  sub: string;
}

export type Config = {
  pdps: {
    [specVersion: string]: string[]
  }
  gateways: {
    [name: string]: string
  }
  gatewayPdps: string[]
}
