import React from 'react';
import {
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  getEdgesFromNodes,
  PipelineNodeModel,
  TopologyControlBar,
  TopologyView,
  useVisualizationController,
  VisualizationSurface,
  addSpacerNodes,
  DEFAULT_SPACER_NODE_TYPE,
  DEFAULT_EDGE_TYPE,
} from '@patternfly/react-topology';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateHeader,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { NODE_HEIGHT, NODE_WIDTH } from './const';

type PipelineVisualizationSurfaceProps = {
  nodes: PipelineNodeModel[];
  selectedIds?: string[];
};

const PipelineVisualizationSurface: React.FC<PipelineVisualizationSurfaceProps> = ({
  nodes,
  selectedIds,
}) => {
  const controller = useVisualizationController();
  const [error, setError] = React.useState<Error | null>();
  React.useEffect(() => {
    const currentModel = controller.toModel();
    const updateNodes = nodes.map((node) => {
      const currentNode = currentModel.nodes?.find((n) => n.id === node.id);
      if (currentNode) {
        return { ...node, collapsed: currentNode.collapsed };
      }
      return node;
    });

    const renderNodes = addSpacerNodes(updateNodes);

    // TODO: We can have a weird edge issue if the node is off by a few pixels vertically from the center
    const edges = getEdgesFromNodes(renderNodes);

    try {
      controller.fromModel(
        {
          nodes: renderNodes,
          edges,
        },
        true,
      );
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      } else {
        // eslint-disable-next-line no-console
        console.error('Unknown error occurred rendering Pipeline Graph', e);
      }
    }
  }, [controller, nodes]);

  const collapseAllCallback = React.useCallback(
    (collapseAll: boolean) => {
      // First, expand/collapse all nodes
      if (collapseAll) {
        controller.getGraph().collapseAll();
      } else {
        controller.getGraph().expandAll();
      }
      // We must recreate the model based on what is visible
      const model = controller.toModel();

      // Get all the non-spacer nodes, mark them all visible again
      const nonSpacerNodes = model
        .nodes!.filter((n) => n.type !== DEFAULT_SPACER_NODE_TYPE)
        .map((n) => ({
          ...n,
          visible: true,
        }));

      // If collapsing, set the size of the collapsed group nodes
      if (collapseAll) {
        nonSpacerNodes.forEach((node) => {
          const newNode = node;
          if (node.group && node.collapsed) {
            newNode.width = NODE_WIDTH;
            newNode.height = NODE_HEIGHT;
          }
        });
      }
      // Determine the new set of nodes, including the spacer nodes
      const pipelineNodes = addSpacerNodes(nonSpacerNodes);

      // Determine the new edges
      const edges = getEdgesFromNodes(
        pipelineNodes,
        DEFAULT_SPACER_NODE_TYPE,
        DEFAULT_EDGE_TYPE,
        DEFAULT_EDGE_TYPE,
      );

      // Apply the new model and run the layout
      controller.fromModel({ nodes: pipelineNodes, edges }, true);
      controller.getGraph().layout();
      controller.getGraph().fit(80);
    },
    [controller],
  );

  if (error) {
    return (
      <EmptyState data-id="error-empty-state">
        <EmptyStateHeader
          titleText="Incorrect pipeline definition"
          icon={<EmptyStateIcon icon={ExclamationCircleIcon} />}
          headingLevel="h4"
        />
        <EmptyStateBody>{error.message}</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <TopologyView
      controlBar={
        <TopologyControlBar
          controlButtons={createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            expandAll: !!collapseAllCallback,
            collapseAll: !!collapseAllCallback,
            zoomInCallback: action(() => {
              controller.getGraph().scaleBy(4 / 3);
            }),
            zoomOutCallback: action(() => {
              controller.getGraph().scaleBy(0.75);
            }),
            fitToScreenCallback: action(() => {
              controller.getGraph().fit(80);
            }),
            resetViewCallback: action(() => {
              controller.getGraph().reset();
              controller.getGraph().layout();
            }),
            expandAllCallback: action(() => {
              collapseAllCallback(false);
            }),
            collapseAllCallback: action(() => {
              collapseAllCallback(true);
            }),
            legend: false,
          })}
        />
      }
    >
      <VisualizationSurface state={{ selectedIds }} />
    </TopologyView>
  );
};

export default PipelineVisualizationSurface;
