import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Artifact } from '~/third_party/mlmd';
import { artifactsBaseRoute } from '~/routes';
import { ArtifactDetails } from '~/pages/pipelines/global/experiments/artifacts/ArtifactDetails';
import GlobalPipelineCoreDetails from '~/pages/pipelines/global/GlobalPipelineCoreDetails';
import * as useGetArtifactById from '~/concepts/pipelines/apiHooks/mlmd/useGetArtifactById';
import * as fetchStorageObjectSize from '~/services/storageService';

jest.mock('~/redux/selectors', () => ({
  ...jest.requireActual('~/redux/selectors'),
  useUser: jest.fn(() => ({ isAdmin: true })),
}));

jest.mock('~/concepts/areas/useIsAreaAvailable', () => () => ({
  status: true,
  featureFlags: {},
  reliantAreas: {},
  requiredComponents: {},
  requiredCapabilities: {},
  customCondition: jest.fn(),
}));

jest.mock('~/concepts/pipelines/context/PipelinesContext', () => ({
  usePipelinesAPI: jest.fn(() => ({
    pipelinesServer: {
      initializing: false,
      installed: true,
      compatible: true,
      timedOut: false,
      name: 'dspa',
    },
    namespace: 'Test namespace',
    project: {
      metadata: {
        name: 'Test namespace',
      },
      kind: 'Project',
    },
    apiAvailable: true,
  })),
}));

describe('ArtifactDetails', () => {
  const useGetArtifactByIdSpy = jest.spyOn(useGetArtifactById, 'useGetArtifactById');
  const fetchStorageObjectSizeSpy = jest.spyOn(fetchStorageObjectSize, 'fetchStorageObjectSize');

  beforeEach(() => {
    useGetArtifactByIdSpy.mockReturnValue([
      {
        toObject: jest.fn(() => ({
          id: 1,
          typeId: 14,
          type: 'system.Artifact',
          uri: 's3://namespace/bucket/path/to/artifact',
          propertiesMap: [],
          customPropertiesMap: [
            [
              'display_name',
              {
                stringValue: 'vertex_model',
              },
            ],
            [
              'resourceName',
              {
                stringValue: '12.15',
              },
            ],
          ],
          state: 2,
          createTimeSinceEpoch: 1711113121829,
          lastUpdateTimeSinceEpoch: 1711113121829,
        })),
      } as unknown as Artifact,
      true,
      undefined,
      jest.fn(),
    ]);
  });

  it('renders page breadcrumbs', () => {
    render(
      <BrowserRouter>
        <GlobalPipelineCoreDetails
          pageName="Artifacts"
          redirectPath={artifactsBaseRoute}
          BreadcrumbDetailsComponent={ArtifactDetails}
        />
      </BrowserRouter>,
    );

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(
      within(breadcrumb).getByRole('link', { name: 'Artifacts - Test namespace' }),
    ).toBeVisible();
    expect(within(breadcrumb).getByText('vertex_model')).toBeVisible();
  });

  it('renders artifact name as page header with the Overview tab initially selected', () => {
    render(
      <BrowserRouter>
        <GlobalPipelineCoreDetails
          pageName="Artifacts"
          redirectPath={artifactsBaseRoute}
          BreadcrumbDetailsComponent={ArtifactDetails}
        />
      </BrowserRouter>,
    );

    expect(screen.getByTestId('app-page-title')).toHaveTextContent('vertex_model');

    const overviewTab = screen.getByRole('tab', { name: 'Overview' });
    expect(overviewTab).toBeVisible();
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders warning on oversized file', async () => {
    fetchStorageObjectSizeSpy.mockResolvedValue(1e9);

    render(
      <BrowserRouter>
        <GlobalPipelineCoreDetails
          pageName="Artifacts"
          redirectPath={artifactsBaseRoute}
          BreadcrumbDetailsComponent={ArtifactDetails}
        />
      </BrowserRouter>,
    );

    expect(await screen.findByTestId('storage-file-oversized-warning')).toBeVisible();
  });

  it('renders Overview tab metadata contents', () => {
    render(
      <BrowserRouter>
        <GlobalPipelineCoreDetails
          pageName="Artifacts"
          redirectPath={artifactsBaseRoute}
          BreadcrumbDetailsComponent={ArtifactDetails}
        />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Live system dataset' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Custom properties' })).toBeVisible();

    const datasetDescriptionList = screen.getByTestId('dataset-description-list');
    expect(within(datasetDescriptionList).getByRole('term')).toHaveTextContent('URI');
    expect(within(datasetDescriptionList).getByRole('definition')).toHaveTextContent(
      's3://namespace/bucket/path/to/artifact',
    );

    const customPropsDescriptionList = screen.getByTestId('custom-props-description-list');
    const customPropsDescriptionListTerms = within(customPropsDescriptionList).getAllByRole('term');
    const customPropsDescriptionListValues = within(customPropsDescriptionList).getAllByRole(
      'definition',
    );

    expect(customPropsDescriptionListTerms[0]).toHaveTextContent('display_name');
    expect(customPropsDescriptionListValues[0]).toHaveTextContent('vertex_model');
    expect(customPropsDescriptionListTerms[1]).toHaveTextContent('resourceName');
    expect(customPropsDescriptionListValues[1]).toHaveTextContent('12.15');
  });
});
