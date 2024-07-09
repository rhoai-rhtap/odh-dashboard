import React from 'react';
import { Link } from 'react-router-dom';

import { ActionsColumn, IAction, Td, Tr } from '@patternfly/react-table';

import { ExperimentKFv2, StorageStateKF } from '~/concepts/pipelines/kfTypes';
import { CheckboxTd } from '~/components/table';
import { experimentRunsRoute } from '~/routes';
import { usePipelinesAPI } from '~/concepts/pipelines/context';
import { ExperimentCreated, LastExperimentRuns, LastExperimentRunsStarted } from './renderUtils';

type ExperimentTableRowProps = {
  isChecked: boolean;
  onToggleCheck: () => void;
  experiment: ExperimentKFv2;
  actionColumnItems: IAction[];
};

const ExperimentTableRow: React.FC<ExperimentTableRowProps> = ({
  isChecked,
  onToggleCheck,
  experiment,
  actionColumnItems,
}) => {
  const { namespace } = usePipelinesAPI();

  const isArchived = experiment.storage_state === StorageStateKF.ARCHIVED;

  return (
    <Tr>
      <CheckboxTd id={experiment.experiment_id} isChecked={isChecked} onToggle={onToggleCheck} />
      <Td dataLabel="Experiment">
        <Link
          to={`${experimentRunsRoute(namespace, experiment.experiment_id)}${
            isArchived ? '/?runType=archived' : ''
          }`}
          state={{ experiment }}
        >
          {experiment.display_name}
        </Link>
      </Td>
      <Td dataLabel="Description">{experiment.description}</Td>
      <Td dataLabel="Created">
        <ExperimentCreated experiment={experiment} />
      </Td>
      <Td dataLabel="Last run started">
        <LastExperimentRunsStarted experiment={experiment} />
      </Td>
      <Td dataLabel="Last 5 runs">
        <LastExperimentRuns experiment={experiment} />
      </Td>
      <Td isActionCell dataLabel="Kebab">
        <ActionsColumn items={actionColumnItems} />
      </Td>
    </Tr>
  );
};

export default ExperimentTableRow;
