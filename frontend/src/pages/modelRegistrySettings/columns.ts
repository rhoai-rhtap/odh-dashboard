import { SortableData, kebabTableColumn } from '~/components/table';
import { ModelRegistryKind } from '~/k8sTypes';

export const modelRegistryColumns: SortableData<ModelRegistryKind>[] = [
  {
    field: 'model regisry name',
    label: 'Model registry name',
    sortable: (a, b) => a.metadata.name.localeCompare(b.metadata.name),
    width: 30,
  },
  {
    field: 'manage permissions',
    label: '',
    sortable: false,
  },
  kebabTableColumn(),
];
