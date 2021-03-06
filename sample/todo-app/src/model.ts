import { Model } from '@travetto/model';
import { Schema } from '@travetto/schema';

@Model()
export class Todo {
  id?: string;
  text: string;
  created?: Date;
  completed?: boolean;
  priority?: number;
}

@Schema()
export class TodoSearch {
  offset?: number;
  limit?: number;
}