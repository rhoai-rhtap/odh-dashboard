import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex, FlexItem, Text, TextContent } from '@patternfly/react-core';
import { getNotebookDisplayName } from '~/pages/projects/utils';
import NotebookRouteLink from '~/pages/projects/notebook/NotebookRouteLink';
import { NotebookDataState } from '~/pages/projects/notebook/types';
import { ProjectKind } from '~/k8sTypes';
import { ProjectSectionID } from '~/pages/projects/screens/detail/types';

const notebookSorter = (a: NotebookDataState, b: NotebookDataState) => {
  if (a.isRunning !== b.isRunning) {
    return a.isRunning ? -1 : 1;
  }
  if (a.isStarting !== b.isStarting) {
    return a.isStarting ? -1 : 1;
  }
  return getNotebookDisplayName(a.notebook).localeCompare(getNotebookDisplayName(b.notebook));
};

interface NotebooksCardItemsProps {
  loaded?: boolean;
  error?: Error;
  notebooks: NotebookDataState[];
  currentProject: ProjectKind;
}
const NotebooksCardItems: React.FC<NotebooksCardItemsProps> = ({
  loaded,
  error,
  notebooks,
  currentProject,
}) => {
  const navigate = useNavigate();

  if (!loaded || error) {
    return [];
  }

  const listItems = notebooks.toSorted(notebookSorter).slice(0, 5);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
      {listItems.map((notebookState) => (
        <NotebookRouteLink
          key={notebookState.notebook.metadata.uid}
          label={getNotebookDisplayName(notebookState.notebook)}
          notebook={notebookState.notebook}
          isRunning={notebookState.isRunning}
          isLarge
        />
      ))}
      <Flex key="count" gap={{ default: 'gapMd' }}>
        <FlexItem>
          <TextContent>
            <Text component="small">
              {listItems.length} of {notebooks.length} workbenches
            </Text>
          </TextContent>
        </FlexItem>
        <FlexItem>
          <Button
            id="workbenches-view-all"
            aria-labelledby="workbenches-view-all Workbenches-title"
            variant="link"
            onClick={() =>
              navigate(
                `/projects/${currentProject.metadata.name}?section=${ProjectSectionID.WORKBENCHES}`,
              )
            }
          >
            View all
          </Button>
        </FlexItem>
      </Flex>
    </Flex>
  );
};

export default NotebooksCardItems;
