import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateBody,
  Bullseye,
  Spinner,
  Truncate,
  EmptyStateHeader,
} from '@patternfly/react-core';
import { useNavigate, useParams } from 'react-router-dom';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ApplicationsPage from '~/pages/ApplicationsPage';
import MarkdownView from '~/components/MarkdownView';
import usePipelineRunById from '~/concepts/pipelines/apiHooks/usePipelineRunById';
import { PipelineCoreDetailsPageComponent } from '~/concepts/pipelines/content/types';
import PipelineRunDrawerBottomContent from '~/concepts/pipelines/content/pipelinesDetails/pipelineRun/PipelineRunDrawerBottomContent';
import PipelineRunDetailsActions from '~/concepts/pipelines/content/pipelinesDetails/pipelineRun/PipelineRunDetailsActions';
import PipelineRunDrawerRightContent from '~/concepts/pipelines/content/pipelinesDetails/pipelineRun/PipelineRunDrawerRightContent';
import {
  RunDetailsTabs,
  RunDetailsTabSelection,
} from '~/concepts/pipelines/content/pipelinesDetails/pipelineRun/PipelineRunDrawerBottomTabs';
import DeletePipelineRunsModal from '~/concepts/pipelines/content/DeletePipelineRunsModal';
import { usePipelinesAPI } from '~/concepts/pipelines/context';
import PipelineDetailsTitle from '~/concepts/pipelines/content/pipelinesDetails/PipelineDetailsTitle';
import { PipelineTopology, PipelineTopologyEmpty } from '~/concepts/topology';
import usePipelineVersionById from '~/concepts/pipelines/apiHooks/usePipelineVersionById';
import { usePipelineTaskTopology } from '~/concepts/pipelines/topology';
import { PipelineRunType } from '~/pages/pipelines/global/runs/types';
import { routePipelineRunsNamespace } from '~/routes';
import PipelineJobReferenceName from '~/concepts/pipelines/content/PipelineJobReferenceName';
import useExecutionsForPipelineRun from '~/concepts/pipelines/content/pipelinesDetails/pipelineRun/useExecutionsForPipelineRun';
import { useGetEventsByExecutionIds } from '~/concepts/pipelines/apiHooks/mlmd/useGetEventsByExecutionId';
import { parseEventsByType } from '~/pages/pipelines/global/experiments/executions/utils';
import { Event } from '~/third_party/mlmd';
import { usePipelineRunArtifacts } from './artifacts';

const PipelineRunDetails: PipelineCoreDetailsPageComponent = ({ breadcrumbPath, contextPath }) => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { namespace } = usePipelinesAPI();
  const [run, runLoaded, runError] = usePipelineRunById(runId, true);
  const [version, versionLoaded, versionError] = usePipelineVersionById(
    run?.pipeline_version_reference?.pipeline_id,
    run?.pipeline_version_reference?.pipeline_version_id,
  );
  const pipelineSpec = version?.pipeline_spec ?? run?.pipeline_spec;
  const [deleting, setDeleting] = React.useState(false);
  const [detailsTab, setDetailsTab] = React.useState<RunDetailsTabSelection>(
    RunDetailsTabs.DETAILS,
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const [executions, executionsLoaded, executionsError] = useExecutionsForPipelineRun(run);
  const [artifacts] = usePipelineRunArtifacts(run);
  const [eventsResponse] = useGetEventsByExecutionIds(
    React.useMemo(() => executions.map((execution) => execution.getId()), [executions]),
  );
  const events = parseEventsByType(eventsResponse);
  const nodes = usePipelineTaskTopology(
    pipelineSpec,
    run?.run_details,
    executions,
    events[Event.Type.OUTPUT],
    artifacts,
  );

  const selectedNode = React.useMemo(
    () => nodes.find((n) => n.id === selectedId),
    [selectedId, nodes],
  );

  const getFirstNode = (firstId: string) => nodes.find((n) => n.id === firstId);

  const loaded = runLoaded && (versionLoaded || !!run?.pipeline_spec);
  const error = versionError || runError;

  if (error) {
    return (
      <EmptyState variant={EmptyStateVariant.lg} data-id="error-empty-state">
        <EmptyStateHeader
          titleText="Error loading pipeline run details"
          icon={<EmptyStateIcon icon={ExclamationCircleIcon} />}
          headingLevel="h4"
        />
        <EmptyStateBody>{error.message}</EmptyStateBody>
      </EmptyState>
    );
  }

  if (!loaded || (!executionsLoaded && !executionsError)) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <>
      <Drawer isExpanded={!!selectedNode}>
        <DrawerContent
          panelContent={
            <PipelineRunDrawerRightContent
              task={selectedNode?.data.pipelineTask}
              upstreamTaskName={selectedNode?.runAfterTasks?.[0]}
              onClose={() => setSelectedId(null)}
              executions={executions}
            />
          }
        >
          <DrawerContentBody>
            <Drawer isInline isExpanded position="bottom">
              <DrawerContent
                panelContent={
                  <PipelineRunDrawerBottomContent
                    detailsTab={detailsTab}
                    onSelectionChange={(selection) => {
                      setDetailsTab(selection);
                      setSelectedId(null);
                    }}
                    pipelineRunDetails={run && pipelineSpec ? run : undefined}
                  />
                }
              >
                <ApplicationsPage
                  title={
                    run ? (
                      <PipelineDetailsTitle run={run} statusIcon pipelineRunLabel />
                    ) : (
                      'Error loading run'
                    )
                  }
                  subtext={
                    run && (
                      <PipelineJobReferenceName
                        runName={run.display_name}
                        recurringRunId={run.recurring_run_id}
                      />
                    )
                  }
                  description={
                    run?.description ? (
                      <MarkdownView conciseDisplay markdown={run.description} />
                    ) : (
                      ''
                    )
                  }
                  loaded={loaded}
                  loadError={error}
                  breadcrumb={
                    <Breadcrumb>
                      {breadcrumbPath}
                      <BreadcrumbItem isActive style={{ maxWidth: 300 }}>
                        <Truncate content={run?.display_name ?? 'Loading...'} />
                      </BreadcrumbItem>
                    </Breadcrumb>
                  }
                  headerAction={
                    <PipelineRunDetailsActions run={run} onDelete={() => setDeleting(true)} />
                  }
                  empty={false}
                >
                  {nodes.length === 0 ? (
                    <PipelineTopologyEmpty />
                  ) : (
                    <PipelineTopology
                      nodes={nodes}
                      selectedIds={selectedId ? [selectedId] : []}
                      onSelectionChange={(ids) => {
                        const firstId = ids[0];
                        if (ids.length === 0) {
                          setSelectedId(null);
                        } else if (getFirstNode(firstId)) {
                          setDetailsTab(null);
                          setSelectedId(firstId);
                        }
                      }}
                    />
                  )}
                </ApplicationsPage>
              </DrawerContent>
            </Drawer>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
      <DeletePipelineRunsModal
        type={PipelineRunType.Archived}
        toDeleteResources={deleting && run ? [run] : []}
        onClose={(deleteComplete) => {
          if (deleteComplete) {
            navigate(contextPath ?? routePipelineRunsNamespace(namespace));
          } else {
            setDeleting(false);
          }
        }}
      />
    </>
  );
};

export default PipelineRunDetails;
