import * as React from 'react';
import { Grid, GridItem, Truncate } from '@patternfly/react-core';

type TaskDetailsPrintKeyValuesProps = {
  items: { label: string; value: React.ReactNode; preview?: React.ReactNode }[];
};

const TaskDetailsPrintKeyValues: React.FC<TaskDetailsPrintKeyValuesProps> = ({ items }) => (
  <Grid hasGutter>
    {items.map((result, i) => (
      <React.Fragment key={`item-${i}`}>
        <GridItem span={6}>
          <b>
            <Truncate content={result.label} />
          </b>
        </GridItem>
        <GridItem span={6}>{result.value}</GridItem>
        {result.preview && <GridItem span={12}>{result.preview}</GridItem>}
      </React.Fragment>
    ))}
  </Grid>
);

export default TaskDetailsPrintKeyValues;
