/* eslint-disable camelcase */
import startCase from 'lodash-es/startCase';
import { RuntimeStateKF, runtimeStateLabels } from '~/concepts/pipelines/kfTypes';
import {
  mockDataSciencePipelineApplicationK8sResource,
  mockK8sResourceList,
  mockProjectK8sResource,
  mockRouteK8sResource,
  buildMockRunKF,
  buildMockJobKF,
  buildMockPipelineVersionsV2,
  buildMockPipelineVersionV2,
  buildMockPipelines,
  buildMockPipelineV2,
  buildMockExperimentKF,
} from '~/__mocks__';
import {
  activeRunsTable,
  pipelineRunsGlobal,
  pipelineRunFilterBar,
  pipelineRunJobTable,
  archivedRunsTable,
  restoreRunModal,
  bulkRestoreRunModal,
  archiveRunModal,
  bulkArchiveRunModal,
} from '~/__tests__/cypress/cypress/pages/pipelines';
import { verifyRelativeURL } from '~/__tests__/cypress/cypress/utils/url';
import { be } from '~/__tests__/cypress/cypress/utils/should';
import {
  DataSciencePipelineApplicationModel,
  ProjectModel,
  RouteModel,
} from '~/__tests__/cypress/cypress/utils/models';
import { tablePagination } from '~/__tests__/cypress/cypress/pages/components/Pagination';

const projectName = 'test-project-filters';
const pipelineId = 'test-pipeline';
const pipelineVersionId = 'test-version';

const mockActiveRuns = [
  buildMockRunKF({
    display_name: 'Test active run 1',
    run_id: 'run-1',
    pipeline_version_reference: {
      pipeline_id: pipelineId,
      pipeline_version_id: 'test-version-1',
    },
    experiment_id: 'test-experiment-1',
    created_at: '2024-02-01T00:00:00Z',
    state: RuntimeStateKF.RUNNING,
  }),
  buildMockRunKF({
    display_name: 'Test active run 2',
    run_id: 'run-2',
    pipeline_version_reference: {
      pipeline_id: pipelineId,
      pipeline_version_id: 'test-version-2',
    },
    experiment_id: 'test-experiment-2',
    created_at: '2024-02-05T00:00:00Z',
    state: RuntimeStateKF.SUCCEEDED,
  }),
  buildMockRunKF({
    display_name: 'Test active run 3',
    run_id: 'run-3',
    pipeline_version_reference: {
      pipeline_id: pipelineId,
      pipeline_version_id: 'test-version-2',
    },
    experiment_id: 'test-experiment-1',
    created_at: '2024-02-10T00:00:00Z',
    state: RuntimeStateKF.CANCELED,
  }),
];

const mockExperimentIds = [...new Set(mockActiveRuns.map((mockRun) => mockRun.experiment_id))];
const mockVersionIds = [
  ...new Set(
    mockActiveRuns.map((mockRun) => mockRun.pipeline_version_reference?.pipeline_version_id),
  ),
];
const mockExperiments = mockExperimentIds.map((experimentId) =>
  buildMockExperimentKF({
    experiment_id: experimentId,
    display_name: startCase(experimentId),
  }),
);

const mockVersions = mockVersionIds.map((versionId) =>
  buildMockPipelineVersionV2({
    pipeline_id: pipelineId,
    pipeline_version_id: versionId,
    display_name: startCase(versionId),
  }),
);

const mockJobs = [
  buildMockJobKF({
    display_name: 'test-pipeline',
    recurring_run_id: 'test-pipeline',
    experiment_id: 'test-experiment-1',
    pipeline_version_reference: {
      pipeline_id: pipelineId,
      pipeline_version_id: 'test-version-1',
    },
  }),
  buildMockJobKF({
    display_name: 'other-pipeline',
    recurring_run_id: 'other-test-pipeline',
    experiment_id: 'test-experiment-2',
    pipeline_version_reference: {
      pipeline_id: pipelineId,
      pipeline_version_id: 'test-version-2',
    },
  }),
  buildMockJobKF({
    display_name: 'another-pipeline',
    recurring_run_id: 'another-test-pipeline',
    experiment_id: 'test-experiment-1',
    pipeline_version_reference: {
      pipeline_id: pipelineId,
      pipeline_version_id: 'test-version-2',
    },
  }),
];

const mockArchivedRuns = [
  buildMockRunKF({
    display_name: 'Test archived run 1',
    run_id: 'archived-run-1',
    pipeline_version_reference: {
      pipeline_id: pipelineId,
      pipeline_version_id: 'test-version-1',
    },
    experiment_id: 'test-experiment-1',
    created_at: '2024-02-05T00:00:00Z',
    state: RuntimeStateKF.SUCCEEDED,
  }),
  buildMockRunKF({
    display_name: 'Test archived run 2',
    run_id: 'archived-run-2',
    pipeline_version_reference: {
      pipeline_id: pipelineId,
      pipeline_version_id: 'test-version-2',
    },
    experiment_id: 'test-experiment-1',
    created_at: '2024-02-20T00:00:00Z',
    state: RuntimeStateKF.SUCCEEDED,
  }),
];

describe('Pipeline runs', () => {
  beforeEach(() => {
    initIntercepts();
  });

  describe('Active runs', () => {
    describe('empty state', () => {
      beforeEach(() => {
        activeRunsTable.mockGetActiveRuns([], projectName);
        pipelineRunsGlobal.visit(projectName, pipelineId, pipelineVersionId, 'active');
      });

      it('shows empty state', () => {
        activeRunsTable.findEmptyState().should('exist');
      });

      it('navigate to create run page', () => {
        pipelineRunsGlobal.findCreateRunButton().click();
        verifyRelativeURL(`/pipelines/${projectName}/pipelineRun/create?runType=active`);
      });
    });

    describe('table pagination', () => {
      it('Active run table pagination', () => {
        const mockRuns = Array.from({ length: 15 }, (_, i) =>
          buildMockRunKF({
            display_name: `Test active run-${i}`,
            run_id: `run-${i}`,
            pipeline_version_reference: {
              pipeline_id: pipelineId,
              pipeline_version_id: `test-version-${i}`,
            },
            experiment_id: `test-experiment-${i}`,
            created_at: '2024-02-05T00:00:00Z',
            state: RuntimeStateKF.SUCCEEDED,
          }),
        );
        cy.interceptOdh(
          'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/runs',
          {
            path: { namespace: projectName, serviceName: 'dspa' },
          },
          {
            runs: mockRuns.slice(0, 10),
            total_size: 15,
            next_page_token: 'page-2-token',
          },
        ).as('getActiveRuns');

        pipelineRunsGlobal.visit(projectName, pipelineId, pipelineVersionId, 'active');

        cy.wait('@getActiveRuns').then((interception) => {
          expect(interception.request.query).to.eql({
            sort_by: 'created_at desc',
            page_size: '10',
            filter:
              '{"predicates":[{"key":"storage_state","operation":"EQUALS","string_value":"AVAILABLE"},{"key":"pipeline_version_id","operation":"EQUALS","string_value":"test-version"}]}',
          });
        });
        activeRunsTable.findRows().should('have.length', 10);
        activeRunsTable.getRowByName('Test active run-0').find().should('exist');

        const pagination = tablePagination.top;

        // test Next button
        pagination.findPreviousButton().should('be.disabled');
        cy.interceptOdh(
          'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/runs',
          {
            path: { namespace: projectName, serviceName: 'dspa' },
          },
          {
            runs: mockRuns.slice(10, 15),
            total_size: 15,
          },
        ).as('refreshActiveRuns');
        pagination.findNextButton().click();

        cy.wait('@refreshActiveRuns').then((interception) => {
          expect(interception.request.query).to.eql({
            sort_by: 'created_at desc',
            page_size: '10',
            filter:
              '{"predicates":[{"key":"storage_state","operation":"EQUALS","string_value":"AVAILABLE"},{"key":"pipeline_version_id","operation":"EQUALS","string_value":"test-version"}]}',
            page_token: 'page-2-token',
          });
        });
        activeRunsTable.getRowByName('Test active run-14').find().should('exist');
        activeRunsTable.findRows().should('have.length', 5);

        // test Previous button
        pagination.findNextButton().should('be.disabled');
        cy.interceptOdh(
          'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/runs',
          {
            path: { namespace: projectName, serviceName: 'dspa' },
          },
          {
            runs: mockRuns.slice(0, 10),
            total_size: 15,
          },
        );
        pagination.findPreviousButton().click();
        activeRunsTable.getRowByName('Test active run-0').find().should('exist');
        activeRunsTable.findRows().should('have.length', 10);

        // 20 per page
        cy.interceptOdh(
          'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/runs',
          {
            path: { namespace: projectName, serviceName: 'dspa' },
          },
          {
            runs: mockRuns.slice(0, 15),
            total_size: 15,
          },
        );
        pagination.selectToggleOption('20 per page');
        activeRunsTable.findRows().should('have.length', 15);
        activeRunsTable.getRowByName('Test active run-0').find().should('exist');
        activeRunsTable.getRowByName('Test active run-14').find().should('exist');
        pagination.findNextButton().should('be.disabled');
        pagination.findPreviousButton().should('be.disabled');
        pagination.selectToggleOption('10 per page');
      });
    });

    describe('with data', () => {
      beforeEach(() => {
        activeRunsTable.mockGetActiveRuns(mockActiveRuns, projectName);
        pipelineRunsGlobal.visit(projectName, pipelineId, pipelineVersionId, 'active');
      });

      it('renders the page with table data', () => {
        activeRunsTable.getRowByName('Test active run 1').find().should('exist');
      });

      it('archive a single run', () => {
        const [runToArchive] = mockActiveRuns;

        activeRunsTable.mockArchiveRun(runToArchive.run_id, projectName);
        activeRunsTable.getRowByName(runToArchive.display_name).findKebabAction('Archive').click();

        activeRunsTable.mockGetRuns([mockActiveRuns[1]], [runToArchive], projectName);
        archiveRunModal.findConfirmInput().type(runToArchive.display_name);
        archiveRunModal.findSubmitButton().click();
        activeRunsTable.shouldRowNotBeVisible(runToArchive.display_name);

        pipelineRunsGlobal.findArchivedRunsTab().click();
        archivedRunsTable.getRowByName(runToArchive.display_name).find().should('exist');
      });

      it('archive multiple runs', () => {
        mockActiveRuns.forEach((activeRun) => {
          activeRunsTable.mockArchiveRun(activeRun.run_id, projectName);
          activeRunsTable.getRowByName(activeRun.display_name).findCheckbox().click();
        });

        activeRunsTable.findActionsKebab().findDropdownItem('Archive').click();
        activeRunsTable.mockGetRuns([], mockActiveRuns, projectName);
        bulkArchiveRunModal.findConfirmInput().type('Archive 3 runs');
        bulkArchiveRunModal.findSubmitButton().click();
        activeRunsTable.findEmptyState().should('exist');

        pipelineRunsGlobal.findArchivedRunsTab().click();
        mockActiveRuns.forEach((run) =>
          archivedRunsTable.getRowByName(run.display_name).find().should('exist'),
        );
      });

      describe('Navigation', () => {
        it('navigate to create run page', () => {
          pipelineRunsGlobal.findCreateRunButton().click();
          verifyRelativeURL(`/pipelines/${projectName}/pipelineRun/create`);
        });
        it('navigate to clone run page', () => {
          activeRunsTable
            .getRowByName(mockActiveRuns[0].display_name)
            .findKebabAction('Duplicate')
            .click();
          verifyRelativeURL(
            `/pipelines/${projectName}/pipelineRun/clone/${mockActiveRuns[0].run_id}`,
          );
        });
        it('navigate between tabs', () => {
          pipelineRunsGlobal.findArchivedRunsTab().click();
          verifyRelativeURL(
            `/pipelines/${projectName}/pipeline/runs/${pipelineId}/${pipelineVersionId}?runType=archived`,
          );
          pipelineRunsGlobal.findActiveRunsTab().click();
          verifyRelativeURL(
            `/pipelines/${projectName}/pipeline/runs/${pipelineId}/${pipelineVersionId}?runType=active`,
          );
          pipelineRunsGlobal.findSchedulesTab().click();
          verifyRelativeURL(
            `/pipelines/${projectName}/pipeline/runs/${pipelineId}/${pipelineVersionId}?runType=scheduled`,
          );
        });
        it('navigate to run details page', () => {
          activeRunsTable
            .getRowByName(mockActiveRuns[0].display_name)
            .findColumnName(mockActiveRuns[0].display_name)
            .click();

          verifyRelativeURL(
            `/pipelines/${projectName}/pipelineRun/view/${mockActiveRuns[0].run_id}`,
          );
        });
      });

      describe('Table filter', () => {
        it('filter by name', () => {
          // Verify initial run rows exist
          activeRunsTable.findRows().should('have.length', 3);

          // Select the "Run" filter, enter a value to filter by
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() => pipelineRunsGlobal.selectFilterByName('Run'));
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() => pipelineRunFilterBar.findNameInput().type('run 1'));

          // Mock runs (filtered by typed run name)
          activeRunsTable.mockGetActiveRuns(
            mockActiveRuns.filter((mockRun) => mockRun.display_name.includes('run 1')),
            projectName,
            1,
          );

          // Verify only rows with the typed run name exist
          activeRunsTable.findRows().should('have.length', 1);
          activeRunsTable.getRowByName('Test active run 1').find().should('exist');
        });

        it('filter by experiment', () => {
          // Mock initial list of experiments
          pipelineRunFilterBar.mockExperiments(mockExperiments, projectName);

          // Verify initial run rows exist
          activeRunsTable.findRows().should('have.length', 3);

          // Select the "Experiment" filter, enter a value to filter by
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() => pipelineRunsGlobal.selectFilterByName('Experiment'));
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() => pipelineRunFilterBar.findExperimentInput().type('Test Experiment 1'));

          // Mock runs (filtered by selected experiment)
          activeRunsTable.mockGetActiveRuns(
            mockActiveRuns.filter((mockRun) => mockRun.experiment_id === 'test-experiment-1'),
            projectName,
            1,
          );

          // Select an experiment to filter by
          pipelineRunFilterBar.selectExperimentByName('Test Experiment 1');

          // Verify only rows with selected experiment exist
          activeRunsTable.findRows().should('have.length', 2);
          activeRunsTable.getRowByName('Test active run 1').find().should('exist');
          activeRunsTable.getRowByName('Test active run 3').find().should('exist');
        });

        it('filter by started', () => {
          // Verify initial run rows exist
          activeRunsTable.findRows().should('have.length', 3);

          // Select the "Started" filter, select a value to filter by
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() => pipelineRunsGlobal.selectFilterByName('Started'));

          // Mock runs (filtered by start date), type a start date
          activeRunsTable.mockGetActiveRuns(
            mockActiveRuns.filter((mockRun) => mockRun.created_at.includes('2024-02-10')),
            projectName,
            1,
          );
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() => pipelineRunFilterBar.findStartDateInput().type('2024-02-10'));

          // Verify only rows with selected start date exist
          activeRunsTable.findRows().should('have.length', 1);
          activeRunsTable.getRowByName('Test active run 3').find().should('exist');

          // Mock runs with a cleared filter before updating again
          activeRunsTable.mockGetRuns(mockActiveRuns, [], projectName, 1);
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() => pipelineRunFilterBar.findStartDateInput().clear());

          // Mock runs with a start date not associated with those runs
          activeRunsTable.mockGetActiveRuns(
            mockActiveRuns.filter((mockRun) => mockRun.created_at.includes('2024-02-15')),
            projectName,
            1,
          );
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() => pipelineRunFilterBar.findStartDateInput().type('2024-02-15'));

          // Verify no results were found
          activeRunsTable.findEmptyResults().should('exist');
        });

        it('filter by status', () => {
          // Verify initial run rows exist
          activeRunsTable.findRows().should('have.length', 3);

          // Select the "Status" filter
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() => pipelineRunsGlobal.selectFilterByName('Status'));

          // Mock runs (filtered by a status of 'RUNNING')
          activeRunsTable.mockGetActiveRuns(
            mockActiveRuns.filter((mockRun) => mockRun.state === RuntimeStateKF.RUNNING),
            projectName,
            1,
          );
          // Select a filter value of 'RUNNING'
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() =>
              pipelineRunFilterBar.selectStatusByName(runtimeStateLabels[RuntimeStateKF.RUNNING]),
            );

          // Verify only rows with the selected status exist
          activeRunsTable.findRows().should('have.length', 1);
          activeRunsTable.getRowByName('Test active run 1').find().should('exist');

          // Mock runs (filtered by a status of 'SUCCEEDED')
          activeRunsTable.mockGetActiveRuns(
            mockActiveRuns.filter((mockRun) => mockRun.state === RuntimeStateKF.SUCCEEDED),
            projectName,
            1,
          );
          // Select a filter value of 'SUCCEEDED'
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() =>
              pipelineRunFilterBar.selectStatusByName(runtimeStateLabels[RuntimeStateKF.SUCCEEDED]),
            );

          // Verify only rows with the selected status exist
          activeRunsTable.findRows().should('have.length', 1);
          activeRunsTable.getRowByName('Test active run 2').find().should('exist');

          // Mock runs (filtered by a status of 'CANCELED')
          activeRunsTable.mockGetActiveRuns(
            mockActiveRuns.filter((mockRun) => mockRun.state === RuntimeStateKF.CANCELED),
            projectName,
            1,
          );
          // Select a filter value of 'CANCELED'
          pipelineRunsGlobal
            .findActiveRunsToolbar()
            .within(() =>
              pipelineRunFilterBar.selectStatusByName(runtimeStateLabels[RuntimeStateKF.CANCELED]),
            );

          // Verify only rows with the selected status exist
          activeRunsTable.findRows().should('have.length', 1);
          activeRunsTable.getRowByName('Test active run 3').find().should('exist');
        });

        it('Sort by Name', () => {
          pipelineRunFilterBar.findSortButtonForActive('Run').click();
          pipelineRunFilterBar.findSortButtonForActive('Run').should(be.sortAscending);
          pipelineRunFilterBar.findSortButtonForActive('Run').click();
          pipelineRunFilterBar.findSortButtonForActive('Run').should(be.sortDescending);
        });
      });
    });
  });

  describe('Archived runs', () => {
    it('shows empty state', () => {
      archivedRunsTable.mockGetArchivedRuns([], projectName);
      pipelineRunsGlobal.visit(projectName, pipelineId, pipelineVersionId, 'archived');
      archivedRunsTable.findEmptyState().should('exist');
    });

    describe('with data', () => {
      beforeEach(() => {
        archivedRunsTable.mockGetArchivedRuns(mockArchivedRuns, projectName);
        pipelineRunsGlobal.visit(projectName, pipelineId, pipelineVersionId, 'archived');
      });

      it('renders the page with table data', () => {
        mockArchivedRuns.forEach((archivedRun) =>
          archivedRunsTable.getRowByName(archivedRun.display_name).find().should('exist'),
        );
      });

      it('restore a single run', () => {
        const [runToRestore] = mockArchivedRuns;

        archivedRunsTable.mockRestoreRun(runToRestore.run_id, projectName);
        archivedRunsTable
          .getRowByName(runToRestore.display_name)
          .findKebabAction('Restore')
          .click();

        archivedRunsTable.mockGetRuns([runToRestore], [mockArchivedRuns[1]], projectName);
        restoreRunModal.findSubmitButton().click();
        archivedRunsTable.shouldRowNotBeVisible(runToRestore.display_name);

        pipelineRunsGlobal.findActiveRunsTab().click();
        activeRunsTable.getRowByName(runToRestore.display_name).find().should('exist');
      });

      it('restore multiple runs', () => {
        mockArchivedRuns.forEach((archivedRun) => {
          archivedRunsTable.mockRestoreRun(archivedRun.run_id, projectName);
          archivedRunsTable.getRowByName(archivedRun.display_name).findCheckbox().click();
        });
        pipelineRunsGlobal.findRestoreRunButton().click();
        archivedRunsTable.mockGetRuns(mockArchivedRuns, [], projectName);
        bulkRestoreRunModal.findSubmitButton().click();
        archivedRunsTable.findEmptyState().should('exist');

        pipelineRunsGlobal.findActiveRunsTab().click();
        mockArchivedRuns.forEach((run) =>
          activeRunsTable.getRowByName(run.display_name).find().should('exist'),
        );
      });

      describe('Table filter', () => {
        it('filter by run name', () => {
          // Verify initial run rows exist
          archivedRunsTable.findRows().should('have.length', 2);

          // Select the "Name" filter, enter a value to filter by
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() => pipelineRunsGlobal.selectFilterByName('Run'));
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() => pipelineRunFilterBar.findNameInput().type('run 1'));

          // Mock runs (filtered by typed run name)
          archivedRunsTable.mockGetArchivedRuns(
            mockArchivedRuns.filter((mockRun) => mockRun.display_name.includes('run 1')),
            projectName,
            1,
          );

          // Verify only rows with the typed run name exist
          archivedRunsTable.findRows().should('have.length', 1);
          archivedRunsTable.getRowByName('Test archived run 1').find().should('exist');
        });

        it('filter by experiment', () => {
          // Mock initial list of experiments
          pipelineRunFilterBar.mockExperiments(mockExperiments, projectName);

          // Verify initial run rows exist
          archivedRunsTable.findRows().should('have.length', 2);

          // Select the "Experiment" filter, enter a value to filter by
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() => pipelineRunsGlobal.selectFilterByName('Experiment'));
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() => pipelineRunFilterBar.findExperimentInput().type('Test Experiment 1'));

          // Mock runs (filtered by selected experiment)
          archivedRunsTable.mockGetArchivedRuns(
            mockArchivedRuns.filter((mockRun) => mockRun.experiment_id === 'test-experiment-1'),
            projectName,
            1,
          );

          // Select an experiment to filter by
          pipelineRunFilterBar.selectExperimentByName('Test Experiment 1');

          // Verify only rows with selected experiment exist
          archivedRunsTable.findRows().should('have.length', 2);
          archivedRunsTable.getRowByName('Test archived run 1').find().should('exist');
          archivedRunsTable.getRowByName('Test archived run 2').find().should('exist');
        });

        it('filter by started', () => {
          // Verify initial run rows exist
          archivedRunsTable.findRows().should('have.length', 2);

          // Select the "Started" filter, select a value to filter by
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() => pipelineRunsGlobal.selectFilterByName('Started'));

          // Mock runs (filtered by start date), type a start date
          archivedRunsTable.mockGetArchivedRuns(
            mockArchivedRuns.filter((mockRun) => mockRun.created_at.includes('2024-02-05')),
            projectName,
            1,
          );
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() => pipelineRunFilterBar.findStartDateInput().type('2024-02-05'));

          // Verify only rows with selected start date exist
          archivedRunsTable.findRows().should('have.length', 1);
          archivedRunsTable.getRowByName('Test archived run 1').find().should('exist');
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() => pipelineRunFilterBar.findStartDateInput().clear());

          // Mock runs with a start date not associated with those runs
          archivedRunsTable.mockGetArchivedRuns(
            mockArchivedRuns.filter((mockRun) => mockRun.created_at.includes('2024-02-15')),
            projectName,
            1,
          );
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() => pipelineRunFilterBar.findStartDateInput().type('2024-02-15'));

          // Verify no results were found
          archivedRunsTable.findEmptyResults().should('exist');
        });

        it('filter by status', () => {
          // Verify initial run rows exist
          archivedRunsTable.findRows().should('have.length', 2);

          // Select the "Status" filter
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() => pipelineRunsGlobal.selectFilterByName('Status'));

          // Mock runs (filtered by a status of 'SUCCEEDED')
          archivedRunsTable.mockGetArchivedRuns(
            mockArchivedRuns.filter((mockRun) => mockRun.state === RuntimeStateKF.SUCCEEDED),
            projectName,
            1,
          );
          // Select a filter value of 'SUCCEEDED'
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() =>
              pipelineRunFilterBar.selectStatusByName(runtimeStateLabels[RuntimeStateKF.SUCCEEDED]),
            );

          // Verify only rows with the selected status exist
          archivedRunsTable.findRows().should('have.length', 2);
          archivedRunsTable.getRowByName('Test archived run 1').find().should('exist');
          archivedRunsTable.getRowByName('Test archived run 2').find().should('exist');

          // Mock runs (filtered by a status of 'RUNNING')
          archivedRunsTable.mockGetArchivedRuns(
            mockArchivedRuns.filter((mockRun) => mockRun.state === RuntimeStateKF.RUNNING),
            projectName,
            1,
          );
          // Select a filter value of 'RUNNING'
          pipelineRunsGlobal
            .findArchivedRunsToolbar()
            .within(() =>
              pipelineRunFilterBar.selectStatusByName(runtimeStateLabels[RuntimeStateKF.RUNNING]),
            );

          // Verify no results were found
          archivedRunsTable.findEmptyResults().should('exist');
        });

        it('Sort by Name', () => {
          pipelineRunFilterBar.findSortButtonForArchive('Run').click();
          pipelineRunFilterBar.findSortButtonForArchive('Run').should(be.sortAscending);
          pipelineRunFilterBar.findSortButtonForArchive('Run').click();
          pipelineRunFilterBar.findSortButtonForArchive('Run').should(be.sortDescending);
        });
      });
    });
  });

  describe('Schedules', () => {
    describe('empty state', () => {
      beforeEach(() => {
        pipelineRunJobTable.mockGetJobs([], projectName);
        pipelineRunsGlobal.visit(projectName, pipelineId, pipelineVersionId, 'scheduled');
      });

      it('shows empty state', () => {
        pipelineRunJobTable.findEmptyState().should('exist');
      });

      it('navigate to create run page', () => {
        pipelineRunsGlobal.findScheduleRunButton().click();
        verifyRelativeURL(`/pipelines/${projectName}/pipelineRun/create?runType=scheduled`);
      });
    });

    it('shows empty state', () => {
      pipelineRunJobTable.mockGetJobs([], projectName);
      pipelineRunsGlobal.visit(projectName, pipelineId, pipelineVersionId, 'scheduled');
      pipelineRunJobTable.findEmptyState().should('exist');
    });

    describe('table pagination', () => {
      it('Scheduled run table pagination', () => {
        const mockJobRuns = Array.from({ length: 15 }, (_, i) =>
          buildMockJobKF({
            display_name: `another-pipeline-${i}`,
            recurring_run_id: `another-test-pipeline-${i}`,
            experiment_id: `test-experiment-${i}`,
            pipeline_version_reference: {
              pipeline_id: pipelineId,
              pipeline_version_id: `test-version-${i}`,
            },
          }),
        );

        cy.interceptOdh(
          'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/recurringruns',
          {
            path: { namespace: projectName, serviceName: 'dspa' },
          },
          {
            recurringRuns: mockJobRuns.slice(0, 10),
            total_size: 15,
            next_page_token: 'page-2-token',
          },
        ).as('getScheduledRuns');
        pipelineRunsGlobal.visit(projectName, pipelineId, pipelineVersionId, 'scheduled');

        cy.wait('@getScheduledRuns').then((interception) => {
          expect(interception.request.query).to.eql({
            filter:
              '{"predicates":[{"key":"pipeline_version_id","operation":"EQUALS","string_value":"test-version"}]}',
            sort_by: 'created_at desc',
            page_size: '10',
          });
        });

        pipelineRunJobTable.getRowByName('another-pipeline-0').find().should('exist');
        pipelineRunJobTable.findRows().should('have.length', 10);

        const pagination = tablePagination.top;

        // test Next button
        pagination.findFirstButton().should('be.disabled');
        pagination.findPreviousButton().should('be.disabled');
        cy.interceptOdh(
          'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/recurringruns',
          {
            path: { namespace: projectName, serviceName: 'dspa' },
          },
          {
            recurringRuns: mockJobRuns.slice(10, 15),
            total_size: 15,
          },
        ).as('refreshScheduledRuns');
        pagination.findNextButton().click();

        cy.wait('@refreshScheduledRuns').then((interception) => {
          expect(interception.request.query).to.eql({
            filter:
              '{"predicates":[{"key":"pipeline_version_id","operation":"EQUALS","string_value":"test-version"}]}',
            sort_by: 'created_at desc',
            page_size: '10',
            page_token: 'page-2-token',
          });
        });

        pagination.findInput().should('have.value', '2');
        pipelineRunJobTable.getRowByName('another-pipeline-14').find().should('exist');
        pipelineRunJobTable.findRows().should('have.length', 5);

        //test first button
        pagination.findLastButton().should('be.disabled');
        pagination.findNextButton().should('be.disabled');
        cy.interceptOdh(
          'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/recurringruns',
          {
            path: { namespace: projectName, serviceName: 'dspa' },
          },
          {
            recurringRuns: mockJobRuns.slice(0, 10),
            total_size: 15,
            next_page_token: 'new-page-token',
          },
        );
        pagination.findFirstButton().click();
        pagination.findInput().should('have.value', '1');
        pipelineRunJobTable.getRowByName('another-pipeline-0').find().should('exist');
        pipelineRunJobTable.findRows().should('have.length', 10);

        //test last button
        pagination.findFirstButton().should('be.disabled');
        pagination.findPreviousButton().should('be.disabled');
        cy.interceptOdh(
          'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/recurringruns',
          {
            path: { namespace: projectName, serviceName: 'dspa' },
          },
          {
            recurringRuns: mockJobRuns.slice(10, 15),
            total_size: 15,
          },
        ).as('refreshPipelineRunJobs');

        pagination.findLastButton().click();
        pagination.findInput().should('have.value', Math.ceil(15 / 10));
        pipelineRunJobTable.getRowByName('another-pipeline-14').find().should('exist');
        pipelineRunJobTable.findRows().should('have.length', 5);

        cy.wait('@refreshPipelineRunJobs').then((interception) => {
          expect(interception.request.query).to.eql({
            filter:
              '{"predicates":[{"key":"pipeline_version_id","operation":"EQUALS","string_value":"test-version"}]}',
            sort_by: 'created_at desc',
            page_size: '10',
            page_token: 'new-page-token',
          });
        });

        // test Previous button
        pagination.findLastButton().should('be.disabled');
        pagination.findNextButton().should('be.disabled');
        cy.interceptOdh(
          'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/recurringruns',
          {
            path: { namespace: projectName, serviceName: 'dspa' },
          },
          {
            recurringRuns: mockJobRuns.slice(0, 10),
            total_size: 15,
          },
        );
        pagination.findPreviousButton().click();
        pagination.findInput().should('have.value', '1');
        pipelineRunJobTable.getRowByName('another-pipeline-0').find().should('exist');
        pipelineRunJobTable.findRows().should('have.length', 10);

        // 20 per page
        cy.interceptOdh(
          'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/recurringruns',
          {
            path: { namespace: projectName, serviceName: 'dspa' },
          },
          {
            recurringRuns: mockJobRuns.slice(0, 15),
            total_size: 15,
          },
        );

        pagination.selectToggleOption('20 per page');

        pipelineRunJobTable.getRowByName('another-pipeline-0').find().should('exist');
        pipelineRunJobTable.getRowByName('another-pipeline-14').find().should('exist');
        pipelineRunJobTable.findRows().should('have.length', 15);
        pagination.findLastButton().should('be.disabled');
        pagination.findNextButton().should('be.disabled');
        pagination.findPreviousButton().should('be.disabled');
        pagination.findFirstButton().should('be.disabled');
        pagination.findInput().should('have.value', Math.ceil(15 / 20));
      });
    });

    describe('with data', () => {
      beforeEach(() => {
        pipelineRunJobTable.mockGetJobs(mockJobs, projectName);
        pipelineRunsGlobal.visit(projectName, pipelineId, pipelineVersionId, 'scheduled');
      });

      it('renders the page with table rows', () => {
        pipelineRunJobTable.find().should('exist');
        pipelineRunJobTable.getRowByName('test-pipeline').find().should('exist');
        pipelineRunJobTable.getRowByName('other-pipeline').find().should('exist');
        pipelineRunJobTable.getRowByName('another-pipeline').find().should('exist');
      });

      it('can disable a job', () => {
        pipelineRunJobTable.mockDisableJob(mockJobs[0], projectName).as('disableJob');
        pipelineRunJobTable
          .getRowByName(mockJobs[0].display_name)
          .findStatusSwitchByRowName()
          .click();
        cy.wait('@disableJob');
      });

      describe('Navigation', () => {
        it('navigate to create scheduled run page', () => {
          pipelineRunsGlobal.findScheduleRunButton().click();
          verifyRelativeURL(`/pipelines/${projectName}/pipelineRun/create?runType=scheduled`);
        });
        it('navigate to clone scheduled run page', () => {
          pipelineRunJobTable
            .getRowByName(mockJobs[0].display_name)
            .findKebabAction('Duplicate')
            .click();
          verifyRelativeURL(
            `/pipelines/${projectName}/pipelineRun/cloneJob/${mockJobs[0].recurring_run_id}?runType=scheduled`,
          );
        });
        it('navigate to scheduled run details page', () => {
          pipelineRunJobTable
            .getRowByName(mockJobs[0].display_name)
            .findColumnName(mockJobs[0].display_name)
            .click();
          verifyRelativeURL(
            `/pipelines/${projectName}/pipelineRunJob/view/${mockJobs[0].recurring_run_id}`,
          );
        });
      });

      describe('Table filter', () => {
        it('filter by name', () => {
          // Verify initial job rows exist
          pipelineRunJobTable.findRows().should('have.length', 3);

          // Select the "Schedule" filter, enter a value to filter by
          pipelineRunJobTable.selectFilterByName('Schedule');
          pipelineRunJobTable.findFilterTextField().type('test-pipeline');

          // Mock jobs (filtered by typed job name)
          pipelineRunJobTable.mockGetJobs(
            mockJobs.filter((mockJob) => mockJob.display_name.includes('test-pipeline')),
            projectName,
          );

          // Verify only rows with the typed job name exist
          pipelineRunJobTable.findRows().should('have.length', 1);
          pipelineRunJobTable.getRowByName('test-pipeline').find().should('exist');
        });

        it('Sort by Name', () => {
          pipelineRunFilterBar.findSortButtonforSchedules('Schedule').click();
          pipelineRunFilterBar.findSortButtonforSchedules('Schedule').should(be.sortAscending);
          pipelineRunFilterBar.findSortButtonforSchedules('Schedule').click();
          pipelineRunFilterBar.findSortButtonforSchedules('Schedule').should(be.sortDescending);
        });
      });
    });
  });
});

const initIntercepts = () => {
  mockDspaIntercepts();

  cy.interceptK8sList(
    ProjectModel,
    mockK8sResourceList([
      mockProjectK8sResource({ k8sName: projectName, displayName: 'Test project' }),
    ]),
  );

  cy.interceptOdh(
    'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/pipelines',
    {
      path: { namespace: projectName, serviceName: 'dspa' },
    },
    buildMockPipelines([buildMockPipelineV2({ pipeline_id: pipelineId })]),
  );

  cy.interceptOdh(
    'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/pipelines/:pipelineId/versions',
    { path: { namespace: projectName, serviceName: 'dspa', pipelineId } },
    buildMockPipelineVersionsV2(mockVersions),
  );
  cy.interceptOdh(
    'GET /api/service/pipelines/:namespace/:serviceName/apis/v2beta1/pipelines/:pipelineId/versions/:pipelineVersionId',
    {
      path: {
        namespace: projectName,
        serviceName: 'dspa',
        pipelineId,
        pipelineVersionId,
      },
    },
    buildMockPipelineVersionV2({ pipeline_id: pipelineId, pipeline_version_id: pipelineVersionId }),
  );
};

const mockDspaIntercepts = () => {
  cy.interceptK8s(
    DataSciencePipelineApplicationModel,
    mockDataSciencePipelineApplicationK8sResource({
      name: 'pipelines-definition',
      namespace: projectName,
    }),
  );

  cy.interceptK8sList(
    DataSciencePipelineApplicationModel,
    mockK8sResourceList([
      mockDataSciencePipelineApplicationK8sResource({ namespace: projectName }),
    ]),
  );

  cy.interceptK8s(
    DataSciencePipelineApplicationModel,
    mockDataSciencePipelineApplicationK8sResource({
      namespace: projectName,
    }),
  );

  cy.interceptK8s(
    RouteModel,
    mockRouteK8sResource({
      notebookName: 'ds-pipeline-dspa',
      namespace: projectName,
    }),
  );
};
