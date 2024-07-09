import { SortableData } from '~/components/table';
import { RegisteredModel } from '~/concepts/modelRegistry/types';

export const rmColumns: SortableData<RegisteredModel>[] = [
  {
    field: 'model name',
    label: 'Model name',
    sortable: (a, b) => a.name.localeCompare(b.name),
    width: 40,
  },
  {
    field: 'labels',
    label: 'Labels',
    sortable: false,
    width: 35,
  },
  {
    field: 'last_modified',
    label: 'Last modified',
    sortable: (a: RegisteredModel, b: RegisteredModel): number => {
      const first = parseInt(a.lastUpdateTimeSinceEpoch);
      const second = parseInt(b.lastUpdateTimeSinceEpoch);
      return new Date(first).getTime() - new Date(second).getTime();
    },
  },
  {
    field: 'owner',
    label: 'Owner',
    sortable: false, // TODO Add sortable once RHOAIENG-7566 is completed.
  },
  {
    field: 'kebab',
    label: '',
    sortable: false,
  },
];
