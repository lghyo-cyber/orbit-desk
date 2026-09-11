export type Step = {
  id: string;
  title: string;
  done: boolean;
};

export type Topic = {
  id: string;
  title: string;
  notes: string;
  steps: Step[];
  createdAt: number;
  updatedAt: number;
};
